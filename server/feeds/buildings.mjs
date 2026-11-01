import { requestOverpass } from '../lib/http.mjs';

const buildingCache = new Map();

function buildingHeight(tags) {
  const explicit = Number.parseFloat(tags.height);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const levels = Number.parseInt(tags['building:levels'], 10);
  return Number.isFinite(levels) && levels > 0 ? levels * 3 : 9;
}

export async function loadBuildings(south, west, north, east) {
  const key = [south, west, north, east].map(value => value.toFixed(3)).join(',');
  const cached = buildingCache.get(key);
  if (cached && Date.now() - cached.updatedAt < 30 * 60 * 1000) return cached.data;
  const query = `[out:json][timeout:25];way["building"](${south},${west},${north},${east});out geom tags;`;
  const payload = await requestOverpass(query);
  const data = {
    type: 'FeatureCollection',
    features: payload.elements.flatMap(element => {
      const coordinates = (element.geometry || []).map(point => [point.lon, point.lat]);
      if (coordinates.length < 4) return [];
      const tags = element.tags || {};
      return [{ type: 'Feature', properties: { height: buildingHeight(tags), minHeight: Number.parseFloat(tags.min_height) || 0, estimated: !tags.height }, geometry: { type: 'Polygon', coordinates: [coordinates] } }];
    })
  };
  buildingCache.set(key, { updatedAt: Date.now(), data });
  return data;
}

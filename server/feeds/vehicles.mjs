import https from 'https';
import protobuf from 'protobufjs';
import { mapMatchPoint } from '../lib/geo.mjs';
import { normalizeRoute } from '../lib/gtfs-parse.mjs';
import { getTripShape, nextStopName, routeMap, tripMap } from './gtfs-static.mjs';

const protoDef = `
syntax = "proto2";
package transit_realtime;

message FeedMessage {
  required FeedHeader header = 1;
  repeated FeedEntity entity = 2;
}

message FeedHeader {
  required string gtfs_realtime_version = 1;
  optional uint64 timestamp = 2;
}

message FeedEntity {
  required string id = 1;
  optional VehiclePosition vehicle = 4;
}

message VehiclePosition {
  optional TripDescriptor trip = 1;
  optional Position position = 2;
  optional VehicleDescriptor vehicle = 8;
  optional uint64 timestamp = 5;
}

message TripDescriptor {
  optional string trip_id = 1;
  optional string route_id = 5;
}

message Position {
  required float latitude = 1;
  required float longitude = 2;
  optional float bearing = 3;
  optional float speed = 5;
}

message VehicleDescriptor {
  optional string id = 1;
  optional string label = 2;
  optional string license_plate = 3;
}
`;

const root = protobuf.parse(protoDef).root;
const FeedMessage = root.lookupType('transit_realtime.FeedMessage');

let cachedVehicles = [];
let lastFetch = 0;

/** The last decoded vehicle positions and when they were fetched. */
export function getVehicles() {
  return { vehicles: cachedVehicles, updatedAt: lastFetch };
}

export function fetchLiveVehicles() {
  return new Promise((resolve) => {
    https.get('https://track.ua-gis.com/gtfs/lviv/vehicle_position', (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const buf = Buffer.concat(chunks);
          const msg = FeedMessage.decode(buf);
          const vehicles = [];

          for (const ent of msg.entity) {
            if (!ent.vehicle || !ent.vehicle.position) continue;
            const v = ent.vehicle;
            const tripId = v.trip && v.trip.tripId;
            const rawRouteId = (v.trip && v.trip.routeId) || (tripId && tripMap[tripId]);
            const rInfo = rawRouteId && routeMap[rawRouteId];

            const lat = v.position.latitude;
            const lng = v.position.longitude;
            if (lat < 49.65 || lat > 49.98 || lng < 23.75 || lng > 24.35) continue;

            const normalized = rInfo 
              ? normalizeRoute(rInfo.shortName, rInfo.longName, rInfo.type)
              : { route: rawRouteId || '?', type: 'bus', destination: 'Львів' };

            const matched = mapMatchPoint(lat, lng, getTripShape(tripId));
            vehicles.push({
              id: ent.id,
              tripId: tripId || '',
              route: normalized.route,
              destination: normalized.destination,
              type: normalized.type,
              lat: matched.lat,
              lng: matched.lng,
              mapMatched: matched.matched,
              nextStop: nextStopName(tripId, lat, lng),
              speed: Math.round((v.position.speed || 0) * 3.6),
              bearing: Math.round(v.position.bearing || 0),
              plate: (v.vehicle && (v.vehicle.licensePlate || v.vehicle.id)) || '---',
              lowFloor: (v.vehicle && v.vehicle.label === 'low_floor') || false,
              timestamp: v.timestamp ? Number(v.timestamp) : Math.floor(Date.now() / 1000)
            });
          }

          cachedVehicles = vehicles;
          lastFetch = Date.now();
          resolve(vehicles);
        } catch (err) {
          console.error('[Lviv API] Parse error:', err);
          resolve(cachedVehicles);
        }
      });
    }).on('error', (err) => {
      console.error('[Lviv API] Fetch error:', err);
      resolve(cachedVehicles);
    });
  });
}

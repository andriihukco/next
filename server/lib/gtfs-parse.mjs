import zlib from 'zlib';

/** Pure GTFS helpers: route names, CSV rows, and the static ZIP archive. */

export function normalizeRoute(shortName, longName, routeType) {
  let s = (shortName || '').trim();
  let type = 'bus';
  
  if (s.startsWith('Тр') || s.startsWith('тр')) {
    type = 'trolleybus';
    s = s.slice(2);
  } else if (s.startsWith('Т') || s.startsWith('т')) {
    type = 'tram';
    s = s.slice(1);
  } else if (s.startsWith('А') || s.startsWith('а') || s.startsWith('A') || s.startsWith('a')) {
    type = 'bus';
    s = s.slice(1);
  }

  if (routeType === '0') type = 'tram';
  else if (routeType === '800') type = 'trolleybus';

  // Strip leading zero: 01 -> 1, 09 -> 9, 08а -> 8A
  if (s.startsWith('0')) s = s.slice(1);

  // Special Lviv mappings to match municipal eWay names
  if (s === '47') s = '47A';
  if (s === '8а' || s === '8А' || s === '8a') s = '8A';
  if (s === '39а' || s === '39А' || s === '39a') s = '39A';

  return { route: s.toUpperCase(), type, destination: (longName || '').trim() };
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        value += char;
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(value);
      value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some(cell => cell.length > 0)) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some(cell => cell.length > 0)) rows.push(row);
  const [headers, ...records] = rows;
  return records.map(record => Object.fromEntries(headers.map((header, index) => [header, record[index] || ''])));
}

export function unzipEntries(zip) {
  const end = zip.lastIndexOf(Buffer.from('PK\x05\x06'));
  if (end < 0) throw new Error('GTFS archive directory is missing');

  const entryCount = zip.readUInt16LE(end + 10);
  let offset = zip.readUInt32LE(end + 16);
  const entries = new Map();

  for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
    if (zip.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid GTFS archive entry');
    const compression = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localOffset = zip.readUInt32LE(offset + 42);
    const name = zip.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    const localNameLength = zip.readUInt16LE(localOffset + 26);
    const localExtraLength = zip.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = zip.subarray(dataStart, dataStart + compressedSize);
    const data = compression === 0 ? compressed : zlib.inflateRawSync(compressed);
    entries.set(name, data.toString('utf8'));
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

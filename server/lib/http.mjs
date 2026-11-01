import https from 'https';

export function requestBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if ((res.statusCode || 500) >= 400) {
        reject(new Error(`External data request failed with ${res.statusCode}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

export function requestOverpass(query) {
  return new Promise((resolve, reject) => {
    const request = https.request('https://overpass.osm.ch/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(`data=${encodeURIComponent(query)}`), 'User-Agent': 'un/1.0 (local transit map)' }
    }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        if ((response.statusCode || 500) >= 400) {
          reject(new Error(`OpenStreetMap request failed with ${response.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on('error', reject);
    request.write(`data=${encodeURIComponent(query)}`);
    request.end();
  });
}

export function sendJson(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(JSON.stringify(body));
}

// Vercel parses JSON bodies into req.body; the local server hands over the raw stream.
export async function readJsonBody(req, limit = 4096) {
  if (req.body && typeof req.body === 'object') return req.body;
  let text = typeof req.body === 'string' ? req.body : '';
  if (!text) {
    for await (const chunk of req) {
      text += chunk;
      if (text.length > limit) throw new Error('Body too large');
    }
  }
  return text ? JSON.parse(text) : {};
}

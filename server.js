const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables from .env.local manually
let token = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
  const match = envContent.match(/WAQI_TOKEN\s*=\s*([^\s#]+)/);
  if (match) {
    token = match[1];
  }
} catch (err) {
  console.warn('Warning: Could not read .env.local or find WAQI_TOKEN.');
}

// Indian AQI Calculation Logic (from api/aqi.js)
function calculateIndianAQI(iaqi) {
  if (!iaqi) return null;

  const pollutants = {};

  if (iaqi.pm25 && iaqi.pm25.v !== undefined) {
    pollutants.pm25 = iaqi.pm25.v;
  }
  if (iaqi.pm10 && iaqi.pm10.v !== undefined) {
    pollutants.pm10 = iaqi.pm10.v;
  }
  if (iaqi.no2 && iaqi.no2.v !== undefined) {
    pollutants.no2 = iaqi.no2.v * 1.88;
  }
  if (iaqi.co && iaqi.co.v !== undefined) {
    pollutants.co = iaqi.co.v * 1.145;
  }
  if (iaqi.so2 && iaqi.so2.v !== undefined) {
    pollutants.so2 = iaqi.so2.v * 2.62;
  }
  if (iaqi.o3 && iaqi.o3.v !== undefined) {
    pollutants.o3 = iaqi.o3.v * 1.96;
  }

  const bpRanges = {
    pm25: [
      { cMin: 0, cMax: 30, iMin: 0, iMax: 50 },
      { cMin: 30, cMax: 60, iMin: 50, iMax: 100 },
      { cMin: 60, cMax: 90, iMin: 100, iMax: 200 },
      { cMin: 90, cMax: 120, iMin: 200, iMax: 300 },
      { cMin: 120, cMax: 250, iMin: 300, iMax: 400 },
      { cMin: 250, cMax: 380, iMin: 400, iMax: 500 }
    ],
    pm10: [
      { cMin: 0, cMax: 50, iMin: 0, iMax: 50 },
      { cMin: 50, cMax: 100, iMin: 50, iMax: 100 },
      { cMin: 100, cMax: 250, iMin: 100, iMax: 200 },
      { cMin: 250, cMax: 350, iMin: 200, iMax: 300 },
      { cMin: 350, cMax: 430, iMin: 300, iMax: 400 },
      { cMin: 430, cMax: 510, iMin: 400, iMax: 500 }
    ],
    no2: [
      { cMin: 0, cMax: 40, iMin: 0, iMax: 50 },
      { cMin: 40, cMax: 80, iMin: 50, iMax: 100 },
      { cMin: 80, cMax: 180, iMin: 100, iMax: 200 },
      { cMin: 180, cMax: 280, iMin: 200, iMax: 300 },
      { cMin: 280, cMax: 400, iMin: 300, iMax: 400 },
      { cMin: 400, cMax: 800, iMin: 400, iMax: 500 }
    ],
    co: [
      { cMin: 0, cMax: 1.0, iMin: 0, iMax: 50 },
      { cMin: 1.0, cMax: 2.0, iMin: 50, iMax: 100 },
      { cMin: 2.0, cMax: 10.0, iMin: 100, iMax: 200 },
      { cMin: 10.0, cMax: 17.0, iMin: 200, iMax: 300 },
      { cMin: 17.0, cMax: 34.0, iMin: 300, iMax: 400 },
      { cMin: 34.0, cMax: 57.0, iMin: 400, iMax: 500 }
    ],
    so2: [
      { cMin: 0, cMax: 40, iMin: 0, iMax: 50 },
      { cMin: 40, cMax: 80, iMin: 50, iMax: 100 },
      { cMin: 80, cMax: 380, iMin: 100, iMax: 200 },
      { cMin: 380, cMax: 800, iMin: 200, iMax: 300 },
      { cMin: 800, cMax: 1600, iMin: 300, iMax: 400 },
      { cMin: 1600, cMax: 3200, iMin: 400, iMax: 500 }
    ],
    o3: [
      { cMin: 0, cMax: 50, iMin: 0, iMax: 50 },
      { cMin: 50, cMax: 100, iMin: 50, iMax: 100 },
      { cMin: 100, cMax: 168, iMin: 100, iMax: 200 },
      { cMin: 168, cMax: 208, iMin: 200, iMax: 300 },
      { cMin: 208, cMax: 748, iMin: 300, iMax: 400 },
      { cMin: 748, cMax: 1496, iMin: 400, iMax: 500 }
    ]
  };

  let maxSubIndex = 0;
  let dominantPol = '';

  for (const pol in pollutants) {
    const val = pollutants[pol];
    const ranges = bpRanges[pol];
    if (!ranges) continue;

    let subIndex = 0;
    let matched = false;
    for (let idx = 0; idx < ranges.length; idx++) {
      const r = ranges[idx];
      const isFirst = (idx === 0);
      const inRange = isFirst
        ? (val >= r.cMin && val <= r.cMax)
        : (val > r.cMin && val <= r.cMax);

      if (inRange) {
        subIndex = ((r.iMax - r.iMin) / (r.cMax - r.cMin)) * (val - r.cMin) + r.iMin;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const last = ranges[ranges.length - 1];
      if (val > last.cMax) {
        subIndex = 500;
      }
    }

    subIndex = Math.round(subIndex);
    if (subIndex > maxSubIndex) {
      maxSubIndex = subIndex;
      dominantPol = pol;
    }
  }

  return {
    aqi: maxSubIndex,
    dominentpol: dominantPol
  };
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Handle API Proxy
  if (pathname === '/api/aqi') {
    const { action, param } = parsedUrl.query;
    if (!action || !param) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing action or param' }));
    }

    if (!token) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'API token not configured locally' }));
    }

    let fetchUrl;
    if (action === 'feed') {
      fetchUrl = `https://api.waqi.info/feed/${encodeURIComponent(param)}/?token=${token}`;
    } else if (action === 'search') {
      fetchUrl = `https://api.waqi.info/search/?token=${token}&keyword=${encodeURIComponent(param)}`;
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid action. Use "feed" or "search".' }));
    }

    try {
      const apiResponse = await fetch(fetchUrl);
      const data = await apiResponse.json();

      if (action === 'feed' && data.status === 'ok' && data.data) {
        const indianAQI = calculateIndianAQI(data.data.iaqi);
        if (indianAQI && indianAQI.aqi > 0) {
          data.data.aqi = indianAQI.aqi;
          data.data.dominentpol = indianAQI.dominentpol;
        }
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      });
      return res.end(JSON.stringify(data));
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Failed to reach WAQI API', details: err.message }));
    }
  }

  // Normalize static file path
  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(__dirname, pathname);
  
  // Guard against directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop the server.`);
});

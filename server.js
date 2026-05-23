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

      // WAQI's data.aqi and iaqi fields are already AQI/sub-index values.
      // Do not recalculate AQI from iaqi as if it were raw concentration data.

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

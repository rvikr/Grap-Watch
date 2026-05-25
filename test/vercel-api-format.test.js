const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const apiPath = path.join(root, 'api', 'aqi.js');
const apiSource = fs.readFileSync(apiPath, 'utf8');
const handler = require(apiPath);

assert.equal(typeof handler, 'function', 'api/aqi.js should export a Vercel handler function');
assert.match(
  apiSource,
  /module\.exports\s*=/,
  'api/aqi.js should use CommonJS exports because package.json is CommonJS'
);
assert.doesNotMatch(
  apiSource,
  /export\s+default/,
  'api/aqi.js should not trigger Vercel ESM-to-CommonJS compilation warnings'
);

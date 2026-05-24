const assert = require('assert');
const fs = require('fs');
const path = require('path');

const swSource = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const vehiclesSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'vehicles.js'), 'utf8');
const indexSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const swCacheName = swSource.match(/const CACHE_NAME = '([^']+)'/)?.[1];
const vehiclesCacheName = vehiclesSource.match(/caches\.open\('([^']+)'\)/)?.[1];

assert(swCacheName, 'Service worker CACHE_NAME should be declared');
assert(vehiclesCacheName, 'Vehicle sync cache name should be declared');
assert.strictEqual(
  vehiclesCacheName,
  swCacheName,
  'Vehicle sync should write to the active service-worker cache'
);

assert(
  indexSource.includes('src="js/stations.js?v=6"'),
  'Station script should use the current asset version so browsers fetch the updated station list'
);

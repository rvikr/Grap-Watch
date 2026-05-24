const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const stationsPath = path.join(__dirname, '..', 'js', 'stations.js');
const source = fs.readFileSync(stationsPath, 'utf8');
const { STATIONS, NCR_CITIES } = vm.runInNewContext(`${source}\n;({ STATIONS, NCR_CITIES });`, {});

const expectedSlugs = new Map([
  ['New Delhi', 'A10111'],
  ['Noida', 'A11863'],
  ['Gurugram', 'A12816'],
  ['Faridabad', 'A12813'],
]);

assert.deepStrictEqual(
  Array.from(STATIONS, (station) => station.nameEn),
  Array.from(expectedSlugs.keys()),
  'Station chips should only show New Delhi, Noida, Gurugram, and Faridabad'
);

for (const [name, slug] of expectedSlugs) {
  const station = STATIONS.find((item) => item.nameEn === name);
  assert(station, `Missing station: ${name}`);
  assert.strictEqual(station.slug, slug, `${name} should use WAQI station ${slug}`);
}

assert.deepStrictEqual(
  Array.from(NCR_CITIES, (city) => city.slug),
  ['A10111', 'A11863', 'A12816', 'A12813'],
  'NCR city cards should use the current explicit WAQI station ids'
);

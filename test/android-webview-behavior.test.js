const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const mainActivitySource = fs.readFileSync(
  path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'grapwatch', 'MainActivity.java'),
  'utf8'
);
const appSource = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
const chartSource = fs.readFileSync(path.join(root, 'js', 'chart.js'), 'utf8');

assert.match(
  mainActivitySource,
  /setOnChildScrollUpCallback/,
  'Native pull-to-refresh should only trigger when the WebView is scrolled to the top'
);
assert.match(
  mainActivitySource,
  /refreshComplete\(\)/,
  'Native pull-to-refresh should call into a bridge completion callback'
);
assert.match(
  mainActivitySource,
  /@JavascriptInterface\s+public void refreshComplete\(\)/,
  'Android bridge should expose refreshComplete() so JavaScript can stop the native spinner'
);
assert.match(
  mainActivitySource,
  /WindowInsetsCompat\.Type\.systemBars\(\)/,
  'Android layout should apply system bar insets instead of drawing edge-to-edge under phone chrome'
);
assert.match(
  appSource,
  /function refreshData\(\) \{[\s\S]*return Promise\.allSettled\(/,
  'refreshData() should return a promise so native refresh can wait for network work'
);

const canvasOps = [];

function createCanvasContext() {
  return {
    scale() {},
    clearRect() {},
    fillRect() {},
    fillText() {},
    beginPath() {},
    moveTo(x, y) { canvasOps.push({ type: 'moveTo', x, y }); },
    lineTo(x, y) { canvasOps.push({ type: 'lineTo', x, y }); },
    closePath() {},
    fill() {},
    stroke() {},
    arc() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
  };
}

const storage = new Map();
const elements = {
  aqiChart: {
    style: {},
    width: 0,
    height: 0,
    getBoundingClientRect: () => ({ width: 320, height: 160 }),
    getContext: () => createCanvasContext(),
  },
  chartEmpty: { style: {}, textContent: '' },
  chartStartLabel: { textContent: '' },
  chartEndLabel: { textContent: '' },
};
const context = {
  safeStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
  },
  STRINGS: { en: { chartCollecting: 'Collecting data...' } },
  lang: 'en',
  window: { devicePixelRatio: 1 },
  document: {
    getElementById: id => elements[id],
  },
  Date,
  Math,
  JSON,
  Number,
};
const chartApi = vm.runInNewContext(
  `${chartSource}\n;({
    saveReading,
    renderChartCard,
    drawAQIChart,
    buildChartSegments: typeof buildChartSegments === 'function' ? buildChartSegments : null,
    formatChartLabel: typeof formatChartLabel === 'function' ? formatChartLabel : null,
  });`,
  context
);

chartApi.saveReading(312, Date.now());
chartApi.renderChartCard();

assert.strictEqual(
  elements.aqiChart.style.display,
  'none',
  'AQI trend chart should not draw a fake flat line from a single live reading'
);
assert.strictEqual(
  elements.chartEmpty.style.display,
  'block',
  'AQI trend chart should stay in a collecting state until at least two real readings exist'
);

canvasOps.length = 0;
const baseTs = Date.now();
chartApi.drawAQIChart(elements.aqiChart, [
  { aqi: 300, ts: baseTs },
  { aqi: 305, ts: baseTs + 30 * 60 * 1000 },
  { aqi: 310, ts: baseTs + 60 * 60 * 1000 },
]);

const trendYs = canvasOps
  .filter(op => (op.type === 'moveTo' || op.type === 'lineTo') && op.y < 156)
  .map(op => op.y);
const ySpread = Math.max(...trendYs) - Math.min(...trendYs);

assert(
  ySpread >= 20,
  'AQI trend chart should make small real AQI changes visibly non-flat'
);

storage.clear();
const demoTs = Date.now();
chartApi.saveReading(312, demoTs, { source: 'demo' });
chartApi.saveReading(190, demoTs + 60 * 1000);

assert.deepStrictEqual(
  JSON.parse(storage.get('grap-history')).map(reading => reading.aqi),
  [190],
  'Demo AQI readings should not be persisted or suppress the first live reading'
);
assert.strictEqual(
  storage.get('grap-history-version'),
  '2',
  'Saved AQI history should mark the live-only history schema version'
);

storage.clear();
storage.set('grap-history', JSON.stringify([
  { aqi: 312, ts: demoTs - 60 * 60 * 1000 },
]));
chartApi.saveReading(188, demoTs);

assert.deepStrictEqual(
  JSON.parse(storage.get('grap-history')).map(reading => reading.aqi),
  [188],
  'Legacy unversioned AQI history should be reset because it may contain demo readings'
);

assert.strictEqual(
  typeof chartApi.buildChartSegments,
  'function',
  'AQI chart should expose gap-aware segment building for test coverage'
);
assert.deepStrictEqual(
  Array.from(chartApi.buildChartSegments([
    { aqi: 190, ts: demoTs },
    { aqi: 220, ts: demoTs + 24 * 60 * 60 * 1000 },
    { aqi: 230, ts: demoTs + 25 * 60 * 60 * 1000 },
  ], 6 * 60 * 60 * 1000), segment => segment.length),
  [1, 2],
  'AQI trend chart should not connect readings across long collection gaps'
);

assert.strictEqual(
  typeof chartApi.formatChartLabel,
  'function',
  'AQI chart should expose range-aware label formatting for test coverage'
);
assert.match(
  chartApi.formatChartLabel(Date.parse('2026-05-26T17:40:00+05:30'), '7d'),
  /26|May/,
  '7D AQI trend labels should include date context, not only the time'
);

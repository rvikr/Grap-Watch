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

function createCanvasContext() {
  return {
    scale() {},
    clearRect() {},
    fillRect() {},
    fillText() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
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
  `${chartSource}\n;({ saveReading, renderChartCard });`,
  context
);

chartApi.saveReading(312, Date.now());
chartApi.renderChartCard();

assert.strictEqual(
  elements.aqiChart.style.display,
  'block',
  'AQI trend chart should render immediately with a single live reading'
);
assert.notStrictEqual(
  elements.chartEmpty.style.display,
  'block',
  'AQI trend chart should not stay in collecting state after the first live reading'
);

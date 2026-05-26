// ═══════════════════════════════════════════════════════════
//  GRAP WATCH — Historical AQI Chart (Canvas)
// ═══════════════════════════════════════════════════════════

const MAX_HISTORY = 336; // 7 days at 30-min intervals
const HISTORY_VERSION = '2';
const HISTORY_VERSION_KEY = 'grap-history-version';
let chartRange = '24h';

function loadHistory() {
  if (safeStorage.getItem(HISTORY_VERSION_KEY) !== HISTORY_VERSION) return [];
  const raw = safeStorage.getItem('grap-history');
  if (!raw) return [];
  try {
    return JSON.parse(raw)
      .filter(h => Number.isFinite(Number(h.aqi)) && Number.isFinite(Number(h.ts)))
      .map(h => ({ aqi: Number(h.aqi), ts: Number(h.ts), source: h.source || 'live' }))
      .sort((a, b) => a.ts - b.ts);
  } catch {
    return [];
  }
}

function saveReading(aqi, ts, options = {}) {
  if (aqi == null || aqi === '-') return;
  if ((options.source || 'live') !== 'live') return;
  const value = Number(aqi);
  if (!Number.isFinite(value) || !Number.isFinite(Number(ts))) return;

  const history = loadHistory();
  // Avoid duplicate entries within 5 minutes
  if (history.length > 0) {
    const last = history[history.length - 1];
    if (ts - last.ts < 5 * 60 * 1000) return;
  }
  history.push({ aqi: value, ts: Number(ts), source: 'live' });
  // Prune entries older than 7 days
  const cutoff = ts - 7 * 24 * 60 * 60 * 1000;
  const pruned = history.filter(h => h.ts >= cutoff);
  // Keep max entries
  while (pruned.length > MAX_HISTORY) pruned.shift();
  safeStorage.setItem(HISTORY_VERSION_KEY, HISTORY_VERSION);
  safeStorage.setItem('grap-history', JSON.stringify(pruned));
}

function setChartRange(range) {
  chartRange = range;
  document.getElementById('btn24h').classList.toggle('active', range === '24h');
  document.getElementById('btn7d').classList.toggle('active', range === '7d');
  renderChartCard();
}

function renderChartCard() {
  const canvas = document.getElementById('aqiChart');
  if (!canvas) return;

  const history = loadHistory();
  const s = STRINGS[lang];
  const now = Date.now();
  const data = buildRenderableChartData(history, now);

  if (data.length < 2) {
    canvas.style.display = 'none';
    const empty = document.getElementById('chartEmpty');
    if (empty) { empty.style.display = 'block'; empty.textContent = getChartCollectingText(s); }
    document.getElementById('chartStartLabel').textContent = '';
    document.getElementById('chartEndLabel').textContent = '';
    return;
  }

  canvas.style.display = 'block';
  const empty = document.getElementById('chartEmpty');
  if (empty) empty.style.display = 'none';

  document.getElementById('chartStartLabel').textContent =
    formatChartLabel(data[0].ts);
  document.getElementById('chartEndLabel').textContent =
    formatChartLabel(data[data.length - 1].ts);

  drawAQIChart(canvas, data);
}

function getChartCollectingText(s) {
  if (chartRange === '24h') return s.chartCollecting24h || s.chartCollecting;
  return s.chartCollecting7d || s.chartCollecting;
}

function formatChartLabel(ts, range = chartRange) {
  const locale = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const fmt = range === '7d'
    ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
    : { hour: '2-digit', minute: '2-digit' };
  return new Date(ts).toLocaleString(locale, fmt);
}

function buildRenderableChartData(history, now = Date.now()) {
  const cutoff = chartRange === '24h'
    ? now - 24 * 60 * 60 * 1000
    : now - 7 * 24 * 60 * 60 * 1000;
  return history.filter(h => h.ts >= cutoff);
}

function buildChartDomain(data) {
  const values = data.map(d => Number(d.aqi)).filter(Number.isFinite);
  if (values.length === 0) return { minAQI: 0, maxAQI: 500 };

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const minSpan = chartRange === '24h' ? 50 : 100;
  const valueSpan = maxValue - minValue;
  const targetSpan = Math.max(valueSpan * 1.4, minSpan);
  const center = (minValue + maxValue) / 2;

  let minAQI = center - targetSpan / 2;
  let maxAQI = center + targetSpan / 2;

  if (minAQI < 0) {
    maxAQI -= minAQI;
    minAQI = 0;
  }
  if (maxAQI > 500) {
    minAQI -= maxAQI - 500;
    maxAQI = 500;
  }

  minAQI = Math.max(0, Math.floor(minAQI / 10) * 10);
  maxAQI = Math.min(500, Math.ceil(maxAQI / 10) * 10);

  if (maxAQI - minAQI < minSpan) {
    if (minAQI === 0) maxAQI = Math.min(500, minAQI + minSpan);
    else if (maxAQI === 500) minAQI = Math.max(0, maxAQI - minSpan);
  }

  return { minAQI, maxAQI };
}

function buildYAxisTicks(minAQI, maxAQI) {
  const span = maxAQI - minAQI;
  let step = 100;
  if (span <= 60) step = 10;
  else if (span <= 120) step = 20;
  else if (span <= 250) step = 50;

  const ticks = [];
  for (let v = Math.ceil(minAQI / step) * step; v <= maxAQI; v += step) {
    ticks.push(v);
  }
  if (ticks[0] !== minAQI) ticks.unshift(minAQI);
  if (ticks[ticks.length - 1] !== maxAQI) ticks.push(maxAQI);
  return ticks.filter((v, i, arr) => i === 0 || v !== arr[i - 1]);
}

function getMaxConnectedGapMs() {
  return chartRange === '24h'
    ? 90 * 60 * 1000
    : 6 * 60 * 60 * 1000;
}

function buildChartSegments(data, maxGapMs = getMaxConnectedGapMs()) {
  if (data.length === 0) return [];

  const segments = [[data[0]]];
  for (let i = 1; i < data.length; i++) {
    const point = data[i];
    const prev = data[i - 1];
    if (point.ts - prev.ts > maxGapMs) {
      segments.push([point]);
    } else {
      segments[segments.length - 1].push(point);
    }
  }
  return segments;
}

function drawAQIChart(canvas, data) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const pad = { top: 10, right: 10, bottom: 4, left: 30 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  ctx.clearRect(0, 0, w, h);

  const { minAQI, maxAQI } = buildChartDomain(data);
  const aqiSpan = maxAQI - minAQI || 1;
  function toY(aqi) {
    const clamped = Math.max(minAQI, Math.min(Number(aqi), maxAQI));
    return pad.top + ch - ((clamped - minAQI) / aqiSpan) * ch;
  }

  // AQI zone background bands
  const zones = [
    { min: 0,   max: 50,  color: 'rgba(34,197,94,0.08)' },
    { min: 50,  max: 100, color: 'rgba(134,239,172,0.06)' },
    { min: 100, max: 200, color: 'rgba(250,204,21,0.06)' },
    { min: 200, max: 300, color: 'rgba(249,115,22,0.06)' },
    { min: 300, max: 400, color: 'rgba(239,68,68,0.06)' },
    { min: 400, max: 500, color: 'rgba(127,29,29,0.08)' },
  ];

  zones.forEach(z => {
    const bandMin = Math.max(z.min, minAQI);
    const bandMax = Math.min(z.max, maxAQI);
    if (bandMax <= bandMin) return;
    const y1 = toY(bandMax);
    const y2 = toY(bandMin);
    ctx.fillStyle = z.color;
    ctx.fillRect(pad.left, y1, cw, y2 - y1);
  });

  // Y-axis labels
  ctx.fillStyle = '#5a6070';
  ctx.font = '9px "DM Mono", monospace';
  ctx.textAlign = 'right';
  buildYAxisTicks(minAQI, maxAQI).forEach(v => {
    const y = toY(v);
    ctx.fillText(v, pad.left - 4, y + 3);
  });

  // Data points
  const minTs = data[0].ts;
  const maxTs = data[data.length - 1].ts;
  const tsRange = maxTs - minTs || 1;

  function toX(ts) { return pad.left + ((ts - minTs) / tsRange) * cw; }
  const segments = buildChartSegments(data);

  // Area fill
  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
  grad.addColorStop(0, 'rgba(255,107,53,0.2)');
  grad.addColorStop(1, 'rgba(255,107,53,0.02)');
  segments.filter(segment => segment.length > 1).forEach(segment => {
    ctx.beginPath();
    ctx.moveTo(toX(segment[0].ts), toY(segment[0].aqi));
    for (let i = 1; i < segment.length; i++) {
      ctx.lineTo(toX(segment[i].ts), toY(segment[i].aqi));
    }
    ctx.lineTo(toX(segment[segment.length - 1].ts), pad.top + ch);
    ctx.lineTo(toX(segment[0].ts), pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  });

  // Line
  ctx.strokeStyle = '#ff6b35';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  segments.filter(segment => segment.length > 1).forEach(segment => {
    ctx.beginPath();
    ctx.moveTo(toX(segment[0].ts), toY(segment[0].aqi));
    for (let i = 1; i < segment.length; i++) {
      ctx.lineTo(toX(segment[i].ts), toY(segment[i].aqi));
    }
    ctx.stroke();
  });

  // Reading dots
  data.slice(0, -1).forEach(point => {
    ctx.beginPath();
    ctx.arc(toX(point.ts), toY(point.aqi), 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6b35';
    ctx.fill();
  });

  // Current point dot
  const last = data[data.length - 1];
  ctx.beginPath();
  ctx.arc(toX(last.ts), toY(last.aqi), 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ff6b35';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(toX(last.ts), toY(last.aqi), 5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,107,53,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

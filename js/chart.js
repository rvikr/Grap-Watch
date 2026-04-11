// ═══════════════════════════════════════════════════════════
//  GRAP WATCH — Historical AQI Chart (Canvas)
// ═══════════════════════════════════════════════════════════

const MAX_HISTORY = 336; // 7 days at 30-min intervals
let chartRange = '24h';

function loadHistory() {
  const raw = safeStorage.getItem('grap-history');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveReading(aqi, ts) {
  if (aqi == null || aqi === '-') return;
  const history = loadHistory();
  // Avoid duplicate entries within 5 minutes
  if (history.length > 0) {
    const last = history[history.length - 1];
    if (ts - last.ts < 5 * 60 * 1000) return;
  }
  history.push({ aqi: Number(aqi), ts });
  // Prune entries older than 7 days
  const cutoff = ts - 7 * 24 * 60 * 60 * 1000;
  const pruned = history.filter(h => h.ts >= cutoff);
  // Keep max entries
  while (pruned.length > MAX_HISTORY) pruned.shift();
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

  // Filter by range
  const now = Date.now();
  const cutoff = chartRange === '24h'
    ? now - 24 * 60 * 60 * 1000
    : now - 7 * 24 * 60 * 60 * 1000;
  const data = history.filter(h => h.ts >= cutoff);

  if (data.length < 2) {
    canvas.style.display = 'none';
    const empty = document.getElementById('chartEmpty');
    if (empty) { empty.style.display = 'block'; empty.textContent = s.chartCollecting; }
    document.getElementById('chartStartLabel').textContent = '';
    document.getElementById('chartEndLabel').textContent = '';
    return;
  }

  canvas.style.display = 'block';
  const empty = document.getElementById('chartEmpty');
  if (empty) empty.style.display = 'none';

  // Time labels
  const fmt = { hour: '2-digit', minute: '2-digit' };
  document.getElementById('chartStartLabel').textContent =
    new Date(data[0].ts).toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', fmt);
  document.getElementById('chartEndLabel').textContent =
    new Date(data[data.length - 1].ts).toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', fmt);

  drawAQIChart(canvas, data);
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

  // AQI zone background bands
  const zones = [
    { min: 0,   max: 50,  color: 'rgba(34,197,94,0.08)' },
    { min: 50,  max: 100, color: 'rgba(134,239,172,0.06)' },
    { min: 100, max: 200, color: 'rgba(250,204,21,0.06)' },
    { min: 200, max: 300, color: 'rgba(249,115,22,0.06)' },
    { min: 300, max: 400, color: 'rgba(239,68,68,0.06)' },
    { min: 400, max: 500, color: 'rgba(127,29,29,0.08)' },
  ];

  const maxAQI = 500;
  zones.forEach(z => {
    const y1 = pad.top + ch - (z.max / maxAQI) * ch;
    const y2 = pad.top + ch - (z.min / maxAQI) * ch;
    ctx.fillStyle = z.color;
    ctx.fillRect(pad.left, y1, cw, y2 - y1);
  });

  // Y-axis labels
  ctx.fillStyle = '#5a6070';
  ctx.font = '9px "DM Mono", monospace';
  ctx.textAlign = 'right';
  [0, 100, 200, 300, 400, 500].forEach(v => {
    const y = pad.top + ch - (v / maxAQI) * ch;
    ctx.fillText(v, pad.left - 4, y + 3);
  });

  // Data points
  const minTs = data[0].ts;
  const maxTs = data[data.length - 1].ts;
  const tsRange = maxTs - minTs || 1;

  function toX(ts) { return pad.left + ((ts - minTs) / tsRange) * cw; }
  function toY(aqi) { return pad.top + ch - (Math.min(aqi, maxAQI) / maxAQI) * ch; }

  // Area fill
  ctx.beginPath();
  ctx.moveTo(toX(data[0].ts), toY(data[0].aqi));
  for (let i = 1; i < data.length; i++) {
    ctx.lineTo(toX(data[i].ts), toY(data[i].aqi));
  }
  ctx.lineTo(toX(data[data.length - 1].ts), pad.top + ch);
  ctx.lineTo(toX(data[0].ts), pad.top + ch);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
  grad.addColorStop(0, 'rgba(255,107,53,0.2)');
  grad.addColorStop(1, 'rgba(255,107,53,0.02)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.moveTo(toX(data[0].ts), toY(data[0].aqi));
  for (let i = 1; i < data.length; i++) {
    ctx.lineTo(toX(data[i].ts), toY(data[i].aqi));
  }
  ctx.strokeStyle = '#ff6b35';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.stroke();

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

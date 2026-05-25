// ═══════════════════════════════════════════════════════════
//  GRAP WATCH v3.0 — Core Application Logic
//  Fixes: safeStorage, fetchWithTimeout, error handling,
//         demo labeling, API proxy
// ═══════════════════════════════════════════════════════════

// ─── SAFE STORAGE (guards against private browsing) ───────
const safeStorage = {
  getItem(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem(key, val) {
    try { localStorage.setItem(key, val); } catch { /* silent */ }
  },
  removeItem(key) {
    try { localStorage.removeItem(key); } catch { /* silent */ }
  }
};

// ─── STATE ────────────────────────────────────────────────
let lang = safeStorage.getItem('grap-lang') || 'hi';
let currentStation = 0;
let currentStageNum = -1;
let autoRefreshTimer = null;
let countdownTimer = null;
let secondsLeft = 30 * 60;
let deferredInstallPrompt = null;
window._isDemo = false;
window._lastData = null;

// ─── FETCH WITH TIMEOUT ──────────────────────────────────
function fetchWithTimeout(url, ms = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
}

// ─── PWA: Service Worker Registration ─────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    console.log('[PWA] Service Worker registered:', reg.scope);

    navigator.serviceWorker.addEventListener('message', e => {
      if (e.data?.type === 'AQI_UPDATE') {
        renderMain({ aqi: e.data.aqi, iaqi: {} });
        resetCountdown();
      }
    });

    if ('periodicSync' in reg) {
      reg.periodicSync.register('grap-periodic', { minInterval: 30 * 60 * 1000 })
        .catch(() => {});
    }
  }).catch(err => console.warn('[PWA] SW registration failed:', err));
}

// ─── PWA: Install Prompt ──────────────────────────────────
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const banner = document.getElementById('installBanner');
  banner.classList.add('show');
  document.getElementById('installText').textContent = STRINGS[lang].installText;
});
window.addEventListener('appinstalled', () => {
  document.getElementById('installBanner').classList.remove('show');
  deferredInstallPrompt = null;
});

function triggerInstall() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.then(() => {
    deferredInstallPrompt = null;
    document.getElementById('installBanner').classList.remove('show');
  });
}

// ─── PLATFORM DETECTION ───────────────────────────────────
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalonePWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

function isNativeIOS() {
  return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iOSBridge);
}

function hasAndroidMethod(method) {
  try {
    return !!(window.Android && window.Android[method] != null);
  } catch {
    return false;
  }
}

function callAndroid(method, ...args) {
  try {
    if (!hasAndroidMethod(method)) return undefined;
    return window.Android[method](...args);
  } catch {
    return undefined;
  }
}

function androidBool(value) {
  return value === true || value === 'true';
}

function isNativeAndroid() {
  const bridgeResult = callAndroid('isAndroid');
  return androidBool(bridgeResult) ||
    /GRAPWatchAndroid\//.test(navigator.userAgent);
}

function notificationsSupported() {
  return isNativeAndroid() || isNativeIOS() || 'Notification' in window;
}

function syncAndroidNotificationState(enabled) {
  const isEnabled = androidBool(enabled);
  const toggle = document.getElementById('notifToggle');

  if (isEnabled) {
    safeStorage.setItem('grap-notif', '1');
    document.getElementById('notifToast').classList.remove('show');
  } else {
    safeStorage.removeItem('grap-notif');
  }

  if (toggle) toggle.checked = isEnabled;
}

// ─── NOTIFICATIONS ────────────────────────────────────────
function handleNotifToggle(enabled) {
  if (enabled) {
    requestNotificationPermission();
  } else {
    syncAndroidNotificationState(false);
    if (isNativeAndroid() && hasAndroidMethod('setNotificationsEnabled')) {
      syncAndroidNotificationState(callAndroid('setNotificationsEnabled', false));
    }
  }
}

async function requestNotificationPermission() {
  const s = STRINGS[lang];
  const toggle = document.getElementById('notifToggle');

  if (isNativeAndroid()) {
    document.getElementById('notifToast').classList.remove('show');
    if (hasAndroidMethod('requestNotificationPermission')) {
      callAndroid('requestNotificationPermission');
    } else if (hasAndroidMethod('setNotificationsEnabled')) {
      syncAndroidNotificationState(callAndroid('setNotificationsEnabled', true));
    } else {
      syncAndroidNotificationState(false);
    }
    return;
  }

  if (isNativeIOS()) {
    safeStorage.setItem('grap-notif', '1');
    toggle.checked = true;
    document.getElementById('notifToast').classList.remove('show');
    window.webkit.messageHandlers.iOSBridge.postMessage({
      action: 'requestNotificationPermission'
    });
    return;
  }

  if (isIOS() && !isStandalonePWA()) {
    toggle.checked = false;
    showIOSInstallGuide(s.iosInstallMsg);
    return;
  }

  if (!notificationsSupported()) {
    toggle.checked = false;
    showIOSInstallGuide(s.notifUnsupported);
    return;
  }

  const perm = await Notification.requestPermission();
  toggle.checked = (perm === 'granted');
  document.getElementById('notifToast').classList.remove('show');

  if (perm === 'granted') {
    safeStorage.setItem('grap-notif', '1');
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      reg.sync.register('grap-sync').catch(() => {});
    }
  } else {
    safeStorage.removeItem('grap-notif');
  }
}

function showIOSInstallGuide(message) {
  const toast = document.getElementById('notifToast');
  document.getElementById('toastMsg').textContent = message;
  const actionBtn = document.getElementById('toastAction');
  actionBtn.style.display = 'none';
  toast.classList.add('show');

  const closeBtn = toast.querySelector('.toast-close');
  const origClose = closeBtn.onclick;
  closeBtn.onclick = () => {
    toast.classList.remove('show');
    actionBtn.style.display = '';
    closeBtn.onclick = origClose;
  };
}

function maybeShowNotifPrompt() {
  if (isNativeAndroid()) {
    let enabled = safeStorage.getItem('grap-notif') === '1';
    if (hasAndroidMethod('areNotificationsEnabled')) {
      enabled = androidBool(callAndroid('areNotificationsEnabled'));
    }
    syncAndroidNotificationState(enabled);
    if (!enabled) {
      setTimeout(() => {
        document.getElementById('notifToast').classList.add('show');
      }, 3000);
    }
    return;
  }

  if (isIOS() && !isStandalonePWA()) return;
  if (!notificationsSupported()) return;

  if (!safeStorage.getItem('grap-notif') && Notification.permission === 'default') {
    setTimeout(() => {
      document.getElementById('notifToast').classList.add('show');
    }, 3000);
  } else if (Notification.permission === 'granted') {
    document.getElementById('notifToggle').checked = true;
  }
}

async function localNotify(title, body) {
  if (isNativeAndroid() && hasAndroidMethod('showNotification')) {
    if (hasAndroidMethod('areNotificationsEnabled') &&
        !androidBool(callAndroid('areNotificationsEnabled'))) {
      return;
    }
    callAndroid('showNotification', title, body);
    return;
  }
  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iOSBridge) {
    window.webkit.messageHandlers.iOSBridge.postMessage({
      action: 'showNotification',
      title: title,
      body: body
    });
    return;
  }
  if (!notificationsSupported()) return;
  if (Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(title, {
      body, icon: '/icon-192.png', badge: '/badge-72.png',
      tag: 'grap-alert', renotify: true,
      vibrate: [200, 100, 200]
    });
  } else {
    new Notification(title, { body });
  }
}

// ─── AUTO-REFRESH (30 min setInterval) ────────────────────
function startAutoRefresh() {
  stopAutoRefresh();
  resetCountdown();
  autoRefreshTimer = setInterval(() => {
    refreshData();
    resetCountdown();
  }, 30 * 60 * 1000);
}

function stopAutoRefresh() {
  clearInterval(autoRefreshTimer);
  clearInterval(countdownTimer);
  autoRefreshTimer = null;
}

function resetCountdown() {
  secondsLeft = 30 * 60;
  clearInterval(countdownTimer);
  updateCountdownUI();
  countdownTimer = setInterval(() => {
    secondsLeft = Math.max(0, secondsLeft - 1);
    updateCountdownUI();
  }, 1000);
}

function updateCountdownUI() {
  const m = Math.floor(secondsLeft / 60).toString().padStart(2,'0');
  const sec = (secondsLeft % 60).toString().padStart(2,'0');
  document.getElementById('refreshCountdown').textContent = `${m}:${sec}`;
  const pct = (secondsLeft / (30 * 60)) * 100;
  document.getElementById('refreshFill').style.width = pct + '%';
}

function handleAutoRefresh(enabled) {
  if (enabled) { startAutoRefresh(); }
  else { stopAutoRefresh(); document.getElementById('refreshCountdown').textContent = '\u2014'; }
}

// ─── STATIONS ─────────────────────────────────────────────
function renderStationChips() {
  const el = document.getElementById('stationScroll');
  el.innerHTML = STATIONS.map((s, i) => {
    const name = lang === 'hi' ? s.nameHi : s.nameEn;
    return `<div class="station-chip ${i===currentStation?'active':''}" role="tab" aria-selected="${i===currentStation}" tabindex="${i===currentStation?'0':'-1'}" onclick="selectStation(${i})">${name}</div>`;
  }).join('');
}

function selectStation(i) {
  currentStation = i;
  document.querySelectorAll('.station-chip').forEach((c,j) => {
    c.classList.toggle('active', j===i);
    c.setAttribute('aria-selected', j===i);
    c.tabIndex = j===i ? 0 : -1;
  });
  loadStation(i);
}

// ─── ERROR HANDLING ───────────────────────────────────────
function showError(type) {
  const s = STRINGS[lang];
  const messages = {
    network: s.errorNetwork,
    api: s.errorApi,
    timeout: s.errorTimeout
  };
  const banner = document.getElementById('errorBanner');
  if (!banner) return;
  document.getElementById('errorMsg').textContent = messages[type] || messages.api;
  banner.classList.add('show');
}

function hideError() {
  const banner = document.getElementById('errorBanner');
  if (banner) banner.classList.remove('show');
}

// ─── DATA LOADING ─────────────────────────────────────────
async function loadStation(i) {
  const slug = STATIONS[i].slug;
  const feed = slug.startsWith('A') ? `@${slug.slice(1)}` : slug;
  hideError();
  try {
    const r = await fetchWithTimeout(`/api/aqi?action=feed&param=${encodeURIComponent(feed)}`);
    const d = await r.json();
    if (d.status === 'ok' && d.data && d.data.aqi != null && d.data.aqi !== '-') {
      renderMain(d.data); return;
    }
    const aqi = await searchAQI(STATIONS[i].nameEn);
    if (aqi && aqi !== '-') { renderMain({ aqi, iaqi: {} }); }
    else { showNoData(); }
  } catch(e) {
    console.warn('[GRAP] Station load failed:', e);
    if (e.name === 'AbortError') {
      showError('timeout');
    } else {
      showError('network');
    }
  }
}

async function searchAQI(name) {
  try {
    const r = await fetchWithTimeout(`/api/aqi?action=search&param=${encodeURIComponent(name)}`);
    const d = await r.json();
    if (d.status === 'ok' && d.data.length > 0) return d.data[0].aqi;
  } catch(e) {
    console.warn('[GRAP] Search fallback failed for', name, e);
  }
  return null;
}

async function loadNcr() {
  const results = await Promise.all(NCR_CITIES.map(async c => {
    const slug = c.slug;
    const feed = slug.startsWith('A') ? `@${slug.slice(1)}` : slug;
    try {
      const r = await fetchWithTimeout(`/api/aqi?action=feed&param=${encodeURIComponent(feed)}`);
      const d = await r.json();
      if (d.status === 'ok' && d.data && d.data.aqi != null && d.data.aqi !== '-') {
        return { nameHi: c.nameHi, nameEn: c.nameEn, aqi: d.data.aqi };
      }
      const aqi = await searchAQI(c.nameEn);
      return { nameHi: c.nameHi, nameEn: c.nameEn, aqi: (aqi && aqi !== '-') ? aqi : null };
    } catch(e) {
      console.warn('[GRAP] NCR load failed for', c.nameEn, e);
      return { nameHi: c.nameHi, nameEn: c.nameEn, aqi: null };
    }
  }));
  renderNcr(results);
}

// ─── RENDER ───────────────────────────────────────────────
function getStageNum(aqi) {
  if (aqi <= 200) return 0;
  if (aqi <= 300) return 1;
  if (aqi <= 400) return 2;
  if (aqi <= 450) return 3;
  return 4;
}

function showNoData() {
  const s = STRINGS[lang];
  document.documentElement.style.setProperty('--stage-color', '#5a6070');
  document.documentElement.style.setProperty('--stage-glow', 'rgba(90,96,112,0.15)');
  document.getElementById('stageName').textContent = s.noData;
  document.getElementById('aqiNumber').innerHTML = `\u2014 <span>AQI</span>`;
  document.getElementById('stageDesc').textContent = s.noDataDesc;
  document.getElementById('pollutantGrid').innerHTML = [
    { label: 'PM2.5', unit: '\u00b5g/m\u00b3' }, { label: 'PM10', unit: '\u00b5g/m\u00b3' },
    { label: 'NO\u2082', unit: 'ppb' }, { label: 'CO', unit: 'ppm' }
  ].map(p => `<div class="pollutant-card">
    <div class="pollutant-label">${p.label}</div>
    <div class="pollutant-value">\u2014</div>
    <div class="pollutant-unit">${p.unit}</div>
    <div class="pollutant-bar"><div class="pollutant-fill" style="width:0%"></div></div>
  </div>`).join('');
  document.getElementById('restrictionsList').innerHTML =
    `<div style="color:var(--muted);font-size:13px">${s.noDataDesc}</div>`;
}

function renderMain(data) {
  window._lastData = data;
  const aqi = data.aqi;
  if (aqi == null || aqi === '-' || aqi === undefined) { showNoData(); return; }

  // Clear demo state on live data
  if (window._isDemo) {
    window._isDemo = false;
    const demoBanner = document.getElementById('demoBanner');
    if (demoBanner) demoBanner.classList.remove('show');
    const liveStatus = document.getElementById('liveStatus');
    liveStatus.classList.remove('demo');
  }
  hideError();

  const s = STRINGS[lang];
  const stageNum = getStageNum(aqi);
  const { color, glow } = GRAP_COLORS[stageNum];

  // Stage change notification
  if (currentStageNum !== -1 && currentStageNum !== stageNum) {
    const dir = stageNum > currentStageNum
      ? (lang === 'hi' ? '\u092c\u093f\u0917\u0921\u093c\u093e' : 'worsened')
      : (lang === 'hi' ? '\u0938\u0941\u0927\u0930\u093e' : 'improved');
    const title = `${['\u2705','\u26a0\ufe0f','\ud83d\udfe0','\ud83d\udd34','\ud83d\udea8'][stageNum]} GRAP ${dir}`;
    let body = `${s.stageNames[currentStageNum]} \u2192 ${s.stageNames[stageNum]} \u00b7 AQI ${aqi}`;

    // Personalized vehicle alerts
    const vehicles = typeof loadVehicles === 'function' ? loadVehicles() : [];
    if (vehicles.length > 0) {
      const bannedVehicles = [];
      for (const v of vehicles) {
        const check = isVehicleBanned(v, stageNum);
        if (check.banned) {
          bannedVehicles.push(v.name);
        }
      }
      if (bannedVehicles.length > 0) {
        if (lang === 'hi') {
          body += `\n\ud83d\udea8 \u092a\u094d\u0930\u092d\u093e\u0935\u093f\u0924: ${bannedVehicles.join(', ')} \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927\u093f\u0924 \u0939\u0948!`;
        } else {
          body += `\n\ud83d\udea8 Affected: ${bannedVehicles.join(', ')} is BANNED!`;
        }
      } else {
        if (lang === 'hi') {
          body += `\n\u2705 \u0905\u091a\u094d\u091b\u0940 \u0916\u092c\u0930: \u0906\u092a\u0915\u0945 \u0938\u092d\u0940 \u0935\u093e\u0939\u0928 \u0905\u0928\u0941\u092e\u0924 \u0939\u0948\u0902\u0964`;
        } else {
          body += `\n\u2705 Good news: All your vehicles are allowed.`;
        }
      }
    }

    let alertsEnabled = safeStorage.getItem('grap-notif') === '1';
    if (isNativeAndroid() && hasAndroidMethod('areNotificationsEnabled')) {
      alertsEnabled = androidBool(callAndroid('areNotificationsEnabled'));
    }
    if (alertsEnabled) localNotify(title, body);
  }
  currentStageNum = stageNum;

  // Native widget integration
  if (isNativeAndroid() && hasAndroidMethod('updateWidget')) {
    callAndroid('updateWidget', aqi, s.stageNames[stageNum], GRAP_COLORS[stageNum].color);
  } else if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.iOSBridge) {
    window.webkit.messageHandlers.iOSBridge.postMessage({
      action: 'updateWidget',
      aqi: aqi,
      stageName: s.stageNames[stageNum],
      stageColor: GRAP_COLORS[stageNum].color
    });
  }

  document.documentElement.style.setProperty('--stage-color', color);
  document.documentElement.style.setProperty('--stage-glow', glow);
  document.getElementById('stageName').textContent = s.stageNames[stageNum];
  document.getElementById('aqiNumber').innerHTML = `${aqi} <span>AQI</span>`;
  document.getElementById('stageDesc').textContent = s.stageDescs[stageNum];

  // Update live status
  const liveStatus = document.getElementById('liveStatus');
  liveStatus.textContent = s.liveLabel;
  liveStatus.classList.remove('demo');

  // Pollutants
  const iaqi = data.iaqi || {};
  const pollutants = [
    { key: 'pm25', label: 'PM2.5', unit: 'AQI', max: 500 },
    { key: 'pm10', label: 'PM10',  unit: 'AQI', max: 500 },
    { key: 'no2',  label: 'NO\u2082',   unit: 'AQI', max: 500 },
    { key: 'co',   label: 'CO',    unit: 'AQI', max: 500 },
  ];
  document.getElementById('pollutantGrid').innerHTML = pollutants.map(p => {
    const val = iaqi[p.key]?.v ?? null;
    const pct = val ? Math.min(100, (val/p.max)*100) : 0;
    return `<div class="pollutant-card">
      <div class="pollutant-label">${p.label}</div>
      <div class="pollutant-value">${val !== null ? val : '\u2014'}</div>
      <div class="pollutant-unit">${p.unit}</div>
      <div class="pollutant-bar" aria-hidden="true"><div class="pollutant-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');

  // Restrictions
  document.getElementById('restrictionsList').innerHTML =
    s.restrictions[stageNum].map(r =>
      `<div class="restriction-item"><span class="restriction-icon" aria-hidden="true">${r.icon}</span><span>${r.text}</span></div>`
    ).join('');

  // Timestamp
  const now = new Date();
  document.getElementById('lastUpdated').textContent =
    now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' });

  // Save reading for chart
  saveReading(aqi, now.getTime());

  // Render new feature cards
  renderHealthCard(aqi);
  renderVehiclesCard(stageNum);
  renderChartCard();

  // Background sync trigger
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => reg.sync.register('grap-sync').catch(() => {}));
  }
}

function renderNcr(cities) {
  document.getElementById('ncrGrid').innerHTML = cities.map(c => {
    const name = lang === 'hi' ? c.nameHi : c.nameEn;
    if (!c.aqi) return `<div class="ncr-card" role="button" tabindex="0" aria-label="${name}: data unavailable"><div class="ncr-city">${name}</div><div class="ncr-aqi" style="color:var(--muted)">\u2014</div></div>`;
    const stageNum = getStageNum(c.aqi);
    const { color } = GRAP_COLORS[stageNum];
    const stageName = STRINGS[lang].stageNames[stageNum].split('\u2014')[0].trim();
    return `<div class="ncr-card" role="button" tabindex="0" aria-label="${name}: AQI ${c.aqi}, ${stageName}" onclick="selectBySlug('${c.nameEn}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectBySlug('${c.nameEn}')}">
      <div class="ncr-city">${name}</div>
      <div class="ncr-aqi" style="color:${color}">${c.aqi}</div>
      <div class="ncr-stage" style="color:${color}">${stageName}</div>
    </div>`;
  }).join('');
}

function selectBySlug(nameEn) {
  const i = STATIONS.findIndex(s => s.nameEn === nameEn);
  if (i !== -1) selectStation(i);
}

// ─── DEMO DATA ────────────────────────────────────────────
function loadDemoData() {
  window._isDemo = true;
  renderMain({ aqi: 312, iaqi: { pm25:{v:142}, pm10:{v:220}, no2:{v:68}, co:{v:12} } });
  // Re-set demo flag since renderMain clears it
  window._isDemo = true;
  renderNcr([
    { nameHi:'\u0926\u093f\u0932\u094d\u0932\u0940',    nameEn:'Delhi',    aqi: 312 },
    { nameHi:'\u0928\u094b\u090f\u0921\u093e',     nameEn:'Noida',    aqi: 278 },
    { nameHi:'\u0917\u0941\u0930\u0941\u0917\u094d\u0930\u093e\u092e', nameEn:'Gurugram', aqi: 335 },
    { nameHi:'\u092b\u0930\u0940\u0926\u093e\u092c\u093e\u0926',  nameEn:'Faridabad',aqi: 298 },
  ]);
  document.getElementById('lastUpdated').textContent = STRINGS[lang].demoLabel;

  // Show demo indicators
  const liveStatus = document.getElementById('liveStatus');
  liveStatus.textContent = STRINGS[lang].demoLabel;
  liveStatus.classList.add('demo');
  const demoBanner = document.getElementById('demoBanner');
  if (demoBanner) {
    demoBanner.textContent = STRINGS[lang].demoBanner;
    demoBanner.classList.add('show');
  }
}

function refreshData() {
  loadStation(currentStation);
  loadNcr();
  resetCountdown();
}

// ─── KEYBOARD NAVIGATION ─────────────────────────────────
function initKeyboardNav() {
  const scroll = document.getElementById('stationScroll');
  scroll.addEventListener('keydown', e => {
    const chips = Array.from(scroll.querySelectorAll('.station-chip'));
    const idx = chips.findIndex(c => c === document.activeElement);
    if (idx === -1) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = e.key === 'ArrowRight'
        ? (idx + 1) % chips.length
        : (idx - 1 + chips.length) % chips.length;
      chips[next].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectStation(idx);
    }
  });
}

// ─── INIT ─────────────────────────────────────────────────
function init() {
  if (typeof syncWithNativeBridge === 'function') syncWithNativeBridge();
  setLang(lang);
  loadDemoData();
  loadStation(0);
  loadNcr();
  startAutoRefresh();
  maybeShowNotifPrompt();
  initKeyboardNav();

  // Handle ?station= URL param
  const params = new URLSearchParams(location.search);
  const stationParam = params.get('station');
  if (stationParam) {
    const i = STATIONS.findIndex(s => s.nameEn.toLowerCase() === stationParam.toLowerCase() || s.slug === stationParam);
    if (i !== -1) selectStation(i);
  }
}

init();

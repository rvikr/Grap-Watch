// ═══════════════════════════════════════════════════════════
//  GRAP WATCH — Service Worker v3.0
//  Handles: Push Notifications · Background Sync · Cache
//  Fixes: API proxy routing, race condition lock, offline fallback
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = 'grap-watch-v3';
const ASSETS = [
  '/', '/index.html', '/manifest.json', '/styles.css', '/offline.html',
  '/js/stations.js', '/js/i18n.js', '/js/app.js',
  '/js/vehicles.js', '/js/health.js', '/js/chart.js'
];
const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Race condition lock for background checks
let _bgCheckRunning = false;

// ─── INSTALL ──────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH (Cache-first for assets, network-first for API) ─
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.pathname.startsWith('/api/aqi')) {
    // Network first for live AQI data via proxy
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else if (e.request.mode === 'navigate') {
    // Navigation requests: network first, fallback to cache, then offline page
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(cached => cached || caches.match('/offline.html'))
        )
    );
  } else {
    // Cache first for static assets
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});

// ─── PUSH NOTIFICATIONS ────────────────────────────────────
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const options = {
    body: data.body || 'GRAP stage has changed in Delhi NCR',
    icon: data.icon || '/icon-192.png',
    badge: '/badge-72.png',
    tag: 'grap-alert',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'view', title: '📊 View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  e.waitUntil(
    self.registration.showNotification(data.title || '🚨 GRAP Alert — Delhi NCR', options)
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        for (const client of list) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        return clients.openWindow('/');
      })
  );
});

// ─── BACKGROUND SYNC (30-min AQI poll) ────────────────────
self.addEventListener('sync', e => {
  if (e.tag === 'grap-sync') {
    e.waitUntil(backgroundAQICheck());
  }
});

self.addEventListener('periodicsync', e => {
  if (e.tag === 'grap-periodic') {
    e.waitUntil(backgroundAQICheck());
  }
});

async function backgroundAQICheck() {
  if (_bgCheckRunning) return;
  _bgCheckRunning = true;
  try {
    const res = await fetch('/api/aqi?action=feed&param=delhi');
    const data = await res.json();
    if (data.status !== 'ok') return;

    const aqi = data.data.aqi;
    const newStage = getStageNumber(aqi);

    // Read last known stage from cache storage
    const cache = await caches.open(CACHE_NAME);
    const stateRes = await cache.match('/grap-state');
    const prevState = stateRes ? await stateRes.json() : { stage: -1, aqi: 0 };

    // Save new state
    await cache.put('/grap-state', new Response(JSON.stringify({ stage: newStage, aqi }), {
      headers: { 'Content-Type': 'application/json' }
    }));

    // Notify clients to refresh UI
    const allClients = await clients.matchAll({ type: 'window' });
    allClients.forEach(c => c.postMessage({ type: 'AQI_UPDATE', aqi, stage: newStage }));

    // Push notification only if GRAP stage changed
    if (prevState.stage !== -1 && prevState.stage !== newStage) {
      const stageNames = ['No GRAP', 'Stage I', 'Stage II', 'Stage III', 'Stage IV'];
      const emoji = ['✅', '⚠️', '🟠', '🔴', '🚨'];
      const direction = newStage > prevState.stage ? 'worsened' : 'improved';
      
      let bodyText = `${stageNames[prevState.stage]} → ${stageNames[newStage]}  ·  AQI ${aqi}`;

      // Check premium vehicle status
      try {
        const subRes = await cache.match('/grap-subscribed');
        const subData = subRes ? await subRes.json() : null;
        if (subData && subData.subscribed === true) {
          const vehRes = await cache.match('/grap-vehicles');
          const vehicles = vehRes ? await vehRes.json() : [];
          if (vehicles.length > 0) {
            const banned = [];
            for (const v of vehicles) {
              if (isVehicleBannedInSW(v, newStage)) {
                banned.push(v.name);
              }
            }
            if (banned.length > 0) {
              bodyText += `\n🚨 Affected: ${banned.join(', ')} is BANNED!`;
            } else {
              bodyText += `\n✅ Good news: All your vehicles are allowed.`;
            }
          }
        }
      } catch (subErr) {
        console.warn('[SW] Vehicle check failed:', subErr);
      }

      await self.registration.showNotification(`${emoji[newStage]} GRAP ${direction} in Delhi`, {
        body: bodyText,
        icon: '/icon-192.png',
        badge: '/badge-72.png',
        tag: 'grap-stage-change',
        renotify: true,
        vibrate: newStage > prevState.stage ? [300, 100, 300, 100, 300] : [200],
        data: { url: '/' }
      });
    }
  } catch (err) {
    console.error('[SW] Background AQI check failed:', err);
  } finally {
    _bgCheckRunning = false;
  }
}

function getStageNumber(aqi) {
  if (aqi <= 200) return 0;
  if (aqi <= 300) return 1;
  if (aqi <= 400) return 2;
  if (aqi <= 450) return 3;
  return 4;
}

const VEHICLE_RULES = {
  3: [
    { fuelType: 'petrol', emissionStd: 'BS-III' },
    { fuelType: 'diesel', emissionStd: 'BS-IV' },
    { fuelType: 'diesel', emissionStd: 'BS-III' },
  ],
  4: [
    { fuelType: 'petrol', emissionStd: 'BS-III' },
    { fuelType: 'diesel', emissionStd: 'BS-IV' },
    { fuelType: 'diesel', emissionStd: 'BS-III' },
  ]
};

function isVehicleBannedInSW(vehicle, grapStage) {
  if (vehicle.fuelType === 'electric' || vehicle.emissionStd === 'electric') {
    return false;
  }
  const rules = VEHICLE_RULES[grapStage] || [];
  for (const rule of rules) {
    if (rule.fuelType === vehicle.fuelType && rule.emissionStd === vehicle.emissionStd) {
      return true;
    }
  }
  if (grapStage >= 4 && vehicle.fuelType === 'diesel' &&
      ['BS-II', 'BS-III', 'BS-IV'].includes(vehicle.emissionStd)) {
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════
//  GRAP WATCH — Vehicle GRAP Rules Engine
// ═══════════════════════════════════════════════════════════

const VEHICLE_RULES = {
  0: [],
  1: [],
  2: [],
  3: [
    { fuelType: 'petrol', emissionStd: 'BS-III', area: 'Delhi' },
    { fuelType: 'diesel', emissionStd: 'BS-IV', area: 'Delhi' },
    { fuelType: 'diesel', emissionStd: 'BS-III', area: 'Delhi' },
  ],
  4: [
    { fuelType: 'petrol', emissionStd: 'BS-III', area: 'NCR' },
    { fuelType: 'diesel', emissionStd: 'BS-IV', area: 'NCR' },
    { fuelType: 'diesel', emissionStd: 'BS-III', area: 'NCR' },
  ]
};

function isVehicleBanned(vehicle, grapStage) {
  if (vehicle.fuelType === 'electric' || vehicle.emissionStd === 'electric') {
    return { banned: false };
  }
  const rules = VEHICLE_RULES[grapStage] || [];
  for (const rule of rules) {
    if (rule.fuelType === vehicle.fuelType && rule.emissionStd === vehicle.emissionStd) {
      return {
        banned: true,
        area: rule.area,
        stage: grapStage
      };
    }
  }
  // Stage 4: all BS-IV and below diesel
  if (grapStage >= 4 && vehicle.fuelType === 'diesel' &&
      ['BS-II', 'BS-III', 'BS-IV'].includes(vehicle.emissionStd)) {
    return { banned: true, area: 'NCR', stage: 4 };
  }
  return { banned: false };
}

function loadVehicles() {
  const raw = safeStorage.getItem('grap-vehicles');
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function saveVehicles(list) {
  safeStorage.setItem('grap-vehicles', JSON.stringify(list));
  // Sync to service worker cache
  if ('caches' in window) {
    caches.open('grap-watch-v3').then(cache => {
      cache.put('/grap-vehicles', new Response(JSON.stringify(list), {
        headers: { 'Content-Type': 'application/json' }
      }));
    }).catch(err => console.warn('[Cache] Vehicle sync failed:', err));
  }
  // Sync to Android bridge
  if (window.Android && typeof window.Android.saveVehicles === 'function') {
    window.Android.saveVehicles(JSON.stringify(list));
  }
}

function syncSubscription(status) {
  safeStorage.setItem('grap-subscribed', status ? 'true' : 'false');
  if ('caches' in window) {
    caches.open('grap-watch-v3').then(cache => {
      cache.put('/grap-subscribed', new Response(JSON.stringify({ subscribed: status }), {
        headers: { 'Content-Type': 'application/json' }
      }));
    }).catch(err => console.warn('[Cache] Sub sync failed:', err));
  }
  if (window.Android && typeof window.Android.setSubscriptionStatus === 'function') {
    window.Android.setSubscriptionStatus(status);
  }
}

function syncWithNativeBridge() {
  if (window.Android) {
    if (typeof window.Android.isSubscribed === 'function') {
      const isSub = window.Android.isSubscribed();
      safeStorage.setItem('grap-subscribed', isSub ? 'true' : 'false');
    }
    if (typeof window.Android.getVehicles === 'function') {
      const vStr = window.Android.getVehicles();
      if (vStr) {
        safeStorage.setItem('grap-vehicles', vStr);
      }
    }
  }
}

function addVehicle(vehicle) {
  const list = loadVehicles();
  vehicle.id = 'v_' + Date.now();
  list.push(vehicle);
  saveVehicles(list);
  return list;
}

function removeVehicle(id) {
  const list = loadVehicles().filter(v => v.id !== id);
  saveVehicles(list);
  return list;
}

function showAddVehicleForm() {
  const overlay = document.getElementById('vehicleFormOverlay');
  overlay.classList.add('show');

  const s = STRINGS[lang];
  document.getElementById('addVehicleFormTitle').textContent = s.addVehicleFormTitle;
  document.getElementById('vehicleNameInput').placeholder = s.vehicleNamePlaceholder;
  document.getElementById('fuelTypeLabel').textContent = s.vehicleFuelLabel;
  document.getElementById('emissionLabel').textContent = s.vehicleEmissionLabel;
  document.getElementById('yearLabel').textContent = s.vehicleYearLabel;
  document.getElementById('btnSaveVehicle').textContent = s.vehicleSave;
  document.getElementById('btnCancelVehicle').textContent = s.vehicleCancel;

  // Render fuel chips
  const fuelGroup = document.getElementById('fuelTypeGroup');
  fuelGroup.innerHTML = ['petrol','diesel','cng','electric'].map(f =>
    `<button class="form-chip" data-fuel="${f}" onclick="selectFuelChip(this)">${s.fuelTypes[f]}</button>`
  ).join('');

  // Render emission chips
  const emGroup = document.getElementById('emissionGroup');
  emGroup.innerHTML = ['BS-III','BS-IV','BS-VI','electric'].map(e =>
    `<button class="form-chip" data-emission="${e}" onclick="selectEmissionChip(this)">${s.emissionStandards[e]}</button>`
  ).join('');

  // Reset form
  document.getElementById('vehicleNameInput').value = '';
  document.getElementById('vehicleYearInput').value = '';
  window._selectedFuel = null;
  window._selectedEmission = null;

  // Focus the name input
  setTimeout(() => document.getElementById('vehicleNameInput').focus(), 100);
}

function hideAddVehicleForm() {
  document.getElementById('vehicleFormOverlay').classList.remove('show');
}

function selectFuelChip(el) {
  el.parentElement.querySelectorAll('.form-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  window._selectedFuel = el.dataset.fuel;

  // Auto-set emission for electric
  if (el.dataset.fuel === 'electric') {
    window._selectedEmission = 'electric';
    document.querySelectorAll('#emissionGroup .form-chip').forEach(c => {
      c.classList.toggle('selected', c.dataset.emission === 'electric');
    });
  }
}

function selectEmissionChip(el) {
  el.parentElement.querySelectorAll('.form-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  window._selectedEmission = el.dataset.emission;
}

function saveVehicleForm() {
  const name = document.getElementById('vehicleNameInput').value.trim();
  const year = document.getElementById('vehicleYearInput').value.trim();
  const fuelType = window._selectedFuel;
  const emissionStd = window._selectedEmission;

  if (!name || !fuelType || !emissionStd) return;

  addVehicle({
    name,
    fuelType,
    emissionStd,
    year: year ? parseInt(year) : null
  });

  hideAddVehicleForm();
  renderVehiclesCard(currentStageNum);
}

// ─── SUBSCRIPTION MODAL CONTROLLERS ───
function showSubscriptionModal() {
  const overlay = document.getElementById('subModalOverlay');
  overlay.classList.add('show');
  document.getElementById('subMainCard').style.display = 'block';
  document.getElementById('subSuccessCard').style.display = 'none';
  selectPaymentMethod('upi');
  
  // Reset payment states
  const s = STRINGS[lang];
  document.getElementById('btnVerifyUpi').disabled = false;
  document.getElementById('btnVerifyUpi').textContent = s.verifyPayment;
  document.getElementById('btnPayCard').disabled = false;
  document.getElementById('btnPayCard').textContent = s.payNow;
}

function hideSubscriptionModal() {
  document.getElementById('subModalOverlay').classList.remove('show');
}

function selectPaymentMethod(method) {
  document.querySelectorAll('.pay-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.id === (method === 'upi' ? 'payUpiBtn' : 'payCardBtn'));
  });
  document.getElementById('upiPaymentView').classList.toggle('active', method === 'upi');
  document.getElementById('cardPaymentView').classList.toggle('active', method === 'card');
}

function simulatePaymentProcess(method) {
  const s = STRINGS[lang];
  if (method === 'upi') {
    const btn = document.getElementById('btnVerifyUpi');
    btn.disabled = true;
    btn.textContent = s.verifying;
    setTimeout(() => {
      showSubSuccess();
    }, 2000);
  } else {
    const btn = document.getElementById('btnPayCard');
    btn.disabled = true;
    btn.textContent = s.processing;
    setTimeout(() => {
      showSubSuccess();
    }, 2000);
  }
}

function showSubSuccess() {
  document.getElementById('subMainCard').style.display = 'none';
  document.getElementById('subSuccessCard').style.display = 'block';
}

function activateSubscription() {
  syncSubscription(true);
  hideSubscriptionModal();
  renderVehiclesCard(currentStageNum);
  // Re-open form
  showAddVehicleForm();
}

function renderVehiclesCard(grapStage) {
  const el = document.getElementById('vehiclesList');
  if (!el) return;

  const badgeEl = document.getElementById('vehiclesPremiumBadge');
  if (badgeEl) {
    badgeEl.style.display = 'none';
  }

  syncWithNativeBridge();
  const vehicles = loadVehicles();
  const s = STRINGS[lang];

  if (vehicles.length === 0) {
    el.innerHTML = `<div style="color:var(--muted);font-size:12px;padding:6px 0">${s.noVehicles}</div>`;
    return;
  }

  el.innerHTML = vehicles.map(v => {
    const result = isVehicleBanned(v, Math.max(0, grapStage));
    const statusClass = result.banned ? 'banned' : 'allowed';
    const statusText = result.banned ? s.vehicleBanned : s.vehicleAllowed;
    const fuelLabel = s.fuelTypes[v.fuelType] || v.fuelType;
    const emLabel = s.emissionStandards[v.emissionStd] || v.emissionStd;
    const yearStr = v.year ? ` \u00b7 ${v.year}` : '';
    const reasonHtml = result.banned
      ? `<div class="vehicle-ban-reason">${s.vehicleBanReasons[result.stage] || ''}</div>`
      : '';

    return `<div class="vehicle-item">
      <div class="vehicle-info">
        <div class="vehicle-name">${escapeHtml(v.name)}</div>
        <div class="vehicle-detail">${fuelLabel} \u00b7 ${emLabel}${yearStr}</div>
        ${reasonHtml}
      </div>
      <span class="vehicle-status ${statusClass}">${statusText}</span>
      <button class="vehicle-delete" onclick="deleteVehicle('${v.id}')" aria-label="Delete ${escapeHtml(v.name)}">\u2715</button>
    </div>`;
  }).join('');
}

function deleteVehicle(id) {
  removeVehicle(id);
  renderVehiclesCard(currentStageNum);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

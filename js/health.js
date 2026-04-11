// ═══════════════════════════════════════════════════════════
//  GRAP WATCH — Health Advisories
// ═══════════════════════════════════════════════════════════

const HEALTH_ADVISORIES = {
  ranges: [
    { min: 0,   max: 50,  level: 'good' },
    { min: 51,  max: 100, level: 'satisfactory' },
    { min: 101, max: 200, level: 'moderate' },
    { min: 201, max: 300, level: 'poor' },
    { min: 301, max: 400, level: 'veryPoor' },
    { min: 401, max: 999, level: 'severe' },
  ],
  advisories: {
    good: {
      general:   { hi: '\u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f\u092f\u093e\u0902 \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0939\u0948\u0902', en: 'Outdoor activities are safe' },
      sensitive: { hi: '\u0915\u094b\u0908 \u0935\u093f\u0936\u0947\u0937 \u0938\u093e\u0935\u0927\u093e\u0928\u0940 \u0928\u0939\u0940\u0902', en: 'No special precautions needed' },
      children:  { hi: '\u092c\u091a\u094d\u091a\u0947 \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924 \u0930\u0942\u092a \u0938\u0947 \u092c\u093e\u0939\u0930 \u0916\u0947\u0932 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902', en: 'Children can play outdoors safely' },
      mask:      { hi: '\u092e\u093e\u0938\u094d\u0915 \u0906\u0935\u0936\u094d\u092f\u0915 \u0928\u0939\u0940\u0902', en: 'No mask needed', level: 'safe' },
      outdoor:   { hi: '\u0938\u092d\u0940 \u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f\u092f\u093e\u0902 \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924', en: 'All outdoor activities safe' },
      windows:   { hi: '\u0916\u093f\u0921\u093c\u0915\u093f\u092f\u093e\u0902 \u0916\u094b\u0932\u0940 \u0930\u0916 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902', en: 'Windows can stay open' }
    },
    satisfactory: {
      general:   { hi: '\u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932 \u0932\u094b\u0917 \u0932\u0902\u092c\u0940 \u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f \u0938\u0940\u092e\u093f\u0924 \u0915\u0930\u0947\u0902', en: 'Sensitive individuals should limit prolonged outdoor exertion' },
      sensitive: { hi: '\u0905\u0938\u094d\u0925\u092e\u093e/\u0939\u094d\u0930\u0926\u092f \u0930\u094b\u0917\u0940 \u0938\u093e\u0935\u0927\u093e\u0928\u0940 \u092c\u0930\u0924\u0947\u0902', en: 'Asthma/heart patients should take precautions' },
      children:  { hi: '\u0932\u0902\u092c\u0947 \u0938\u092e\u092f \u0924\u0915 \u092c\u093e\u0939\u0930 \u0916\u0947\u0932\u0928\u0947 \u0938\u0947 \u092c\u091a\u0947\u0902', en: 'Avoid prolonged outdoor play' },
      mask:      { hi: '\u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932 \u0932\u094b\u0917\u094b\u0902 \u0915\u0947 \u0932\u093f\u090f \u092e\u093e\u0938\u094d\u0915 \u0909\u092a\u092f\u094b\u0917\u0940', en: 'Mask useful for sensitive individuals', level: 'safe' },
      outdoor:   { hi: '\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u0932\u094b\u0917\u094b\u0902 \u0915\u0947 \u0932\u093f\u090f \u0938\u0941\u0930\u0915\u094d\u0937\u093f\u0924', en: 'Safe for most people' },
      windows:   { hi: '\u0916\u093f\u0921\u093c\u0915\u093f\u092f\u093e\u0902 \u0916\u094b\u0932\u0940 \u0930\u0916 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902', en: 'Windows can stay open' }
    },
    moderate: {
      general:   { hi: '\u0932\u0902\u092c\u0940 \u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f \u0938\u0940\u092e\u093f\u0924 \u0915\u0930\u0947\u0902', en: 'Reduce prolonged outdoor exertion' },
      sensitive: { hi: '\u0905\u0938\u094d\u0925\u092e\u093e/\u0939\u094d\u0930\u0926\u092f \u0930\u094b\u0917\u0940 \u092c\u093e\u0939\u0930 \u0928 \u091c\u093e\u090f\u0902', en: 'Asthma/heart patients should stay indoors' },
      children:  { hi: '\u092c\u093e\u0939\u0930\u0940 \u0916\u0947\u0932 \u0938\u0940\u092e\u093f\u0924 \u0915\u0930\u0947\u0902', en: 'Limit outdoor play time' },
      mask:      { hi: '\u0938\u0930\u094d\u091c\u093f\u0915\u0932 \u092e\u093e\u0938\u094d\u0915 \u0909\u092a\u092f\u094b\u0917\u0940', en: 'Surgical mask recommended', level: 'caution' },
      outdoor:   { hi: '\u092d\u093e\u0930\u0940 \u0935\u094d\u092f\u093e\u092f\u093e\u092e \u0938\u0947 \u092c\u091a\u0947\u0902', en: 'Avoid heavy exercise outdoors' },
      windows:   { hi: '\u092a\u0940\u0915 \u0906\u0935\u0930\u0938 \u092e\u0947\u0902 \u0916\u093f\u0921\u093c\u0915\u093f\u092f\u093e\u0902 \u092c\u0902\u0926 \u0930\u0916\u0947\u0902', en: 'Close windows during peak hours' }
    },
    poor: {
      general:   { hi: '\u092c\u093e\u0939\u0930 \u091c\u093e\u0928\u0947 \u0938\u0947 \u092c\u091a\u0947\u0902, \u0918\u0930 \u092e\u0947\u0902 \u0930\u0939\u0947\u0902', en: 'Avoid going outdoors, stay indoors' },
      sensitive: { hi: '\u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932 \u0932\u094b\u0917 \u0918\u0930 \u092e\u0947\u0902 \u0939\u0940 \u0930\u0939\u0947\u0902', en: 'Sensitive groups must stay indoors' },
      children:  { hi: '\u092c\u091a\u094d\u091a\u094b\u0902 \u0915\u094b \u092c\u093e\u0939\u0930 \u0928 \u0916\u0947\u0932\u0928\u0947 \u0926\u0947\u0902', en: 'Keep children indoors' },
      mask:      { hi: 'N95 \u092e\u093e\u0938\u094d\u0915 \u0905\u0928\u093f\u0935\u093e\u0930\u094d\u092f', en: 'N95 mask essential outdoors', level: 'danger' },
      outdoor:   { hi: '\u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f \u092c\u0902\u0926 \u0915\u0930\u0947\u0902', en: 'Stop all outdoor activities' },
      windows:   { hi: '\u0916\u093f\u0921\u093c\u0915\u093f\u092f\u093e\u0902 \u092c\u0902\u0926 \u0930\u0916\u0947\u0902, \u090f\u092f\u0930 \u092a\u094d\u092f\u0942\u0930\u0940\u092b\u093e\u092f\u0930 \u091a\u0932\u093e\u090f\u0902', en: 'Keep windows shut, use air purifier' }
    },
    veryPoor: {
      general:   { hi: '\u0938\u092d\u0940 \u0915\u094b \u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f \u091f\u093e\u0932\u0928\u0940 \u091a\u093e\u0939\u093f\u090f', en: 'Everyone should avoid outdoor activity' },
      sensitive: { hi: '\u0905\u0938\u094d\u0925\u092e\u093e/\u0939\u094d\u0930\u0926\u092f \u0930\u094b\u0917\u0940 \u0918\u0930 \u092e\u0947\u0902 \u0939\u0940 \u0930\u0939\u0947\u0902', en: 'Asthma/heart patients stay strictly indoors' },
      children:  { hi: '\u092c\u091a\u094d\u091a\u094b\u0902 \u0915\u094b \u092c\u093f\u0932\u094d\u0915\u0941\u0932 \u092c\u093e\u0939\u0930 \u0928 \u091c\u093e\u0928\u0947 \u0926\u0947\u0902', en: 'Do not let children go outdoors at all' },
      mask:      { hi: 'N95 \u092e\u093e\u0938\u094d\u0915 \u0905\u0928\u093f\u0935\u093e\u0930\u094d\u092f', en: 'N95 mask mandatory', level: 'danger' },
      outdoor:   { hi: '\u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f \u092c\u0902\u0926 \u0915\u0930\u0947\u0902', en: 'Stop all outdoor activity' },
      windows:   { hi: '\u0916\u093f\u0921\u093c\u0915\u093f\u092f\u093e\u0902 \u092c\u0902\u0926 \u0930\u0916\u0947\u0902, \u090f\u092f\u0930 \u092a\u094d\u092f\u0942\u0930\u0940\u092b\u093e\u092f\u0930 \u091a\u0932\u093e\u090f\u0902', en: 'Keep windows closed, use air purifier' }
    },
    severe: {
      general:   { hi: '\u0938\u092d\u0940 \u0915\u094b \u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f \u091f\u093e\u0932\u0928\u0940 \u091a\u093e\u0939\u093f\u090f', en: 'Everyone should avoid outdoor activity' },
      sensitive: { hi: '\u0905\u0938\u094d\u092a\u0924\u093e\u0932 \u091c\u093e\u090f\u0902 \u092f\u0926\u093f \u0938\u093e\u0902\u0938 \u0932\u0947\u0928\u0947 \u092e\u0947\u0902 \u0924\u0915\u0932\u0940\u092b', en: 'Visit hospital if breathing difficulty' },
      children:  { hi: '\u092c\u091a\u094d\u091a\u094b\u0902 \u0915\u094b \u0918\u0930 \u092e\u0947\u0902 \u0930\u0916\u0947\u0902, \u0938\u094d\u0915\u0942\u0932 \u092c\u0902\u0926 \u0939\u094b \u0938\u0915\u0924\u0947 \u0939\u0948\u0902', en: 'Keep children indoors, schools may close' },
      mask:      { hi: 'N95 \u092e\u093e\u0938\u094d\u0915 \u0905\u0928\u093f\u0935\u093e\u0930\u094d\u092f', en: 'N95 mask mandatory', level: 'danger' },
      outdoor:   { hi: '\u092c\u093e\u0939\u0930\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f \u092c\u0902\u0926 \u0915\u0930\u0947\u0902', en: 'Stop all outdoor activity' },
      windows:   { hi: '\u0916\u093f\u0921\u093c\u0915\u093f\u092f\u093e\u0902 \u092c\u0902\u0926 \u0930\u0916\u0947\u0902, \u090f\u092f\u0930 \u092a\u094d\u092f\u0942\u0930\u0940\u092b\u093e\u092f\u0930 \u091a\u0932\u093e\u090f\u0902', en: 'Keep windows closed, use air purifier' }
    }
  }
};

function getHealthLevel(aqi) {
  for (const r of HEALTH_ADVISORIES.ranges) {
    if (aqi >= r.min && aqi <= r.max) return r.level;
  }
  return 'severe';
}

function renderHealthCard(aqi) {
  const el = document.getElementById('healthContent');
  if (!el || aqi == null || aqi === '-') {
    if (el) el.innerHTML = '';
    return;
  }

  const s = STRINGS[lang];
  const level = getHealthLevel(aqi);
  const advice = HEALTH_ADVISORIES.advisories[level];

  const items = [
    { icon: '\ud83d\udcaa', label: s.healthGeneral,   data: advice.general },
    { icon: '\ud83e\ude7a', label: s.healthSensitive, data: advice.sensitive },
    { icon: '\ud83d\udc76', label: s.healthChildren,  data: advice.children },
    { icon: '\ud83c\udf2c\ufe0f', label: '',           data: advice.outdoor },
    { icon: '\ud83e\ude9f', label: '',                 data: advice.windows },
  ];

  let html = items.map(item =>
    `<div class="health-item">
      <span class="health-icon" aria-hidden="true">${item.icon}</span>
      <span>${item.data[lang]}</span>
    </div>`
  ).join('');

  // Mask badge
  const mask = advice.mask;
  html += `<div class="mask-badge ${mask.level}">${mask[lang]}</div>`;

  el.innerHTML = html;
}

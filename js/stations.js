// ═══════════════════════════════════════════════════════════
//  GRAP WATCH — Station & Color Data
// ═══════════════════════════════════════════════════════════

const GRAP_COLORS = [
  { color: '#22c55e', glow: 'rgba(34,197,94,0.25)' },
  { color: '#facc15', glow: 'rgba(250,204,21,0.25)' },
  { color: '#f97316', glow: 'rgba(249,115,22,0.25)' },
  { color: '#ef4444', glow: 'rgba(239,68,68,0.25)' },
  { color: '#991b1b', glow: 'rgba(153,27,27,0.35)' }
];

const STATIONS = [
  { nameHi: '\u0928\u0908 \u0926\u093f\u0932\u094d\u0932\u0940', nameEn: 'New Delhi', slug: 'A10111' },
  { nameHi: '\u0928\u094b\u090f\u0921\u093e',      nameEn: 'Noida',       slug: 'A11863' },
  { nameHi: '\u0917\u0941\u0930\u0941\u0917\u094d\u0930\u093e\u092e',  nameEn: 'Gurugram',    slug: 'A12816' },
  { nameHi: '\u092b\u0930\u0940\u0926\u093e\u092c\u093e\u0926',   nameEn: 'Faridabad',   slug: 'A12813' },
];

const NCR_CITIES = STATIONS.filter(s => ['A10111','A11863','A12816','A12813'].includes(s.slug));

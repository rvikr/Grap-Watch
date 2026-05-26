// ═══════════════════════════════════════════════════════════
//  GRAP WATCH — i18n Strings & Language Switching
// ═══════════════════════════════════════════════════════════

const STRINGS = {
  hi: {
    appTitle: 'GRAP \u0935\u0949\u091a',
    appSubtitle: '\u0926\u093f\u0932\u094d\u0932\u0940 \u00b7 NCR \u00b7 \u0935\u093e\u092f\u0941 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e',
    currentStageLabel: '\u0935\u0930\u094d\u0924\u092e\u093e\u0928 GRAP \u0938\u094d\u0924\u0930',
    scaleTitle: 'AQI \u0938\u094d\u0915\u0947\u0932',
    restrictionsTitle: '\u0938\u0915\u094d\u0930\u093f\u092f \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927',
    settingsTitle: '\u0938\u0947\u091f\u093f\u0902\u0917\u094d\u0938',
    notifLabel: 'GRAP \u0905\u0932\u0930\u094d\u091f',
    notifSub: '\u0938\u094d\u0924\u0930 \u092c\u0926\u0932\u0928\u0947 \u092a\u0930 \u0938\u0942\u091a\u0928\u093e',
    autoRefLabel: '\u0911\u091f\u094b-\u0930\u093f\u092b\u094d\u0930\u0947\u0936 (30 \u092e\u093f\u0928\u091f)',
    autoRefSub: '\u092a\u0943\u0937\u094d\u0920\u092d\u0942\u092e\u093f \u092e\u0947\u0902 \u0905\u092a\u0921\u0947\u091f',
    ncrTitle: 'NCR \u0938\u094d\u0928\u0948\u092a\u0936\u0949\u091f',
    refreshBtnLabel: '\u0921\u0947\u091f\u093e \u0930\u093f\u092b\u094d\u0930\u0947\u0936 \u0915\u0930\u0947\u0902',
    footerSource: '\u0921\u0947\u091f\u093e: WAQI \u00b7 CPCB \u00b7 CAQM \u0926\u093f\u0936\u093e\u0928\u093f\u0930\u094d\u0926\u0947\u0936',
    autoRefreshLabel: '\u0905\u0917\u0932\u093e \u0905\u092a\u0921\u0947\u091f',
    installText: '\u0939\u094b\u092e \u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u092a\u0930 \u091c\u094b\u0921\u093c\u0947\u0902',
    toastMsg: 'GRAP \u092c\u0926\u0932\u0928\u0947 \u092a\u0930 \u0928\u094b\u091f\u093f\u092b\u093f\u0915\u0947\u0936\u0928 \u092a\u093e\u090f\u0902',
    toastAction: '\u091a\u093e\u0932\u0942 \u0915\u0930\u0947\u0902',
    loading: '\u0932\u094b\u0921 \u0939\u094b \u0930\u0939\u093e \u0939\u0948...',
    fetching: '\u0921\u0947\u091f\u093e \u0932\u093e\u092f\u093e \u091c\u093e \u0930\u0939\u093e \u0939\u0948...',
    liveLabel: '\u0932\u093e\u0907\u0935',
    demoLabel: '\u0921\u0947\u092e\u094b',
    noData: '\u0921\u0947\u091f\u093e \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902',
    noDataDesc: '\u0907\u0938 \u0938\u094d\u091f\u0947\u0936\u0928 \u0915\u0947 \u0932\u093f\u090f \u0905\u092d\u0940 AQI \u0921\u0947\u091f\u093e \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964 \u0915\u0943\u092a\u092f\u093e \u0926\u093f\u0932\u094d\u0932\u0940 \u0938\u094d\u091f\u0947\u0936\u0928 \u091a\u0941\u0928\u0947\u0902\u0964',
    iosInstallMsg: '\u0928\u094b\u091f\u093f\u092b\u093f\u0915\u0947\u0936\u0928 \u0915\u0947 \u0932\u093f\u090f \u092a\u0939\u0932\u0947 \u0910\u092a \u0907\u0902\u0938\u094d\u091f\u0949\u0932 \u0915\u0930\u0947\u0902: Share \u092c\u091f\u0928 \u2b06 \u0926\u092c\u093e\u090f\u0902 \u2192 "Add to Home Screen" \u091a\u0941\u0928\u0947\u0902, \u092b\u093f\u0930 \u0910\u092a \u0938\u0947 \u0905\u0932\u0930\u094d\u091f \u091a\u093e\u0932\u0942 \u0915\u0930\u0947\u0902\u0964',
    notifUnsupported: '\u0906\u092a\u0915\u093e \u092c\u094d\u0930\u093e\u0909\u091c\u093c\u0930 \u0928\u094b\u091f\u093f\u092b\u093f\u0915\u0947\u0936\u0928 \u0938\u092a\u094b\u0930\u094d\u091f \u0928\u0939\u0940\u0902 \u0915\u0930\u0924\u093e\u0964 \u0915\u0943\u092a\u092f\u093e iOS 16.4+ \u092a\u0930 \u0910\u092a \u0907\u0902\u0938\u094d\u091f\u0949\u0932 \u0915\u0930\u0947\u0902\u0964',
    stageNames: ['GRAP \u0938\u0915\u094d\u0930\u093f\u092f \u0928\u0939\u0940\u0902', '\u091a\u0930\u0923 I \u2014 \u0916\u0930\u093e\u092c', '\u091a\u0930\u0923 II \u2014 \u092c\u0939\u0941\u0924 \u0916\u0930\u093e\u092c', '\u091a\u0930\u0923 III \u2014 \u0917\u0902\u092d\u0940\u0930', '\u091a\u0930\u0923 IV \u2014 \u0905\u0924\u093f \u0917\u0902\u092d\u0940\u0930'],
    stageDescs: [
      '\u0935\u093e\u092f\u0941 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u0938\u094d\u0935\u0940\u0915\u093e\u0930\u094d\u092f \u0939\u0948\u0964 \u0915\u094b\u0908 \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927 \u0928\u0939\u0940\u0902\u0964',
      '\u0935\u093e\u092f\u0941 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e \u0916\u0930\u093e\u092c \u0939\u0948\u0964 \u092c\u0941\u0928\u093f\u092f\u093e\u0926\u0940 \u0938\u093e\u0935\u0927\u093e\u0928\u093f\u092f\u093e\u0902 \u0932\u093e\u0917\u0942\u0964',
      '\u092c\u0939\u0941\u0924 \u0916\u0930\u093e\u092c \u0935\u093e\u092f\u0941 \u0917\u0941\u0923\u0935\u0924\u094d\u0924\u093e\u0964 NCR \u092e\u0947\u0902 \u0915\u0921\u093c\u0947 \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927\u0964',
      '\u0917\u0902\u092d\u0940\u0930 \u092a\u094d\u0930\u0926\u0942\u0937\u0923\u0964 \u0935\u093e\u0939\u0928\u094b\u0902 \u0935 \u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u092a\u0930 \u092c\u0921\u093c\u0947 \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927\u0964',
      '\u0905\u0924\u094d\u092f\u0902\u0924 \u0906\u092a\u093e\u0924\u0915\u093e\u0932\u0964 \u0905\u0927\u093f\u0915\u0924\u092e \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927, WFH \u0938\u0932\u093e\u0939 \u0938\u0915\u094d\u0930\u093f\u092f\u0964'
    ],
    restrictions: [
      [
        { icon: '\u2705', text: '\u0938\u093e\u092e\u093e\u0928\u094d\u092f \u0935\u093e\u0939\u0928 \u0906\u0935\u093e\u091c\u093e\u0939\u0940 \u0905\u0928\u0941\u092e\u0924' },
        { icon: '\u2705', text: '\u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0917\u0924\u093f\u0935\u093f\u0927\u093f \u0905\u0928\u0941\u092e\u0924' },
        { icon: '\u2705', text: '\u0909\u0926\u094d\u092f\u094b\u0917 \u0938\u093e\u092e\u093e\u0928\u094d\u092f \u0930\u0942\u092a \u0938\u0947 \u091a\u093e\u0932\u0942' },
        { icon: '\u2705', text: '\u0911\u0921-\u0908\u0935\u0928 \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927 \u0928\u0939\u0940\u0902' },
      ],
      [
        { icon: '\u26a0\ufe0f', text: '\u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0938\u094d\u0925\u0932\u094b\u0902 \u092a\u0930 \u0927\u0942\u0932 \u0926\u092e\u0928 \u0905\u0928\u093f\u0935\u093e\u0930\u094d\u092f' },
        { icon: '\u26a0\ufe0f', text: '\u0915\u0942\u0921\u093c\u093e \u091c\u0932\u093e\u0928\u093e \u0938\u0916\u094d\u0924 \u0935\u0930\u094d\u091c\u093f\u0924' },
        { icon: '\u26a0\ufe0f', text: '\u092a\u094d\u0930\u0926\u0942\u0937\u0923\u0915\u093e\u0930\u0940 \u0909\u0926\u094d\u092f\u094b\u0917 \u0928\u093f\u0917\u0930\u093e\u0928\u0940 \u092e\u0947\u0902' },
        { icon: '\u2705', text: '\u0935\u0948\u0927 PUC \u0935\u093e\u0932\u0947 \u0935\u093e\u0939\u0928 \u0905\u0928\u0941\u092e\u0924' },
      ],
      [
        { icon: '\ud83d\udeab', text: '\u0921\u0940\u091c\u0932 \u091c\u0928\u0930\u0947\u091f\u0930 (\u0905\u0938\u094d\u092a\u0924\u093e\u0932 \u091b\u094b\u0921\u093c\u0915\u0930) \u092c\u0902\u0926' },
        { icon: '\ud83d\udeab', text: '\u0939\u0949\u091f \u092e\u093f\u0915\u094d\u0938 \u092a\u094d\u0932\u093e\u0902\u091f \u0935 \u0938\u094d\u091f\u094b\u0928 \u0915\u094d\u0930\u0936\u0930 \u092c\u0902\u0926' },
        { icon: '\u26a0\ufe0f', text: '\u0924\u0902\u0926\u0942\u0930 \u092e\u0947\u0902 \u0915\u094b\u092f\u0932\u093e \u0935 \u0932\u0915\u0921\u093c\u0940 \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927\u093f\u0924' },
        { icon: '\u26a0\ufe0f', text: '\u0908\u0902\u091f \u092d\u091f\u094d\u091f\u094b\u0902 \u0915\u094b \u091c\u093c\u093f\u0917-\u091c\u093c\u0948\u0917 \u0924\u0915\u0928\u0940\u0915 \u0905\u092a\u0928\u093e\u0928\u0940 \u0939\u094b\u0917\u0940' },
      ],
      [
        { icon: '\ud83d\udeab', text: '\u0926\u093f\u0932\u094d\u0932\u0940 \u092e\u0947\u0902 BS-III \u092a\u0947\u091f\u094d\u0930\u094b\u0932 \u0935 BS-IV \u0921\u0940\u091c\u0932 \u0915\u093e\u0930 \u092c\u0902\u0926' },
        { icon: '\ud83d\udeab', text: '\u0917\u0948\u0930-\u091c\u0930\u0942\u0930\u0940 \u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0915\u093e\u0930\u094d\u092f \u092c\u0902\u0926' },
        { icon: '\ud83d\udeab', text: '\u0916\u0928\u0928 \u0935 \u0909\u0924\u094d\u0916\u0928\u0928 \u0917\u0924\u093f\u0935\u093f\u0927\u093f\u092f\u093e\u0902 \u092c\u0902\u0926' },
        { icon: '\u26a0\ufe0f', text: '\u0938\u094d\u0915\u0942\u0932 \u0911\u0928\u0932\u093e\u0907\u0928 \u092e\u094b\u0921 \u092e\u0947\u0902 \u091c\u093e \u0938\u0915\u0924\u0947 \u0939\u0948\u0902' },
      ],
      [
        { icon: '\ud83d\udeab', text: '\u0926\u093f\u0932\u094d\u0932\u0940 \u092e\u0947\u0902 \u091f\u094d\u0930\u0915 \u092a\u094d\u0930\u0935\u0947\u0936 \u092c\u0902\u0926 (\u091c\u0930\u0942\u0930\u0940 \u0938\u0947\u0935\u093e\u090f\u0902 \u091b\u094b\u0921\u093c\u0915\u0930)' },
        { icon: '\ud83d\udeab', text: 'BS-IV \u0935 \u0909\u0938\u0938\u0947 \u0928\u0940\u091a\u0947 \u0915\u0947 \u0921\u0940\u091c\u0932 LMV NCR \u092e\u0947\u0902 \u092c\u0902\u0926' },
        { icon: '\ud83d\udeab', text: '\u0938\u092d\u0940 \u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0935 \u0927\u094d\u0935\u0902\u0938 \u0915\u093e\u0930\u094d\u092f \u092c\u0902\u0926' },
        { icon: '\ud83d\udeab', text: '50% \u0938\u0930\u0915\u093e\u0930\u0940 \u0915\u0930\u094d\u092e\u091a\u093e\u0930\u0940 WFH, \u0928\u093f\u091c\u0940 \u0926\u092b\u094d\u0924\u0930 \u092a\u094d\u0930\u094b\u0924\u094d\u0938\u093e\u0939\u093f\u0924' },
      ]
    ],
    // Error strings
    errorNetwork: '\u0907\u0902\u091f\u0930\u0928\u0947\u091f \u0928\u0939\u0940\u0902 \u2014 \u0915\u0948\u0936 \u0921\u0947\u091f\u093e \u0926\u093f\u0916\u093e\u092f\u093e \u091c\u093e \u0930\u0939\u093e \u0939\u0948',
    errorApi: 'API \u0938\u0947 \u0921\u0947\u091f\u093e \u0928\u0939\u0940\u0902 \u092e\u093f\u0932\u093e \u2014 \u0926\u094b\u092c\u093e\u0930\u093e \u092a\u094d\u0930\u092f\u093e\u0938 \u0939\u094b \u0930\u0939\u093e \u0939\u0948...',
    errorTimeout: '\u0905\u0928\u0941\u0930\u094b\u0927 \u0938\u092e\u092f \u0938\u092e\u093e\u092a\u094d\u0924 \u2014 \u0915\u0943\u092a\u092f\u093e \u092a\u0941\u0928\u0903 \u092a\u094d\u0930\u092f\u093e\u0938 \u0915\u0930\u0947\u0902',
    retryBtn: '\u092a\u0941\u0928\u0903 \u092a\u094d\u0930\u092f\u093e\u0938',
    showingCached: '\u0915\u0948\u0936 \u0921\u0947\u091f\u093e \u0926\u093f\u0916\u093e\u092f\u093e \u091c\u093e \u0930\u0939\u093e \u0939\u0948',
    demoBanner: '\u0921\u0947\u092e\u094b \u0921\u0947\u091f\u093e \u2014 \u0932\u093e\u0907\u0935 \u0921\u0947\u091f\u093e \u0932\u094b\u0921 \u0939\u094b \u0930\u0939\u093e \u0939\u0948...',
    // Health advisory strings
    healthTitle: '\u0938\u094d\u0935\u093e\u0938\u094d\u0925\u094d\u092f \u0938\u0932\u093e\u0939',
    healthGeneral: '\u0938\u093e\u092e\u093e\u0928\u094d\u092f',
    healthSensitive: '\u0938\u0902\u0935\u0947\u0926\u0928\u0936\u0940\u0932 \u0935\u0930\u094d\u0917',
    healthChildren: '\u092c\u091a\u094d\u091a\u0947',
    healthElderly: '\u092c\u0941\u091c\u0941\u0930\u094d\u0917',
    // Vehicle strings
    vehiclesTitle: '\u092e\u0947\u0930\u0947 \u0935\u093e\u0939\u0928',
    addVehicleBtnLabel: '\u0935\u093e\u0939\u0928 \u091c\u094b\u0921\u093c\u0947\u0902',
    addVehicleFormTitle: '\u0928\u092f\u093e \u0935\u093e\u0939\u0928 \u091c\u094b\u0921\u093c\u0947\u0902',
    vehicleBanned: '\u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927\u093f\u0924',
    vehicleAllowed: '\u0905\u0928\u0941\u092e\u0924',
    vehicleNamePlaceholder: '\u0935\u093e\u0939\u0928 \u0915\u093e \u0928\u093e\u092e (e.g. \u092e\u0947\u0930\u0940 Swift)',
    vehicleFuelLabel: '\u0908\u0902\u0927\u0928 \u092a\u094d\u0930\u0915\u093e\u0930',
    vehicleEmissionLabel: '\u0909\u0924\u094d\u0938\u0930\u094d\u091c\u0928 \u092e\u093e\u0928\u0915',
    vehicleYearLabel: '\u0928\u093f\u0930\u094d\u092e\u093e\u0923 \u0935\u0930\u094d\u0937',
    vehicleSave: '\u0938\u0939\u0947\u091c\u0947\u0902',
    vehicleCancel: '\u0930\u0926\u094d\u0926 \u0915\u0930\u0947\u0902',
    fuelTypes: { petrol: '\u092a\u0947\u091f\u094d\u0930\u094b\u0932', diesel: '\u0921\u0940\u091c\u093c\u0932', cng: 'CNG', electric: '\u0907\u0932\u0947\u0915\u094d\u091f\u094d\u0930\u093f\u0915' },
    emissionStandards: { 'BS-III': 'BS-III', 'BS-IV': 'BS-IV', 'BS-VI': 'BS-VI', 'electric': '\u0907\u0932\u0947\u0915\u094d\u091f\u094d\u0930\u093f\u0915' },
    vehicleBanReasons: {
      3: '\u0926\u093f\u0932\u094d\u0932\u0940 \u092e\u0947\u0902 \u091a\u0930\u0923 III \u0915\u0947 \u0924\u0939\u0924 \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927\u093f\u0924',
      4: 'NCR \u092e\u0947\u0902 \u091a\u0930\u0923 IV \u0915\u0947 \u0924\u0939\u0924 \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927\u093f\u0924'
    },
    noVehicles: '\u0905\u092a\u0928\u0947 \u0935\u093e\u0939\u0928 \u091c\u094b\u0921\u093c\u0947\u0902 \u0914\u0930 GRAP \u092a\u094d\u0930\u0924\u093f\u092c\u0902\u0927 \u0926\u0947\u0916\u0947\u0902',
    // Chart strings
    chartTitle: 'AQI \u091f\u094d\u0930\u0947\u0902\u0921',
    chartCollecting: '\u091f\u094d\u0930\u0947\u0902\u0921 \u0926\u094b \u0932\u093e\u0907\u0935 \u0905\u092a\u0921\u0947\u091f \u0915\u0947 \u092c\u093e\u0926 \u0926\u093f\u0916\u0947\u0917\u093e',
    chartCollecting24h: '24H \u091f\u094d\u0930\u0947\u0902\u0921 \u0915\u0947 \u0932\u093f\u090f \u092a\u093f\u091b\u0932\u0947 24 \u0918\u0902\u091f\u094b\u0902 \u092e\u0947\u0902 \u0926\u094b \u0932\u093e\u0907\u0935 \u0905\u092a\u0921\u0947\u091f \u091a\u093e\u0939\u093f\u090f',
    chartCollecting7d: '7D \u091f\u094d\u0930\u0947\u0902\u0921 \u0915\u0947 \u0932\u093f\u090f \u0907\u0938 \u0939\u092b\u094d\u0924\u0947 \u0926\u094b \u0932\u093e\u0907\u0935 \u0905\u092a\u0921\u0947\u091f \u091a\u093e\u0939\u093f\u090f',
    // AQI scale category labels
    scaleGood: '\u0905\u091a\u094d\u091b\u093e',
    scaleSatisfactory: '\u0938\u0902\u0924\u094b\u0937\u091c\u0928\u0915',
    scaleModerate: '\u092e\u0927\u094d\u092f\u092e',
    scalePoor: '\u0916\u0930\u093e\u092c',
    scaleVeryPoor: '\u092c\u0939\u0941\u0924 \u0916\u0930\u093e\u092c',
    scaleSevere: '\u0917\u0902\u092d\u0940\u0930',
  },
  en: {
    appTitle: 'GRAP WATCH',
    appSubtitle: 'Delhi \u00b7 NCR \u00b7 Air Quality',
    currentStageLabel: 'Current GRAP Stage',
    scaleTitle: 'AQI Scale',
    restrictionsTitle: 'Active Restrictions',
    settingsTitle: 'Settings',
    notifLabel: 'GRAP Alerts',
    notifSub: 'Notify when stage changes',
    autoRefLabel: 'Auto-Refresh (30 min)',
    autoRefSub: 'Update in background',
    ncrTitle: 'NCR Snapshot',
    refreshBtnLabel: 'Refresh Data',
    footerSource: 'Data: WAQI \u00b7 CPCB \u00b7 CAQM guidelines',
    autoRefreshLabel: 'Next update',
    installText: 'Add to home screen',
    toastMsg: 'Get notified when GRAP changes',
    toastAction: 'Enable',
    loading: 'Loading...',
    fetching: 'Fetching air quality data...',
    liveLabel: 'LIVE',
    demoLabel: 'DEMO',
    noData: 'Data Unavailable',
    noDataDesc: 'AQI data is not available for this station right now. Please select the Delhi station.',
    iosInstallMsg: 'To enable notifications, first install the app: Tap the Share button \u2b06 \u2192 "Add to Home Screen", then enable alerts from the installed app.',
    notifUnsupported: 'Your browser doesn\'t support notifications. Please install the app on iOS 16.4+ to get alerts.',
    stageNames: ['No GRAP Active', 'Stage I \u2014 Poor', 'Stage II \u2014 Very Poor', 'Stage III \u2014 Severe', 'Stage IV \u2014 Severe+'],
    stageDescs: [
      'Air quality is acceptable. No restrictions in effect.',
      'Air quality is poor. Basic precautions in effect.',
      'Very poor air quality. Enhanced restrictions across NCR.',
      'Severe pollution. Major restrictions on vehicles and construction.',
      'Extreme emergency. Maximum restrictions, WFH advisory active.'
    ],
    restrictions: [
      [
        { icon: '\u2705', text: 'Normal vehicle movement allowed' },
        { icon: '\u2705', text: 'Construction activity permitted' },
        { icon: '\u2705', text: 'Industries operating normally' },
        { icon: '\u2705', text: 'No odd-even restrictions' },
      ],
      [
        { icon: '\u26a0\ufe0f', text: 'Dust suppression at construction sites mandatory' },
        { icon: '\u26a0\ufe0f', text: 'Garbage burning strictly prohibited' },
        { icon: '\u26a0\ufe0f', text: 'Polluting industries under enhanced monitoring' },
        { icon: '\u2705', text: 'Vehicles with valid PUC permitted' },
      ],
      [
        { icon: '\ud83d\udeab', text: 'Diesel gensets (except hospitals) banned' },
        { icon: '\ud83d\udeab', text: 'Hot mix plants & stone crushers shut' },
        { icon: '\u26a0\ufe0f', text: 'Coal & firewood use in tandoors restricted' },
        { icon: '\u26a0\ufe0f', text: 'Brick kilns to use zig-zag technology only' },
      ],
      [
        { icon: '\ud83d\udeab', text: 'BS-III petrol & BS-IV diesel cars banned in Delhi' },
        { icon: '\ud83d\udeab', text: 'Non-essential construction halted' },
        { icon: '\ud83d\udeab', text: 'Mining & quarrying activities stopped' },
        { icon: '\u26a0\ufe0f', text: 'Schools may shift to online mode' },
      ],
      [
        { icon: '\ud83d\udeab', text: 'Truck entry into Delhi banned (except essentials)' },
        { icon: '\ud83d\udeab', text: 'BS-IV & below diesel LMVs banned NCR-wide' },
        { icon: '\ud83d\udeab', text: 'All construction & demolition halted' },
        { icon: '\ud83d\udeab', text: '50% govt staff WFH, private offices encouraged' },
      ]
    ],
    // Error strings
    errorNetwork: 'No internet \u2014 showing cached data',
    errorApi: 'API error \u2014 retrying...',
    errorTimeout: 'Request timed out \u2014 please try again',
    retryBtn: 'Retry',
    showingCached: 'Showing cached data',
    demoBanner: 'Demo data \u2014 live data loading...',
    // Health advisory strings
    healthTitle: 'Health Advisory',
    healthGeneral: 'General',
    healthSensitive: 'Sensitive Groups',
    healthChildren: 'Children',
    healthElderly: 'Elderly',
    // Vehicle strings
    vehiclesTitle: 'My Vehicles',
    addVehicleBtnLabel: 'Add Vehicle',
    addVehicleFormTitle: 'Add New Vehicle',
    vehicleBanned: 'BANNED',
    vehicleAllowed: 'ALLOWED',
    vehicleNamePlaceholder: 'Vehicle name (e.g. My Swift)',
    vehicleFuelLabel: 'Fuel Type',
    vehicleEmissionLabel: 'Emission Standard',
    vehicleYearLabel: 'Year',
    vehicleSave: 'Save',
    vehicleCancel: 'Cancel',
    fuelTypes: { petrol: 'Petrol', diesel: 'Diesel', cng: 'CNG', electric: 'Electric' },
    emissionStandards: { 'BS-III': 'BS-III', 'BS-IV': 'BS-IV', 'BS-VI': 'BS-VI', 'electric': 'Electric' },
    vehicleBanReasons: {
      3: 'Banned in Delhi under Stage III',
      4: 'Banned NCR-wide under Stage IV'
    },
    noVehicles: 'Add your vehicles to see GRAP restrictions',
    // Chart strings
    chartTitle: 'AQI Trend',
    chartCollecting: 'Trend appears after two live updates',
    chartCollecting24h: '24H trend needs two live updates in the last 24 hours',
    chartCollecting7d: '7D trend needs two live updates this week',
    // AQI scale category labels
    scaleGood: 'Good',
    scaleSatisfactory: 'Satisfactory',
    scaleModerate: 'Moderate',
    scalePoor: 'Poor',
    scaleVeryPoor: 'Very Poor',
    scaleSevere: 'Severe',
  }
};

function setLang(l) {
  lang = l;
  safeStorage.setItem('grap-lang', l);
  document.documentElement.lang = l;
  document.getElementById('btnHi').classList.toggle('active', l === 'hi');
  document.getElementById('btnEn').classList.toggle('active', l === 'en');
  document.getElementById('btnHi').setAttribute('aria-pressed', l === 'hi');
  document.getElementById('btnEn').setAttribute('aria-pressed', l === 'en');

  const s = STRINGS[l];
  document.getElementById('appTitle').textContent = s.appTitle;
  document.getElementById('appSubtitle').textContent = s.appSubtitle;
  document.getElementById('currentStageLabel').textContent = s.currentStageLabel;
  document.getElementById('scaleTitle').textContent = s.scaleTitle;
  document.getElementById('restrictionsTitle').textContent = s.restrictionsTitle;
  document.getElementById('settingsTitle').textContent = s.settingsTitle;
  document.getElementById('notifLabel').textContent = s.notifLabel;
  document.getElementById('notifSub').textContent = s.notifSub;
  document.getElementById('autoRefLabel').textContent = s.autoRefLabel;
  document.getElementById('autoRefSub').textContent = s.autoRefSub;
  document.getElementById('ncrTitle').textContent = s.ncrTitle;
  document.getElementById('refreshBtnLabel').textContent = s.refreshBtnLabel;
  document.getElementById('footerSource').textContent = s.footerSource;
  document.getElementById('autoRefreshLabel').textContent = s.autoRefreshLabel;
  document.getElementById('installText').textContent = s.installText;
  document.getElementById('toastMsg').textContent = s.toastMsg;
  document.getElementById('toastAction').textContent = s.toastAction;
  document.getElementById('healthTitle').textContent = s.healthTitle;
  document.getElementById('vehiclesTitle').textContent = s.vehiclesTitle;
  document.getElementById('addVehicleBtnLabel').textContent = s.addVehicleBtnLabel;
  document.getElementById('chartTitle').textContent = s.chartTitle;

  // AQI scale category labels
  const catLabels = document.getElementById('scaleCategoryLabels');
  if (catLabels) {
    catLabels.innerHTML = `<span>${s.scaleGood}</span><span>${s.scaleSatisfactory}</span><span>${s.scaleModerate}</span><span>${s.scalePoor}</span><span>${s.scaleVeryPoor}</span><span>${s.scaleSevere}</span>`;
  }

  renderStationChips();
  if (window._lastData) renderMain(window._lastData);
  if (typeof renderVehiclesCard === 'function') renderVehiclesCard(currentStageNum);
  if (typeof renderHealthCard === 'function') renderHealthCard(window._lastData?.aqi);
}

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'js', 'app.js'), 'utf8');
const vehiclesSource = fs.readFileSync(path.join(root, 'js', 'vehicles.js'), 'utf8');
const mainActivitySource = fs.readFileSync(
  path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'grapwatch', 'MainActivity.java'),
  'utf8'
);
const notificationPreferenceSource = fs.readFileSync(
  path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'grapwatch', 'NotificationPreference.java'),
  'utf8'
);
const androidSource = `${mainActivitySource}\n${notificationPreferenceSource}`;

const androidCalls = new Set(
  [
    ...`${appSource}\n${vehiclesSource}`.matchAll(/window\.Android\.([A-Za-z0-9_]+)/g),
    ...`${appSource}\n${vehiclesSource}`.matchAll(/callAndroid\(['"]([A-Za-z0-9_]+)['"]/g),
    ...`${appSource}\n${vehiclesSource}`.matchAll(/hasAndroidMethod\(['"]([A-Za-z0-9_]+)['"]/g),
  ]
    .map((match) => match[1])
);

const exposedMethods = new Set(
  [...mainActivitySource.matchAll(/@JavascriptInterface\s+public\s+[\w<>\[\]]+\s+([A-Za-z0-9_]+)\s*\(/g)]
    .map((match) => match[1])
);

for (const method of androidCalls) {
  assert(
    exposedMethods.has(method),
    `Android WebView bridge should expose window.Android.${method} used by the web app`
  );
}

assert(
  /function syncAndroidNotificationState\(enabled\)/.test(appSource),
  'Web app should provide syncAndroidNotificationState(enabled) for native permission callbacks'
);

assert(
  /function callAndroid\(method, \.\.\.args\)/.test(appSource),
  'Web app should call the Android bridge through callAndroid(method, ...args)'
);

assert(
  !/typeof window\.Android\.[A-Za-z0-9_]+ === 'function'/.test(`${appSource}\n${vehiclesSource}`),
  'Web app should not rely on typeof checks for Android WebView bridge methods'
);

assert(
  /syncAndroidNotificationState\(/.test(androidSource),
  'Android permission callbacks should sync the effective notification state back into the WebView'
);

assert(
  !/putBoolean\(KEY_NOTIFICATIONS_ENABLED,\s*enabled\s*&&\s*hasNotifPermission\(\)\)/.test(mainActivitySource),
  'setNotificationsEnabled should persist the requested toggle state, not only the current Android permission result'
);

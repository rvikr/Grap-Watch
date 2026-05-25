const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = fs.readFileSync(
  path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
  'utf8'
);
const mainActivity = fs.readFileSync(
  path.join(root, 'android', 'app', 'src', 'main', 'java', 'com', 'grapwatch', 'MainActivity.java'),
  'utf8'
);

assert.match(
  manifest,
  /<application\b[^>]*android:name="\.GrapWatchApplication"/s,
  'Application class should be registered so polling is scheduled from app lifecycle'
);

assert.match(
  manifest,
  /<receiver\b[^>]*android:name="\.AQIPollReceiver"[^>]*>/,
  'AQIPollReceiver should be registered as a manifest receiver'
);

assert.match(
  manifest,
  /<action android:name="android\.intent\.action\.BOOT_COMPLETED"\s*\/>/,
  'AQIPollReceiver should listen for boot completed'
);

assert.match(
  manifest,
  /<action android:name="android\.intent\.action\.MY_PACKAGE_REPLACED"\s*\/>/,
  'AQIPollReceiver should listen for app package replacement'
);

const widgetUpdate = mainActivity.match(
  /public void onUpdate\(Context ctx, AppWidgetManager mgr, int\[\] ids\) \{([\s\S]*?)\n        \}/
);
assert(widgetUpdate, 'GRAPWidget should implement onUpdate');
assert.match(
  widgetUpdate[1],
  /AQIPollScheduler\.schedulePeriodic\(ctx\);/,
  'Widget updates should keep periodic polling scheduled'
);
assert.match(
  widgetUpdate[1],
  /AQIPollScheduler\.enqueueImmediatePoll\(ctx\);/,
  'Widget updates should enqueue an immediate worker refresh'
);

const widgetEnabled = mainActivity.match(
  /public void onEnabled\(Context ctx\) \{([\s\S]*?)\n        \}/
);
assert(widgetEnabled, 'GRAPWidget should implement onEnabled');
assert.match(
  widgetEnabled[1],
  /AQIPollScheduler\.schedulePeriodic\(ctx\);/,
  'Adding the first widget should keep periodic polling scheduled'
);
assert.match(
  widgetEnabled[1],
  /AQIPollScheduler\.enqueueImmediatePoll\(ctx\);/,
  'Adding the first widget should enqueue an immediate worker refresh'
);

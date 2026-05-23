package com.grapwatch;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.Uri;
import android.net.NetworkInfo;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.RemoteViews;
import android.widget.Toast;
import androidx.activity.ComponentActivity;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import org.json.JSONObject;

public class MainActivity extends ComponentActivity {

    private static final String APP_URL         = "https://grap-watch.vercel.app/";
    private static final String APP_HOST        = "grap-watch.vercel.app";
    private static final String OFFLINE_URL      = "file:///android_asset/offline.html";
    private static final String CHANNEL_ID       = "grap_alerts";
    private static final int    NOTIF_PERMISSION  = 101;
    private static final String PREFS_NAME      = "grap_watch_prefs";
    private static final String KEY_NOTIFICATIONS_ENABLED = "grap_notif_enabled";

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;

    // ── onCreate ──────────────────────────────────────────
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        createNotificationChannel();

        swipeRefresh = findViewById(R.id.swipeRefresh);
        webView      = findViewById(R.id.webView);

        setupBackHandler();
        setupWebView();
        setupSwipeRefresh();

        if (isOnline()) {
            webView.loadUrl(APP_URL);
        } else {
            webView.loadUrl(OFFLINE_URL);
        }

        schedulePeriodicAQIPoll();
    }

    // ── WebView Setup ─────────────────────────────────────
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);          // localStorage for lang pref
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUserAgentString(
            settings.getUserAgentString() + " GRAPWatchAndroid/2.0"
        );

        // JavaScript bridge → native
        webView.addJavascriptInterface(new JSBridge(this), "Android");

        webView.setWebChromeClient(new WebChromeClient());

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                String url = req.getUrl().toString();
                if (isTrustedAppUrl(url) || url.startsWith("file:///android_asset/")) {
                    return false;
                }
                if (url.startsWith("https://") || url.startsWith("http://")) {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    return true;
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                swipeRefresh.setRefreshing(false);
                // Inject station param from intent (widget tap deeplink)
                String station = getIntent().getStringExtra("station");
                if (station != null) {
                    String quotedStation = JSONObject.quote(station);
                    view.evaluateJavascript(
                        "if(typeof selectBySlug !== 'undefined') selectBySlug(" + quotedStation + ");",
                        null
                    );
                }
            }

            @Override
            public void onReceivedError(WebView view, int errorCode, String desc, String failingUrl) {
                if (!isOnline()) view.loadUrl(OFFLINE_URL);
            }
        });
    }

    private boolean isTrustedAppUrl(String url) {
        Uri uri = Uri.parse(url);
        return "https".equals(uri.getScheme()) && APP_HOST.equals(uri.getHost());
    }

    private void setupSwipeRefresh() {
        swipeRefresh.setColorSchemeColors(0xFFff6b35);
        swipeRefresh.setProgressBackgroundColorSchemeColor(0xFF12151c);
        swipeRefresh.setOnRefreshListener(() -> {
            if (isOnline()) {
                webView.evaluateJavascript("refreshData();", null);
            } else {
                swipeRefresh.setRefreshing(false);
                Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            }
        });
    }

    // ── Back Button ───────────────────────────────────────
    private void setupBackHandler() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                    return;
                }
                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
            }
        });
    }

    // ── Connectivity ──────────────────────────────────────
    private boolean isOnline() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            android.net.Network network = cm.getActiveNetwork();
            if (network == null) return false;
            android.net.NetworkCapabilities caps = cm.getNetworkCapabilities(network);
            return caps != null && (
                caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) ||
                caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR) ||
                caps.hasTransport(android.net.NetworkCapabilities.TRANSPORT_ETHERNET)
            );
        } else {
            @SuppressWarnings("deprecation")
            NetworkInfo info = cm.getActiveNetworkInfo();
            return info != null && info.isConnected();
        }
    }

    // ── Notifications ─────────────────────────────────────
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                CHANNEL_ID, "GRAP Alerts", NotificationManager.IMPORTANCE_HIGH
            );
            ch.setDescription("Notifies when GRAP stage changes in Delhi NCR");
            ch.enableVibration(true);
            ch.setVibrationPattern(new long[]{0, 200, 100, 200});
            NotificationManager nm = getSystemService(NotificationManager.class);
            nm.createNotificationChannel(ch);
        }
    }

    private void requestNotifPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIF_PERMISSION);
            }
        }
    }

    private boolean hasNotifPermission() {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                           @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == NOTIF_PERMISSION) {
            boolean granted = grantResults.length > 0 &&
                grantResults[0] == PackageManager.PERMISSION_GRANTED;
            getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_NOTIFICATIONS_ENABLED, granted)
                .apply();
            if (!granted && webView != null) {
                webView.evaluateJavascript(
                    "try{localStorage.removeItem('grap-notif');document.getElementById('notifToggle').checked=false;}catch(e){}",
                    null
                );
            }
        }
    }

    // ── JavaScript Bridge ─────────────────────────────────
    // Called from the web app: Android.showNotification(title, body)
    public class JSBridge {
        private final Context ctx;
        JSBridge(Context c) { ctx = c; }

        @JavascriptInterface
        public void showNotification(String title, String body) {
            if (!areNotificationsEnabled()) return;

            NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notif)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setVibrate(new long[]{0, 200, 100, 200})
                .setContentIntent(PendingIntent.getActivity(
                    ctx, 0,
                    new Intent(ctx, MainActivity.class),
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                ));

            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            nm.notify(1, builder.build());
        }

        @JavascriptInterface
        public void updateWidget(int aqi, String stageName, String stageColor) {
            // Forward to widget provider
            Intent intent = new Intent(ctx, GRAPWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra("aqi", aqi);
            intent.putExtra("stageName", stageName);
            intent.putExtra("stageColor", stageColor);
            ctx.sendBroadcast(intent);
        }

        @JavascriptInterface
        public boolean isAndroid() { return true; }

        @JavascriptInterface
        public void requestNotificationPermission() {
            if (hasNotifPermission()) {
                setNotificationsEnabled(true);
                return;
            }
            MainActivity.this.runOnUiThread(() -> requestNotifPermission());
        }

        @JavascriptInterface
        public void setNotificationsEnabled(boolean enabled) {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean(KEY_NOTIFICATIONS_ENABLED, enabled && hasNotifPermission()).apply();
        }

        @JavascriptInterface
        public boolean areNotificationsEnabled() {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            return prefs.getBoolean(KEY_NOTIFICATIONS_ENABLED, false) && hasNotifPermission();
        }

        @JavascriptInterface
        public String getLanguage() {
            return java.util.Locale.getDefault().getLanguage(); // "hi" or "en"
        }

        @JavascriptInterface
        public void setSubscriptionStatus(boolean isSubscribed) {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putBoolean("grap_subscribed", isSubscribed).apply();
        }

        @JavascriptInterface
        public void saveVehicles(String json) {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString("grap_vehicles", json).apply();
        }

        @JavascriptInterface
        public boolean isSubscribed() {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            return prefs.getBoolean("grap_subscribed", false);
        }

        @JavascriptInterface
        public String getVehicles() {
            SharedPreferences prefs = ctx.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            return prefs.getString("grap_vehicles", "[]");
        }
    }


    // ═══════════════════════════════════════════════════════
    //  HOME SCREEN WIDGET
    //  Register in AndroidManifest.xml as AppWidgetProvider
    //  res/xml/grap_widget_info.xml → updatePeriodMillis="1800000"
    // ═══════════════════════════════════════════════════════
    public static class GRAPWidget extends AppWidgetProvider {

        @Override
        public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
            for (int id : ids) updateWidget(ctx, mgr, id, null, null);
        }

        @Override
        public void onReceive(Context ctx, Intent intent) {
            super.onReceive(ctx, intent);
            if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(intent.getAction())) {
                int aqi           = intent.getIntExtra("aqi", -1);
                String stageName  = intent.getStringExtra("stageName");
                String stageColor = intent.getStringExtra("stageColor");

                AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
                int[] ids = mgr.getAppWidgetIds(
                    new android.content.ComponentName(ctx, GRAPWidget.class)
                );
                for (int id : ids) {
                    updateWidget(ctx, mgr, id,
                        aqi > 0 ? String.valueOf(aqi) : null,
                        stageName
                    );
                }
            }
        }

        private static void updateWidget(Context ctx, AppWidgetManager mgr,
                                          int widgetId, String aqi, String stage) {
            RemoteViews views = new RemoteViews(ctx.getPackageName(), R.layout.widget_grap);

            if (aqi != null) {
                views.setTextViewText(R.id.widget_aqi, aqi);
                views.setTextViewText(R.id.widget_stage, stage != null ? stage : "");
            } else {
                views.setTextViewText(R.id.widget_aqi, "—");
                views.setTextViewText(R.id.widget_stage, "Loading...");
            }

            // Timestamp
            String time = new java.text.SimpleDateFormat(
                "HH:mm", java.util.Locale.getDefault()
            ).format(new java.util.Date());
            views.setTextViewText(R.id.widget_time, "Updated " + time);

            // Tap → open app
            Intent tapIntent = new Intent(ctx, MainActivity.class);
            PendingIntent pi = PendingIntent.getActivity(ctx, 0, tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widget_root, pi);

            mgr.updateAppWidget(widgetId, views);
        }
    }


    // ═══════════════════════════════════════════════════════
    //  BACKGROUND WORK — 30-min AQI poll using WorkManager
    // ═══════════════════════════════════════════════════════
    private void schedulePeriodicAQIPoll() {
        androidx.work.PeriodicWorkRequest workRequest =
            new androidx.work.PeriodicWorkRequest.Builder(
                AQIPollWorker.class,
                30, java.util.concurrent.TimeUnit.MINUTES
            )
            .setConstraints(new androidx.work.Constraints.Builder()
                .setRequiredNetworkType(androidx.work.NetworkType.CONNECTED)
                .build())
            .build();

        androidx.work.WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "AQIPollWork",
            androidx.work.ExistingPeriodicWorkPolicy.KEEP,
            workRequest
        );
    }
}

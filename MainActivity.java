// ═══════════════════════════════════════════════════════════
//  GRAP Watch — Android WebView Wrapper
//  File: app/src/main/java/com/grapwatch/MainActivity.java
//
//  Features:
//    · Full-screen WebView (no browser chrome)
//    · JavaScript bridge for native notifications
//    · Home screen widget via AppWidgetProvider
//    · Back gesture / swipe-to-refresh
//    · Offline fallback page
// ═══════════════════════════════════════════════════════════

package com.grapwatch;

import android.Manifest;
import android.app.Activity;
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
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
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
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

public class MainActivity extends Activity {

    private static final String APP_URL         = "https://grap-watch.vercel.app/";
    private static final String OFFLINE_URL      = "file:///android_asset/offline.html";
    private static final String CHANNEL_ID       = "grap_alerts";
    private static final int    NOTIF_PERMISSION  = 101;

    private WebView webView;
    private SwipeRefreshLayout swipeRefresh;

    // ── onCreate ──────────────────────────────────────────
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        createNotificationChannel();
        requestNotifPermission();

        swipeRefresh = findViewById(R.id.swipeRefresh);
        webView      = findViewById(R.id.webView);

        setupWebView();
        setupSwipeRefresh();

        if (isOnline()) {
            webView.loadUrl(APP_URL);
        } else {
            webView.loadUrl(OFFLINE_URL);
        }
    }

    // ── WebView Setup ─────────────────────────────────────
    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);          // localStorage for lang pref
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setAllowFileAccessFromFileURLs(true);
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
                // Keep all navigation inside WebView
                if (url.startsWith("https://") || url.startsWith("http://")) {
                    view.loadUrl(url);
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
                    view.evaluateJavascript(
                        "if(typeof selectBySlug !== 'undefined') selectBySlug('" + station + "');",
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
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
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

    // ── JavaScript Bridge ─────────────────────────────────
    // Called from the web app: Android.showNotification(title, body)
    public class JSBridge {
        private final Context ctx;
        JSBridge(Context c) { ctx = c; }

        @JavascriptInterface
        public void showNotification(String title, String body) {
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
        public String getLanguage() {
            return java.util.Locale.getDefault().getLanguage(); // "hi" or "en"
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
    //  BACKGROUND ALARM — 30-min AQI poll
    //  Schedule in Application.onCreate() or MainActivity.onStart()
    // ═══════════════════════════════════════════════════════
    public static class AQIAlarmReceiver extends BroadcastReceiver {
        public static final String ACTION = "com.grapwatch.CHECK_AQI";

        @Override
        public void onReceive(Context ctx, Intent intent) {
            // TODO: Create AQIFetchService as a ForegroundService or use WorkManager
            //   to hit the WAQI API, update widget, and trigger notification if stage changed.
            //   Example: Intent serviceIntent = new Intent(ctx, AQIFetchService.class);
            //            ctx.startForegroundService(serviceIntent);
            androidx.work.OneTimeWorkRequest workRequest =
                new androidx.work.OneTimeWorkRequest.Builder(AQIPollWorker.class).build();
            androidx.work.WorkManager.getInstance(ctx).enqueue(workRequest);
        }

        /** Call this from MainActivity.onStart() to arm the alarm */
        public static void schedule(Context ctx) {
            AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
            Intent i = new Intent(ctx, AQIAlarmReceiver.class).setAction(ACTION);
            PendingIntent pi = PendingIntent.getBroadcast(ctx, 0, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            // Repeating every 30 minutes (1_800_000 ms)
            am.setInexactRepeating(
                AlarmManager.RTC_WAKEUP,
                System.currentTimeMillis() + 30 * 60 * 1000,
                30 * 60 * 1000,
                pi
            );
        }
    }
}

/*
─────────────────────────────────────────────────────────────
  res/layout/activity_main.xml
─────────────────────────────────────────────────────────────
<?xml version="1.0" encoding="utf-8"?>
<androidx.swiperefreshlayout.widget.SwipeRefreshLayout
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/swipeRefresh"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent"/>

</androidx.swiperefreshlayout.widget.SwipeRefreshLayout>

─────────────────────────────────────────────────────────────
  res/layout/widget_grap.xml
─────────────────────────────────────────────────────────────
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:id="@+id/widget_root"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="@drawable/widget_bg"
    android:orientation="vertical"
    android:padding="12dp"
    android:gravity="center">

    <TextView android:id="@+id/widget_aqi"
        android:textSize="40sp" android:textColor="#ff6b35"
        android:textStyle="bold" android:gravity="center"
        android:layout_width="wrap_content" android:layout_height="wrap_content"/>

    <TextView android:id="@+id/widget_stage"
        android:textSize="11sp" android:textColor="#aaaaaa"
        android:gravity="center"
        android:layout_width="wrap_content" android:layout_height="wrap_content"/>

    <TextView android:id="@+id/widget_time"
        android:textSize="9sp" android:textColor="#555555"
        android:gravity="center" android:layout_marginTop="4dp"
        android:layout_width="wrap_content" android:layout_height="wrap_content"/>
</LinearLayout>

─────────────────────────────────────────────────────────────
  res/xml/grap_widget_info.xml
─────────────────────────────────────────────────────────────
<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="110dp"
    android:minHeight="110dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widget_grap"
    android:resizeMode="horizontal|vertical"
    android:widgetCategory="home_screen"
    android:description="@string/widget_description"/>

─────────────────────────────────────────────────────────────
  AndroidManifest.xml additions
─────────────────────────────────────────────────────────────
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM"/>

<receiver android:name=".MainActivity$GRAPWidget" android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE"/>
    </intent-filter>
    <meta-data android:name="android.appwidget.provider"
        android:resource="@xml/grap_widget_info"/>
</receiver>

<receiver android:name=".MainActivity$AQIAlarmReceiver" android:exported="false">
    <intent-filter>
        <action android:name="com.grapwatch.CHECK_AQI"/>
        <action android:name="android.intent.action.BOOT_COMPLETED"/>
    </intent-filter>
</receiver>
*/

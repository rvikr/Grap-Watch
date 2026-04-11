// ═══════════════════════════════════════════════════════════
//  GRAP Watch — Background AQI Poll Worker
//  File: app/src/main/java/com/grapwatch/AQIPollWorker.java
//
//  Fetches AQI from the proxy endpoint, detects GRAP stage
//  changes, triggers notification and widget update.
// ═══════════════════════════════════════════════════════════

package com.grapwatch;

import android.app.NotificationManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class AQIPollWorker extends Worker {

    private static final String APP_URL = "https://grap-watch.vercel.app";
    private static final String API_ENDPOINT = APP_URL + "/api/aqi?action=feed&param=delhi";
    private static final String PREFS_NAME = "grap_watch_prefs";
    private static final String KEY_LAST_STAGE = "last_grap_stage";
    private static final String CHANNEL_ID = "grap_alerts";

    private static final String[] STAGE_NAMES = {
        "No GRAP", "Stage I", "Stage II", "Stage III", "Stage IV"
    };
    private static final String[] STAGE_COLORS = {
        "#22c55e", "#facc15", "#f97316", "#ef4444", "#991b1b"
    };

    public AQIPollWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        try {
            // Fetch AQI data from proxy
            String json = fetchUrl(API_ENDPOINT);
            if (json == null) return Result.retry();

            JSONObject root = new JSONObject(json);
            if (!"ok".equals(root.optString("status"))) return Result.retry();

            JSONObject data = root.getJSONObject("data");
            int aqi = data.getInt("aqi");
            int newStage = getStageNumber(aqi);

            // Read previous stage from SharedPreferences
            SharedPreferences prefs = getApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            int prevStage = prefs.getInt(KEY_LAST_STAGE, -1);

            // Save new stage
            prefs.edit().putInt(KEY_LAST_STAGE, newStage).apply();

            // Update home screen widget
            updateWidget(aqi, newStage);

            // Notify if stage changed
            if (prevStage != -1 && prevStage != newStage) {
                String direction = newStage > prevStage ? "worsened" : "improved";
                String title = "GRAP " + direction + " in Delhi";
                String body = STAGE_NAMES[prevStage] + " → " + STAGE_NAMES[newStage]
                    + "  ·  AQI " + aqi;
                showNotification(title, body);
            }

            return Result.success();
        } catch (Exception e) {
            e.printStackTrace();
            return Result.retry();
        }
    }

    private int getStageNumber(int aqi) {
        if (aqi <= 200) return 0;
        if (aqi <= 300) return 1;
        if (aqi <= 400) return 2;
        if (aqi <= 450) return 3;
        return 4;
    }

    private String fetchUrl(String urlStr) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(urlStr);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);

            int code = conn.getResponseCode();
            if (code != 200) return null;

            BufferedReader reader = new BufferedReader(
                new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            reader.close();
            return sb.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private void showNotification(String title, String body) {
        Context ctx = getApplicationContext();

        Intent tapIntent = new Intent(ctx, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(ctx, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notif)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setVibrate(new long[]{0, 300, 100, 300})
            .setContentIntent(pi);

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        nm.notify(2, builder.build());
    }

    private void updateWidget(int aqi, int stage) {
        Context ctx = getApplicationContext();
        Intent intent = new Intent(ctx, MainActivity.GRAPWidget.class);
        intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
        intent.putExtra("aqi", aqi);
        intent.putExtra("stageName", STAGE_NAMES[stage]);
        intent.putExtra("stageColor", STAGE_COLORS[stage]);
        ctx.sendBroadcast(intent);
    }
}

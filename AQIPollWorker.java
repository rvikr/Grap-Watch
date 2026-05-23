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

import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;

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
    private static final String[] STAGE_NAMES_HI = {
        "GRAP सक्रिय नहीं", "चरण I", "चरण II", "चरण III", "चरण IV"
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
                boolean isHi = "hi".equals(java.util.Locale.getDefault().getLanguage());
                String title;
                String body;
                if (isHi) {
                    String direction = newStage > prevStage ? "और खराब हुई" : "में सुधार हुआ";
                    title = "दिल्ली में GRAP स्थिति " + direction;
                    body = STAGE_NAMES_HI[prevStage] + " → " + STAGE_NAMES_HI[newStage]
                        + "  ·  AQI " + aqi;
                } else {
                    String direction = newStage > prevStage ? "worsened" : "improved";
                    title = "GRAP " + direction + " in Delhi";
                    body = STAGE_NAMES[prevStage] + " → " + STAGE_NAMES[newStage]
                        + "  ·  AQI " + aqi;
                }

                // Add personalized vehicle alert when saved vehicles exist
                String vehiclesJson = prefs.getString("grap_vehicles", "[]");
                try {
                    JSONArray vehicles = new JSONArray(vehiclesJson);
                    ArrayList<String> bannedList = new ArrayList<>();
                    for (int i = 0; i < vehicles.length(); i++) {
                        JSONObject vehicle = vehicles.getJSONObject(i);
                        if (isVehicleBannedInJava(vehicle, newStage)) {
                            bannedList.add(vehicle.optString("name", "Vehicle"));
                        }
                    }
                        if (bannedList.size() > 0) {
                            StringBuilder sb = new StringBuilder();
                            for (int i = 0; i < bannedList.size(); i++) {
                                if (i > 0) sb.append(", ");
                                sb.append(bannedList.get(i));
                            }
                            if (isHi) {
                                body += "\n🚨 प्रभावित: " + sb.toString() + " प्रतिबंधित है!";
                            } else {
                                body += "\n🚨 Affected: " + sb.toString() + " is BANNED!";
                            }
                        } else if (vehicles.length() > 0) {
                            if (isHi) {
                                body += "\n✅ अच्छी खबर: आपके सभी वाहनों की अनुमति है।";
                            } else {
                                body += "\n✅ Good news: All your vehicles are allowed.";
                            }
                        }
                } catch (Exception je) {
                    je.printStackTrace();
                }

                showNotification(title, body);
            }

            return Result.success();
        } catch (Exception e) {
            e.printStackTrace();
            return Result.retry();
        }
    }

    private boolean isVehicleBannedInJava(JSONObject vehicle, int stage) {
        String fuelType = vehicle.optString("fuelType", "");
        String emissionStd = vehicle.optString("emissionStd", "");
        
        if ("electric".equals(fuelType) || "electric".equals(emissionStd)) {
            return false;
        }
        
        if (stage == 3) {
            if ("petrol".equals(fuelType) && "BS-III".equals(emissionStd)) return true;
            if ("diesel".equals(fuelType) && ("BS-IV".equals(emissionStd) || "BS-III".equals(emissionStd))) return true;
        } else if (stage >= 4) {
            if ("petrol".equals(fuelType) && "BS-III".equals(emissionStd)) return true;
            if ("diesel".equals(fuelType) && ("BS-IV".equals(emissionStd) || "BS-III".equals(emissionStd) || "BS-II".equals(emissionStd))) return true;
        }
        return false;
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

package com.grapwatch;

import android.app.Application;

public class GrapWatchApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        AQIPollScheduler.schedulePeriodic(this);
    }
}

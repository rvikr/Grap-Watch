package com.grapwatch;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class AQIPollReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        handleAction(intent.getAction(), AQIPollScheduler.workClient(context));
    }

    static boolean handleAction(String action, AQIPollScheduler.WorkClient client) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            return false;
        }

        AQIPollScheduler.schedulePeriodic(client);
        AQIPollScheduler.enqueueImmediatePoll(client);
        return true;
    }
}

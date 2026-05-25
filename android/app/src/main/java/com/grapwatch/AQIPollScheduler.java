package com.grapwatch;

import android.content.Context;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;

final class AQIPollScheduler {
    static final String PERIODIC_WORK_NAME = "AQIPollWork";
    static final String IMMEDIATE_WORK_NAME = "AQIPollImmediateWork";
    static final long POLL_INTERVAL_MINUTES = 30L;

    interface WorkClient {
        void enqueueUniquePeriodicWork(
            String name,
            ExistingPeriodicWorkPolicy policy,
            PeriodicWorkRequest request
        );

        void enqueueUniqueWork(
            String name,
            ExistingWorkPolicy policy,
            OneTimeWorkRequest request
        );
    }

    private static final class WorkManagerClient implements WorkClient {
        private final WorkManager workManager;

        WorkManagerClient(WorkManager workManager) {
            this.workManager = workManager;
        }

        @Override
        public void enqueueUniquePeriodicWork(
            String name,
            ExistingPeriodicWorkPolicy policy,
            PeriodicWorkRequest request
        ) {
            workManager.enqueueUniquePeriodicWork(name, policy, request);
        }

        @Override
        public void enqueueUniqueWork(
            String name,
            ExistingWorkPolicy policy,
            OneTimeWorkRequest request
        ) {
            workManager.enqueueUniqueWork(name, policy, request);
        }
    }

    private AQIPollScheduler() {
    }

    static void schedulePeriodic(Context context) {
        schedulePeriodic(workClient(context));
    }

    static void schedulePeriodic(WorkClient client) {
        client.enqueueUniquePeriodicWork(
            PERIODIC_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            buildPeriodicRequest()
        );
    }

    static void enqueueImmediatePoll(Context context) {
        enqueueImmediatePoll(workClient(context));
    }

    static void enqueueImmediatePoll(WorkClient client) {
        client.enqueueUniqueWork(
            IMMEDIATE_WORK_NAME,
            ExistingWorkPolicy.REPLACE,
            buildImmediateRequest()
        );
    }

    static WorkClient workClient(Context context) {
        return new WorkManagerClient(WorkManager.getInstance(context.getApplicationContext()));
    }

    private static PeriodicWorkRequest buildPeriodicRequest() {
        return new PeriodicWorkRequest.Builder(
            AQIPollWorker.class,
            POLL_INTERVAL_MINUTES,
            TimeUnit.MINUTES
        )
            .setConstraints(connectedNetworkConstraints())
            .build();
    }

    private static OneTimeWorkRequest buildImmediateRequest() {
        return new OneTimeWorkRequest.Builder(AQIPollWorker.class)
            .setConstraints(connectedNetworkConstraints())
            .build();
    }

    private static Constraints connectedNetworkConstraints() {
        return new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();
    }
}

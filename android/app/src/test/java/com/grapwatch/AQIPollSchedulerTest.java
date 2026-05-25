package com.grapwatch;

import android.content.Intent;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import java.util.concurrent.TimeUnit;
import org.junit.Test;
import static org.junit.Assert.*;

public class AQIPollSchedulerTest {

    private static class RecordingClient implements AQIPollScheduler.WorkClient {
        String periodicName;
        ExistingPeriodicWorkPolicy periodicPolicy;
        PeriodicWorkRequest periodicRequest;
        String immediateName;
        ExistingWorkPolicy immediatePolicy;
        OneTimeWorkRequest immediateRequest;

        @Override
        public void enqueueUniquePeriodicWork(
                String name,
                ExistingPeriodicWorkPolicy policy,
                PeriodicWorkRequest request) {
            periodicName = name;
            periodicPolicy = policy;
            periodicRequest = request;
        }

        @Override
        public void enqueueUniqueWork(
                String name,
                ExistingWorkPolicy policy,
                OneTimeWorkRequest request) {
            immediateName = name;
            immediatePolicy = policy;
            immediateRequest = request;
        }
    }

    @Test
    public void schedulePeriodicPollingUsesStableUniqueWorkContract() {
        RecordingClient client = new RecordingClient();

        AQIPollScheduler.schedulePeriodic(client);

        assertEquals("AQIPollWork", client.periodicName);
        assertEquals(ExistingPeriodicWorkPolicy.KEEP, client.periodicPolicy);
        assertNotNull(client.periodicRequest);
        assertEquals(AQIPollWorker.class.getName(), client.periodicRequest.getWorkSpec().workerClassName);
        assertEquals(
            TimeUnit.MINUTES.toMillis(30),
            client.periodicRequest.getWorkSpec().intervalDuration
        );
        assertEquals(
            NetworkType.CONNECTED,
            client.periodicRequest.getWorkSpec().constraints.getRequiredNetworkType()
        );
    }

    @Test
    public void enqueueImmediatePollingUsesUniqueReplacementWork() {
        RecordingClient client = new RecordingClient();

        AQIPollScheduler.enqueueImmediatePoll(client);

        assertEquals("AQIPollImmediateWork", client.immediateName);
        assertEquals(ExistingWorkPolicy.REPLACE, client.immediatePolicy);
        assertNotNull(client.immediateRequest);
        assertEquals(AQIPollWorker.class.getName(), client.immediateRequest.getWorkSpec().workerClassName);
        assertEquals(
            NetworkType.CONNECTED,
            client.immediateRequest.getWorkSpec().constraints.getRequiredNetworkType()
        );
    }

    @Test
    public void bootReceiverActionSchedulesPeriodicAndImmediatePolling() {
        RecordingClient client = new RecordingClient();

        AQIPollReceiver.handleAction(Intent.ACTION_BOOT_COMPLETED, client);

        assertNotNull(client.periodicRequest);
        assertNotNull(client.immediateRequest);
    }

    @Test
    public void packageReplacementReceiverActionSchedulesPeriodicAndImmediatePolling() {
        RecordingClient client = new RecordingClient();

        AQIPollReceiver.handleAction(Intent.ACTION_MY_PACKAGE_REPLACED, client);

        assertNotNull(client.periodicRequest);
        assertNotNull(client.immediateRequest);
    }
}

package com.grapwatch;

import org.junit.Test;
import static org.junit.Assert.*;

public class NotificationPreferenceTest {

    @Test
    public void requestedToggleStateIsPersistedSeparatelyFromPermissionState() {
        assertTrue(NotificationPreference.persistedToggleState(true));
        assertFalse(NotificationPreference.persistedToggleState(false));
    }

    @Test
    public void effectiveStateRequiresStoredToggleAndAndroidPermission() {
        assertTrue(NotificationPreference.effectiveEnabled(true, true));
        assertFalse(NotificationPreference.effectiveEnabled(true, false));
        assertFalse(NotificationPreference.effectiveEnabled(false, true));
        assertFalse(NotificationPreference.effectiveEnabled(false, false));
    }

    @Test
    public void webSyncScriptCallsTheWebContractFunction() {
        assertEquals(
            "try{syncAndroidNotificationState(true);}catch(e){}",
            NotificationPreference.webSyncScript(true)
        );
        assertEquals(
            "try{syncAndroidNotificationState(false);}catch(e){}",
            NotificationPreference.webSyncScript(false)
        );
    }
}

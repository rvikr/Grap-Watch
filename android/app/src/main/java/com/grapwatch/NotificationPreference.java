package com.grapwatch;

final class NotificationPreference {
    private NotificationPreference() {}

    static boolean persistedToggleState(boolean enabled) {
        return enabled;
    }

    static boolean effectiveEnabled(boolean storedToggleEnabled, boolean androidNotificationsAllowed) {
        return storedToggleEnabled && androidNotificationsAllowed;
    }

    static String webSyncScript(boolean enabled) {
        return "try{syncAndroidNotificationState(" + enabled + ");}catch(e){}";
    }
}

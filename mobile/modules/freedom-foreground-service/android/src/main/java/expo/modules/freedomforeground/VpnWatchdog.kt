package expo.modules.freedomforeground

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat

/**
 * Restarts the DNS tunnel whenever it is meant to be up and is not: after an app
 * update, and after the user switches it off. Android's always-on VPN would
 * cover this, but setting it needs a system API a normal app cannot call.
 *
 * Hosted in the foreground service, like BankingAppGuard, so it survives the VPN
 * service dying and the app process being swiped away.
 */
class VpnWatchdog(private val context: Context) {

    private val handler = Handler(Looper.getMainLooper())
    private var running = false
    private var blockedWarned = false

    private val tick = object : Runnable {
        override fun run() {
            if (!running) return
            try {
                pollOnce()
            } catch (e: Exception) {
                Log.w(TAG, "VPN watchdog poll failed: ${e.message}")
            }
            handler.postDelayed(this, POLL_MS)
        }
    }

    fun start() {
        if (running) return
        running = true
        handler.postDelayed(tick, POLL_MS)
    }

    fun stop() {
        running = false
        handler.removeCallbacks(tick)
    }

    private fun pollOnce() {
        if (!isVpnWanted(context)) {
            clearConsentLost()
            return
        }

        // Non-null means another VPN holds the slot, or consent is gone. Neither
        // can be fixed from here, and both end DNS filtering silently.
        if (VpnService.prepare(context) != null) {
            if (!blockedWarned) {
                blockedWarned = true
                Log.w(TAG, "VPN wanted but not prepared; consent withdrawn or another VPN holds the slot")
                notifyConsentLost()
            }
            return
        }
        clearConsentLost()

        // onStartCommand returns early when the tunnel is already up. No liveness
        // flag: a hard kill leaves one stale exactly when the restart is needed.
        context.startForegroundService(
            Intent().setComponent(ComponentName(context.packageName, VPN_SERVICE))
        )
    }

    private fun notificationManager(): NotificationManager? =
        context.getSystemService(NotificationManager::class.java)

    private fun clearConsentLost() {
        if (!blockedWarned) return
        blockedWarned = false
        notificationManager()?.cancel(CONSENT_LOST_NOTIFICATION_ID)
    }

    private fun notifyConsentLost() {
        val manager = notificationManager() ?: return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CONSENT_LOST_CHANNEL_ID,
                    "Protection alerts",
                    NotificationManager.IMPORTANCE_HIGH
                )
            )
        }
        val openApp = context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
            PendingIntent.getActivity(
                context, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }
        val notification = NotificationCompat.Builder(context, CONSENT_LOST_CHANNEL_ID)
            .setContentTitle("VPN permission was removed")
            .setContentText("Protection is off. Open LibreAscent to turn it back on.")
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(openApp)
            .setAutoCancel(true)
            .build()
        manager.notify(CONSENT_LOST_NOTIFICATION_ID, notification)
    }

    companion object {
        private const val TAG = "VpnWatchdog"

        // Written by FreedomVpnService, cleared by FreedomVpnModule.stopVpn.
        private const val VPN_PREFS = "freedom_vpn_state"
        private const val KEY_WANTED = "vpn_wanted"

        private const val VPN_SERVICE = "expo.modules.freedomvpn.FreedomVpnService"

        private const val POLL_MS = 30_000L

        private const val CONSENT_LOST_CHANNEL_ID = "freedom_protection_alerts"
        private const val CONSENT_LOST_NOTIFICATION_ID = 1002

        fun isVpnWanted(context: Context): Boolean = context
            .getSharedPreferences(VPN_PREFS, Context.MODE_PRIVATE)
            .getBoolean(KEY_WANTED, false)
    }
}

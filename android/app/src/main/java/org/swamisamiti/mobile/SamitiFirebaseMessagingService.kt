package org.swamisamiti.mobile

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class SamitiFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        super.onNewToken(token)
        registerToken(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val title = message.notification?.title ?: message.data["title"] ?: "Swami Vivekananda Samiti"
        val body = message.notification?.body ?: message.data["body"] ?: "You have a new notification."
        showNotification(title, body)
    }

    private fun registerToken(token: String) {
        try {
            val prefs = getSharedPreferences("samiti_session", Context.MODE_PRIVATE)
            val authToken = prefs.getString("token", "") ?: ""
            val role = prefs.getString("role", "user") ?: "user"
            if (authToken.isBlank() || !(role.equals("admin", true) || role.equals("superadmin", true))) return
            val payload = JSONObject()
                .put("token", token)
                .put("platform", "android")
                .put("role", "admin")
                .put("name", prefs.getString("displayName", "Admin") ?: "Admin")
                .put("email", prefs.getString("email", "") ?: "")
                .put("phone", prefs.getString("phone", "") ?: "")
                .put("deviceName", "${Build.MANUFACTURER} ${Build.MODEL}".trim())
            val base = BuildConfig.API_BASE_URL.removeSuffix("/")
            val request = Request.Builder().url("$base/push-tokens").header("Authorization", "Bearer $authToken").post(payload.toString().toRequestBody("application/json; charset=utf-8".toMediaType())).build()
            OkHttpClient().newCall(request).execute().close()
        } catch (e: Exception) { android.util.Log.e("SamitiPush", "Token registration failed", e) }
    }

    private fun showNotification(title: String, body: String) {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channelId = "samiti_notifications"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(NotificationChannel(channelId, "Samiti notifications", NotificationManager.IMPORTANCE_HIGH))
        }
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("open_notifications", true)
        }
        val pending = PendingIntent.getActivity(this, 7001, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(R.mipmap.ic_launcher).setContentTitle(title).setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body)).setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH).setContentIntent(pending).build()
        manager.notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), notification)
    }
}

package ir.aqsat.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** نمایش اعلان سررسید */
public class AlarmReceiver extends BroadcastReceiver {

    public static final String CH_SOUND = "myc_sound";
    public static final String CH_SILENT = "myc_silent";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        boolean sound = intent.getBooleanExtra("sound", true);

        if (title == null || title.isEmpty()) title = "MyC";
        if (body == null) body = "";

        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel s = new NotificationChannel(
                    CH_SOUND, "یادآوری (با صدا)", NotificationManager.IMPORTANCE_HIGH);
            s.enableVibration(true);
            nm.createNotificationChannel(s);

            NotificationChannel q = new NotificationChannel(
                    CH_SILENT, "یادآوری (بی‌صدا)", NotificationManager.IMPORTANCE_LOW);
            q.setSound(null, null);
            nm.createNotificationChannel(q);
        }

        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent content = PendingIntent.getActivity(ctx, 0, open, flags);

        Notification.Builder b;
        if (Build.VERSION.SDK_INT >= 26) {
            b = new Notification.Builder(ctx, sound ? CH_SOUND : CH_SILENT);
        } else {
            b = new Notification.Builder(ctx);
            b.setPriority(sound ? Notification.PRIORITY_HIGH : Notification.PRIORITY_LOW);
        }

        b.setSmallIcon(R.drawable.ic_stat)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setContentIntent(content)
                .setAutoCancel(true);

        if (sound) {
            b.setDefaults(Notification.DEFAULT_ALL);
        }

        nm.notify((int) (System.currentTimeMillis() % 100000), b.build());
    }
}

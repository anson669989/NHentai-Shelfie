package io.github.anson669989.nhwebfetch;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.text.TextUtils;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;

/**
 * 背景下載用的前景服務（類型 dataSync）：只負責「讓 App 不被系統停掉」與「顯示一則進度通知」。
 *
 * 抓資料仍然是 JS 的佇列（src/services/library.js），節流照舊走 nhSource 的兩條隊伍；
 * 這個服務**不做任何網路或資料庫動作**（CLAUDE.md 規則 16 的精神）。
 *
 * - ACTION_START（title、text、stopLabel、channelName）：建通知頻道 → 立刻 startForeground → 取得有逾時的 WakeLock。
 *   外掛以 startForegroundService 送出，所以每次收到都必須呼叫 startForeground（5 秒內）。
 * - ACTION_UPDATE（text）：同一個通知 ID 重發，只改「還有 N 本」。
 * - ACTION_STOP_USER：通知上的「停止」按鈕 → 通知外掛（bgSyncStopped, reason = user）→ 停止並移除通知。
 * - onTimeout（Android 15：dataSync 每 24 小時最多約 6 小時）→ 通知外掛（reason = timeout）→ 立刻停止。
 * - onTaskRemoved（使用者從最近工作清單滑掉 App）→ 停止：Activity 與 JS 都沒了，留著沒有意義。
 *
 * 通知不放書名、封面、ID；鎖定畫面不顯示（VISIBILITY_SECRET）。
 * 「已暫停」通知（stop(ctx, true, text)）是另一個 ID 的一般通知：可滑掉、點了開 App，回到前景時 JS 會清掉。
 */
public class SyncService extends Service {

    static final String ACTION_START = "io.github.anson669989.nhwebfetch.BG_SYNC_START";
    static final String ACTION_UPDATE = "io.github.anson669989.nhwebfetch.BG_SYNC_UPDATE";
    static final String ACTION_STOP_USER = "io.github.anson669989.nhwebfetch.BG_SYNC_STOP_USER";
    /** JS 要求停止（stop()）：以 Intent 送，排在可能還沒處理的 START 後面，避免服務在 startForeground 前被停掉而當掉 */
    private static final String ACTION_STOP = "io.github.anson669989.nhwebfetch.BG_SYNC_STOP";

    static final String EXTRA_TITLE = "title";
    static final String EXTRA_TEXT = "text";
    static final String EXTRA_STOP_LABEL = "stopLabel";
    static final String EXTRA_CHANNEL_NAME = "channelName";

    private static final String CHANNEL_ID = "nh_bg_sync";
    private static final String DEFAULT_CHANNEL_NAME = "Background download";
    private static final int NOTIF_ID = 0x4E480001;
    private static final int PAUSED_NOTIF_ID = 0x4E480002;
    private static final String WAKE_LOCK_TAG = "nhshelfie:bgsync";
    /** 6 小時 10 分：比 Android 15 的 dataSync 上限多一點，避免任何情況下永久持有 */
    private static final long WAKE_LOCK_MS = (6L * 60 + 10) * 60_000L;

    /** 服務是否已進入前景狀態；外掛的 updateBgSync 在 false 時直接不送 Intent。 */
    static volatile boolean running = false;
    /** 最近一次的頻道名稱（目前介面語言）；「已暫停」通知建頻道時沿用。 */
    private static volatile String lastChannelName = DEFAULT_CHANNEL_NAME;

    private PowerManager.WakeLock wakeLock;
    private String title = "";
    private String text = "";
    private String stopLabel = "";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? null : intent.getAction();

        if (ACTION_START.equals(action)) {
            title = nonNull(intent.getStringExtra(EXTRA_TITLE));
            text = nonNull(intent.getStringExtra(EXTRA_TEXT));
            stopLabel = nonNull(intent.getStringExtra(EXTRA_STOP_LABEL));
            String channelName = intent.getStringExtra(EXTRA_CHANNEL_NAME);
            if (!TextUtils.isEmpty(channelName)) lastChannelName = channelName;
            ensureChannel(this, lastChannelName);
            try {
                int type = Build.VERSION.SDK_INT >= 29 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC : 0;
                ServiceCompat.startForeground(this, NOTIF_ID, buildNotification(), type);
            } catch (Exception e) {
                // 例：App 已在背景（ForegroundServiceStartNotAllowedException）、dataSync 額度用完、權限問題。
                // 不讓 App 當掉：通知 JS 退回「只在前景抓」。
                running = false;
                NhWebFetchPlugin.notifyBgSyncStopped("failed");
                stopSelf(startId);
                return START_NOT_STICKY;
            }
            running = true;
            cancelPausedNotice(this);
            acquireWakeLock();
            return START_NOT_STICKY;
        }

        // 其餘動作以 startService 送來；服務不在前景狀態就直接結束（stopSelf(startId) 不會誤停後面排隊的 START）
        if (!running) {
            stopSelf(startId);
            return START_NOT_STICKY;
        }

        if (ACTION_UPDATE.equals(action)) {
            String t = intent.getStringExtra(EXTRA_TEXT);
            if (t != null && !t.equals(text)) {
                text = t;
                notifySafe(this, NOTIF_ID, buildNotification());
            }
        } else if (ACTION_STOP.equals(action)) {
            stopNow();
        } else if (ACTION_STOP_USER.equals(action)) {
            NhWebFetchPlugin.notifyBgSyncStopped("user");
            stopNow();
        }
        return START_NOT_STICKY;
    }

    /** Android 15（API 35）：dataSync 額度用完。必須在幾秒內停止，否則會被系統判定異常。 */
    @Override
    public void onTimeout(int startId, int fgsType) {
        NhWebFetchPlugin.notifyBgSyncStopped("timeout");
        stopNow();
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        stopNow();
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        running = false;
        try {
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        } catch (Exception ignored) {
            // 已不在前景狀態
        }
        releaseWakeLock();
        super.onDestroy();
    }

    private void stopNow() {
        running = false;
        try {
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        } catch (Exception ignored) {
            // 已不在前景狀態
        }
        releaseWakeLock();
        stopSelf();
    }

    // ------------------------------------------------------------ 外掛呼叫

    /**
     * 停止服務並移除進度通知。keepPausedNotice 為 true 時另發一則「已暫停」的一般通知（文字＝pausedText）。
     * 可在任何執行緒呼叫；服務沒在跑也不會出錯。
     */
    static void stop(Context ctx, boolean keepPausedNotice, String pausedText) {
        Context app = ctx.getApplicationContext();
        running = false;
        // 用 startService 送 ACTION_STOP（照順序排在 START 後面）；服務在前景狀態時背景也允許。
        // 送不出去（App 在背景且服務沒在跑 → IllegalStateException）就退回 stopService。
        try {
            app.startService(new Intent(app, SyncService.class).setAction(ACTION_STOP));
        } catch (Exception e) {
            try {
                app.stopService(new Intent(app, SyncService.class));
            } catch (Exception ignored) {
                // 服務本來就沒在跑
            }
        }
        if (keepPausedNotice && !TextUtils.isEmpty(pausedText)) {
            ensureChannel(app, lastChannelName);
            NotificationCompat.Builder b = new NotificationCompat.Builder(app, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_nh_sync)
                .setContentText(pausedText)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(pausedText))
                .setAutoCancel(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setShowWhen(false)
                .setVisibility(NotificationCompat.VISIBILITY_SECRET)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setPriority(NotificationCompat.PRIORITY_LOW);
            PendingIntent open = openAppIntent(app);
            if (open != null) b.setContentIntent(open);
            notifySafe(app, PAUSED_NOTIF_ID, b.build());
        }
    }

    /** 清掉「已暫停」那則通知（App 回到前景時）。 */
    static void cancelPausedNotice(Context ctx) {
        try {
            NotificationManagerCompat.from(ctx.getApplicationContext()).cancel(PAUSED_NOTIF_ID);
        } catch (Exception ignored) {
            // 沒有這則通知
        }
    }

    // ------------------------------------------------------------ 通知

    private Notification buildNotification() {
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_nh_sync)
            .setContentTitle(title)
            .setContentText(text)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setShowWhen(false)
            .setVisibility(NotificationCompat.VISIBILITY_SECRET)
            .setCategory(NotificationCompat.CATEGORY_PROGRESS)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE);
        PendingIntent open = openAppIntent(this);
        if (open != null) b.setContentIntent(open);
        Intent stop = new Intent(this, SyncService.class).setAction(ACTION_STOP_USER);
        PendingIntent stopPi = PendingIntent.getService(
            this,
            1,
            stop,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
        b.addAction(0, TextUtils.isEmpty(stopLabel) ? "Stop" : stopLabel, stopPi);
        return b.build();
    }

    /** 點通知本體：開啟（或帶回前景）App。 */
    private static PendingIntent openAppIntent(Context ctx) {
        Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (launch == null) return null;
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        return PendingIntent.getActivity(
            ctx,
            0,
            launch,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );
    }

    /** 通知頻道只在 API 26+ 建立；重複建立只會更新名稱。低重要性、不響不震、鎖定畫面不顯示。 */
    private static void ensureChannel(Context ctx, String name) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel ch = new NotificationChannel(
            CHANNEL_ID,
            TextUtils.isEmpty(name) ? DEFAULT_CHANNEL_NAME : name,
            NotificationManager.IMPORTANCE_LOW
        );
        ch.setSound(null, null);
        ch.enableVibration(false);
        ch.enableLights(false);
        ch.setShowBadge(false);
        ch.setLockscreenVisibility(Notification.VISIBILITY_SECRET);
        nm.createNotificationChannel(ch);
    }

    /** 沒有通知權限時 notify 可能丟 SecurityException：吞掉，服務照跑（只是看不到通知）。 */
    @SuppressLint("MissingPermission")
    private static void notifySafe(Context ctx, int id, Notification n) {
        try {
            NotificationManagerCompat.from(ctx).notify(id, n);
        } catch (Exception ignored) {
            // 沒有權限或系統拒絕
        }
    }

    // ------------------------------------------------------------ WakeLock

    private void acquireWakeLock() {
        try {
            if (wakeLock == null) {
                PowerManager pm = getSystemService(PowerManager.class);
                if (pm == null) return;
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG);
                wakeLock.setReferenceCounted(false);
            }
            // 一定用有逾時的版本；重複 START 時重新計時
            wakeLock.acquire(WAKE_LOCK_MS);
        } catch (Exception ignored) {
            // 取不到 WakeLock：關螢幕後可能變慢，但不影響其他功能
        }
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        } catch (Exception ignored) {
            // 已釋放
        }
    }

    private static String nonNull(String s) {
        return s == null ? "" : s;
    }
}

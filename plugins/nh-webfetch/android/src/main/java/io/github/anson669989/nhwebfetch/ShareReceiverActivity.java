package io.github.anson669989.nhwebfetch;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

/**
 * 瀏覽器「分享」的唯一入口（分享選單裡只有一個 NH Shelfie）。無畫面，處理完立刻 finish()。
 *
 * - 設定為「開 App 選資料夾」（預設、或從未設定）：把同一份分享內容轉給 MainActivity，
 *   之後走原本的流程（外掛 captureShare → JS takeSharedText → 新增頁填入 ID）。
 * - 設定為「直接收藏」：取出 nhentai 的 ID，記進原生收件匣（QuickShareStore）並顯示 Toast，
 *   畫面留在瀏覽器；書名與封面等使用者下次打開 App 時由 JS 補上。
 *
 * 禁止在這裡開資料庫、發網路請求或做耗時工作。Theme.NoDisplay 的 Activity 必須在 onResume 結束前
 * finish()，所以整段包在 try/finally。
 */
public class ShareReceiverActivity extends Activity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            handle(getIntent());
        } catch (Throwable t) {
            // 不讓分享入口當掉；使用者會看到下面的失敗提示或什麼都沒發生
        } finally {
            finish();
        }
    }

    private void handle(Intent intent) {
        if (intent == null || !Intent.ACTION_SEND.equals(intent.getAction())) return;
        String type = intent.getType();
        if (type == null || !type.startsWith("text/")) return;

        if (!QuickShareStore.MODE_QUICK.equals(QuickShareStore.getMode(this))) {
            forwardToMain(intent);
            return;
        }

        // 文字取法與外掛的 captureShare 相同：EXTRA_TEXT ＋空白＋ EXTRA_SUBJECT，最多 4096 字
        String text = readText(intent);
        int id = QuickShareStore.extractId(this, text);
        if (id < 0) {
            toast(QuickShareStore.message(this, "msg_not_nh", 0));
            return;
        }
        if (QuickShareStore.isKnown(this, id)) {
            toast(QuickShareStore.message(this, "msg_duplicate", id));
            return;
        }
        if (!QuickShareStore.append(this, id, System.currentTimeMillis())) {
            toast(QuickShareStore.message(this, "msg_failed", id));
            return;
        }
        toast(QuickShareStore.message(this, "msg_saved", id));
        NhWebFetchPlugin.notifyQuickShare();
    }

    private static String readText(Intent intent) {
        StringBuilder sb = new StringBuilder();
        CharSequence text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
        if (text != null) sb.append(text);
        String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
        if (subject != null) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(subject);
        }
        return sb.length() > QuickShareStore.MAX_TEXT_CHARS ? sb.substring(0, QuickShareStore.MAX_TEXT_CHARS) : sb.toString();
    }

    /** 把同一份分享內容轉給 MainActivity（明確指定元件，不會再被分享選單攔走）。 */
    private void forwardToMain(Intent original) {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        ComponentName main = launch == null ? null : launch.getComponent();
        if (main == null) return;
        Intent forward = new Intent(Intent.ACTION_SEND);
        forward.setComponent(main);
        forward.setType("text/plain");
        CharSequence text = original.getCharSequenceExtra(Intent.EXTRA_TEXT);
        if (text != null) forward.putExtra(Intent.EXTRA_TEXT, text);
        String subject = original.getStringExtra(Intent.EXTRA_SUBJECT);
        if (subject != null) forward.putExtra(Intent.EXTRA_SUBJECT, subject);
        forward.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(forward);
    }

    private void toast(String text) {
        Toast.makeText(getApplicationContext(), text, Toast.LENGTH_SHORT).show();
    }
}

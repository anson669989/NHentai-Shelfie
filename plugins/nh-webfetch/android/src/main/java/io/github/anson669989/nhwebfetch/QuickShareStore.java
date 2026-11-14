package io.github.anson669989.nhwebfetch;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 「直接收藏」的原生儲存：SharedPreferences「nh_quick_share」。
 *
 * 原生端不碰 SQLite（避免與 App 的資料庫連線互搶檔案鎖）：分享進來的 ID 只記在「收件匣」，
 * 由 JS 在 App 前景時 peek → 寫進資料庫 → ack。所有讀寫以同一把鎖同步，寫入用 commit()。
 *
 * JS 端的對應檔：src/services/quickShare.js、src/services/library.js（drainQuickShares）。
 */
final class QuickShareStore {

    private static final String PREFS = "nh_quick_share";
    private static final Object LOCK = new Object();

    static final String MODE_OPEN = "open";
    static final String MODE_QUICK = "quick";
    static final int MAX_TEXT_CHARS = 4096;
    static final int MAX_INBOX = 1000;
    private static final int MAX_ID = 9_999_999;

    // 與 src/services/parse.js 的 extractNhGalleryId 規則完全相同，改一邊要同步另一邊：
    // https?://[子網域.]網域/g/{1–7 位數字}，後面必須是 / ? # 空白或結尾；不分大小寫；取位置最前面的
    // Java 的 \s 只含 ASCII 空白，JS 的含全形空白與不換行空白，所以這裡補上 　、
    private static final String ID_TAIL = ")/g/(\\d{1,7})(?=[/?#\\s\\u3000\\u00a0]|$)";
    private static final String ID_HEAD = "https?://(?:[a-z0-9-]+\\.)*(?:";

    private QuickShareStore() {}

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    // ------------------------------------------------------------ 設定（JS 推送）

    static void setConfig(
        Context ctx,
        String mode,
        String hosts,
        String ids,
        String msgSaved,
        String msgDuplicate,
        String msgNotNh,
        String msgFailed
    ) {
        synchronized (LOCK) {
            SharedPreferences.Editor e = prefs(ctx).edit();
            e.putString("mode", MODE_QUICK.equals(mode) ? MODE_QUICK : MODE_OPEN);
            if (hosts != null) e.putString("hosts", hosts);
            if (ids != null) e.putString("ids", ids);
            if (msgSaved != null) e.putString("msg_saved", msgSaved);
            if (msgDuplicate != null) e.putString("msg_duplicate", msgDuplicate);
            if (msgNotNh != null) e.putString("msg_not_nh", msgNotNh);
            if (msgFailed != null) e.putString("msg_failed", msgFailed);
            e.commit();
        }
    }

    static String getMode(Context ctx) {
        synchronized (LOCK) {
            return MODE_QUICK.equals(prefs(ctx).getString("mode", MODE_OPEN)) ? MODE_QUICK : MODE_OPEN;
        }
    }

    private static List<String> hosts(SharedPreferences p) {
        List<String> out = new ArrayList<>();
        String raw = p.getString("hosts", "nhentai.net");
        for (String h : raw.split(",")) {
            String s = h.trim().toLowerCase(Locale.ROOT);
            if (s.matches("[a-z0-9.-]+") && !out.contains(s)) out.add(s);
        }
        if (out.isEmpty()) out.add("nhentai.net");
        return out;
    }

    /** 提示文字（含 {id}）；JS 從沒同步過時用英文備援。 */
    static String message(Context ctx, String key, int id) {
        String fallback;
        switch (key) {
            case "msg_saved":
                fallback = "Saved #{id}";
                break;
            case "msg_duplicate":
                fallback = "#{id} is already saved (nothing changed)";
                break;
            case "msg_not_nh":
                fallback = "Not an nhentai gallery";
                break;
            default:
                fallback = "Couldn't save. Open the app and try again";
                break;
        }
        String tpl;
        synchronized (LOCK) {
            tpl = prefs(ctx).getString(key, fallback);
        }
        if (tpl == null || tpl.isEmpty()) tpl = fallback;
        return tpl.replace("{id}", String.valueOf(id));
    }

    // ------------------------------------------------------------ 取出 ID

    /** 從分享文字取出 nhentai 的 gallery ID；取不到回傳 -1。 */
    static int extractId(Context ctx, String text) {
        if (text == null) return -1;
        List<String> hs;
        synchronized (LOCK) {
            hs = hosts(prefs(ctx));
        }
        return extractId(text, hs);
    }

    static int extractId(String text, List<String> hosts) {
        if (text == null || hosts == null || hosts.isEmpty()) return -1;
        StringBuilder alt = new StringBuilder();
        for (String h : hosts) {
            if (alt.length() > 0) alt.append('|');
            alt.append(h.replace(".", "\\."));
        }
        String s = toHalfWidth(text.length() > MAX_TEXT_CHARS ? text.substring(0, MAX_TEXT_CHARS) : text);
        Matcher m = Pattern.compile(ID_HEAD + alt + ID_TAIL, Pattern.CASE_INSENSITIVE).matcher(s);
        if (!m.find()) return -1;
        try {
            int id = Integer.parseInt(m.group(1));
            return id >= 1 && id <= MAX_ID ? id : -1;
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    /** 全形數字、全形＃ → 半形（同 JS 的 toHalfWidth） */
    private static String toHalfWidth(String s) {
        StringBuilder sb = new StringBuilder(s.length());
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            // U+FF10–U+FF19 全形數字、U+FF03 全形＃
            if ((c >= '０' && c <= '９') || c == '＃') sb.append((char) (c - 0xFEE0));
            else sb.append(c);
        }
        return sb.toString();
    }

    // ------------------------------------------------------------ 已知 ID 與收件匣

    private static Set<Integer> idSet(String csv) {
        Set<Integer> out = new HashSet<>();
        if (csv == null || csv.isEmpty()) return out;
        for (String part : csv.split(",")) {
            try {
                out.add(Integer.parseInt(part.trim()));
            } catch (NumberFormatException ignored) {
                // 略過壞掉的項目
            }
        }
        return out;
    }

    private static JSONArray readInbox(SharedPreferences p) {
        try {
            return new JSONArray(p.getString("inbox", "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    /** 已在「已收藏 ID 快照」或「收件匣」裡 */
    static boolean isKnown(Context ctx, int id) {
        synchronized (LOCK) {
            SharedPreferences p = prefs(ctx);
            if (idSet(p.getString("ids", "")).contains(id)) return true;
            JSONArray inbox = readInbox(p);
            for (int i = 0; i < inbox.length(); i++) {
                JSONObject o = inbox.optJSONObject(i);
                if (o != null && o.optInt("id", -1) == id) return true;
            }
            return false;
        }
    }

    /** 加入收件匣；成功（已寫入）回傳 true，收件匣已滿或寫入失敗回傳 false。 */
    static boolean append(Context ctx, int id, long at) {
        synchronized (LOCK) {
            SharedPreferences p = prefs(ctx);
            JSONArray inbox = readInbox(p);
            if (inbox.length() >= MAX_INBOX) return false;
            try {
                inbox.put(new JSONObject().put("id", id).put("at", at));
            } catch (JSONException e) {
                return false;
            }
            return p.edit().putString("inbox", inbox.toString()).commit();
        }
    }

    /** 讀出收件匣，不清除。 */
    static JSONArray peek(Context ctx) {
        synchronized (LOCK) {
            return readInbox(prefs(ctx));
        }
    }

    /** 把這些 ID 從收件匣移除（JS 寫進資料庫後呼叫）。 */
    static void ack(Context ctx, Set<Integer> ids) {
        synchronized (LOCK) {
            SharedPreferences p = prefs(ctx);
            JSONArray inbox = readInbox(p);
            JSONArray keep = new JSONArray();
            for (int i = 0; i < inbox.length(); i++) {
                JSONObject o = inbox.optJSONObject(i);
                if (o != null && !ids.contains(o.optInt("id", -1))) keep.put(o);
            }
            p.edit().putString("inbox", keep.toString()).commit();
        }
    }
}

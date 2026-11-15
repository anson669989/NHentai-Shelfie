# 2026-11 背景下載（前景服務＋通知）與匯入時的同步提醒

> 建立：2026-11-15　·　目標版本：併入 v0.4.0（v0.4.0 尚未推標籤；`package.json` 版本號不用改）
> 狀態：**階段 A、B 完成**（B 待 GitHub Actions 確認編譯）。本文件由規劃者撰寫，交給另一位執行者依序實作。
> 執行者沒有規劃時的對話內容，所有需要的背景都寫在這份文件裡。

---

## 0. 給執行者：開始前必讀

1. 先讀 `CLAUDE.md`（必守規則全部適用，**除了本文件第 2.1 節明確放寬的兩條**）與 `docs/DEVELOPMENT.md`，再讀本文件第 1–3 節，最後才動手做第 4 節。
2. **一次只做一個階段**（A → E）。每個階段做完：`npm test`、`npm run build` 都通過 → 勾選該階段的核取方塊 → 依 `CLAUDE.md`「回報方式」向使用者回報（繁體中文、白話、先講結論）→ 等使用者說繼續才做下一階段。commit／push 只在使用者要求時做。
3. `docs/tasks/archive/` 是過去已完成的任務，**只能參考，不要執行**。
4. 第 3 節「自行決定的細節」是規劃者替使用者做的決定。使用者若有修改，以使用者的指示為準。
5. 你無法讀取 `node_modules/`，Capacitor 內部行為無法從原始碼確認。凡是標 **⚠ 實機確認** 的地方，代表規劃時無法驗證，已附備案；請寫出能容錯的程式，並確認它在第 5 節的實機清單裡。
6. 本機沒有 Android 環境。能用單元測試覆蓋的邏輯一律抽成純函式並寫測試；Java 靠 GitHub Actions 建置（確認編譯得過）與第 5 節的實機清單驗收。

---

## 1. 背景與已查證的事實（2026-11-15）

### 1.1 使用者要什麼

- 現在 App 只有開在畫面上時才抓書名與封面。匯入大量 CSV（例如 1000 本）要等很久：站方限制詳情每分鐘 20 次，所以 **1000 本約 50 分鐘**，這段時間手機不能做別的事。
- 使用者決定：**做「背景下載」，設定頁一個開關，預設關閉**。開啟後切到別的 App 或關螢幕也繼續抓，通知列顯示進度，抓完通知自動消失。
- 另外要求：**在匯入 CSV 的地方提醒使用者「資料是怎麼同步的」**（要開著 App，或開啟背景下載）。
- 順便修掉上次檢查發現的問題：App 在背景時收到「直接收藏」，會在背景啟動佇列去連站方，而且「已加入剛才分享的 N 本」的提示在背景跳、回到 App 看不到。

### 1.2 目前程式的狀態

| 項目 | 現況 | 位置 |
| ---- | ---- | ---- |
| 佇列啟停 | `runQueue()`（`paused = false`，啟動 meta／cover 兩個工作者）、`stopQueue()`（`paused = true`，清掉重試計時器；目前這本做完就停） | `src/services/library.js` 約 895–965 行 |
| 前景／背景 | `CapApp.addListener('appStateChange')`：`isActive` → `drainShares()`＋`runQueue()`＋`maybeUpdateTagTranslations()`；否則 `stopQueue()` | `src/App.vue` 約 99–108 行 |
| 直接收藏事件 | `listenForQuickShares(onDrained)`；`onDrained(n)` 在 `n > 0` 時 `toast` 並 `runQueue()`——**不管 App 是不是在前景**（這就是要修的問題） | `src/App.vue` 約 113、130–135 行 |
| 佇列狀態 | `queueState = { apiWaitUntil, imgWaitUntil, netWaitUntil, challenge, error }`、`pendingCount`、`queueRunning`（都是 reactive／ref） | `library.js` 約 77 行、`updateRunning()`、`refreshPendingCount()` |
| 佇列停下的原因 | 做完（沒有待處理）；`queueState.challenge = true`（等使用者驗證）；`queueState.error`（寫檔／空間／資料庫錯誤）；429 或網路失敗會用 `retryLater()` 自己重試，不算停 | `metaLoop()`、`coverLoop()` |
| 節流等待 | `makeLane()` 用 `sleep(ms)`＝`setTimeout`（API 隊伍 3 秒、圖片隊伍 1 秒） | `src/services/nhSource.js` 約 82–111 行 |
| 網路請求 | 原生 `CapacitorHttp`（不靠 WebView 的 fetch）；被擋時才用外掛的隱藏 WebView | `nhSource.js` |
| 外掛 | `plugins/nh-webfetch/`：`NhWebFetchPlugin.java`（有 `static WeakReference<NhWebFetchPlugin> instance` 與 `notifyQuickShare()` 的寫法可沿用）、`QuickShareStore.java`、`ShareReceiverActivity.java`；外掛 manifest 目前**不宣告任何權限**；沒有 `res/` 資料夾；依賴 `androidx.appcompat`（會帶入 `androidx.core`，可用 `NotificationCompat`／`ServiceCompat`） | `plugins/nh-webfetch/android/` |
| SDK 版本 | `minSdk 23`、`compileSdk 35`、`targetSdk 35`、Java 21 | `plugins/nh-webfetch/android/build.gradle` |
| 匯入畫面 | 設定頁「資料」卡片：匯出／匯入按鈕；選檔後 `previewCsvImport` → `confirmDialog(msg, { okText })`（純文字、可含 `\n`）→ `commitCsvImport` → `toast('import.done')` → `runQueue()` | `src/components/SettingsPage.vue` 約 200–217、483–515 行 |
| 服務層與 i18n | 服務層不 import i18n；文字由介面傳入（例：`setShareLabels`） | `library.js`、`App.vue` 的 `pushShareLabels` |

### 1.3 Android 的規則（寫程式時要遵守）

- **背景持續工作必須是「前景服務」＋一則通知**。Android 14 起每個前景服務要宣告類型；本功能用 `dataSync`。
- 需要的權限（全部宣告在**外掛的 manifest**，`cap sync` 會自動合併，不用改 `scripts/patch-android.mjs`）：
  - `android.permission.FOREGROUND_SERVICE`
  - `android.permission.FOREGROUND_SERVICE_DATA_SYNC`
  - `android.permission.POST_NOTIFICATIONS`（Android 13 起要跳視窗問使用者；12 以下自動允許）
  - `android.permission.WAKE_LOCK`（關螢幕後 CPU 才不會睡著；不會跳視窗）
- **Android 12 起，App 在背景時不能啟動前景服務**（會丟 `ForegroundServiceStartNotAllowedException`）。所以本設計**只在 App 還在前景時啟動服務**（見 2.3）。
- **Android 15 起 `dataSync` 類型每 24 小時最多跑約 6 小時**。時間到系統會呼叫 `Service.onTimeout(int, int)`，必須在幾秒內 `stopSelf()`，否則 App 會被系統判定異常。6 小時約可抓 7000 本，夠用。
- Android 14 起使用者可以把前景服務的通知滑掉，服務仍會繼續跑。
- 部分品牌（小米、OPPO、vivo…）的省電機制仍可能砍掉 App：無法避免，下次開 App 會從資料庫接著抓（佇列本來就存在資料庫）。

---

## 2. 整體設計

### 2.1 放寬的規則（使用者已同意）

- 規則 9「不新增 Android 權限」：**本功能例外**，新增 1.3 列的四個權限，只能宣告在外掛 manifest。
- 「背景佇列只在前景執行」：改成「**預設只在前景執行；設定 `bg_sync` 開啟且前景服務正在跑時，背景也繼續**」。
- **沒有放寬**的：規則 16「原生端不可碰 SQLite」——服務**只負責讓 App 不被系統停掉並顯示通知**，不做網路、不碰資料庫；抓資料仍然是原本 JS 的佇列。規則 6 的兩條節流隊伍照舊，背景不會抓得比較快。

### 2.2 架構

```
設定頁開關（bg_sync）──▶ library.setBgSyncEnabled()
App.vue appStateChange ──▶ library.setAppActive(isActive)
佇列狀態改變（running / pending / challenge / error）
            │
            ▼
   library.syncBgService()  ──用純函式 bgSync.js 的 planBgSync() 決定動作──▶
            │
            ▼
   nhSource.js（唯一 import 外掛的地方）：startBgSync / updateBgSync / stopBgSync
            │
            ▼
   NhWebFetchPlugin.java ──▶ SyncService.java（前景服務＋通知＋WakeLock）
            ▲
            └── 服務被使用者按「停止」或 6 小時到期 ──▶ 事件 bgSyncStopped ──▶ library
```

### 2.3 什麼時候啟動、更新、停止服務（純函式 `planBgSync`）

輸入：`{ enabled, active, serviceOn, pending, running, waiting, halted }`

- `enabled`：設定 `bg_sync === '1'` 且已有通知權限
- `active`：App 在前景
- `serviceOn`：JS 認為服務正在跑
- `pending`：`pendingCount`
- `running`：`queueRunning`
- `waiting`：有重試計時器在等（429 或網路重試；工作者暫時沒在跑但會自己回來）
- `halted`：`queueState.challenge || queueState.error`（要使用者處理）

輸出（一個字串）：

| 結果 | 條件 | 動作 |
| ---- | ---- | ---- |
| `'start'` | `enabled && active && !serviceOn && pending > 0 && (running \|\| waiting) && !halted` | 啟動服務（**只在前景啟動**） |
| `'update'` | `serviceOn && pending > 0 && (running \|\| waiting) && !halted` | 更新通知上的本數 |
| `'done'` | `serviceOn && pending === 0 && !running` | 停止服務、移除通知 |
| `'paused'` | `serviceOn && halted` | 停止服務；若 App 在背景，通知改成「已暫停，請開啟 App」並留著（可滑掉、點了開 App）；若在前景，直接移除通知 |
| `'stop'` | `serviceOn && !enabled`（使用者關掉開關） | 停止服務、移除通知 |
| `'none'` | 其他 | 不動 |

判斷順序：`stop` → `paused` → `done` → `update` → `start` → `none`。

結果：只要開關開著、佇列有東西在抓，**不論前景背景通知都在**（前景時也顯示，換來的是不會踩到「背景不能啟動服務」的限制，邏輯也最簡單）。

### 2.4 App 切到背景／回到前景（`library.setAppActive`）

- 切到背景（`active = false`）：
  - `serviceOn` → **不停佇列**，繼續抓。
  - 否則 → `stopQueue()`（和現在一樣）。
- 回到前景（`active = true`）：`runQueue()`（和現在一樣；之後 `syncBgService()` 會視情況啟動服務）。
- 背景中服務停了（`done`／`paused`／使用者按停止／6 小時到期）且 `active === false` → 一併 `stopQueue()`，回到「只在前景」的狀態。

### 2.5 修掉「背景收到直接收藏就啟動佇列」

`App.vue` 的 `onDrained(n)` 改成：

- App 在前景：照舊（`toast`＋`runQueue()`）。
- App 在背景：**不 `toast`、不 `runQueue()`**；把 `n` 累加到一個變數，回到前景時（`appStateChange` 的 `isActive`）一次 `toast(t('share.drained', { n: 累計 }))` 後歸零。
  - 例外：背景下載的服務正在跑（佇列本來就在動）時，新書已經寫進資料庫，佇列會自然輪到它，**不需要**另外呼叫 `runQueue()`；但若工作者剛好都跑完了，為了不漏掉，可呼叫 `library.nudgeQueue()`（新函式：`serviceOn` 才 `kick` 兩個工作者，否則不做事）。
- 寫進資料庫（`drainQuickShares`）這一步在背景照做（純本機動作，沒有網路）。

### 2.6 背景時計時器變慢的對策 ⚠ 實機確認

WebView 不在畫面上時，系統可能把網頁的 `setTimeout` 放慢（最壞情況對齊到每分鐘一次），那 3 秒的節流等待會變成 1 分鐘，背景下載等於沒用。對策：

- 外掛新增 `delay({ ms })`：Java 端用主執行緒 `Handler.postDelayed` 到時間才 `call.resolve()`（`ms` 夾在 0–60000）。原生回呼不受網頁計時器限速影響。
- `nhSource.js` 的 `sleep(ms)` 改成：**原生平台且 `document.visibilityState === 'hidden'`** 時用 `NhWebFetch.delay`，失敗（外掛丟錯）就退回 `setTimeout`；其他情況照舊用 `setTimeout`。
- `library.js` 的 `retryLater()`（30 秒以上的重試）維持 `setTimeout` 不改：就算被放慢到多等一分鐘也無妨。
- 測試：`sleep` 的選擇邏輯抽成可測的小函式（例：`pickSleep({ native, hidden })` 回傳 `'native' | 'timer'`）。

### 2.7 原生端：`SyncService.java`

新檔 `plugins/nh-webfetch/android/src/main/java/io/github/anson669989/nhwebfetch/SyncService.java`：

- `extends android.app.Service`，`onBind` 回 `null`，`onStartCommand` 回 `START_NOT_STICKY`。
- Intent action：
  - `ACTION_START`（extras：`title`、`text`、`stopLabel`、`channelName`）：建通知頻道（API 26+，`IMPORTANCE_LOW`、不震動不響、`lockscreenVisibility = VISIBILITY_SECRET`）→ `ServiceCompat.startForeground(this, NOTIF_ID, notification, FOREGROUND_SERVICE_TYPE_DATA_SYNC)`（API 29 以下型別參數傳 0）→ 取得 `PARTIAL_WAKE_LOCK`（`acquire(6 小時 10 分)` 的逾時版本，避免永久持有）。
  - `ACTION_UPDATE`（extra：`text`）：同一個 `NOTIF_ID` 重發通知（`setOnlyAlertOnce(true)`）。
  - `ACTION_STOP_USER`（通知上「停止」按鈕）：通知外掛（`reason = 'user'`）→ 停止並移除通知。
- 通知內容：小圖示用外掛自帶的向量圖 `res/drawable/ic_stat_nh_sync.xml`（**中性的同步箭頭**，單色；不要用書本圖示）、`setOngoing(true)`、`setVisibility(VISIBILITY_SECRET)`（鎖定畫面不顯示）、`setCategory(CATEGORY_PROGRESS)`、`setContentIntent`＝開啟 App（`getPackageManager().getLaunchIntentForPackage(getPackageName())`，`PendingIntent.FLAG_IMMUTABLE | FLAG_UPDATE_CURRENT`）、一個「停止」action。**通知不放書名、封面、ID**。
- `onTimeout(int startId, int fgsType)`（API 35，用 `@Override` 會在 compileSdk 35 下編得過；另外保留 API 34 的 `onTimeout(int)` 不需要）：通知外掛（`reason = 'timeout'`）→ `stopForeground(STOP_FOREGROUND_REMOVE)`＋`stopSelf()`。
- `onTaskRemoved`（使用者從最近工作清單把 App 滑掉）：`stopSelf()`、移除通知——Activity 沒了，JS 也沒了，留著服務沒有意義。
- `onDestroy`：釋放 WakeLock（`isHeld()` 才 release）。
- 靜態方法 `static void stop(Context, boolean keepPausedNotice, String pausedText)`：`keepPausedNotice` 為 true 時，先停服務（`STOP_FOREGROUND_REMOVE`），再用 `NotificationManagerCompat` 以**另一個 ID** 發一則一般通知（可滑掉、`setAutoCancel(true)`、點了開 App、文字＝`pausedText`）。App 回到前景時 JS 會呼叫 `clearBgSyncNotice()` 把這則清掉。
- 通知外掛用 `NhWebFetchPlugin` 既有的 `static WeakReference instance` 寫法，新增 `static void notifyBgSyncStopped(String reason)` → `notifyListeners("bgSyncStopped", { reason }, true)`。
- **服務本身不做任何網路或資料庫動作。**

外掛 manifest（`plugins/nh-webfetch/android/src/main/AndroidManifest.xml`）加四個 `<uses-permission>` 與：

```xml
<service
    android:name="io.github.anson669989.nhwebfetch.SyncService"
    android:exported="false"
    android:foregroundServiceType="dataSync" />
```

並把檔頭註解「不宣告任何權限」改成說明這四個權限的用途。

### 2.8 外掛新增的方法（`NhWebFetchPlugin.java`＋`plugins/nh-webfetch/src/index.js` 的註解）

| 方法 | 作用 |
| ---- | ---- |
| `getNotificationPermission()` → `{ granted }` | API 33 以下一律 `true`；否則查 `POST_NOTIFICATIONS`，並且 `NotificationManagerCompat.areNotificationsEnabled()` 也要是 true |
| `requestNotificationPermission()` → `{ granted }` | API 33+ 用 Capacitor 的權限流程（`@CapacitorPlugin(permissions = { @Permission(alias = "notifications", strings = { "android.permission.POST_NOTIFICATIONS" }) })`＋`requestPermissionForAlias`＋`@PermissionCallback`）；API 33 以下直接回 `areNotificationsEnabled()` |
| `startBgSync({ title, text, stopLabel, channelName })` → `{}` | `ContextCompat.startForegroundService`；任何例外（含 `ForegroundServiceStartNotAllowedException`、`SecurityException`）都 `call.reject("BG_SYNC_FAILED")`，不可讓 App 當掉 |
| `updateBgSync({ text })` → `{}` | 服務沒在跑就什麼都不做 |
| `stopBgSync({ paused, text })` → `{}` | `paused` 為 true 時留下「已暫停」通知（2.7） |
| `clearBgSyncNotice()` → `{}` | 清掉「已暫停」那則通知 |
| `delay({ ms })` → `{}` | 2.6 |
| 事件 `bgSyncStopped` `{ reason: 'user' | 'timeout' | 'failed' }` | 服務被使用者按停止、6 小時到期，或 `startBgSync` 已成功但服務進不了前景狀態（`failed`，階段 B 實作時補上；JS 一律當成服務已停） |

`handleOnDestroy()` 裡也要停掉服務（Activity 結束）。

### 2.9 JS 端

- **`src/services/bgSync.js`（新，純函式，必須有單元測試 `tests/bg-sync.test.js`）**
  - `planBgSync(state)`：2.3。
  - `estimateSyncMinutes(n)`：`Math.ceil((n * 3) / 60)`（瓶頸是 API 隊伍每本 3 秒；封面隊伍同時進行不另外加）；`n <= 0` 回 0。
  - `fillCount(template, n)`：把 `{n}` 換成數字（服務層不 import i18n，通知文字的範本由介面傳入）。
- **`src/services/nhSource.js`**：包裝 2.8 的方法（`getNotificationPermission`、`requestNotificationPermission`、`startBgSync`、`updateBgSync`、`stopBgSync`、`clearBgSyncNotice`、`onBgSyncStopped`）；非原生平台（`npm run dev`）全部安靜地回預設值（權限 `false`、其餘不做事），寫法比照既有的 `takeSharedText`／`onQuickShareReceived`。`sleep` 依 2.6 修改。
- **`src/services/library.js`**
  - 模組變數：`appActive = true`、`bgServiceOn = false`、`bgLabels = null`。
  - `setBgSyncLabels({ title, progress, paused, stop, channel })`：介面傳入文字（`progress` 含 `{n}`）。
  - `setAppActive(isActive)`：2.4。
  - `syncBgService()`：組出 2.3 的輸入 → `planBgSync` → 呼叫 nhSource。要**序列化**（上一個動作還沒做完就排在後面，比照 `drainQuickShares` 的單一 Promise 寫法），並且**同樣的通知文字不重複送**。`startBgSync` 失敗 → `bgServiceOn = false`，`console.warn`，不丟錯（退回只在前景抓）。
  - 呼叫 `syncBgService()` 的時機：`updateRunning()`、`refreshPendingCount()` 之後、`retryLater()`、`queueState.challenge`／`queueState.error` 被設定的地方、`setAppActive`、設定 `bg_sync` 改變時。建議用 Vue 的 `watch`（`library.js` 已經 import `reactive`）監看 `[pendingCount, queueRunning, queueState.challenge, queueState.error]`，再加上手動呼叫的幾處，避免漏掉。
  - `waiting`＝`workers.meta.timer || workers.cover.timer` 有值。
  - `onBgSyncStopped`（啟動時註冊一次）：`bgServiceOn = false`；`appActive === false` → `stopQueue()`。`reason === 'user'` 時**不要**把設定 `bg_sync` 關掉（只停這一次）。
  - `nudgeQueue()`：2.5。
  - 檔頭註解「背景佇列（只在前景執行）」改成新的說法。
- **`src/services/settings.js`**：`DEFAULTS` 加 `bg_sync: '0'`（1＝背景下載；**不列入 CSV 備份**，因為通知權限是每台手機各自的）。
- **`src/App.vue`**：`appStateChange` 改呼叫 `setAppActive(isActive)`（裡面處理停／跑佇列），保留 `drainShares()` 與 `maybeUpdateTagTranslations()`；回到前景時呼叫 `clearBgSyncNotice`（經 library 的包裝，介面層不可直接 import nhSource）；啟動時與語言改變時呼叫 `setBgSyncLabels`（比照 `pushShareLabels`，找出現有「語言改變時重推分享文字」的地方一起做）；`onDrained` 依 2.5 修改。

### 2.10 設定頁

「資料」卡片（`SettingsPage.vue` 約 200 行），在匯出／匯入那一列**下面**加一列開關：

- 標題 `settings.bgSync`、說明 `settings.bgSyncHint`，樣式比照「標籤翻譯」的開關列（`row`＋`row-text`＋`switch`）。
- 打開時（`flipBgSync`）：
  1. `getNotificationPermission()`；沒有 → `requestNotificationPermission()`。
  2. 仍沒有 → 開關彈回關閉（記得把 `$event.target.checked` 設回 false）、`alertDialog(t('settings.bgSyncDenied'))`、不寫設定。
  3. 有 → `setSetting('bg_sync', '1')` → `setBgSyncEnabled()`／`syncBgService()`。
- 關閉時：`setSetting('bg_sync', '0')` → `syncBgService()`（會走 `'stop'`）。
- 每次啟動 App：若 `bg_sync === '1'` 但權限已被使用者到系統設定收回 → 視同未啟用（`enabled = false`），**不自動改設定、不主動跳視窗**；設定頁開關下方顯示 `settings.bgSyncNoPerm`（紅字，樣式用既有的 `field-error`）。

### 2.11 匯入時的同步提醒

`SettingsPage.vue` 的 `doImport`：預覽訊息在 `res.ok.length > 0` 時，於 `import.preview`（與 `import.layout`）之後、跳過原因之前，多加一段（前面空一行）：

1. `import.syncEta`：預估時間，`min = estimateSyncMinutes(res.ok.length + pendingCount.value)`。
2. 依開關擇一：`import.syncHintOff`（沒開背景下載）或 `import.syncHintOn`（已開且有權限）。

匯入完成的 toast（`import.done`）不改。

### 2.12 新增的介面字串（四語都要補；`{n}`、`{min}` 是變數）

| 鍵 | zh-TW | zh-CN | en | ja |
| -- | ----- | ----- | -- | -- |
| `settings.bgSync` | 背景下載 | 后台下载 | Background download | バックグラウンドでダウンロード |
| `settings.bgSyncHint` | 開啟後，切到別的 App 或關閉螢幕也會繼續補書名與封面，通知列會顯示進度（不顯示書名與封面）。速度不會變快；每天最多連續約 6 小時。 | 开启后，切到其他 App 或关闭屏幕也会继续补全标题和封面，通知栏会显示进度（不显示标题和封面）。速度不会变快；每天最多连续约 6 小时。 | Keeps fetching titles and covers while you use other apps or the screen is off. A notification shows progress (no titles or covers). It is not faster; limited to about 6 hours a day. | オンにすると、他のアプリを使っているときや画面オフのときもタイトルと表紙の取得を続けます。通知に進み具合を表示します（タイトルや表紙は表示しません）。速度は変わりません。1 日に最長約 6 時間までです。 |
| `settings.bgSyncDenied` | 需要允許通知才能在背景下載。請在系統設定允許 NH Shelfie 的通知後再試一次。 | 需要允许通知才能在后台下载。请在系统设置中允许 NH Shelfie 的通知后再试一次。 | Background download needs notification permission. Allow notifications for NH Shelfie in system settings, then try again. | バックグラウンドでのダウンロードには通知の許可が必要です。システム設定で NH Shelfie の通知を許可してから、もう一度お試しください。 |
| `settings.bgSyncNoPerm` | 通知權限已關閉，背景下載目前沒有作用。 | 通知权限已关闭，后台下载目前不起作用。 | Notifications are turned off, so background download is not active. | 通知がオフのため、バックグラウンドでのダウンロードは動作していません。 |
| `bgSync.title` | 同步中 | 同步中 | Syncing | 同期中 |
| `bgSync.progress` | 還有 {n} 本 | 还剩 {n} 本 | {n} left | 残り {n} 件 |
| `bgSync.paused` | 同步已暫停，請開啟 App 查看 | 同步已暂停，请打开 App 查看 | Sync paused. Open the app to continue. | 同期を一時停止しました。アプリを開いて確認してください。 |
| `bgSync.stop` | 停止 | 停止 | Stop | 停止 |
| `bgSync.channel` | 背景下載 | 后台下载 | Background download | バックグラウンドでのダウンロード |
| `import.syncEta` | 書名與封面會在匯入後慢慢補上，大約需要 {min} 分鐘。 | 标题和封面会在导入后慢慢补全，大约需要 {min} 分钟。 | Titles and covers are fetched after the import; this takes about {min} min. | タイトルと表紙はインポート後に少しずつ取得します。約 {min} 分かかります。 |
| `import.syncHintOff` | 要讓 App 開在畫面上才會繼續；切到別的 App 或關閉螢幕就會暫停，下次開啟時接著抓。想邊用手機邊抓，請先到「設定 → 資料 → 背景下載」開啟。 | 需要让 App 保持在屏幕上才会继续；切到其他 App 或关闭屏幕就会暂停，下次打开时接着获取。想边用手机边获取，请先到“设置 → 数据 → 后台下载”开启。 | Fetching only continues while the app is on screen; it pauses when you switch apps or turn the screen off and resumes next time. To keep going in the background, turn on Settings → Data → Background download first. | アプリを画面に表示している間だけ取得します。他のアプリに切り替えたり画面をオフにすると一時停止し、次に開いたときに再開します。バックグラウンドでも続けたい場合は、先に「設定 → データ → バックグラウンドでダウンロード」をオンにしてください。 |
| `import.syncHintOn` | 已開啟背景下載：切到別的 App 或關閉螢幕也會繼續，通知列會顯示進度。 | 已开启后台下载：切到其他 App 或关闭屏幕也会继续，通知栏会显示进度。 | Background download is on: fetching continues while you use other apps or the screen is off, with progress in a notification. | バックグラウンドでのダウンロードがオンです。他のアプリを使っているときや画面オフのときも取得を続け、通知に進み具合を表示します。 |

`import.syncHintOff` 裡的「設定 → 資料」請對照 `locales.js` 既有的 `settings.data` 各語言實際用詞，不一致就以既有用詞為準。

---

## 3. 自行決定的細節（請使用者審閱）

1. **權限是 4 個，不是先前口頭說的 2–3 個**：多了一個 `WAKE_LOCK`（關螢幕後不讓 CPU 睡著，否則關螢幕就停）。只有「通知」會跳視窗問你，其餘三個安裝時自動給。
2. **開關預設關閉**；放在設定頁「資料」卡片、匯入按鈕的下面。
3. **通知文字保持中性**：標題「同步中」、內容「還有 N 本」，圖示是同步箭頭；不顯示書名、封面、ID；**鎖定畫面不顯示**。但通知列上仍會出現 App 名稱「NH Shelfie」（Android 規定，改不掉）。
4. **開關開著、有東西在抓時，就算 App 開在畫面上也會有通知**（這樣最穩，不會踩到「背景不能啟動服務」的限制）。抓完自動消失。
5. 通知上有「停止」按鈕：只停這一次，不會把開關關掉；回到 App 會照常繼續抓。
6. **不允許通知就不能開**背景下載（開關會彈回去並說明原因）。
7. 背景中遇到要你處理的事（Cloudflare 驗證、空間不足等）：停止背景下載，通知改成「同步已暫停，請開啟 App 查看」。
8. 背景中**斷網或被限速**：照原本規則自己重試（30 秒），不另外設上限；反正 Android 每天最多讓它跑約 6 小時。
9. App 在背景、背景下載**沒在跑**時收到「直接收藏」：只把書存進資料庫，不連網；回到 App 才開始抓，並補顯示「已加入剛才分享的 N 本」。（背景下載正在跑時，新分享的書會直接排進去一起抓。）
10. 匯入提醒放在**按下「匯入」前的確認視窗**裡（預估分鐘數＋同步方式說明），不另外加按鈕。預估時間用「每本 3 秒」計算，並把原本還沒抓完的本數算進去。
11. `bg_sync` 這個設定**不放進 CSV 備份**（換手機要重新允許通知）。
12. 併入尚未發佈的 v0.4.0，不另外升版號。

---

## 4. 分階段任務

### 階段 A：純函式、設定鍵、字串

- [x] 新增 `src/services/bgSync.js`：`planBgSync`、`estimateSyncMinutes`、`fillCount`（2.3、2.9）
- [x] 新增 `tests/bg-sync.test.js`：2.3 表格每一列至少一個案例，另外測判斷順序（例：`serviceOn && !enabled && halted` → `'stop'`）、背景時不會 `'start'`（`active = false`）、`estimateSyncMinutes(0) = 0`／`(1) = 1`／`(1000) = 50`
- [x] `src/services/settings.js` 的 `DEFAULTS` 加 `bg_sync: '0'`
- [x] `src/locales.js` 四語加入 2.12 的全部字串（`npm test` 的 locales 測試會檢查四語鍵一致）
- 驗收：`npm test`、`npm run build` 通過。這個階段畫面沒有任何變化。

### 階段 B：原生端

- [x] 新增 `SyncService.java`（2.7）
- [x] 新增 `plugins/nh-webfetch/android/src/main/res/drawable/ic_stat_nh_sync.xml`（24dp 單色向量圖，同步箭頭）
- [x] 外掛 manifest：四個權限＋`<service>`，更新檔頭註解
- [x] `NhWebFetchPlugin.java`：2.8 的方法、`@CapacitorPlugin(name = "NhWebFetch", permissions = {...})`、`notifyBgSyncStopped`、`handleOnDestroy` 停服務；檔頭說明補一段
- [x] `plugins/nh-webfetch/src/index.js`：補上新方法與事件的註解
- 陷阱：
  - `ServiceCompat.startForeground` 必須在 `onStartCommand` 收到 `ACTION_START` 後**立刻**呼叫（5 秒內沒呼叫會被系統丟例外）；`ACTION_UPDATE`／`ACTION_STOP_USER` 送到一個還沒 `startForeground` 的服務時，用 `startService` 而不是 `startForegroundService`，並且服務沒在前景狀態就直接 `stopSelf()`。建議用一個 `static volatile boolean running` 記錄狀態，外掛端 `updateBgSync` 在 `!running` 時直接不送 Intent。
  - 通知頻道只在 API 26+ 建立；`PendingIntent` 一律帶 `FLAG_IMMUTABLE`。
  - `POST_NOTIFICATIONS` 常數在 API 33 才有，用字串 `"android.permission.POST_NOTIFICATIONS"`，並以 `Build.VERSION.SDK_INT >= 33` 包起來。
  - WakeLock tag 用 `"nhshelfie:bgsync"`；一定要用有逾時的 `acquire(ms)`。
  - 不要在服務裡做網路或資料庫動作（規則 16 的精神）。
- 驗收：本機無法編譯 Java；`npm test`、`npm run build` 通過即可回報，並提醒使用者推上 GitHub 讓 Actions 建置，**建置失敗要回來修**。

### 階段 C：服務層串接

- [ ] `nhSource.js`：包裝外掛方法、`sleep` 依 2.6 修改（`pickSleep` 抽出並加測試，放進 `tests/bg-sync.test.js` 或既有合適的測試檔）
- [ ] `library.js`：`setBgSyncLabels`、`setAppActive`、`syncBgService`、`nudgeQueue`、`onBgSyncStopped` 註冊、權限查詢與請求的包裝（給設定頁用：例 `bgSyncPermission()`、`requestBgSyncPermission()`、`clearBgSyncNotice()`）、更新註解（2.9）
- [ ] `App.vue`：`appStateChange` 改用 `setAppActive`；啟動與語言改變時推通知文字；回到前景清「已暫停」通知；`onDrained` 依 2.5 修改
- 陷阱：
  - `stopQueue()` 之後佇列「目前這本做完才停」是既有行為，不要改。
  - `syncBgService()` 會被很頻繁地呼叫（每本書至少一次）：要序列化、文字沒變不送。
  - `startBgSync` 失敗不可讓佇列停下或跳錯誤訊息，只是退回舊行為。
  - `appActive` 初始值是 `true`（App 啟動時一定在前景）。
  - 階段 B 補充：`bgSyncStopped` 多了 `reason = 'failed'`（見 2.8），處理方式與其他原因相同（`bgServiceOn = false`）。另外，使用者在 App **還在前景**時（例如拉下通知列）按「停止」，`planBgSync` 下一次會立刻回 `'start'` 把服務重開；若要真的「只停這一次」，可在 `reason === 'user'` 時記一個旗標，到下次切到背景再回前景前都不啟動。
  - 介面層不可直接 import `nhSource.js`（三層架構），一律經 `library.js`。
  - 規則 6：新程式不可繞過兩條節流隊伍；`delay` 只是取代隊伍內的等待方式，間隔秒數不變。
- 驗收：`npm test`、`npm run build` 通過。開關還沒有介面，`bg_sync` 預設 `'0'`，行為應與改動前完全相同（除了 2.5 的修正）。

### 階段 D：介面

- [ ] `SettingsPage.vue`：「資料」卡片加背景下載開關與權限流程（2.10）
- [ ] `SettingsPage.vue` 的 `doImport`：加入同步提醒（2.11）
- 陷阱：規則 4（純文字渲染，不用 v-html；`confirmDialog` 的訊息本來就是純文字＋換行）；規則 8（四語）。
- 驗收：`npm test`、`npm run build` 通過；`npm run dev` 可看到開關與文字（桌面上權限一律視為沒有，開關會彈回並顯示說明——這是預期行為）。

### 階段 E：文件

- [ ] `CLAUDE.md`：
  - 規則 9 改成：權限為 `INTERNET`＋背景下載用的四個（列出名稱），都宣告在外掛 manifest；仍不新增其他權限
  - 規則 16 補一句：`SyncService` 只保活與顯示通知，不做網路、不碰資料庫
  - 架構一節：`bgSync.js`（純函式，列入「必須有單元測試」與 `npm test` 必跑清單）、nh-webfetch 的說明補上前景服務、通知權限與 `delay`
  - 「背景佇列只在前景執行」的幾處改成 2.1 的新說法；加一條：前景服務只能在 App 於前景時啟動
  - 「待實機驗收」加入本文件；「任務文件」一節指向本文件
- [ ] `docs/DEVELOPMENT.md`：第 32、59、100、109 行附近（「只在前景執行」「只申請 INTERNET 權限」）與檔案清單（`bgSync.js`、`SyncService.java`）；設定頁功能表加「背景下載」
- [ ] `README.md`／`README.en.md`：若有提到「要開著 App 才會抓」或權限的段落就更新；沒有就加一小段說明背景下載是選用功能、會用到通知權限
- [ ] 全部完成後，把本文件狀態改成「階段 A–E 完成，待實機驗收」

---

## 5. 需要使用者在實機上手動測試的項目

先從 GitHub Actions 下載建置好的 APK 安裝（覆蓋安裝，資料會保留）。

**開關與權限**

- [ ] 設定 →「資料」看到「背景下載」開關，預設關閉
- [ ] 第一次打開：跳出「允許通知」視窗；按「不允許」→ 開關自動關回去並出現說明
- [ ] 再打開一次並允許 → 開關維持開啟
- [ ] 到系統設定把 NH Shelfie 的通知關掉，回到 App 的設定頁 → 開關下方出現紅字「通知權限已關閉…」

**背景下載（開關開啟）**

- [ ] 匯入一份 30 本以上的 CSV → 通知列出現「同步中／還有 N 本」，數字會減少
- [ ] 按主畫面鍵切到別的 App，等 2 分鐘 → 通知上的數字持續減少（⚠ 如果幾乎不動＝背景計時被放慢，請回報）
- [ ] **關閉螢幕** 3 分鐘再打開 → 數字有明顯減少（大約每分鐘少 20）
- [ ] 鎖定畫面上**看不到**這則通知
- [ ] 通知裡沒有書名、封面、ID
- [ ] 全部抓完 → 通知自動消失
- [ ] 抓到一半按通知上的「停止」→ 通知消失、不再抓；回到 App → 自動繼續抓，設定裡的開關仍是開的
- [ ] 抓到一半點通知本體 → 回到 App
- [ ] 抓到一半從「最近使用的 App」把 NH Shelfie 滑掉 → 通知消失；重新開 App 會接著抓
- [ ] 抓到一半開飛航模式 1 分鐘再關掉 → 通知還在，恢復網路後繼續

**開關關閉時（確認舊行為沒壞）**

- [ ] 關閉開關後匯入幾本 → 沒有通知；切到別的 App 再回來，回來後才繼續抓

**直接收藏（設定 → 分享 → 直接收藏）**

- [ ] 背景下載**關閉**、佇列是空的：在瀏覽器分享一本 → 出現「成功收藏」；先不要回 App，等 1 分鐘 → 回到 App 才看到「已加入剛才分享的 1 本」，然後才開始補書名
- [ ] 背景下載**開啟**且正在抓：在瀏覽器分享一本 → 通知上的數字加 1，之後照常抓完

**匯入提醒**

- [ ] 背景下載關閉時匯入：確認視窗裡有「大約需要 X 分鐘」與「要讓 App 開在畫面上…」的說明
- [ ] 背景下載開啟時匯入：說明變成「已開啟背景下載…」
- [ ] 匯入的檔案全部是已收藏的書（新增 0 筆）：不出現這段說明
- [ ] 切換四種語言各看一次開關說明與匯入說明，沒有出現英文鍵名（如 `import.syncEta`）

**長時間（選做）**

- [ ] 匯入 300 本以上，關螢幕放著 → 約 15–20 分鐘後全部完成（若中途停住，回報手機品牌與 Android 版本）

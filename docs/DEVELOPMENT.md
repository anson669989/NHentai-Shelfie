# NH Shelfie 開發文件

> 給開發者與維護者看的技術說明。一般使用說明請看 [README](../README.md)。

Capacitor + Vue 3 的 Android App：輸入 gallery ID，在背景抓書名與封面存到本機，以資料夾分類；不經任何自建伺服器。

## 功能一覽

| 頁面 | 功能 |
| --- | --- |
| 資料夾 | 上方兩列搜尋與篩選：第一列「標籤／作者／社團」（可打字、勾選；清單上方「篩選方式」可選排除／包含任一／全部符合，預設全部符合；清單右上角「全部清除」）＋排序；第二列「作品名稱／備註／ID」文字搜尋（停止輸入 300 ms 後查詢）＋資料夾篩選（多選；標題旁「篩選方式」可選排除／包含任一／全部符合，預設包含任一；「全部」「未分類」「未讀」「⭐ 典藏」固定在最上方；自建資料夾與分隔線按住 ≡ 拖曳排序、⋯ 改名／刪除；最下方「＋ 新增資料夾」與「⚙ 管理資料夾」；右上角「全部清除」回到「全部」）；標籤翻譯開啟時，標籤清單顯示目前介面語言的翻譯名稱（中文或日文），打原文或翻譯都搜得到，開啟「附註原文」時翻譯旁以灰色小字顯示原文；有篩選時顯示「找到 N 本」與「清除全部篩選」；封面牆（虛擬捲動，可調 2–5 欄），封面下方固定兩行書名（可再多一行備註）、左下角 ID；每個資料夾各自記住排序（多選資料夾時用「全部」的排序）；點封面依「開啟網頁方式」以系統瀏覽器或 Custom Tab 開網頁；封面右上角「⋮」單本選單（完整英／日標題、單行備註、複製 ID、📁 分類（勾選即存）、從此資料夾移除、刪除；找不到的書可「修改 ID」；選單右上角灰色重新載入圖示＝重新查詢並更新標籤與封面）；長按封面進入多選模式（全選只選目前篩選結果、批次分類／移除／刪除，返回鍵退出）；佔位圖依狀態顯示「載入中／找不到這本／資料讀取失敗／封面失敗」 |
| 新增 | 「先存、後查」：輸入 ID（純數字、`#228922`、全形＃、網址）→ 按「加入」只做本機動作（不發網路請求）→ 輸入框立刻清空；已在所選資料夾就提示、已收藏就只補資料夾（不會重新加進未讀）；資料夾記住上次的選擇（勾選即存；預設只勾「未讀」，右邊灰色圖示可恢復預設）；下方「最近加入」清單（10–50 筆可設定）顯示所在資料夾、隨背景補資料自動更新，點整條開網頁、長按開「⋮」單本選單；從瀏覽器「分享」進來（「開 App 選資料夾」模式）會自動填入 ID；直接收藏的書在打開 App 時寫入並提示「已加入剛才分享的 N 本」 |
| 設定 | 最上方「使用說明」（每個主題點標題展開，內容是粗體小標＋底下的條列）；主題顏色、深淺色、語言（繁中／简中／English／日本語）；開啟網頁方式（外部瀏覽器／App 內瀏覽器）；分享（開 App 選資料夾／直接收藏，直接收藏時自動加入的資料夾）；資料夾（管理資料夾：拖曳排序、改名、刪除、新增分隔線）；標籤翻譯（開關、附註原文、狀態、立即更新、來源與授權）；在封面下方顯示備註、最近加入顯示筆數；媽媽模式（套用頁面：收藏頁／最近加入；隱藏內容：封面換成固定淺灰方塊且不載入圖片、書名、備註；詳細設定預設收合）；CSV 匯出／匯入（換機用，v2 格式含資料夾順序、分隔線、未讀／典藏、分享設定；匯入前的確認視窗附預估時間與同步方式說明）、背景下載（選用，前景服務＋通知，需要通知權限）、背景佇列、重抓缺少的封面、封面占用空間、清除封面快取（只清暫存，收藏的封面不刪）；進階：測試連線；連點「關於 → 版本」7 次開啟開發者模式，可修改站方端點、看最近 50 次抓取成功率、切換抓取方式、重設驗證 |
| 驗證畫面 | 站方開啟 Cloudflare 安全驗證時，App 會先在背景 WebView 自動嘗試；過不了才在提示列出現「進行驗證」按鈕，開啟全螢幕驗證畫面讓你手動完成，通過後背景佇列自動續跑 |

## 資料來源：nhentai API v2

App 直接向站方的公開 API v2 取資料，不經任何自建伺服器、不需要帳號或 API 金鑰：

- 書的資料：`GET https://nhentai.net/api/v2/galleries/{id}`
- 封面：先用 `GET https://nhentai.net/api/v2/cdn` 取得封面主機清單（t1–t4，快取 24 小時；四台都失敗時讓快取過期、下次重新取得），再把主機接上書的資料裡的 `cover.path`。上次成功的主機會優先使用，失敗才依序換下一台。
- 站方限制（[`/api/v2/docs`](https://nhentai.net/api/v2/docs)）：詳情匿名每分鐘 20 次／IP，所以 API 請求至少間隔 3 秒；封面 CDN 沒有明文次數（「正常瀏覽很寬鬆、持續高速會暫時封鎖、429 一律當退避訊號」），圖片請求採保守的 1 秒間隔。請求都帶 `NH-Shelfie/<版本>` 的 User-Agent。
- 站方舊的 `/api/gallery/{id}` 已停用；舊版 App 存下的資料仍能讀取。

## 「先存、後查」加入流程與背景佇列

1. 按「加入」（`library.quickAdd`）只查本機：`planAdd()`（[`addPlan.js`](../src/services/addPlan.js)，純函式）判斷 `new`／`already`／`addFolders`。新書以單一交易寫 `books`（`fetch_status = 'meta_pending'`、`queue_seq` = 加入毫秒）與 `book_folders`。
2. 佇列就是 `books.fetch_status`，存在資料庫，App 重開後接著做；依 `queue_seq`（加入順序）處理。
   - **meta 工作者**（API 隊伍）：`meta_pending` → 抓詳情 → 單一交易寫 `books` 書名與 `book_raw` → `cover_pending`；404 → `not_found`；格式不符 → `meta_failed`。
   - **cover 工作者**（圖片隊伍）：`cover_pending` → 用本機 `book_raw` 組封面網址 → 下載 → 搬進 `covers/`（新檔名）→ 更新資料庫 → `ok`；封面失敗 → `no_cover`。
   - 離線／逾時／被擋：不算失敗，留在佇列 30 秒後自動重試；429：該隊伍暫停到 `Retry-After`（預設 30 秒）後自動續跑，畫面顯示「請求太頻繁，稍後自動重試」；需要驗證：暫停並顯示「進行驗證」。
   - 預設只在前景執行：切到背景就停，回到前景或網路恢復（`online` 事件）自動續跑。設定「背景下載」（`bg_sync`）開啟且前景服務正在跑時，背景也繼續（見下一節）。
3. 節流分兩條獨立隊伍（[`nhSource.js`](../src/services/nhSource.js) 的 `makeLane`）：API（詳情、`/api/v2/cdn`、驗證畫面，≥ 3 秒）與圖片（t1–t4，≥ 1 秒），封面下載不會卡住下一本的查詢。不可在某條隊伍的工作內再呼叫排進同一條隊伍的函式。

## 背景下載（前景服務＋通知，選用）

設定頁「資料 → 背景下載」（`bg_sync`，預設 `'0'`，不列入 CSV 備份）。開啟後切到別的 App 或關螢幕也繼續補書名與封面，通知列顯示「同步中／還有 N 本」（不放書名、封面、ID；鎖定畫面不顯示），抓完通知自動消失。規格見 [`docs/tasks/2026-11-background-download.md`](tasks/2026-11-background-download.md)。

```
設定頁開關 ─▶ library.setBgSyncEnabled        App.vue appStateChange ─▶ library.setAppActive
佇列狀態改變（pendingCount／queueRunning／challenge／error，Vue watch）＋ retryLater
            ▼
library.syncBgService（序列化、文字沒變不重送）── bgSync.js 的 planBgSync 決定 start／update／done／paused／stop
            ▼
nhSource.js：startBgSync／updateBgSync／stopBgSync／clearBgSyncNotice（唯一 import 外掛的地方）
            ▼
NhWebFetchPlugin.java ─▶ SyncService.java（前景服務 dataSync＋通知＋WakeLock）
            ▲
            └── 使用者按通知的「停止」、6 小時到期、進不了前景狀態 ─▶ 事件 bgSyncStopped
```

- **服務只保活與顯示通知**，不做網路、不碰資料庫；抓資料仍是 JS 的佇列與兩條節流隊伍（速度不變）。
- **前景服務只能在 App 於前景時啟動**（Android 12 起背景不能啟動前景服務）：`planBgSync` 只在 `active` 時回 `start`。所以開關開著、有東西在抓時，App 開在畫面上也會有通知。
- 切到背景：服務在跑就不停佇列；否則 `stopQueue()`（和以前一樣）。背景中服務停了（抓完、要使用者處理、按停止、6 小時到期）就一併停佇列。
- 背景中遇到 Cloudflare 驗證或寫檔／空間／資料庫錯誤：停服務，留一則可滑掉的「同步已暫停，請開啟 App 查看」通知，回到 App 時清掉。
- 通知的「停止」只停這一次（不改設定）：到下次「切到背景再回前景」前不自動重開；啟動失敗、6 小時到期也一樣。
- 背景時網頁的 `setTimeout` 可能被放慢：節流等待（`nhSource.js` 的 `sleep`）在原生平台且網頁不在畫面上時改用外掛的 `delay`（原生計時，`pickSleep` 決定），失敗就退回 `setTimeout`。30 秒以上的重試計時維持 `setTimeout`。
- 權限（都宣告在外掛 manifest）：`FOREGROUND_SERVICE`、`FOREGROUND_SERVICE_DATA_SYNC`、`POST_NOTIFICATIONS`（Android 13 起會跳視窗，不允許就不能開）、`WAKE_LOCK`。通知權限被收回時開關保持原樣、視同未啟用，設定頁顯示紅字。
- Android 15 起 `dataSync` 每 24 小時最多約 6 小時（`onTimeout` 時立刻停）；部分品牌的省電機制仍可能砍掉 App，下次開 App 會從資料庫接著抓。
- App 在背景、背景下載沒在跑時收到直接收藏：只寫進資料庫、不連網，回到前景才開始抓並補顯示「已加入剛才分享的 N 本」。

## 從瀏覽器「分享」加入（兩種模式）

分享選單只有**一個** NH Shelfie 入口：外掛 manifest（`plugins/nh-webfetch/android/src/main/AndroidManifest.xml`）宣告的無畫面 `ShareReceiverActivity`（`Theme.NoDisplay`、`excludeFromRecents`、`noHistory`、空的 `taskAffinity`），依設定 `share_mode` 決定行為。[`scripts/patch-android.mjs`](../scripts/patch-android.mjs) **不再**把 intent-filter 加到 `MainActivity`，並移除舊版加的那段（否則會出現兩個入口）；`MainActivity` 維持 `launchMode="singleTask"`。

```
瀏覽器分享（ACTION_SEND text/plain）
  ▼
ShareReceiverActivity（處理完立刻 finish；不碰 SQLite、不連網）
  ├─ mode = open（預設）→ 轉給 MainActivity → 外掛 captureShare → 新增頁填入 ID
  └─ mode = quick（直接收藏）
       1. extractId 取 nhentai 網址裡的 ID（取不到 → Toast「非 nhentai 書籍」）
       2. 在「已收藏 ID 快照」或收件匣裡 → Toast「重複收藏 #id」（什麼都不改）
       3. 否則寫進收件匣 → Toast「成功收藏 #id」；App 還活著就發 quickShareReceived
  ▼
App 啟動／回到前景／收到事件 → library.drainQuickShares（JS）
  peek → planQuickShareDrain → 還沒收藏的以「先存、後查」寫入（meta_pending、加入時間＝分享當下、
  資料夾＝share_auto_folders）→ 寫完才 ack → 背景佇列補書名與封面
```

- **原生端不碰 SQLite**：同一個行程用 Android 內建 SQLite 再開同一個檔案會讓檔案鎖失效、有毀損風險。收件匣與設定存在 `QuickShareStore`（SharedPreferences `nh_quick_share`，同一把鎖、`commit()`）：`mode`、`hosts`、`ids`（已收藏 ID 快照）、四句提示文字（目前介面語言，JS 推過去；Java 另有英文備援）、`inbox`（`[{id, at}]`，最多 1000 筆）。
- 外掛方法（只有 `nhSource.js` 呼叫）：`setQuickShareConfig`、`peekQuickShares`（只讀）、`ackQuickShares`（移除）、事件 `quickShareReceived`。先 peek、寫完資料庫才 ack，中途當掉最多重做一次，而重做是安全的（已收藏就跳過）。
- 快照與提示文字由 `library.pushQuickShareConfig` 整份重推：啟動、新增／刪除書、改 ID、CSV 匯入、處理收件匣之後、切換分享模式或語言時。快照可能慢一步，最壞只是提示不準一次；真正寫入時 JS 會再查資料庫，已收藏的書完全不動。CSV 匯出前也會先處理收件匣。
- ID 規則：直接收藏只認 nhentai 網址（`https://nhentai.net/g/數字/`，含子網域；開發者模式改過「開啟網頁」端點時也認那個網域，`shareHosts`），純數字與 `#123456` 不算。規則在 `parse.js` 的 `extractNhGalleryId` 與 `QuickShareStore.java` 的 `extractId` 各一份，要同步。「開 App 選資料夾」模式沿用 `extractGalleryId`（`/g/{id}`、`#123456` 或整段數字，取第一個）。
- 自動加入的資料夾（`share_auto_folders`，純函式 `resolveAutoFolders`）：空字串＝還沒設定＝只有「未讀」；`'[]'`＝都不加；以**打開 App 處理當下**的設定為準。
- App 在背景時收到的直接收藏：只寫進資料庫（純本機），書名與封面等回到 App 才補；背景下載正在跑時則直接排進去一起抓。提示「已加入剛才分享的 N 本」在回到前景時一次顯示。

## 搜尋與篩選（schema v3）

- 三個條件的組合：`標籤` **且** `資料夾` **且** `文字`。標籤與資料夾各有一個「篩選方式」（`filter.js` 的 `FILTER_MODES`）：`exclude`（排除＝所選的一個都沒有）、`any`（包含任一）、`all`（全部符合）；標籤預設 `all`、資料夾預設 `any`（＝加入篩選方式之前的行為）。資料夾的「未分類」當成一個條件一起算（例：「全部符合」＋未分類＋未讀＝沒有自建資料夾且在未讀裡）；標籤「排除」會包含還沒補完資料、沒有標籤的書。沒有勾選時篩選方式不產生條件。WHERE 由 [`filter.js`](../src/services/filter.js)（純函式）的 `buildFilterWhere` 組出、全部參數化，`library.listBooks` 執行；列表查詢不 SELECT `book_raw`。
- 文字搜尋比對 `books.title`（pretty）、`title_ja`、`title_en`、`note` 與 ID，`LIKE ? ESCAPE '\'`，使用者輸入的 `%`、`_`、`\` 會跳脫。
- 標籤存在 `tags(id, type, name)`＋`book_tags(gallery_id, tag_id)`，存全部 7 種類型（tag、artist、group、parody、character、language、category），介面只顯示 tag／artist／group 且本數 > 0 的。解析在 `parse.js` 的 `parseSearchFields`（api-v1／api-v2 都支援，欄位缺少不崩潰）。
- 新書：meta 工作者寫書名與 `book_raw` 的同一個交易裡一併寫 `title_en`、`tags`、`book_tags`。
- 舊資料：遷移只建表；啟動後由 `library.backfillTags` 從 `book_raw` 本地分批（每批 100 本）回填，不上網，完成後記 `tags_backfilled = 1`。
- 標籤選項清單沒有數量上限（已勾選的排最上面，其他依本數多到少）；為了不卡，`TagFilter` 先畫 200 筆，捲到接近底部再多畫 200 筆，打字換關鍵字時回到第一批。
- 重開 App 後只保留資料夾篩選與它的篩選方式（設定鍵 `folder_filter`、`folder_filter_mode`），文字、標籤與標籤的篩選方式每次回到預設。「清除全部篩選」會把兩個篩選方式都還原成預設；清單／選單裡的「全部清除」只取消勾選。
- 篩選方式不是預設且有勾選時，收合的輸入框與資料夾按鈕會標出來（例：「排除：已選 2 個」「排除：未讀」）。資料夾篩選方式為「排除」時，`currentFolder` 為 null（列出的書都不在那個資料夾，所以沒有「從此資料夾移除」），按鈕上也不顯示本數。
- 選篩選方式的元件是 [`ModePicker.vue`](../src/components/ModePicker.vue)（小按鈕＋下拉選單，不用原生 `<select>`：標籤清單為了不收鍵盤會擋掉 mousedown，原生選單可能打不開），標籤清單與資料夾選單（`actionSheet` 的 `multi.mode`）共用；選單裡預設的那一項後面標「（預設）」（`defaultMode`）。

## 標籤翻譯（中文＋日文）

只影響收藏頁的標籤篩選（`TagFilter` 顯示 `label || name`）。開關 `tag_translate` 預設關閉、中日共用。設定 `tag_show_original`（附註原文，預設關閉）開啟時，有翻譯的標籤會在翻譯名稱旁以灰色小字顯示原文（只是顯示，不影響查詢；沒開顯示翻譯時這個開關不能切換）。介面語言 `zh-TW` 顯示 `zh_tw`、`zh-CN` 顯示 `zh_cn`、`ja` 顯示日文、English 或開關關閉顯示原文；沒有翻譯的顯示原文；打原文或翻譯都搜得到（`filterTagOptions`）。

| | 中文 | 日文 |
| --- | --- | --- |
| dataset | `'zh'` | `'ja'` |
| 介面語言 | `zh-TW`、`zh-CN` | `ja` |
| 來源 | [EhTagTranslation/Database](https://github.com/EhTagTranslation/Database)（CC BY-NC-SA 3.0） | [EhPanda Tag Database](https://github.com/EhPanda-Team/ehpanda-tag-database)（標籤清單 CC BY-NC-SA 3.0；日文譯名 e-hentaidb.com CC BY 4.0） |
| 版本檔 | `sha`（40 位） | `sources.json` 的 `datasets.ja.sha256`（64 位） |
| 資料檔 | `db.text.json.gz`（WebView 沒有 `DecompressionStream` 時退回 `db.text.json`） | `ja.json`（沒有壓縮版，約 1.6 MB） |
| 資料表 | `tag_translations(type, name, zh_cn, zh_tw)` | `tag_translations_ja(type, name, ja)` |
| 設定鍵 | `tagtr_sha`／`tagtr_count`／`tagtr_updated_at`／`tagtr_checked_at` | `tagtr_ja_sha`／`tagtr_ja_count`／`tagtr_ja_updated_at`／`tagtr_ja_checked_at` |
| 簡轉繁 | opencc-js `cn → twp`（`zhConvert.js` 動態載入；含假名的名稱不轉） | 不需要 |

- **對應規則**（`parseTagDb`，兩份共用）：nhentai `artist` ← `artist`、`group` ← `group`、`tag` ← 依序 `mixed` → `female` → `male` → `other` → `location`（先找到的為準）；其他 namespace（含日文的 `temp`）不存。key `trim().toLowerCase()`；名稱空白、超過 100 字或和原文相同的略過。只存名稱，不存 `intro`／`links`。
- **只處理目前介面語言那一份**：服務層不 import i18n，`App.vue` 在 `initLibrary()` 之後與切換語言時呼叫 `library.setTagLang(lang)`；英文介面不下載。切換語言時若開關開啟就依新語言檢查一次；另一份已下載的資料保留不刪。
- **更新流程**（`library.updateTagTranslations`）：觸發＝啟動、回到前景、打開開關、切換語言、「立即更新」。前幾種需「開關開啟」且「距上次檢查滿 24 小時或資料是空的」；失敗後 1 小時內不重試（兩份各記各的）。同一份共用一個 Promise，不同份排隊跑。先取版本檔，和設定裡的版本相同就只更新 `*_checked_at`；不同（或取不到）就下載 → `JSON.parse` → `parseTagDb` → 少於 `MIN_TAGDB_ROWS`（1,000）筆就丟 `TAGDB_FAILED` → 一個交易：`DELETE` 全表＋分批 `INSERT`（中文 4 欄×200 筆、日文 3 欄×300 筆，參數不超過 999）＋四個設定鍵 → 刪暫存檔 → `bump()`。任何失敗都保留舊資料，設定頁顯示「更新失敗，之後會自動重試」。
- **查詢**：`listTagOptions(lang)` 以 `translationSource(lang)` 的**寫死對照表**取表名與欄位名後 `LEFT JOIN`，不把語言字串拼進 SQL。
- **網路**：[`tagDbSource.js`](../src/services/tagDbSource.js) 是唯一對 GitHub 發請求的地方，只准兩個寫死的網址開頭（`https://github.com/EhTagTranslation/Database/releases/latest/download/`、`https://github.com/EhPanda-Team/ehpanda-tag-database/releases/latest/download/`），一律原生 HTTP（`CapacitorHttp`／`Filesystem.downloadFile`），不可用 `fetch()`、不放寬 CSP；轉址只跟隨 `github.com` 與 `*.githubusercontent.com`（原生沒自動跟隨時手動跟，最多 3 次）。暫存在快取目錄 `tagdb/`（在 `TEMP_DIRS` 內）。不送出任何使用者資料。
- 日文來源是 2026-11 才建立的新儲存庫，若改格式或下架，日文翻譯會停止更新（已下載的仍可用）。日文介面不拿中文資料裡的日文原名補缺。

## 實作重點

- **轉接層**：所有對站方的請求與解析集中在 [`src/services/nhSource.js`](../src/services/nhSource.js)，對內只輸出固定的 BookMeta；端點範本存在 settings，可在設定頁修改。舊 API（`raw_format = api-v1`）的已存資料仍可解析。
- **原生網路**：下載封面前一定先建立目標資料夾（`downloadFile` 不會自己建立）；詳情先走 `CapacitorHttp`（帶 `NH-Shelfie/<版本> (+https://github.com/anson669989/NH-Shelfie)` User-Agent）；被 Cloudflare 擋下時改用本地外掛 [`plugins/nh-webfetch`](../plugins/nh-webfetch) 的獨立 WebView（不接 Capacitor bridge，回傳通道只對 `https://nhentai.net` 開放）在站方頁面內抓 API。封面用 `Filesystem.downloadFile` 原生下載到快取目錄（不經 base64 橋接），成功後搬進 `covers/`。
- **不留半套資料**：新書與資料夾關聯一個交易寫入；詳情與 `book_raw` 一個交易寫入；封面先存檔再更新資料庫，失敗或書已被刪就刪檔。啟動時清掉孤兒封面檔。
- **資料模型**：SQLite（`books`、`book_raw`、`folders`、`folder_separators`、`book_folders`、`tags`、`book_tags`、`tag_translations`、`tag_translations_ja`、`settings`、`fetch_log`），`raw_json` 獨立存放並以 `raw_format` 標版本，可直接本地解析、不必重抓。schema 以 `PRAGMA user_version` 逐版遷移，遷移前自動備份。v2 新增 `books.queue_seq` 與新的 `fetch_status` 值（`meta_pending`、`cover_pending`、`not_found`、`meta_failed`），舊的 `pending` 自動轉換。v3 新增 `tags`、`book_tags`（`tag_id` 索引）與 `books.title_en`；刪除書時一併刪 `book_tags`。v4 新增 `folders.kind`（`user`／`unread`／`fav`，並插入兩列系統資料夾，`name` 是佔位字串 `::nhs-unread::`／`::nhs-fav::`，顯示一律經 `folderLabel`）、`folder_separators`（分隔線，和使用者資料夾共用 `sort_order`）與 `tag_translations`；v5 新增 `tag_translations_ja`。「未分類」＝沒有加入任何 `kind = 'user'` 的資料夾（未讀、典藏不算）。備註存在 `books.note`（⋮ 選單編輯，單行、不限長度），資料夾與分隔線的順序存在各自的 `sort_order`（`reorderFolderItems`：拖曳放開時一個交易全部更新，失敗回滾並還原畫面）。
- **開啟網頁**：設定 `open_mode`：`external`（預設，本地外掛 `nh-webfetch` 的 `openExternal`，Java 端再檢查 https＋nhentai 網域）或 `custom_tab`。預設外部瀏覽器，是因為 MainActivity 是 `singleTask`，從 Custom Tab 分享回 App 時會把 Custom Tab 清掉。開不起來就複製連結。
- **安全**：所有外部文字一律純文字渲染（不使用 `v-html`）；CSP 只允許自身腳本與本機圖片；只允許 HTTPS、請求只送往白名單網域——對外連線只有 nhentai（`nhSource.js`）與 GitHub 的兩個標籤翻譯儲存庫（`tagDbSource.js`，只在開啟標籤翻譯時），CSP `connect-src 'self'`、網路一律走原生 HTTP；ID 先轉整數再套範本，封面網址只接受 `*.nhentai.net` 的 CDN 伺服器與符合格式的 `cover.path`；封面以檔頭驗證 JPG／PNG／WebP、上限 5 MB；全部參數化查詢；CSV 匯出防公式注入；快速分享與背景下載的原生端不碰 SQLite；權限只有 `INTERNET` 與背景下載用的四個（`FOREGROUND_SERVICE`、`FOREGROUND_SERVICE_DATA_SYNC`、`POST_NOTIFICATIONS`、`WAKE_LOCK`，宣告在外掛 manifest）；關閉 `allowBackup`；封面目錄放 `.nomedia`。
- **Android 細節**：safe-area insets 處理 Android 15 edge-to-edge；返回鍵順序：關彈窗 → 收合標籤清單／退出多選 → 回資料夾頁 → 再按一次才離開。
- **語言**：字串在 [`src/locales.js`](../src/locales.js)（繁中／简中／English／日本語），`tests/locales.test.js` 檢查四語鍵一致；手機語言 zh-CN／zh-Hans／zh-SG 自動用简中，zh-TW／zh-HK／zh-Hant 用繁中。

## 已知限制

- 依賴站方 API v2：站方改格式或改限制時，書會顯示「資料讀取失敗」，需要更新 App（或在開發者模式改端點）。
- 匿名每分鐘 20 次的限制下，大量加入或 CSV 匯入後補資料比較慢（每本約 3 秒；封面另走圖片隊伍）。
- 站方若開啟 Cloudflare 驗證，需要在 App 內手動完成一次驗證畫面。
- 背景佇列預設只在前景執行；要在背景繼續須開啟「背景下載」（需要通知權限，每天最多約 6 小時，部分品牌的省電機制仍可能中斷）。
- 還在「待補資料」的書沒有標籤，補完資料後才搜得到；升級到 v3 後，舊資料的標籤在啟動後數秒內回填完成前，選項可能不完整。
- 直接收藏的書：App 完全關閉時要等下次打開才寫進資料庫；App 在背景時會先寫進資料庫，但沒開背景下載就要回到 App 才補書名與封面。
- 標籤翻譯依賴兩個外部儲存庫；日文來源很新，可能改格式或下架。純漢字的日文作者名會被簡轉繁成繁體字（無法區分）。
- CSV：資料夾名稱含 `|` 時，匯出再匯入會被拆成兩個資料夾；主題、媽媽模式、標籤翻譯開關不在備份範圍。
- 沒有桌面預覽：資料庫與檔案功能只在 Android 上運作。

## 尚未包含（依里程碑之後再做）

- （已取消）M4 詳情頁與標籤顯示：點封面一律直接開網頁，備註改在 ⋮ 單本選單編輯；標籤只做搜尋與篩選（v0.3.0 已完成）
- Cloudflare 備援方案 3（手動指定封面）
- 隱藏最近使用畫面（FLAG_SECURE）、App 開啟鎖、自動覆寫 CSV 到指定資料夾
- iOS 版

## 發佈新版本（GitHub Actions 自動建置 APK）

工作流程檔：[`.github/workflows/build-apk.yml`](../.github/workflows/build-apk.yml)

| 觸發 | 產出 |
| --- | --- |
| push 到 `main`、PR、手動執行 | 跑單元測試並建置 APK，放在該次 Actions 的 **Artifacts**（測試用） |
| push 標籤 `v*`（如 `v0.1.0`） | 建置**已簽章**的 release APK，自動建立 GitHub Release 並附上 `nh-shelfie.apk` |

### 1. 設定簽章金鑰（只需做一次）

Android 只允許「同一把金鑰簽章」的 APK 覆蓋更新，所以發佈前必須準備一把固定的金鑰。

```bash
# 產生金鑰（需安裝 JDK；依提示設定密碼）
keytool -genkeypair -v -keystore release.jks -alias nhcollection \
  -keyalg RSA -keysize 2048 -validity 10000

# 轉成 base64（macOS 用 base64 -i release.jks | pbcopy）
base64 -w0 release.jks > release.jks.b64
```

到 GitHub 儲存庫 **Settings → Secrets and variables → Actions → New repository secret** 新增四個 secrets：

| 名稱 | 內容 |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `release.jks.b64` 的內容 |
| `ANDROID_KEYSTORE_PASSWORD` | keystore 密碼 |
| `ANDROID_KEY_ALIAS` | `nhcollection`（或你設定的 alias） |
| `ANDROID_KEY_PASSWORD` | key 密碼（未另外設定時與 keystore 密碼相同） |

> 🔐 `release.jks` 與密碼請另外備份（例如密碼管理器）。**遺失就無法覆蓋更新**，使用者只能解除安裝（資料會一起刪除）。不要把它 commit 進 repo（`.gitignore` 已排除）。
> 沒有設定 secrets 時，推送到 `main` 仍會產出 debug APK；推送 `v*` 標籤則會直接失敗並提示你設定金鑰。

### 2. 發佈

```bash
# 修改 package.json 的 version（選用），然後：
git tag v0.1.0
git push origin v0.1.0
```

約 5–8 分鐘後，Releases 頁就會出現新版本，README 頂端的下載連結（releases/latest）會自動指向它。版本名稱取自標籤（`v0.1.0` → `0.1.0`），`versionCode` 取自 Actions 的執行編號，所以每次發佈都會遞增。

## 本機開發

需求：Node.js 20+、JDK 21、Android Studio（含 Android SDK）。

```bash
npm install
npm test                 # 單元測試（ID 解析、加入判斷、站方回應解析、標籤解析與篩選、CSV、資料夾排序、快速分享、標籤翻譯與下載、背景下載的啟停判斷、四語鍵一致、封面下載流程）
npm run android:prepare  # 建置網頁 → 產生 android/ → 套用設定 → 同步
npm run android:open     # 用 Android Studio 開啟，接手機執行
```

- `android/` 資料夾不進版控，由 `npx cap add android` 產生後，再用 [`scripts/patch-android.mjs`](../scripts/patch-android.mjs) 套上關閉備份、禁止明文傳輸、CI 版本號與簽章等設定。
- SQLite 外掛只在 Android 上運作，`npm run dev` 在桌面瀏覽器開啟時會初始化失敗，屬正常現象；介面除錯請用實機＋`chrome://inspect`（需把 `capacitor.config.json` 的 `webContentsDebuggingEnabled` 暫時改成 `true`）。
- 第一次 `npm install` 後建議把 `package-lock.json` 一併 commit，CI 會改用 `npm ci` 鎖定外掛版本。

## 專案結構

```
.github/workflows/build-apk.yml  建置與發佈 APK
scripts/patch-android.mjs        對產生的 Android 專案套用設定
plugins/nh-webfetch/             本地 Capacitor 外掛（Java）：WebView 驗證抓取、接收分享（ShareReceiverActivity、
                                 QuickShareStore 收件匣）、以系統瀏覽器開網頁、鍵盤高度、
                                 背景下載（SyncService 前景服務＋通知、通知權限、原生計時 delay）
capacitor.config.json            App ID、名稱、外掛設定
index.html                       含 CSP
src/
  App.vue                        底部三格導覽、返回鍵、前景／背景切換（setAppActive）、接收分享、處理快速分享收件匣、
                                 傳介面語言與通知文字給服務層
  viewport.js                    鍵盤高度 → CSS 變數（對話框浮到鍵盤上方）
  components/
    FoldersPage.vue              資料夾頁（搜尋與篩選、多選模式、⋮ 單本選單）
    TagFilter.vue                標籤／作者／社團篩選（可打字的輸入框＋勾選清單）
    ModePicker.vue               「篩選方式」按鈕與下拉選單（排除／包含任一／全部符合；標籤與資料夾篩選共用）
    helpText.js                  使用說明文字（# 主題、## 粗體小標、- 條列）→ 主題／小標／條列（純函式）
    CoverGrid.vue                虛擬捲動封面牆（書名、備註、⋮、選取標記、媽媽模式）
    bookActions.js               ⋮ 單本選單、即時儲存的分類、開網頁（資料夾頁、最近加入共用）
    folderRows.js                資料夾顯示名稱與所有資料夾清單的列（純函式）
    folderManager.js             管理資料夾、資料夾／分隔線的改名與刪除（設定頁與收藏頁共用）
    viewOptions.js               顯示備註／媽媽模式（純函式）
    dragSort.js                  資料夾拖曳排序（Pointer Events）
    AddPage.vue                  新增頁（先存、後查、最近加入）
    QueueBanner.vue              背景佇列提示（429、網路、驗證、錯誤）
    bookStatus.js                書的狀態 → 佔位圖文字
    SettingsPage.vue             設定頁
    DialogHost.vue               對話框／選單／提示
  services/                      服務層（唯一碰資料庫、檔案與網路的地方）
    nhSource.js                  站方轉接層：請求、兩條節流隊伍、解析、封面下載、分享文字；唯一 import nh-webfetch
    tagDbSource.js               標籤翻譯資料下載（唯一對 GitHub 發請求的地方）
    library.js                   書籍／資料夾／分隔線／背景佇列／背景下載服務的啟停／快速分享收件匣／標籤翻譯更新／CSV／健康檢查
    db.js                        SQLite 連線與 schema 遷移
    settings.js                  設定鍵值與預設端點
    parse.js / csv.js / errors.js / addPlan.js / filter.js / settingsMigration.js /
    folderOrder.js / quickShare.js / tagTranslation.js / bgSync.js   純函式（可單元測試）
    zhConvert.js                 簡 → 繁（opencc-js，動態載入）
  locales.js                     繁中／简中／英／日字串（純資料）
  i18n.js                        t()／errText()／語言偵測
tests/                           Vitest 單元測試
docs/tasks/                      任務文件（目前：2026-11-update.md、2026-11-background-download.md；archive/ 是已完成的舊任務，只供參考）
```

## 用 Claude Code 維護

專案已附 [`CLAUDE.md`](../CLAUDE.md)（架構與必守規則）與 `.claude/settings.json`。環境準備、操作流程與提示詞範例見 [`docs/claude-code-guide.md`](claude-code-guide.md)。

## 安裝與更新（技術細節）

1. 用手機開啟 README 的「下載最新版 APK」連結（Releases 頁的 `nh-shelfie.apk`）。
2. 開啟下載的檔案；第一次安裝時 Android 會要求允許「安裝不明應用程式」，請對瀏覽器或檔案管理員開啟此權限。
3. Play Protect 可能顯示「未知的應用程式」警告，選「仍要安裝」。
4. **更新**：下載新版 APK 直接覆蓋安裝即可，資料會保留。所有版本都以同一把金鑰簽章；若出現「套件與現有套件衝突」，代表簽章不同，請勿解除安裝舊版（會連資料一起刪除），先到設定匯出 CSV。

系統需求：Android 6.0（API 23）以上。


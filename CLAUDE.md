# NH Shelfie

Capacitor + Vue 3 的 Android App：輸入 gallery ID，背景抓書名與封面存本機，以資料夾分類。不經任何自建伺服器。README.md／README.en.md 是給使用者看的介紹；技術設計見 `docs/DEVELOPMENT.md`；本檔只記改程式時必須知道的事。

## 回報方式

- 一律用繁體中文、白話說明，使用者不是工程師
- 先講結論與需要使用者決定的事，再講細節
- 不要貼整段程式碼，只說改了哪些檔案、為什麼
- 需要使用者在手機上測試時，列出具體步驟

## 指令

- `npm install`：安裝依賴（首次後請 commit package-lock.json）
- `npm test`：Vitest 單元測試（改 parse.js / csv.js / addPlan.js / filter.js / folderOrder.js / quickShare.js / tagTranslation.js / tagDbSource.js / bgSync.js / locales.js / 解析邏輯後必跑）
- `npm run build`：建置網頁到 dist/
- `npm run android:prepare`：build → 產生 android/ → 套用 patch → cap sync
- 驗證 APK：推到 GitHub 由 Actions 建置（`.github/workflows/build-apk.yml`），本機不一定有 Android SDK

## 架構（三層，禁止跨層）

- `src/components/*.vue`：介面層，只呼叫服務層，不直接碰 DB、檔案、網路
- `src/components/bookActions.js`：「⋮」單本選單（含備註）與開網頁，資料夾頁與新增頁「最近加入」共用，不要各複製一份；`viewOptions.js`（純函式）算顯示備註／媽媽模式
- `src/components/TagFilter.vue`：收藏頁標籤／作者／社團篩選（可打字＋勾選清單、右上角「全部清除」，顯示 `label || name`＝有翻譯就顯示翻譯；設定 `tag_show_original` 開啟時翻譯旁以灰色小字附註原文）；資料夾篩選用 `actionSheet` 的 `multi` 模式（勾選不關選單、標題列右邊「全部清除」）
- `src/components/ModePicker.vue`：「篩選方式」小按鈕＋下拉選單（排除／包含任一／全部符合），標籤清單（`TagFilter`）與資料夾篩選選單（`actionSheet` 的 `multi.mode`）共用，不要各寫一份
- `src/components/helpText.js`（純函式，有單元測試）：把 `locales.js` 的 `help`（純文字：`# 主題`、`- 條列`）解析成主題＋條列，由 `ui.js` 的 `helpDialog` 顯示（設定頁最上方的「使用說明」）；改說明內容只改 `locales.js` 四種語言，主題數與每個主題的條數要一致（`tests/help-text.test.js` 會檢查）
- `src/components/folderRows.js`（純函式）：資料夾顯示名稱 `folderLabel`、書的資料夾文字 `bookFolderLabels`、所有資料夾清單的列 `buildFolderRows`（含系統資料夾、分隔線、拖曳／⋯）；**所有列出資料夾的地方都用它**
- `src/components/folderManager.js`：「管理資料夾」畫面（`openFolderManager`）與資料夾／分隔線的改名、刪除選單（`openFolderItemMenu`），設定頁與收藏頁資料夾篩選共用，不要各寫一份
- `src/services/library.js`：服務層入口，唯一碰 SQLite 與檔案的地方；背景佇列（meta／cover 兩個工作者）、快速分享收件匣（`drainQuickShares`／`pushQuickShareConfig`）、標籤翻譯更新（`updateTagTranslations`）、背景下載服務的啟停（`syncBgService`／`setAppActive`／`setBgSyncEnabled`／`nudgeQueue`）也在這裡。服務層不 import i18n：語言與提示文字由介面傳入（`setTagLang`、`setShareLabels`、`setBgSyncLabels`）
- `src/services/nhSource.js`：**唯一**對 nhentai 發請求與解析的地方；站方改版只改這裡；也是唯一 import `nh-webfetch` 的地方（含接收分享的 `takeSharedText`／`onShareReceived`、快速分享的 `setQuickShareConfig`／`peekQuickShares`／`ackQuickShares`／`onQuickShareReceived`、鍵盤高度 `onKeyboardOverlap`）。使用 **API v2**（`/api/v2/galleries/{id}`、`/api/v2/cdn`，規格摘要見 `docs/tasks/archive/004-api-v2.md` 第 5 節）；舊 `/api/gallery/{id}` 已停用
- `src/services/tagDbSource.js`：**唯一**對 GitHub 發請求的地方（標籤翻譯資料下載，中文 `'zh'`／日文 `'ja'` 兩份），不經 nhSource 的隊伍
- `plugins/nh-webfetch/`：本地 Capacitor 外掛（Java），獨立隱藏 WebView 過 Cloudflare 後抓 API、驗證畫面、清 cookie；**nh-webfetch 也負責接收分享**：分享入口是外掛 manifest 宣告的無畫面 `ShareReceiverActivity`（ACTION_SEND，依設定轉給 MainActivity 或直接收藏），快速分享的設定與收件匣存在 `QuickShareStore`（SharedPreferences `nh_quick_share`）；另有 `openExternal`（以系統瀏覽器開網頁，Java 端再檢查 https＋nhentai 網域；JS 由 nhSource 的 `openInBrowser` 呼叫，依設定 `open_mode` 選外部瀏覽器或 Custom Tab）與鍵盤高度事件 `keyboardOverlap`（給 `src/viewport.js`）；**背景下載**：前景服務 `SyncService`（`dataSync`＋進度通知＋有逾時的 WakeLock，通知不放書名／封面／ID、鎖定畫面不顯示）、通知權限（`getNotificationPermission`／`requestNotificationPermission`）、`startBgSync`／`updateBgSync`／`stopBgSync`／`clearBgSyncNotice`、事件 `bgSyncStopped`（`user`／`timeout`／`failed`），以及原生計時 `delay`（App 在背景時節流等待用，由 nhSource 的 `sleep` 依 `pickSleep` 選用）；`cap sync` 自動納入，不需改 android/
- `src/services/parse.js`、`csv.js`、`errors.js`、`settingsMigration.js`、`addPlan.js`、`filter.js`、`folderOrder.js`、`quickShare.js`、`tagTranslation.js`、`bgSync.js`：純函式，無 I/O，必須有單元測試（`bgSync.js`＝背景下載服務的啟停判斷 `planBgSync`、預估分鐘數 `estimateSyncMinutes`、通知文字 `fillCount`、計時方式 `pickSleep`；`filter.js`＝搜尋／篩選：資料夾多選規則、篩選方式 `FILTER_MODES`、標籤選項排序、參數化 WHERE 組裝；`folderOrder.js`＝資料夾與分隔線的合併與重排；`quickShare.js`＝快速分享的自動加入資料夾與收件匣處理；`tagTranslation.js`＝翻譯資料解析、版本判斷、批次 INSERT 語句、語言 → 資料表對照）
- `src/services/zhConvert.js`：簡 → 繁（opencc-js `cn → twp`），**動態 import**，只在更新中文翻譯時載入
- `src/services/db.js`：連線與 schema 遷移
- `src/locales.js`：所有介面字串（繁中 zh-TW / 简中 zh-CN / English / 日本語）四份同步，純資料（`tests/locales.test.js` 檢查四語鍵一致）；`src/i18n.js` 只放 `t()`、`errText()` 與語言偵測
- `scripts/patch-android.mjs`：對 `cap add android` 產生的專案套設定（含 App 圖示、`adjustResize`；**不再**把分享 intent-filter 加到 MainActivity，並移除舊版加的那段，否則分享選單會出現兩個 NH Shelfie）；android/ 不進版控
- `scripts/gen-icons.mjs`：產生 App 圖示（紅底白書，只用 Node 內建模組）；要改圖示就改這裡（README 用的 `docs/images/icon.png` 也由它產生）

## 必守規則

1. **錯誤統一用錯誤碼**：服務層丟 `AppError(E.XXX)`，介面只用 `errText(err)` 顯示；新增錯誤碼要同時改 errors.js 和 locales.js 四種語言的 `err.XXX`
2. **不留半套資料**（「先存、後查」）：新書＋資料夾關聯一個交易寫入（`fetch_status = meta_pending`，沒有 book_raw 是正常狀態）；詳情與 book_raw 一個交易寫入；封面先存檔再更新資料庫，失敗或書已被刪就刪檔
3. **SQL 一律參數化**，不拼字串；列表查詢不可 SELECT book_raw（單本讀取可以，例如 ⋮ 選單的完整標題）
4. **外部文字一律純文字渲染**：禁用 v-html；CSP 在 index.html，改圖片來源要同步改 CSP
5. **只准 HTTPS 與白名單網域**；組網址只用整數 ID 套範本（`fillTemplate`）。例外一是封面：網址＝`/api/v2/cdn` 回傳且通過 `normalizeCdnServer` 的伺服器（https、`*.nhentai.net`）＋通過 `parseCoverPath` 正則的 `cover.path`，只能經 `buildCdnUrl` 組成；path 原樣使用，不可猜副檔名（站方會封鎖）。例外二是 GitHub 的標籤翻譯資料：只准**兩個寫死的網址開頭**——`https://github.com/EhTagTranslation/Database/releases/latest/download/`（中文）與 `https://github.com/EhPanda-Team/ehpanda-tag-database/releases/latest/download/`（日文），只能經 `tagDbSource.js`（`assertTagDbUrl` 檢查）；不可用 `fetch()`、不可放寬 CSP；轉址只跟隨 `github.com` 與 `*.githubusercontent.com`
6. **所有站方請求經 nhSource 的兩條節流隊伍**（`makeLane`），不可繞過：
   - **API 隊伍**（`schedule()`＝`apiLane.run`）：詳情、`/api/v2/cdn`、驗證畫面；同時 1 個、間隔 ≥ 3 秒（v2 詳情匿名上限 20 次／分鐘）
   - **圖片隊伍**（`imgLane.run`）：t1–t4 封面；同時 1 個、間隔 ≥ 1 秒（`/api/v2/docs` 對 CDN 沒有明文次數，只說持續高速會被暫時封鎖、429 當退避訊號，所以採保守 1 秒）
   - 兩條隊伍互不卡住；收到 429 只暫停該隊伍（`lane.block`），背景佇列自動退避重試、畫面顯示「請求太頻繁，稍後自動重試」，不算失敗
   - 不可在某條隊伍的工作內再呼叫會排進**同一條**隊伍的函式（會互等卡死；例：`downloadCover` 在進圖片隊伍前先呼叫 `getThumbServers`）
7. **schema 變更只能在 `MIGRATIONS` 陣列尾端新增版本**，不改舊版本（目前到 **v5**：v4＝系統資料夾 `folders.kind`／分隔線 `folder_separators`／中文翻譯表 `tag_translations`，v5＝日文翻譯表 `tag_translations_ja`；push 並裝到手機就視同已發佈）
8. **新增 UI 字串四種語言（zh-TW / zh-CN / en / ja）都要補**；新增設定鍵要加進 settings.js 的 `DEFAULTS`
9. 不新增 Capacitor 外掛（例外：repo 內的本地外掛 `nh-webfetch`）、不加廣告或分析 SDK。Android 權限只有 `INTERNET`＋背景下載用的四個：`FOREGROUND_SERVICE`、`FOREGROUND_SERVICE_DATA_SYNC`、`POST_NOTIFICATIONS`、`WAKE_LOCK`（都宣告在外掛 manifest，`cap sync` 自動合併）；不再新增其他權限
10. Cloudflare challenge 特徵字串在 `parse.js` 的 `CHALLENGE_MARKERS` 與 `NhWebFetchPlugin.java` 各一份，改一邊要同步另一邊；分享文字取 ID 的規則（直接收藏用）也一樣，在 `parse.js` 的 `extractNhGalleryId` 與 `QuickShareStore.java` 的 `extractId` 各一份，要同步
11. 底部導覽與對話框要保留 safe-area insets（Android 15 edge-to-edge）
12. **寫檔前先建立上層資料夾**：`Filesystem.downloadFile` 不會自己建立（`recursive` 無效，會丟 ENOENT）；下載用 nhSource 的 `ensureParentDir`。檔案錯誤一律歸 `WRITE_FAILED`／`STORAGE_FULL`，不可歸成 `OFFLINE`（`classifyDownloadError`）
13. **返回鍵順序**：關對話框 → `pushBackHandler` 註冊的處理（例如退出多選模式）→ 回資料夾頁 → 連按兩次離開
14. **系統資料夾**（未讀 `kind = 'unread'`、典藏 `kind = 'fav'`）在資料庫的 `name`（`::nhs-unread::`、`::nhs-fav::`）只是佔位字串，**任何畫面都不可直接顯示**，一律經 `folderLabel`；改名／刪除／排序的 SQL 都要帶 `AND kind = 'user'`。「未分類」＝沒有加入任何 `kind = 'user'` 的資料夾。分隔線在 `folder_separators`，和使用者資料夾共用 `sort_order`，以項目鍵 `f:<id>`／`s:<id>` 識別
15. **標籤翻譯有兩份資料**：中文 `tag_translations(type, name, zh_cn, zh_tw)`（設定鍵 `tagtr_*`）、日文 `tag_translations_ja(type, name, ja)`（設定鍵 `tagtr_ja_*`）；各自「整批取代」（DELETE＋分批 INSERT＋四個設定鍵在同一個交易），只更新**目前介面語言**那一份（英文不下載），解析結果少於 `MIN_TAGDB_ROWS` 筆就不寫入。查詢用的表名與欄位名只能來自 `tagTranslation.js` 的 `translationSource` 寫死對照表，不可把語言字串拼進 SQL；每句 INSERT 參數不可超過 999 個
16. **原生端不可碰 SQLite**：快速分享在 `ShareReceiverActivity` 只寫 SharedPreferences 收件匣，真正寫進資料庫一律由 JS 的 `library.drainQuickShares` 做；這個 Activity 必須在 `finally` 裡 `finish()`（`Theme.NoDisplay` 的限制），不可做網路或耗時工作。背景下載的 `SyncService` 也一樣：只保活與顯示通知，不做網路、不碰資料庫，抓資料仍是 JS 的佇列
17. **背景下載**（設定 `bg_sync`，預設 `'0'`、不列入 CSV 備份）：佇列預設只在前景執行；`bg_sync` 開啟（且有通知權限）且前景服務正在跑時，背景也繼續。**前景服務只能在 App 於前景時啟動**（Android 12 起背景啟動會丟例外）；啟停一律經 `library.syncBgService`（判斷在 `bgSync.js` 的 `planBgSync`），不可在別處直接呼叫 nhSource 的 `startBgSync`。App 在背景且服務沒在跑時不可啟動佇列（`runQueue`）或連網，只能做本機動作（例：`drainQuickShares` 寫資料庫）；要叫醒工作者用 `nudgeQueue`（服務在跑才動作）

## 加入流程：「先存、後查」

- 按「加入」（`library.quickAdd`）**完全不發網路請求**：檢查 ID 格式 → 查本機 → `planAdd()` 決定 `already`（已在所選資料夾，提示）／`addFolders`（已收藏，只補資料夾，不重抓；已收藏的書不會被重新加進「未讀」＝`planAdd` 的 `newOnly`）／`new`（寫入 `meta_pending`）。三種情況都清空輸入框。書是否存在於網站一律由背景佇列判斷
- 背景佇列就是 `books.fetch_status` ＋ `queue_seq`（加入毫秒，排隊順序），存在資料庫，App 重開後繼續；預設只在前景執行，回到前景或網路恢復自動續跑；開啟背景下載且服務在跑時背景也繼續（規則 17）
- 狀態：`meta_pending`（待補資料）→ `cover_pending`（有書名、待抓封面）→ `ok`；失敗：`not_found`（404，⋮ 可「修改 ID」）、`meta_failed`（格式不符）、`no_cover`（封面失敗）。任何狀態的書都可在 ⋮ 選單右上角的重新載入（`refreshBook`）重新查詢＋重抓封面（舊封面保留到新封面成功）
- 網路失敗（離線／逾時／被擋）留在佇列 30 秒後自動重試；需要驗證時暫停並在提示列顯示「進行驗證」；寫檔／空間／資料庫錯誤停下並顯示
- 新書預設進「未讀」（`last_folders` 首次啟動時加入未讀，`sys_seeded`）；已收藏的書不會被重新加進未讀
- 從瀏覽器分享（設定 `share_mode`）：
  - `open`（預設）：`ShareReceiverActivity` 轉給 MainActivity → 外掛 `captureShare` → 新增頁填入 ID（`extractGalleryId` 取第一個）、預選上次的資料夾，按「加入」
  - `quick`（直接收藏）：`ShareReceiverActivity` 用 `extractId` 取 ID（只認 nhentai 網址）→ 比對 JS 推過去的「已收藏 ID 快照」與收件匣 → 寫進收件匣並 Toast「成功收藏／重複收藏／非 nhentai 書籍」，畫面留在瀏覽器。App 啟動、回到前景或收到 `quickShareReceived` 時，`drainQuickShares` 先 peek → 還沒收藏的以「先存、後查」寫入（資料夾＝`share_auto_folders`，空字串＝只有未讀；加入時間＝分享當下）→ 寫完才 ack；已收藏的書完全不動
  - 快照與提示文字由 `pushQuickShareConfig` 整份重推：啟動、新增／刪除書、改 ID、CSV 匯入、處理收件匣後、切換分享模式或語言時；CSV 匯出前也會先處理收件匣

## 已知限制與待辦

### nhentai API v2 規則（站方規格，見 `docs/tasks/archive/004-api-v2.md` 第 5 節）

- 詳情 `GET /api/v2/galleries/{id}`：匿名**每分鐘 20 次**（每個 IP），所以 API 隊伍間隔 ≥ 3 秒；429 一律當退避訊號
- `/api/v2/cdn` 與封面 CDN：規格沒有明文次數；圖片隊伍間隔 ≥ 1 秒
- 請求要帶**具描述性的 User-Agent**：`NH-Shelfie/<版本> (+https://github.com/anson669989/NH-Shelfie)`
- 封面網址＝`GET /api/v2/cdn` 的 `thumb_servers` 主機＋詳情回應的 `cover.path`（原樣使用，副檔名可能是 `.jpg.webp`）；不寫死主機、不猜路徑，否則 CDN 會封鎖
- 主機順序：上次成功的主機（`cdn_last_host`）優先，其餘照 t1→t2→t3→t4；`/api/v2/cdn` 結果快取 24 小時，四台都失敗時讓快取過期、下次重新取得
- 舊 `/api/gallery/{id}` 已停用（回 403「Use new API」→ `BAD_FORMAT`）；已存的 `api-v1` 資料仍可解析
- 本 App 不使用 API 金鑰或帳號

### 任務文件

- 目前的任務：`docs/tasks/2026-11-update.md`（v0.4.0）、`docs/tasks/2026-11-background-download.md`（背景下載＋匯入時的同步提醒，併入 v0.4.0）。舊任務（001–007）在 `docs/tasks/archive/`，**只供參考，不要執行**

### 待實機驗收

- `docs/tasks/2026-11-update.md`（v0.4.0）：系統資料夾（未讀、典藏）、管理資料夾與分隔線、⋮ 單本選單改版（重新載入、即時儲存分類）、鍵盤不遮住備註、快速分享（直接收藏）、標籤翻譯（中文＋日文）、CSV v2、schema v4／v5。清單在該文件第 5 節；手機測完沒問題才推 `v0.4.0` 標籤發佈
- `docs/tasks/2026-11-background-download.md`（併入 v0.4.0）：背景下載開關與通知權限、前景服務與通知、背景計時（⚠ 背景時網頁計時器是否被放慢）、直接收藏在背景時不連網、匯入提醒。清單在該文件第 5 節
- 2026-11-15 追加（沒有任務文件，併入 v0.4.0）：使用說明移到設定頁最上方並改成條列式（點主題展開）、標籤／資料夾的「篩選方式」（排除／包含任一／全部符合）、設定「附註原文」（`tag_show_original`）。只用電腦瀏覽器看過 360 px 寬的排版，尚未在手機上測
- `docs/tasks/archive/007-search-notes-privacy.md`、`006-ui-batch.md`：已隨 v0.3.0 發佈
- `docs/tasks/archive/005-batch.md`：封面下載修正（先建資料夾）、白話錯誤訊息、清除封面快取、新圖示
- `docs/tasks/archive/002-folder-dropdown.md`：資料夾下拉選單已實作，驗收清單尚未勾選

### 標籤翻譯的資料來源

- 中文：EhTagTranslation/Database（`sha` 比對版本，`db.text.json.gz`，CC BY-NC-SA 3.0）；繁體由 opencc-js 在手機上轉換，含假名的名稱不轉
- 日文：EhPanda Tag Database（`sources.json` 的 `datasets.ja.sha256` 比對版本，`ja.json`，沒有壓縮版）。**這是 2026-11 才建立的新儲存庫**（只保留最近 7 個 release），若改格式或下架，日文翻譯會停止更新（已下載的仍可用），需另找來源
- 日文介面**不會**拿中文資料裡的日文原名（約 4,500 位作者／社團）來補日文資料沒有的名稱：要補就得讓日文使用者也下載中文資料，目前不做
- 兩份資料都不放進 repo；只取 tag／artist／group 三類，不存 `intro`／`links`

### 其他

- 已做：M1 路線 A MVP、M2 設定頁、M3 CSV、API v2、Cloudflare 備援 2（WebView 驗證抓取，現在只在原生被擋時才用）、隱藏開發者模式（關於 → 版本 連點 7 次）
- 已做（006）：先存後查＋兩條節流隊伍、多選、⋮ 選單、分享加入、简体中文；schema v2＝`books.queue_seq` 與新的 `fetch_status` 值（舊 `pending` 自動轉換）
- 已做（007）：開啟網頁方式（`open_mode`）、⋮ 選單備註、顯示備註、媽媽模式、最近加入改版、資料夾拖曳排序、收藏頁搜尋與篩選；schema v3＝`tags`／`book_tags`／`books.title_en`
- 搜尋與篩選：`標籤` 且 `資料夾` 且 `文字`（英／日標題、備註、ID）；標籤與資料夾各有「篩選方式」（`exclude` 排除／`any` 包含任一／`all` 全部符合；標籤預設 `all`、資料夾預設 `any`）。只保留資料夾篩選與它的篩選方式（設定 `folder_filter`、`folder_filter_mode`），文字、標籤與標籤的篩選方式每次開 App 回到預設；「清除全部篩選」會把兩個篩選方式都還原成預設。資料夾篩選方式為「排除」時沒有「目前資料夾」（不顯示「從此資料夾移除」）。新書的標籤在 meta 工作者寫書名的同一個交易寫入；舊資料由 `library.backfillTags` 從 book_raw 本地分批回填（`tags_backfilled`）
- 已取消：M4 詳情頁與標籤顯示（點封面一律開網頁，備註在 ⋮ 選單編輯；標籤只做搜尋與篩選）
- 未做：Cloudflare 備援 3（手動指定封面）、FLAG_SECURE、App 開啟鎖
- 背景佇列預設只在前景執行；背景下載（選用，前景服務＋通知）見規則 17 與 `docs/DEVELOPMENT.md`「背景下載」一節
- 已做（2026-11 更新）：未讀與典藏（系統資料夾）、管理資料夾與分隔線、⋮ 選單改版、快速分享、標籤翻譯（中文＋日文）、CSV v2（含資料夾順序、分隔線、未讀／典藏、分享設定；舊 CSV 仍可匯入）
- CSV 已知限制：資料夾名稱含 `|` 時，匯出再匯入會被拆成兩個資料夾；主題、媽媽模式、標籤翻譯開關不在備份範圍
- README 截圖在 `docs/screenshots/*.jpg`
- 任務 003 的 3.2–3.4（加強 Cloudflare 偵測）：v2 原生請求可用後暫不需要，原生再被擋時才做
- 沒有桌面預覽：SQLite / Filesystem 外掛只在 Android 運作，`npm run dev` 只能看靜態樣式；封面下載流程以 `tests/download-flow.test.js`（假檔案系統）測試

## 改完後的檢查清單

1. `npm test` 通過
2. `npm run build` 無錯誤
3. 動到服務層或資料表 → 說明是否需要 schema 遷移
4. 動到字串 → 四種語言 key 一致（`npm test` 的 locales 測試會檢查）
5. 簡述改了哪些檔案與原因，不要貼整個檔案

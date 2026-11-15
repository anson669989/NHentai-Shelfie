// 介面字串（繁中 / 简中 / English / 日本語）。純資料＋純函式，不 import 任何模組，方便單元測試檢查四語的鍵一致。
// 新增字串時四種語言都要補（tests/locales.test.js 會檢查）。

const zhTW = {
  'nav.folders': '資料夾',
  'nav.add': '新增',
  'nav.settings': '設定',
  'folder.all': '全部',
  'folder.uncat': '未分類',
  'folder.unread': '未讀',
  'folder.fav': '典藏',
  'folder.new': '新增資料夾',
  'folder.namePlaceholder': '資料夾名稱（1–30 字）',
  'folder.rename': '改名',
  'folder.delete': '刪除資料夾',
  'folder.pick': '選擇資料夾',
  'folder.more': '更多動作',
  'folder.dragHandle': '按住拖曳調整順序',
  'folder.deleteConfirm': '刪除資料夾「{name}」？\n裡面的書不會被刪除，沒有其他資料夾的書會回到「未分類」。',
  'folder.empty': '這裡還沒有書',
  'folder.emptyHint': '到「新增」頁面輸入 ID 開始收藏',
  'folder.manage': '管理資料夾',
  'folder.manageHint': '按住「≡」拖曳排序，點一下可改名或刪除。「全部」「未分類」「未讀」「典藏」固定在最上方，不能更改。',
  'sep.title': '分隔線',
  'sep.new': '新增分隔線',
  'sep.namePlaceholder': '分隔線名稱（可留空，最多 30 字）',
  'sep.delete': '刪除分隔線',
  'settings.folders': '資料夾',
  'settings.tagTranslate': '標籤翻譯',
  'settings.tagTranslateSwitch': '標籤篩選顯示翻譯',
  'settings.tagTranslateHint': '只影響「資料夾」頁面的標籤篩選；沒有翻譯的標籤顯示原文。翻譯有中文與日文，依介面語言顯示（英文介面顯示原文）。開啟後每天最多從 GitHub 下載一次目前語言的翻譯資料（中文約 1.3 MB、日文約 1.6 MB）。',
  'settings.tagTrStatus': '翻譯資料：{count} 筆，{date} 更新',
  'settings.tagTrNone': '尚未下載翻譯資料',
  'settings.tagTrUpdating': '更新中…',
  'settings.tagTrUpdateNow': '立即更新',
  'settings.tagTrCredit': '中文翻譯資料：EhTagTranslation（CC BY-NC-SA 3.0）',
  'settings.tagTrCreditJa': '日文翻譯資料：EhPanda Tag Database（標籤清單：EhTagTranslation，CC BY-NC-SA 3.0；日文譯名：e-hentaidb.com，CC BY 4.0）',
  'settings.tagTrNoLang': '目前的介面語言沒有翻譯資料，標籤會顯示原文',
  'settings.share': '分享',
  'settings.shareMode': '從瀏覽器「分享」到 NH Shelfie 時',
  'settings.shareMode.open': '開 App 選資料夾',
  'settings.shareMode.quick': '直接收藏',
  'settings.shareModeHint': '「直接收藏」會留在瀏覽器，畫面跳出「成功收藏」；書名與封面等下次開啟 App 時才會補上。',
  'settings.shareAutoFolders': '直接收藏時自動加入',
  'share.saved': '成功收藏 #{id}',
  'share.duplicate': '重複收藏 #{id}（已在收藏中，未變更）',
  'share.notNh': '非 nhentai 書籍',
  'share.failed': '收藏失敗，請開啟 App 再試',
  'share.drained': '已加入剛才分享的 {n} 本',
  'filter.tagFilter': '標籤篩選',
  'filter.tagPlaceholder': '標籤／作者／社團',
  'filter.textPlaceholder': '作品名稱／備註／ID',
  'filter.tagsSelected': '已選 {n} 個',
  'filter.clear': '全部清除',
  'filter.done': '完成',
  'filter.clearAll': '清除全部篩選',
  'filter.found': '找到 {n} 本',
  'filter.noOption': '沒有符合的選項',
  'filter.noTags': '還沒有標籤（書補完資料後才會出現）',
  'filter.noResult': '沒有符合條件的書',
  'filter.folderTitle': '資料夾篩選',
  'filter.foldersN': '{n} 個資料夾',
  'tagType.tag': '標籤',
  'tagType.artist': '作者',
  'tagType.group': '社團',
  'sort.added_desc': '加入時間（新→舊）',
  'sort.added_asc': '加入時間（舊→新）',
  'sort.id_desc': 'ID（大→小）',
  'sort.id_asc': 'ID（小→大）',
  'sort.title': '書名',
  'book.removeFromFolder': "從「{name}」移除",
  'book.delete': "從資料庫刪除",
  'book.deleteConfirm': "從資料庫刪除 #{id}？封面檔也會一併刪除。",
  'add.placeholder': "輸入 ID、#ID 或貼上網址",
  'add.folders': '資料夾',
  'add.noFolder': '未分類',
  'add.resetFolders': '資料夾恢復預設（未分類、未讀）',
  'add.submit': "加入",
  'add.duplicate': '已收藏 #{id}',
  'add.inFolders': '所在資料夾：{names}',
  'add.added': "已加入 #{id}",
  'add.hint': "輸入 ID（可貼上網址或 #123456）後按「加入」。書名與封面會在背景自動補上，不用等。",
  'settings.appearance': '外觀',
  'settings.themeColor': '主題顏色',
  'settings.darkMode': '深色模式',
  'settings.dark.system': '跟隨系統',
  'settings.dark.light': '淺色',
  'settings.dark.dark': '深色',
  'settings.gridColumns': '封面牆每列欄數',
  'settings.language': '語言',
  'settings.language.auto': '跟隨系統',
  'settings.data': '資料',
  'settings.export': '匯出 CSV',
  'settings.import': '匯入 CSV',
  'settings.lastExport': '上次匯出：{date}',
  'settings.neverExported': '尚未匯出過',
  'settings.exportReminder': '已超過 30 天未匯出，建議備份一次以免資料遺失。',
  'settings.pending': "剩 {n} 本待補資料或封面",
  'settings.resumeQueue': '繼續抓取',
  'settings.bgSync': '背景下載',
  'settings.bgSyncHint': '開啟後，切到別的 App 或關閉螢幕也會繼續補書名與封面，通知列會顯示進度（不顯示書名與封面）。速度不會變快；每天最多連續約 6 小時。',
  'settings.bgSyncDenied': '需要允許通知才能在背景下載。請在系統設定允許 NH Shelfie 的通知後再試一次。',
  'settings.bgSyncNoPerm': '通知權限已關閉，背景下載目前沒有作用。',
  'bgSync.title': '同步中',
  'bgSync.progress': '還有 {n} 本',
  'bgSync.paused': '同步已暫停，請開啟 App 查看',
  'bgSync.stop': '停止',
  'bgSync.channel': '背景下載',
  'settings.queueRunning': '抓取中…',
  'settings.refetchMissing': '重抓所有缺少的封面',
  'settings.refetchMarked': '已排入 {n} 本，開始抓取',
  'settings.coversSize': '封面：{count} 張，{size}',
  'settings.calcSize': '計算封面占用空間',
  'settings.clearCache': '清除封面快取',
  'settings.cleared': '已清除',
  'settings.advanced': '進階',
  'settings.endpoints': '站方端點',
  'settings.endpointWarning': '只有在站方換網址時才需要修改。請勿填入不明網域；只接受 https。',
  'settings.endpointDetail': '詳情 API v2（需含 {id}）',
  'settings.endpointCdn': '封面伺服器清單 API（CDN 設定）',
  'settings.endpointPage': '開啟網頁（需含 {id}）',
  'settings.save': '儲存',
  'settings.restoreDefault': '還原預設',
  'settings.saved': '已儲存',
  'settings.testConnection': '測試連線',
  'settings.testing': '測試中…',
  'settings.testResult': '詳情：{detail}\n封面：{cover}',
  'settings.diagnostics': '診斷',
  'settings.fetchLog': '最近 {total} 次抓取成功率：{rate}',
  'settings.fetchLogEmpty': '尚無抓取紀錄',
  'settings.about': '關於',
  'settings.help': '使用說明',
  'settings.version': '版本',
  'settings.devModeOn': '已開啟開發者模式',
  'settings.devModeOff': '已關閉開發者模式',
  'settings.fetchMode': '抓取方式',
  'settings.fetchMode.auto': '自動',
  'settings.fetchMode.native': '原生',
  'settings.fetchMode.webview': 'WebView',
  'settings.lastFetchVia': '上次成功：{via}',
  'settings.resetVerification': '重設驗證（清除 cookie）',
  'settings.verificationReset': '已清除驗證資料',
  'settings.tempSize': '封面快取（暫存）：{count} 個檔案，{size}。收藏的封面不會被刪除。',
  'import.preview': '將新增 {ok} 筆、跳過 {skip} 筆。',
  'import.layout': '同時還原資料夾順序、分隔線與分享設定。',
  'import.syncEta': '書名與封面會在匯入後慢慢補上，大約需要 {min} 分鐘。',
  'import.syncHintOff': '要讓 App 開在畫面上才會繼續；切到別的 App 或關閉螢幕就會暫停，下次開啟時接著抓。想邊用手機邊抓，請先到「設定 → 資料 → 背景下載」開啟。',
  'import.syncHintOn': '已開啟背景下載：切到別的 App 或關閉螢幕也會繼續，通知列會顯示進度。',
  'import.reasons': '跳過原因：',
  'import.reason.invalid_id': '第 {line} 列 ID 無效',
  'import.reason.duplicate': '第 {line} 列已收藏',
  'import.reason.duplicate_in_file': '第 {line} 列與檔案內其他列重複',
  'import.reason.invalid_folder': '第 {line} 列資料夾名稱無效',
  'import.reason.invalid_date': '第 {line} 列日期無效',
  'import.reason.too_many_rows': '超過 20,000 列的部分已略過',
  'import.confirm': '匯入',
  'import.done': "已匯入 {n} 筆，資料與封面會在背景慢慢補上。",
  'common.ok': '確定',
  'common.cancel': '取消',
  'common.close': '關閉',
  'common.retry': '重試',
  'common.delete': '刪除',
  'common.copied': '無法開啟瀏覽器，已複製連結',
  'common.copy': '複製',
  'common.copiedText': '已複製',
  'common.copyFailed': '無法複製',
  'common.pressAgainToExit': '再按一次返回鍵離開',
  'err.INVALID_ID': "請輸入數字 ID（例如 228922 或 #228922），或貼上 /g/ 網址",
  'err.DUPLICATE': '這本已經收藏過了',
  'err.OFFLINE': '網路連不上。請確認手機有連上網路，再按「重試」',
  'err.TIMEOUT': '網站回應太慢。請稍等一下再按「重試」',
  'err.NOT_FOUND': '找不到這個 ID 的書。請檢查號碼是否輸入正確',
  'err.BLOCKED': '網站暫時拒絕連線。請過幾分鐘再試',
  'err.CHALLENGE': '網站要求先完成安全驗證。請按「進行驗證」，完成後會自動重試',
  'challenge.verify': '進行驗證',
  'challenge.title': '網站安全驗證',
  'challenge.notPassed': '驗證未完成',
  'err.RATE_LIMITED': '查詢太頻繁，網站要求暫停。{sec} 秒後可以再試',
  'err.BAD_FORMAT': '網站的資料格式可能改了，App 暫時讀不懂。請到「設定 → 進階 → 測試連線」檢查，或等 App 更新',
  'err.COVER_FAILED': '封面下載失敗。可以點封面右上角「⋮」，再按選單右上角的重新載入',
  'err.STORAGE_FULL': '手機儲存空間不足。請清出空間（或到設定「清除封面快取」）後再試',
  'err.DB_FAILED': '資料存不進去。請重新開啟 App 再試',
  'err.FOLDER_NAME_INVALID': '名稱需為 1–30 字，且不可和內建資料夾（全部、未分類、未讀、典藏）同名',
  'err.FOLDER_NAME_DUP': '已有同名資料夾',
  'err.SEPARATOR_NAME_INVALID': '分隔線名稱最多 30 字',
  'err.ENDPOINT_INVALID': '端點格式不正確（需為 https 且包含必要欄位）',
  'err.CSV_INVALID': 'CSV 檔案無法讀取（需為 UTF-8、5 MB 以內，且有 gallery_id 欄）',
  'err.TAGDB_FAILED': '翻譯資料更新失敗，之後會自動重試',
  'err.UNKNOWN': '發生未預期的錯誤。請重新開啟 App 再試；若一直發生請回報',
  'err.WRITE_FAILED': '封面存檔失敗（不是網路問題）。請到設定按「清除封面快取」後再試；若仍失敗請回報',
  'book.menu': "更多動作",
  'book.loading': "載入中",
  'book.notFound': "找不到這本",
  'book.metaFailed': "資料讀取失敗",
  'book.coverFailed': "封面失敗",
  'book.copyId': "複製 ID",
  'book.idCopied': "已複製 #{id}",
  'book.changeId': "修改 ID",
  'book.classify': "分類（選擇資料夾）",
  'book.requeued': '已排入背景更新標籤與封面',
  'book.refresh': '重新載入（更新標籤與封面）',
  'select.count': "已選 {n} 本",
  'select.all': "全選",
  'select.none': "全不選",
  'select.classify': "分類",
  'select.classifyTitle': "將 {n} 本加入資料夾",
  'select.classified': "已將 {n} 本加入 {f} 個資料夾",
  'select.removeFromFolder': "從此資料夾移除",
  'select.removed': "已移除 {n} 本",
  'select.delete': "從資料庫刪除",
  'select.deleteConfirm': "從資料庫刪除 {n} 本？\n封面檔也會一併刪除，無法復原。",
  'select.deleted': "已刪除 {n} 本",
  'queue.rateLimited': "請求太頻繁，稍後自動重試（{sec} 秒）",
  'queue.offline': "網路連不上，{sec} 秒後自動重試",
  'queue.challenge': "網站要求安全驗證，背景補資料已暫停",
  'queue.progress': "背景補資料中，還有 {n} 本",
  'add.recent': "最近加入",
  'add.alreadyHere': "#{id} 已在收藏中，資料夾未變更（在：{names}）",
  'add.addedExisting': "已加入 #{id}（原本就在：{names}）",
  'share.noId': "分享的內容裡找不到 ID",
  'book.note': "備註",
  'book.notePlaceholder': "輸入備註（點旁邊空白處自動儲存）",
  'settings.showNote': "在封面下方顯示備註",
  'settings.recentLimit': "「最近加入」顯示筆數",
  'settings.web': "開啟網頁",
  'settings.openMode': "開啟網頁方式",
  'settings.openMode.external': "外部瀏覽器",
  'settings.openMode.custom_tab': "App 內瀏覽器",
  'settings.openModeHint': "用外部瀏覽器時，從網頁「分享」回 App 後原本的網頁還在；App 內瀏覽器會在分享時被關掉。",
  'settings.mama': "媽媽模式",
  'settings.mamaHint': "旁人看到螢幕時不尷尬。點「⋮」打開的選單照常顯示。",
  'settings.mamaDetail': "詳細設定",
  'settings.mamaScope': "套用頁面",
  'settings.mamaScope.library': "資料夾頁（封面牆）",
  'settings.mamaScope.add': "新增頁「最近加入」（一併隱藏所在資料夾）",
  'settings.mamaHide': "隱藏內容",
  'settings.mamaHide.cover': "封面",
  'settings.mamaHide.title': "書名",
  'settings.mamaHide.note': "備註",
  'filter.mode': '篩選方式',
  'filter.mode.exclude': '排除',
  'filter.mode.any': '包含任一',
  'filter.mode.all': '全部符合',
  'filter.modeHint.exclude': '所選的一個都沒有',
  'filter.modeHint.any': '有所選的其中一個就算',
  'filter.modeHint.all': '所選的每一個都要有',
  'filter.modePrefix': '{mode}：{text}',
  'filter.modeDefault': '（預設）',
  'settings.tagShowOriginal': '附註原文',
  'settings.tagShowOriginalHint': '在翻譯名稱旁用灰色小字顯示原文，例如「全彩 full color」。要先開啟上方的顯示翻譯。',
  'settings.helpHint': '各項功能怎麼用，點這裡查看',
  help: `點一下標題可以展開或收合。

# 📥 新增書本
## 怎麼加入一本書？
- 到「新增」頁面輸入 ID（也可以貼上網址或 #228922），按「加入」就完成，不用等網路。
- 書名與封面會在背景自動補上，「最近加入」清單會跟著更新。
## 資料夾怎麼選？
- 資料夾會記住上次的選擇，連續加入不必每本重選。
- 欄位右邊的灰色圖示可以恢復預設（未分類、未讀）。
## 加入已經收藏的書會怎樣？
- 不會重複收藏，只會補進新選的資料夾。

# 🔗 從瀏覽器分享
## 怎麼從瀏覽器收藏？
- 在 nhentai 的網頁按 Android 的「分享」，選 NH Shelfie。
## 兩種分享方式
- 「開 App 選資料夾」（預設）：打開 App 並填好 ID，選好資料夾後按「加入」。
- 「直接收藏」：畫面留在瀏覽器，跳出「成功收藏」；書名與封面等下次打開 App 才補上。
- 在「設定」頁面的「分享」切換。
## 直接收藏的書放在哪裡？
- 放進「直接收藏時自動加入」設定的資料夾（預設是未讀）。
- 已收藏過的書不會有任何變更。

# 📁 資料夾與分類
## 固定的四個資料夾
- 「全部」「未分類」「未讀」「⭐ 典藏」固定在最上方，不能改名或刪除。
- 「未分類」是指沒有放進任何自建資料夾的書（未讀、典藏不算）。
## 未讀與典藏怎麼用？
- 新書預設放進「未讀」；看完後按「⋮」→「從『未讀』移除」。
- 喜歡的書可以加進「典藏」。
## 怎麼整理自己的資料夾？
- 一本書可以放進多個資料夾。
- 在資料夾選單裡：按住「≡」拖曳排序，按「⋯」改名或刪除，最下方可以新增資料夾。
- 「管理資料夾」可以新增分隔線，把資料夾分組。

# 🔍 搜尋與篩選
## 怎麼找書？
- 「資料夾」頁面上方第一列：打字找標籤、作者或社團，勾選後就會篩選。
- 第二列：打書名、備註或 ID 搜尋；右邊是資料夾篩選，可以一次勾好幾個。
## 「篩選方式」是什麼？
- 排除：所選的一個都沒有。
- 包含任一：有所選的其中一個就算。
- 全部符合：所選的每一個都要有。
- 標籤與資料夾分開設定；標籤預設「全部符合」，資料夾預設「包含任一」。
## 怎麼取消篩選？
- 「全部清除」只取消勾選。
- 「清除全部篩選」會回到完全沒有篩選的樣子。
## 怎麼排序？
- 第一列右邊可以選排序方式，每個資料夾各自記住。

# 📖 單本選單（⋮）
## 怎麼打開？
- 點封面右上角的「⋮」，或在「最近加入」長按一本。
## 可以做什麼？
- 看完整標題、寫備註（點旁邊空白處自動儲存）、複製 ID。
- 分類：勾選後立即儲存，不用按確定。
- 從目前的資料夾移除，或把這本書刪除。
## 封面或資料有問題？
- 選單右上角的灰色重新載入圖示會重新查詢這本書，更新標籤與封面。
- 找不到的書可以在這裡「修改 ID」。

# ☑️ 多選
## 一次處理很多本
- 長按封面進入多選模式，點封面選取或取消。
- 下方可以一次分類、從此資料夾移除或刪除。
- 按返回鍵退出多選。

# 🌐 開啟網頁
## 怎麼看書的網頁？
- 點封面或「最近加入」的橫條，會開啟該本的網頁。
## 用哪個瀏覽器開？
- 在「設定」頁面的「開啟網頁」可以選外部瀏覽器（預設）或 App 內瀏覽器。

# 🏷️ 標籤翻譯
## 讓標籤顯示中文或日文
- 在「設定」頁面打開「標籤翻譯」，標籤篩選就會顯示翻譯名稱。
- 繁中、简中顯示中文，日本語顯示日文，English 顯示原文；沒有翻譯的標籤顯示原文。
- 打原文或翻譯都搜得到。
## 想同時看到原文？
- 打開「附註原文」，翻譯旁邊會用灰色小字顯示原文。
## 會動到我的資料嗎？
- 不會，只影響標籤篩選的顯示。
- 翻譯資料每天最多從 GitHub 下載一次。

# 🙈 媽媽模式
## 不想讓旁人看到封面
- 在「設定」頁面打開「媽媽模式」，封面會換成灰色方塊。
- 也可以隱藏書名或備註。
## 可以調整什麼？
- 「詳細設定」可以選要套用在哪個頁面、隱藏哪些內容。
- 點「⋮」打開的選單照常顯示。

# 💾 備份與換機
## 怎麼備份？
- 在「設定」頁面的「資料」按「匯出 CSV」，透過分享面板存到雲端硬碟或傳給自己。
- 建議每個月匯出一次。
## 怎麼搬到新手機？
- 新手機安裝後按「匯入 CSV」，書名與封面會依 ID 重新抓取。
- CSV 也包含資料夾順序、分隔線、未讀與典藏，以及分享設定。

# ⏬ 背景下載
## 什麼時候會抓書名與封面？
- 預設只在 App 開在畫面上時才會抓。
## 想邊用手機邊抓？
- 在「設定」頁面的「資料」打開「背景下載」，切到別的 App 或關閉螢幕也會繼續，通知列會顯示進度。
- 需要允許通知；速度不會變快。

# ❓ 抓不到資料？
## 出現「請求太頻繁」或「網路連不上」
- App 會自動重試，不用處理。
## 要求安全驗證
- 按提示列的「進行驗證」。
## 一直抓不到
- 到「設定」頁面的「進階」按「測試連線」檢查。

🔒 所有資料只存在這支手機上，不會上傳到任何伺服器。`,
}

const zhCN = {
  'nav.folders': '文件夹',
  'nav.add': '添加',
  'nav.settings': '设置',
  'folder.all': '全部',
  'folder.uncat': '未分类',
  'folder.unread': '未读',
  'folder.fav': '典藏',
  'folder.new': '新建文件夹',
  'folder.namePlaceholder': '文件夹名称（1–30 字）',
  'folder.rename': '重命名',
  'folder.delete': '删除文件夹',
  'folder.pick': '选择文件夹',
  'folder.more': '更多操作',
  'folder.dragHandle': '按住拖动调整顺序',
  'folder.deleteConfirm': '删除文件夹“{name}”？\n里面的本子不会被删除，不在其他文件夹的本子会回到“未分类”。',
  'folder.empty': '这里还没有本子',
  'folder.emptyHint': '到“添加”页面输入 ID 开始收藏',
  'folder.manage': '管理文件夹',
  'folder.manageHint': '按住“≡”拖动排序，点一下可重命名或删除。“全部”“未分类”“未读”“典藏”固定在最上方，不能更改。',
  'sep.title': '分隔线',
  'sep.new': '新建分隔线',
  'sep.namePlaceholder': '分隔线名称（可留空，最多 30 字）',
  'sep.delete': '删除分隔线',
  'settings.folders': '文件夹',
  'settings.tagTranslate': '标签翻译',
  'settings.tagTranslateSwitch': '标签筛选显示翻译',
  'settings.tagTranslateHint': '只影响“文件夹”页面的标签筛选；没有翻译的标签显示原文。翻译有中文和日文，按界面语言显示（英文界面显示原文）。开启后每天最多从 GitHub 下载一次当前语言的翻译数据（中文约 1.3 MB，日文约 1.6 MB）。',
  'settings.tagTrStatus': '翻译数据：{count} 条，{date} 更新',
  'settings.tagTrNone': '尚未下载翻译数据',
  'settings.tagTrUpdating': '更新中…',
  'settings.tagTrUpdateNow': '立即更新',
  'settings.tagTrCredit': '中文翻译数据：EhTagTranslation（CC BY-NC-SA 3.0）',
  'settings.tagTrCreditJa': '日文翻译数据：EhPanda Tag Database（标签列表：EhTagTranslation，CC BY-NC-SA 3.0；日文译名：e-hentaidb.com，CC BY 4.0）',
  'settings.tagTrNoLang': '当前界面语言没有翻译数据，标签将显示原文',
  'settings.share': '分享',
  'settings.shareMode': '从浏览器“分享”到 NH Shelfie 时',
  'settings.shareMode.open': '打开 App 选文件夹',
  'settings.shareMode.quick': '直接收藏',
  'settings.shareModeHint': '“直接收藏”会留在浏览器，并提示“成功收藏”；标题和封面要等下次打开 App 时才会补全。',
  'settings.shareAutoFolders': '直接收藏时自动加入',
  'share.saved': '成功收藏 #{id}',
  'share.duplicate': '重复收藏 #{id}（已在收藏中，未更改）',
  'share.notNh': '不是 nhentai 的本子',
  'share.failed': '收藏失败，请打开 App 再试',
  'share.drained': '已添加刚才分享的 {n} 本',
  'filter.tagFilter': '标签筛选',
  'filter.tagPlaceholder': '标签／作者／社团',
  'filter.textPlaceholder': '作品名称／备注／ID',
  'filter.tagsSelected': '已选 {n} 个',
  'filter.clear': '全部清除',
  'filter.done': '完成',
  'filter.clearAll': '清除全部筛选',
  'filter.found': '找到 {n} 本',
  'filter.noOption': '没有符合的选项',
  'filter.noTags': '还没有标签（本子补完资料后才会出现）',
  'filter.noResult': '没有符合条件的本子',
  'filter.folderTitle': '文件夹筛选',
  'filter.foldersN': '{n} 个文件夹',
  'tagType.tag': '标签',
  'tagType.artist': '作者',
  'tagType.group': '社团',
  'sort.added_desc': '添加时间（新→旧）',
  'sort.added_asc': '添加时间（旧→新）',
  'sort.id_desc': 'ID（大→小）',
  'sort.id_asc': 'ID（小→大）',
  'sort.title': '标题',
  'book.removeFromFolder': '从“{name}”移除',
  'book.delete': '从数据库删除',
  'book.deleteConfirm': '从数据库删除 #{id}？封面文件也会一并删除。',
  'add.placeholder': '输入 ID、#ID 或粘贴网址',
  'add.folders': '文件夹',
  'add.noFolder': '未分类',
  'add.resetFolders': '文件夹恢复默认（未分类、未读）',
  'add.submit': '添加',
  'add.duplicate': '已收藏 #{id}',
  'add.inFolders': '所在文件夹：{names}',
  'add.added': '已添加 #{id}',
  'add.hint': '输入 ID（也可以粘贴网址或 #123456）后点“添加”。标题和封面会在后台自动补全，无需等待。',
  'settings.appearance': '外观',
  'settings.themeColor': '主题颜色',
  'settings.darkMode': '深色模式',
  'settings.dark.system': '跟随系统',
  'settings.dark.light': '浅色',
  'settings.dark.dark': '深色',
  'settings.gridColumns': '封面墙每行列数',
  'settings.language': '语言',
  'settings.language.auto': '跟随系统',
  'settings.data': '数据',
  'settings.export': '导出 CSV',
  'settings.import': '导入 CSV',
  'settings.lastExport': '上次导出：{date}',
  'settings.neverExported': '尚未导出过',
  'settings.exportReminder': '已超过 30 天未导出，建议备份一次，以免数据丢失。',
  'settings.pending': '还有 {n} 本等待补全数据或封面',
  'settings.resumeQueue': '继续获取',
  'settings.bgSync': '后台下载',
  'settings.bgSyncHint': '开启后，切到其他 App 或关闭屏幕也会继续补全标题和封面，通知栏会显示进度（不显示标题和封面）。速度不会变快；每天最多连续约 6 小时。',
  'settings.bgSyncDenied': '需要允许通知才能在后台下载。请在系统设置中允许 NH Shelfie 的通知后再试一次。',
  'settings.bgSyncNoPerm': '通知权限已关闭，后台下载目前不起作用。',
  'bgSync.title': '同步中',
  'bgSync.progress': '还剩 {n} 本',
  'bgSync.paused': '同步已暂停，请打开 App 查看',
  'bgSync.stop': '停止',
  'bgSync.channel': '后台下载',
  'settings.queueRunning': '获取中…',
  'settings.refetchMissing': '重新获取所有缺失的封面',
  'settings.refetchMarked': '已加入 {n} 本，开始获取',
  'settings.coversSize': '封面：{count} 张，{size}',
  'settings.calcSize': '计算封面占用空间',
  'settings.clearCache': '清除封面缓存',
  'settings.cleared': '已清除',
  'settings.advanced': '高级',
  'settings.endpoints': '站点接口',
  'settings.endpointWarning': '只有在站点更换网址时才需要修改。请勿填写来历不明的域名；仅接受 https。',
  'settings.endpointDetail': '详情 API v2（需包含 {id}）',
  'settings.endpointCdn': '封面服务器列表 API（CDN 配置）',
  'settings.endpointPage': '打开网页（需包含 {id}）',
  'settings.save': '保存',
  'settings.restoreDefault': '恢复默认',
  'settings.saved': '已保存',
  'settings.testConnection': '测试连接',
  'settings.testing': '测试中…',
  'settings.testResult': '详情：{detail}\n封面：{cover}',
  'settings.diagnostics': '诊断',
  'settings.fetchLog': '最近 {total} 次获取成功率：{rate}',
  'settings.fetchLogEmpty': '暂无获取记录',
  'settings.about': '关于',
  'settings.help': '使用说明',
  'settings.version': '版本',
  'settings.devModeOn': '已开启开发者模式',
  'settings.devModeOff': '已关闭开发者模式',
  'settings.fetchMode': '获取方式',
  'settings.fetchMode.auto': '自动',
  'settings.fetchMode.native': '原生',
  'settings.fetchMode.webview': 'WebView',
  'settings.lastFetchVia': '上次成功：{via}',
  'settings.resetVerification': '重置验证（清除 Cookie）',
  'settings.verificationReset': '已清除验证数据',
  'settings.tempSize': '封面缓存（临时文件）：{count} 个文件，{size}。收藏的封面不会被删除。',
  'import.preview': '将新增 {ok} 条，跳过 {skip} 条。',
  'import.layout': '同时恢复文件夹顺序、分隔线和分享设置。',
  'import.syncEta': '标题和封面会在导入后慢慢补全，大约需要 {min} 分钟。',
  'import.syncHintOff': '需要让 App 保持在屏幕上才会继续；切到其他 App 或关闭屏幕就会暂停，下次打开时接着获取。想边用手机边获取，请先到“设置 → 数据 → 后台下载”开启。',
  'import.syncHintOn': '已开启后台下载：切到其他 App 或关闭屏幕也会继续，通知栏会显示进度。',
  'import.reasons': '跳过原因：',
  'import.reason.invalid_id': '第 {line} 行 ID 无效',
  'import.reason.duplicate': '第 {line} 行已收藏',
  'import.reason.duplicate_in_file': '第 {line} 行与文件内其他行重复',
  'import.reason.invalid_folder': '第 {line} 行文件夹名称无效',
  'import.reason.invalid_date': '第 {line} 行日期无效',
  'import.reason.too_many_rows': '超过 20,000 行的部分已忽略',
  'import.confirm': '导入',
  'import.done': '已导入 {n} 条，数据和封面会在后台慢慢补全。',
  'common.ok': '确定',
  'common.cancel': '取消',
  'common.close': '关闭',
  'common.retry': '重试',
  'common.delete': '删除',
  'common.copied': '无法打开浏览器，已复制链接',
  'common.copy': '复制',
  'common.copiedText': '已复制',
  'common.copyFailed': '无法复制',
  'common.pressAgainToExit': '再按一次返回键退出',
  'err.INVALID_ID': '请输入数字 ID（例如 228922 或 #228922），或粘贴 /g/ 网址',
  'err.DUPLICATE': '这本已经收藏过了',
  'err.OFFLINE': '网络连接不上。请确认手机已联网，再点“重试”',
  'err.TIMEOUT': '网站响应太慢。请稍等一会儿再点“重试”',
  'err.NOT_FOUND': '找不到这个 ID 的本子。请检查号码是否输入正确',
  'err.BLOCKED': '网站暂时拒绝连接。请过几分钟再试',
  'err.CHALLENGE': '网站要求先完成安全验证。请点“进行验证”，完成后会自动重试',
  'challenge.verify': '进行验证',
  'challenge.title': '网站安全验证',
  'challenge.notPassed': '验证未完成',
  'err.RATE_LIMITED': '请求太频繁，网站要求暂停。{sec} 秒后可以再试',
  'err.BAD_FORMAT': '网站的数据格式可能变了，App 暂时无法识别。请到“设置 → 高级 → 测试连接”检查，或等待 App 更新',
  'err.COVER_FAILED': '封面下载失败。可以点封面右上角的“⋮”，再点菜单右上角的重新加载',
  'err.STORAGE_FULL': '手机存储空间不足。请清理空间（或到设置“清除封面缓存”）后再试',
  'err.DB_FAILED': '数据保存失败。请重新打开 App 再试',
  'err.FOLDER_NAME_INVALID': '名称需为 1–30 字，且不能和内置文件夹（全部、未分类、未读、典藏）同名',
  'err.FOLDER_NAME_DUP': '已有同名文件夹',
  'err.SEPARATOR_NAME_INVALID': '分隔线名称最多 30 字',
  'err.ENDPOINT_INVALID': '接口格式不正确（需为 https 且包含必要字段）',
  'err.CSV_INVALID': 'CSV 文件无法读取（需为 UTF-8、5 MB 以内，并且有 gallery_id 列）',
  'err.TAGDB_FAILED': '翻译数据更新失败，稍后会自动重试',
  'err.UNKNOWN': '发生意外错误。请重新打开 App 再试；如果一直出现，请反馈',
  'err.WRITE_FAILED': '封面保存失败（不是网络问题）。请到设置点“清除封面缓存”后再试；仍然失败请反馈',
  'book.menu': '更多操作',
  'book.loading': '加载中',
  'book.notFound': '找不到这本',
  'book.metaFailed': '数据读取失败',
  'book.coverFailed': '封面获取失败',
  'book.copyId': '复制 ID',
  'book.idCopied': '已复制 #{id}',
  'book.changeId': '修改 ID',
  'book.classify': '分类（选择文件夹）',
  'book.requeued': '已加入后台更新标签和封面',
  'book.refresh': '重新加载（更新标签和封面）',
  'select.count': '已选 {n} 本',
  'select.all': '全选',
  'select.none': '全不选',
  'select.classify': '分类',
  'select.classifyTitle': '将 {n} 本加入文件夹',
  'select.classified': '已将 {n} 本加入 {f} 个文件夹',
  'select.removeFromFolder': '从此文件夹移除',
  'select.removed': '已移除 {n} 本',
  'select.delete': '从数据库删除',
  'select.deleteConfirm': '从数据库删除 {n} 本？\n封面文件也会一并删除，无法恢复。',
  'select.deleted': '已删除 {n} 本',
  'queue.rateLimited': '请求太频繁，稍后自动重试（{sec} 秒）',
  'queue.offline': '网络连接不上，{sec} 秒后自动重试',
  'queue.challenge': '网站要求安全验证，后台补全已暂停',
  'queue.progress': '后台补全中，还剩 {n} 本',
  'add.recent': '最近添加',
  'add.alreadyHere': '#{id} 已在收藏中，文件夹未更改（在：{names}）',
  'add.addedExisting': '已添加 #{id}（原本就在：{names}）',
  'share.noId': '分享的内容里找不到 ID',
  'book.note': "备注",
  'book.notePlaceholder': "输入备注（点旁边空白处自动保存）",
  'settings.showNote': "在封面下方显示备注",
  'settings.recentLimit': "“最近添加”显示条数",
  'settings.web': "打开网页",
  'settings.openMode': "打开网页方式",
  'settings.openMode.external': "外部浏览器",
  'settings.openMode.custom_tab': "App 内浏览器",
  'settings.openModeHint': "用外部浏览器时，从网页“分享”回 App 后原来的网页还在；App 内浏览器会在分享时被关掉。",
  'settings.mama': "妈妈模式",
  'settings.mamaHint': "旁人看到屏幕时不尴尬。点“⋮”打开的菜单照常显示。",
  'settings.mamaDetail': "详细设置",
  'settings.mamaScope': "应用页面",
  'settings.mamaScope.library': "文件夹页（封面墙）",
  'settings.mamaScope.add': "添加页“最近添加”（同时隐藏所在文件夹）",
  'settings.mamaHide': "隐藏内容",
  'settings.mamaHide.cover': "封面",
  'settings.mamaHide.title': "标题",
  'settings.mamaHide.note': "备注",
  'filter.mode': '筛选方式',
  'filter.mode.exclude': '排除',
  'filter.mode.any': '包含任一',
  'filter.mode.all': '全部符合',
  'filter.modeHint.exclude': '所选的一个都没有',
  'filter.modeHint.any': '有所选的任意一个即可',
  'filter.modeHint.all': '所选的每一个都要有',
  'filter.modePrefix': '{mode}：{text}',
  'filter.modeDefault': '（默认）',
  'settings.tagShowOriginal': '附注原文',
  'settings.tagShowOriginalHint': '在翻译名称旁用灰色小字显示原文，例如“全彩 full color”。需要先开启上方的显示翻译。',
  'settings.helpHint': '各项功能怎么用，点这里查看',
  help: `点一下标题可以展开或收起。

# 📥 添加本子
## 怎么添加一本？
- 在“添加”页面输入 ID（也可以粘贴网址或 #228922），点“添加”即可，无需等待网络。
- 标题和封面会在后台自动补全，“最近添加”列表会跟着更新。
## 文件夹怎么选？
- 文件夹会记住上次的选择，连续添加时不用每本都重新选。
- 文件夹栏右边的灰色图标可以恢复默认（未分类、未读）。
## 添加已经收藏的本子会怎样？
- 不会重复收藏，只会加入新选的文件夹。

# 🔗 从浏览器分享
## 怎么从浏览器收藏？
- 在 nhentai 的网页点 Android 的“分享”，选择 NH Shelfie。
## 两种分享方式
- “打开 App 选文件夹”（默认）：打开 App 并填好 ID，选好文件夹后点“添加”。
- “直接收藏”：停留在浏览器，提示“成功收藏”；标题和封面要等下次打开 App 时才补全。
- 在“设置”页面的“分享”切换。
## 直接收藏的本子放在哪里？
- 放进“直接收藏时自动加入”设置的文件夹（默认是未读）。
- 已收藏过的本子不会有任何更改。

# 📁 文件夹与分类
## 固定的四个文件夹
- “全部”“未分类”“未读”“⭐ 典藏”固定在最上方，不能重命名或删除。
- “未分类”指没有放进任何自建文件夹的本子（未读、典藏不算）。
## 未读和典藏怎么用？
- 新本子默认放进“未读”；看完后点“⋮”→“从‘未读’移除”。
- 喜欢的本子可以加进“典藏”。
## 怎么整理自己的文件夹？
- 一本可以放进多个文件夹。
- 在文件夹菜单里：按住“≡”拖动排序，点“⋯”重命名或删除，最下方可以新建文件夹。
- “管理文件夹”可以新建分隔线，给文件夹分组。

# 🔍 搜索与筛选
## 怎么找本子？
- “文件夹”页面顶部第一行：输入文字查找标签、作者或社团，勾选后即可筛选。
- 第二行：输入标题、备注或 ID 搜索；右边是文件夹筛选，可以一次勾选多个。
## “筛选方式”是什么？
- 排除：所选的一个都没有。
- 包含任一：有所选的任意一个即可。
- 全部符合：所选的每一个都要有。
- 标签和文件夹分开设置；标签默认“全部符合”，文件夹默认“包含任一”。
## 怎么取消筛选？
- “全部清除”只取消勾选。
- “清除全部筛选”会回到完全没有筛选的状态。
## 怎么排序？
- 第一行右边可以选择排序方式，每个文件夹各自记住。

# 📖 单本菜单（⋮）
## 怎么打开？
- 点封面右上角的“⋮”，或在“最近添加”长按一本。
## 可以做什么？
- 查看完整标题、写备注（点旁边空白处自动保存）、复制 ID。
- 分类：勾选后立即保存，不用点确定。
- 从当前文件夹移除，或把这本删除。
## 封面或数据有问题？
- 菜单右上角的灰色重新加载图标会重新查询这本，更新标签和封面。
- 找不到的本子可以在这里“修改 ID”。

# ☑️ 多选
## 一次处理很多本
- 长按封面进入多选模式，点封面选中或取消。
- 底部可以批量分类、从此文件夹移除或删除。
- 按返回键退出多选。

# 🌐 打开网页
## 怎么看本子的网页？
- 点封面或“最近添加”的横条，会打开对应的网页。
## 用哪个浏览器打开？
- 在“设置”页面的“打开网页”可以选外部浏览器（默认）或 App 内浏览器。

# 🏷️ 标签翻译
## 让标签显示中文或日文
- 在“设置”页面打开“标签翻译”，标签筛选就会显示翻译名称。
- 繁中、简中显示中文，日本語显示日文，English 显示原文；没有翻译的标签显示原文。
- 输入原文或翻译都能搜到。
## 想同时看到原文？
- 打开“附注原文”，翻译旁边会用灰色小字显示原文。
## 会改动我的数据吗？
- 不会，只影响标签筛选的显示。
- 翻译数据每天最多从 GitHub 下载一次。

# 🙈 妈妈模式
## 不想让旁人看到封面
- 在“设置”页面打开“妈妈模式”，封面会换成灰色方块。
- 也可以隐藏标题或备注。
## 可以调整什么？
- “详细设置”可以选择应用在哪个页面、隐藏哪些内容。
- 点“⋮”打开的菜单照常显示。

# 💾 备份与换机
## 怎么备份？
- 在“设置”页面的“数据”点“导出 CSV”，通过分享面板保存到网盘或发给自己。
- 建议每个月导出一次。
## 怎么搬到新手机？
- 新手机安装后点“导入 CSV”，标题和封面会根据 ID 重新获取。
- CSV 也包含文件夹顺序、分隔线、未读和典藏，以及分享设置。

# ⏬ 后台下载
## 什么时候会获取标题和封面？
- 默认只在 App 显示在屏幕上时才会获取。
## 想边用手机边获取？
- 在“设置”页面的“数据”打开“后台下载”，切到别的 App 或关闭屏幕也会继续，通知栏会显示进度。
- 需要允许通知；速度不会变快。

# ❓ 获取不到数据？
## 出现“请求太频繁”或“网络连接不上”
- App 会自动重试，无需处理。
## 要求安全验证
- 点提示栏里的“进行验证”。
## 一直获取不到
- 到“设置”页面的“高级”点“测试连接”检查。

🔒 所有数据只保存在这台手机上，不会上传到任何服务器。`,
}

const en = {
  'nav.folders': 'Folders',
  'nav.add': 'Add',
  'nav.settings': 'Settings',
  'folder.all': 'All',
  'folder.uncat': 'Uncategorized',
  'folder.unread': 'Unread',
  'folder.fav': 'Favorites',
  'folder.new': 'New folder',
  'folder.namePlaceholder': 'Folder name (1–30 chars)',
  'folder.rename': 'Rename',
  'folder.delete': 'Delete folder',
  'folder.pick': 'Choose folder',
  'folder.more': 'More actions',
  'folder.dragHandle': 'Hold and drag to reorder',
  'folder.deleteConfirm': 'Delete folder "{name}"?\nBooks are kept; books without any folder go to "Uncategorized".',
  'folder.empty': 'No books here yet',
  'folder.emptyHint': 'Go to the Add page and enter an ID',
  'folder.manage': 'Manage folders',
  'folder.manageHint': 'Hold "≡" and drag to reorder; tap an item to rename or delete it. All, Uncategorized, Unread and Favorites stay on top and can\'t be changed.',
  'sep.title': 'Divider',
  'sep.new': 'New divider',
  'sep.namePlaceholder': 'Divider name (optional, up to 30 characters)',
  'sep.delete': 'Delete divider',
  'settings.folders': 'Folders',
  'settings.tagTranslate': 'Tag translation',
  'settings.tagTranslateSwitch': 'Show translated names in the tag filter',
  'settings.tagTranslateHint': 'Only affects the tag filter on the Folders page; tags without a translation stay as they are. Chinese and Japanese translations are available and follow the app language (English shows the original tags). When on, translation data for the current language (about 1.3 MB for Chinese, 1.6 MB for Japanese) is downloaded from GitHub at most once a day.',
  'settings.tagTrStatus': 'Translation data: {count} entries, updated {date}',
  'settings.tagTrNone': 'Translation data not downloaded yet',
  'settings.tagTrUpdating': 'Updating…',
  'settings.tagTrUpdateNow': 'Update now',
  'settings.tagTrCredit': 'Chinese translation data: EhTagTranslation (CC BY-NC-SA 3.0)',
  'settings.tagTrCreditJa': 'Japanese translation data: EhPanda Tag Database (tag list: EhTagTranslation, CC BY-NC-SA 3.0; Japanese names: e-hentaidb.com, CC BY 4.0)',
  'settings.tagTrNoLang': 'No translation data for the current app language; tags are shown as-is',
  'settings.share': 'Sharing',
  'settings.shareMode': 'When you share from a browser to NH Shelfie',
  'settings.shareMode.open': 'Open app to choose',
  'settings.shareMode.quick': 'Save instantly',
  'settings.shareModeHint': '"Save instantly" keeps you in the browser and shows "Saved". The title and cover are filled in the next time you open the app.',
  'settings.shareAutoFolders': 'Folders for instant saves',
  'share.saved': 'Saved #{id}',
  'share.duplicate': '#{id} is already saved (nothing changed)',
  'share.notNh': 'Not an nhentai gallery',
  'share.failed': "Couldn't save. Open the app and try again",
  'share.drained': 'Added {n} shared item(s)',
  'filter.tagFilter': 'Tag filter',
  'filter.tagPlaceholder': 'Tag / artist / group',
  'filter.textPlaceholder': 'Title / note / ID',
  'filter.tagsSelected': '{n} selected',
  'filter.clear': 'Clear all',
  'filter.done': 'Done',
  'filter.clearAll': 'Clear all filters',
  'filter.found': '{n} found',
  'filter.noOption': 'No matching options',
  'filter.noTags': 'No tags yet (they appear after book info is fetched)',
  'filter.noResult': 'No books match these filters',
  'filter.folderTitle': 'Folder filter',
  'filter.foldersN': '{n} folders',
  'tagType.tag': 'Tag',
  'tagType.artist': 'Artist',
  'tagType.group': 'Group',
  'sort.added_desc': 'Added (newest)',
  'sort.added_asc': 'Added (oldest)',
  'sort.id_desc': 'ID (high→low)',
  'sort.id_asc': 'ID (low→high)',
  'sort.title': 'Title',
  'book.removeFromFolder': "Remove from \"{name}\"",
  'book.delete': "Delete from library",
  'book.deleteConfirm': "Delete #{id} from the library? Its cover file will be deleted too.",
  'add.placeholder': "Enter ID, #ID or paste a URL",
  'add.folders': 'Folders',
  'add.noFolder': 'Uncategorized',
  'add.resetFolders': 'Reset folders to default (Uncategorized, Unread)',
  'add.submit': "Add",
  'add.duplicate': 'Already saved #{id}',
  'add.inFolders': 'In folders: {names}',
  'add.added': "Added #{id}",
  'add.hint': "Enter an ID (a URL or #123456 works too) and tap Add. Title and cover are filled in automatically in the background.",
  'settings.appearance': 'Appearance',
  'settings.themeColor': 'Theme color',
  'settings.darkMode': 'Dark mode',
  'settings.dark.system': 'System',
  'settings.dark.light': 'Light',
  'settings.dark.dark': 'Dark',
  'settings.gridColumns': 'Covers per row',
  'settings.language': 'Language',
  'settings.language.auto': 'System',
  'settings.data': 'Data',
  'settings.export': 'Export CSV',
  'settings.import': 'Import CSV',
  'settings.lastExport': 'Last export: {date}',
  'settings.neverExported': 'Never exported',
  'settings.exportReminder': 'No export in over 30 days. Back up to avoid data loss.',
  'settings.pending': "{n} waiting for details or cover",
  'settings.resumeQueue': 'Resume fetching',
  'settings.bgSync': 'Background download',
  'settings.bgSyncHint': 'Keeps fetching titles and covers while you use other apps or the screen is off. A notification shows progress (no titles or covers). It is not faster; limited to about 6 hours a day.',
  'settings.bgSyncDenied': 'Background download needs notification permission. Allow notifications for NH Shelfie in system settings, then try again.',
  'settings.bgSyncNoPerm': 'Notifications are turned off, so background download is not active.',
  'bgSync.title': 'Syncing',
  'bgSync.progress': '{n} left',
  'bgSync.paused': 'Sync paused. Open the app to continue.',
  'bgSync.stop': 'Stop',
  'bgSync.channel': 'Background download',
  'settings.queueRunning': 'Fetching…',
  'settings.refetchMissing': 'Re-fetch all missing covers',
  'settings.refetchMarked': '{n} queued, fetching',
  'settings.coversSize': 'Covers: {count} files, {size}',
  'settings.calcSize': 'Calculate cover storage',
  'settings.clearCache': 'Clear cover cache',
  'settings.cleared': 'Cleared',
  'settings.advanced': 'Advanced',
  'settings.endpoints': 'Site endpoints',
  'settings.endpointWarning': 'Only change these if the site moves. Never enter unknown domains; https only.',
  'settings.endpointDetail': 'Detail API v2 (must contain {id})',
  'settings.endpointCdn': 'Cover server list API (CDN config)',
  'settings.endpointPage': 'Web page (must contain {id})',
  'settings.save': 'Save',
  'settings.restoreDefault': 'Restore defaults',
  'settings.saved': 'Saved',
  'settings.testConnection': 'Test connection',
  'settings.testing': 'Testing…',
  'settings.testResult': 'Detail: {detail}\nCover: {cover}',
  'settings.diagnostics': 'Diagnostics',
  'settings.fetchLog': 'Success rate of last {total} fetches: {rate}',
  'settings.fetchLogEmpty': 'No fetch history yet',
  'settings.about': 'About',
  'settings.help': 'How to use',
  'settings.version': 'Version',
  'settings.devModeOn': 'Developer mode on',
  'settings.devModeOff': 'Developer mode off',
  'settings.fetchMode': 'Fetch method',
  'settings.fetchMode.auto': 'Auto',
  'settings.fetchMode.native': 'Native',
  'settings.fetchMode.webview': 'WebView',
  'settings.lastFetchVia': 'Last success: {via}',
  'settings.resetVerification': 'Reset verification (clear cookies)',
  'settings.verificationReset': 'Verification data cleared',
  'settings.tempSize': 'Cover cache (temporary): {count} files, {size}. Saved covers are not deleted.',
  'import.preview': '{ok} will be added, {skip} skipped.',
  'import.layout': 'Folder order, dividers and sharing settings will be restored too.',
  'import.syncEta': 'Titles and covers are fetched after the import; this takes about {min} min.',
  'import.syncHintOff': 'Fetching only continues while the app is on screen; it pauses when you switch apps or turn the screen off and resumes next time. To keep going in the background, turn on Settings → Data → Background download first.',
  'import.syncHintOn': 'Background download is on: fetching continues while you use other apps or the screen is off, with progress in a notification.',
  'import.reasons': 'Skipped:',
  'import.reason.invalid_id': 'Line {line}: invalid ID',
  'import.reason.duplicate': 'Line {line}: already saved',
  'import.reason.duplicate_in_file': 'Line {line}: duplicate in file',
  'import.reason.invalid_folder': 'Line {line}: invalid folder name',
  'import.reason.invalid_date': 'Line {line}: invalid date',
  'import.reason.too_many_rows': 'Rows beyond 20,000 were ignored',
  'import.confirm': 'Import',
  'import.done': "Imported {n}. Details and covers will be filled in gradually in the background.",
  'common.ok': 'OK',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.retry': 'Retry',
  'common.delete': 'Delete',
  'common.copied': 'Could not open a browser; link copied',
  'common.copy': 'Copy',
  'common.copiedText': 'Copied',
  'common.copyFailed': 'Could not copy',
  'common.pressAgainToExit': 'Press back again to exit',
  'err.INVALID_ID': "Enter a numeric ID (e.g. 228922 or #228922) or paste a /g/ URL",
  'err.DUPLICATE': 'This one is already in your collection',
  'err.OFFLINE': 'Can’t reach the network. Check your connection, then tap Retry',
  'err.TIMEOUT': 'The site is responding slowly. Wait a moment, then tap Retry',
  'err.NOT_FOUND': 'No gallery with this ID. Please check the number',
  'err.BLOCKED': 'The site is refusing connections for now. Try again in a few minutes',
  'err.CHALLENGE': 'The site wants a security check first. Tap Verify; it retries automatically afterwards',
  'challenge.verify': 'Verify',
  'challenge.title': 'Site security check',
  'challenge.notPassed': 'Verification not completed',
  'err.RATE_LIMITED': 'Too many lookups; the site asked us to pause. Try again in {sec}s',
  'err.BAD_FORMAT': 'The site’s data format may have changed. Run Settings → Advanced → Test connection, or wait for an app update',
  'err.COVER_FAILED': 'Cover download failed. Tap "⋮" on the cover, then the reload icon at the top right of the menu',
  'err.STORAGE_FULL': 'Your phone is out of storage. Free up space (or Clear cover cache in Settings) and try again',
  'err.DB_FAILED': 'Couldn’t save the data. Restart the app and try again',
  'err.FOLDER_NAME_INVALID': 'Name must be 1–30 chars and not a built-in folder name',
  'err.FOLDER_NAME_DUP': 'A folder with this name already exists',
  'err.SEPARATOR_NAME_INVALID': 'Divider names can be up to 30 characters',
  'err.ENDPOINT_INVALID': 'Invalid endpoint (https and required fields only)',
  'err.CSV_INVALID': 'Cannot read CSV (UTF-8, max 5 MB, needs a gallery_id column)',
  'err.TAGDB_FAILED': "Couldn't update the translation data. It will retry automatically",
  'err.UNKNOWN': 'Something unexpected went wrong. Restart the app; report it if it keeps happening',
  'err.WRITE_FAILED': 'Couldn’t save the cover file (not a network problem). Tap Clear cover cache in Settings and try again; report it if it keeps failing',
  'book.menu': "More actions",
  'book.loading': "Loading",
  'book.notFound': "Not found",
  'book.metaFailed': "Data error",
  'book.coverFailed': "Cover failed",
  'book.copyId': "Copy ID",
  'book.idCopied': "Copied #{id}",
  'book.changeId': "Change ID",
  'book.classify': "Folders…",
  'book.requeued': 'Queued to update tags and cover',
  'book.refresh': 'Reload (update tags and cover)',
  'select.count': "{n} selected",
  'select.all': "Select all",
  'select.none': "Select none",
  'select.classify': "Add to folders",
  'select.classifyTitle': "Add {n} to folders",
  'select.classified': "Added {n} to {f} folder(s)",
  'select.removeFromFolder': "Remove from folder",
  'select.removed': "Removed {n}",
  'select.delete': "Delete",
  'select.deleteConfirm': "Delete {n} item(s) from the library?\nTheir cover files will be deleted too. This cannot be undone.",
  'select.deleted': "Deleted {n}",
  'queue.rateLimited': "Too many requests — retrying automatically ({sec}s)",
  'queue.offline': "Can't connect — retrying in {sec}s",
  'queue.challenge': "The site requires verification; background fetching is paused",
  'queue.progress': "Fetching details in background: {n} left",
  'add.recent': "Recently added",
  'add.alreadyHere': "#{id} is already saved; folders unchanged (in: {names})",
  'add.addedExisting': "Added #{id} (already in: {names})",
  'share.noId': "No gallery ID found in the shared content",
  'book.note': "Note",
  'book.notePlaceholder': "Add a note (saved when you tap elsewhere)",
  'settings.showNote': "Show notes under covers",
  'settings.recentLimit': "Items in \"Recently added\"",
  'settings.web': "Opening pages",
  'settings.openMode': "Open pages in",
  'settings.openMode.external': "External browser",
  'settings.openMode.custom_tab': "In-app browser",
  'settings.openModeHint': "With the external browser, the page stays open after you share it back to the app; the in-app browser closes when you share.",
  'settings.mama': "Privacy mode",
  'settings.mamaHint': "Nothing awkward if someone glances at your screen. The \"⋮\" menu still shows everything.",
  'settings.mamaDetail': "Details",
  'settings.mamaScope': "Apply to",
  'settings.mamaScope.library': "Folders page (cover grid)",
  'settings.mamaScope.add': "\"Recently added\" on the Add page (also hides folders)",
  'settings.mamaHide': "Hide",
  'settings.mamaHide.cover': "Covers",
  'settings.mamaHide.title': "Titles",
  'settings.mamaHide.note': "Notes",
  'filter.mode': 'Mode',
  'filter.mode.exclude': 'Exclude',
  'filter.mode.any': 'Any',
  'filter.mode.all': 'All',
  'filter.modeHint.exclude': 'Has none of the selected',
  'filter.modeHint.any': 'Has at least one of the selected',
  'filter.modeHint.all': 'Has every one of the selected',
  'filter.modePrefix': '{mode}: {text}',
  'filter.modeDefault': ' (default)',
  'settings.tagShowOriginal': 'Show original names too',
  'settings.tagShowOriginalHint': 'Shows the original tag in small grey text next to the translation, e.g. "全彩 full color". Needs the translation switch above to be on.',
  'settings.helpHint': 'Tap here to see how each feature works',
  help: `Tap a title to expand or collapse it.

# 📥 Adding items
## How do I add an item?
- On the Add page, enter an ID (a URL or #228922 also works) and tap Add — no waiting for the network.
- Title and cover are filled in automatically in the background, and "Recently added" updates by itself.
## How are folders chosen?
- Your last folder choice is remembered, so you don't have to pick it again for every item.
- The grey icon to the right of the folder field resets it to the default (Uncategorized, Unread).
## What if I add an item I already have?
- It isn't saved twice; it is only put into the newly selected folders.

# 🔗 Sharing from the browser
## How do I save from the browser?
- On an nhentai web page, tap Android's Share and choose NH Shelfie.
## Two ways to share
- "Open app to choose" (default): the app opens with the ID filled in; pick folders and tap Add.
- "Save instantly": you stay in the browser and see "Saved". Title and cover are filled in the next time you open the app.
- Switch between them under Sharing on the Settings page.
## Where do instantly saved items go?
- Into the folders set in "Folders for instant saves" (Unread by default).
- Items you already have are left unchanged.

# 📁 Folders
## The four fixed folders
- All, Uncategorized, Unread and ⭐ Favorites are always at the top and can't be renamed or deleted.
- Uncategorized means items that aren't in any folder you created (Unread and Favorites don't count).
## How do Unread and Favorites work?
- New items go into Unread by default; when you're done with one, tap "⋮" → Remove from "Unread".
- Add the ones you like to Favorites.
## How do I organize my own folders?
- An item can be in several folders.
- In the folder menu: drag "≡" to reorder, tap "⋯" to rename or delete, and create a new folder at the bottom.
- Manage folders lets you add dividers to group your folders.

# 🔍 Search and filters
## How do I find an item?
- First row of the Folders page: type to find a tag, artist or group, then tick it to filter.
- Second row: search by title, note or ID; the folder filter on the right lets you tick several folders.
## What is "Mode"?
- Exclude: has none of the selected.
- Any: has at least one of the selected.
- All: has every one of the selected.
- Tags and folders each have their own mode; tags default to All, folders default to Any.
## How do I clear the filters?
- "Clear all" only unticks.
- "Clear all filters" goes back to no filtering at all.
## How do I sort?
- Choose the sort order on the right of the first row; each folder remembers its own.

# 📖 Item menu (⋮)
## How do I open it?
- Tap "⋮" at the top-right of a cover, or long-press an item in "Recently added".
## What can I do there?
- See the full titles, write a note (saved when you tap elsewhere) and copy the ID.
- Choose folders: saved as you tick, no OK button needed.
- Remove the item from the current folder, or delete it.
## Something wrong with the cover or info?
- The grey reload icon at the top right of the menu looks the item up again and updates its tags and cover.
- For items that were not found, you can "Change ID" here.

# ☑️ Multi-select
## Handle many items at once
- Long-press a cover to start selecting; tap covers to select or deselect.
- Use the bottom bar to add to folders, remove from this folder or delete.
- Press Back to leave multi-select.

# 🌐 Opening pages
## How do I view an item's web page?
- Tap a cover or a row in "Recently added" to open its web page.
## Which browser is used?
- Under Opening pages on the Settings page, choose the external browser (default) or the in-app browser.

# 🏷️ Tag translation
## Show tags in Chinese or Japanese
- Turn on Tag translation on the Settings page and the tag filter shows translated names.
- 繁中 / 简中 show Chinese, 日本語 shows Japanese, English shows the original tags; tags without a translation stay as they are.
- You can search by either the original or the translated name.
## Want to see the original too?
- Turn on "Show original names too" and the original appears in small grey text next to the translation.
## Does it change my data?
- No — it only affects how the tag filter is displayed.
- Translation data is downloaded from GitHub at most once a day.

# 🙈 Privacy mode
## Keep covers away from prying eyes
- Turn on Privacy mode on the Settings page and covers are replaced with grey boxes.
- Titles and notes can be hidden too.
## What can I adjust?
- "Details" lets you choose which pages it applies to and what to hide.
- Menus opened with "⋮" are shown as usual.

# 💾 Backup / new phone
## How do I back up?
- Under Data on the Settings page, tap Export CSV, then save it to cloud storage or send it to yourself via the share sheet.
- Exporting about once a month is a good habit.
## How do I move to a new phone?
- After installing on the new phone, tap Import CSV; titles and covers are fetched again by ID.
- The CSV also keeps your folder order, dividers, Unread and Favorites, and sharing settings.

# ⏬ Background download
## When are titles and covers fetched?
- By default, only while the app is on screen.
## Want to keep using your phone meanwhile?
- Under Data on the Settings page, turn on Background download: fetching continues when you switch apps or turn off the screen, and a notification shows the progress.
- It needs notification permission and does not make fetching faster.

# ❓ Not loading?
## "Too many requests" or "Can't connect"
- The app retries automatically — nothing to do.
## The site asks for verification
- Tap "Verify" on the notice bar.
## It keeps failing
- Under Advanced on the Settings page, tap Test connection.

🔒 All data stays on this device and is never uploaded anywhere.`,
}

const ja = {
  'nav.folders': 'フォルダ',
  'nav.add': '追加',
  'nav.settings': '設定',
  'folder.all': 'すべて',
  'folder.uncat': '未分類',
  'folder.unread': '未読',
  'folder.fav': 'お気に入り',
  'folder.new': '新しいフォルダ',
  'folder.namePlaceholder': 'フォルダ名（1〜30文字）',
  'folder.rename': '名前を変更',
  'folder.delete': 'フォルダを削除',
  'folder.pick': 'フォルダを選択',
  'folder.more': 'その他の操作',
  'folder.dragHandle': '押さえてドラッグで並べ替え',
  'folder.deleteConfirm': 'フォルダ「{name}」を削除しますか？\n本は削除されず、どのフォルダにもない本は「未分類」に戻ります。',
  'folder.empty': 'まだ本がありません',
  'folder.emptyHint': '「追加」ページで ID を入力してください',
  'folder.manage': 'フォルダを管理',
  'folder.manageHint': '「≡」を長押ししてドラッグで並べ替え、タップで名前の変更や削除ができます。「すべて」「未分類」「未読」「お気に入り」は常に先頭にあり、変更できません。',
  'sep.title': '区切り線',
  'sep.new': '区切り線を追加',
  'sep.namePlaceholder': '区切り線の名前（省略可、30 文字まで）',
  'sep.delete': '区切り線を削除',
  'settings.folders': 'フォルダ',
  'settings.tagTranslate': 'タグ翻訳',
  'settings.tagTranslateSwitch': 'タグの絞り込みに翻訳名を表示',
  'settings.tagTranslateHint': '「フォルダ」ページのタグ絞り込みだけに影響します。翻訳のないタグは原文のまま表示されます。翻訳は中国語と日本語があり、アプリの言語に合わせて表示されます（英語では原文のまま）。オンにすると、現在の言語の翻訳データ（中国語は約 1.3 MB、日本語は約 1.6 MB）を GitHub から 1 日 1 回まで取得します。',
  'settings.tagTrStatus': '翻訳データ：{count} 件、{date} 更新',
  'settings.tagTrNone': '翻訳データは未取得です',
  'settings.tagTrUpdating': '更新中…',
  'settings.tagTrUpdateNow': '今すぐ更新',
  'settings.tagTrCredit': '中国語の翻訳データ：EhTagTranslation（CC BY-NC-SA 3.0）',
  'settings.tagTrCreditJa': '日本語の翻訳データ：EhPanda Tag Database（タグ一覧：EhTagTranslation、CC BY-NC-SA 3.0／日本語名：e-hentaidb.com、CC BY 4.0）',
  'settings.tagTrNoLang': '現在のアプリの言語には翻訳データがないため、タグは原文のまま表示されます',
  'settings.share': '共有',
  'settings.shareMode': 'ブラウザから NH Shelfie に共有したとき',
  'settings.shareMode.open': 'アプリを開いて選ぶ',
  'settings.shareMode.quick': 'すぐに保存',
  'settings.shareModeHint': '「すぐに保存」ではブラウザに留まったまま「保存しました」と表示されます。タイトルと表紙は次にアプリを開いたときに取得します。',
  'settings.shareAutoFolders': 'すぐに保存するときの追加先',
  'share.saved': '#{id} を保存しました',
  'share.duplicate': '#{id} は保存済みです（変更なし）',
  'share.notNh': 'nhentai の作品ではありません',
  'share.failed': '保存できませんでした。アプリを開いてもう一度お試しください',
  'share.drained': '共有された {n} 件を追加しました',
  'filter.tagFilter': 'タグ絞り込み',
  'filter.tagPlaceholder': 'タグ／作者／サークル',
  'filter.textPlaceholder': 'タイトル／メモ／ID',
  'filter.tagsSelected': '{n} 件選択中',
  'filter.clear': 'すべて解除',
  'filter.done': '完了',
  'filter.clearAll': '絞り込みをすべて解除',
  'filter.found': '{n} 冊見つかりました',
  'filter.noOption': '一致する候補がありません',
  'filter.noTags': 'タグはまだありません（作品情報の取得後に表示されます）',
  'filter.noResult': '条件に一致する作品がありません',
  'filter.folderTitle': 'フォルダ絞り込み',
  'filter.foldersN': '{n} 個のフォルダ',
  'tagType.tag': 'タグ',
  'tagType.artist': '作者',
  'tagType.group': 'サークル',
  'sort.added_desc': '追加日（新しい順）',
  'sort.added_asc': '追加日（古い順）',
  'sort.id_desc': 'ID（大きい順）',
  'sort.id_asc': 'ID（小さい順）',
  'sort.title': 'タイトル',
  'book.removeFromFolder': "「{name}」から外す",
  'book.delete': "ライブラリから削除",
  'book.deleteConfirm': "#{id} をライブラリから削除しますか？表紙ファイルも削除されます。",
  'add.placeholder': "ID・#ID を入力、または URL を貼り付け",
  'add.folders': 'フォルダ',
  'add.noFolder': '未分類',
  'add.resetFolders': 'フォルダを初期設定に戻す（未分類・未読）',
  'add.submit': "追加",
  'add.duplicate': '#{id} は保存済み',
  'add.inFolders': 'フォルダ：{names}',
  'add.added': "#{id} を追加しました",
  'add.hint': "ID（URL や #123456 も可）を入力して「追加」を押します。タイトルと表紙はバックグラウンドで自動取得されます。",
  'settings.appearance': '外観',
  'settings.themeColor': 'テーマカラー',
  'settings.darkMode': 'ダークモード',
  'settings.dark.system': 'システムに従う',
  'settings.dark.light': 'ライト',
  'settings.dark.dark': 'ダーク',
  'settings.gridColumns': '1 行の表紙数',
  'settings.language': '言語',
  'settings.language.auto': 'システムに従う',
  'settings.data': 'データ',
  'settings.export': 'CSV をエクスポート',
  'settings.import': 'CSV をインポート',
  'settings.lastExport': '前回のエクスポート：{date}',
  'settings.neverExported': 'まだエクスポートしていません',
  'settings.exportReminder': '30 日以上エクスポートしていません。バックアップをおすすめします。',
  'settings.pending': "詳細・表紙の取得待ち {n} 件",
  'settings.resumeQueue': '取得を再開',
  'settings.bgSync': 'バックグラウンドでダウンロード',
  'settings.bgSyncHint': 'オンにすると、他のアプリを使っているときや画面オフのときもタイトルと表紙の取得を続けます。通知に進み具合を表示します（タイトルや表紙は表示しません）。速度は変わりません。1 日に最長約 6 時間までです。',
  'settings.bgSyncDenied': 'バックグラウンドでのダウンロードには通知の許可が必要です。システム設定で NH Shelfie の通知を許可してから、もう一度お試しください。',
  'settings.bgSyncNoPerm': '通知がオフのため、バックグラウンドでのダウンロードは動作していません。',
  'bgSync.title': '同期中',
  'bgSync.progress': '残り {n} 件',
  'bgSync.paused': '同期を一時停止しました。アプリを開いて確認してください。',
  'bgSync.stop': '停止',
  'bgSync.channel': 'バックグラウンドでのダウンロード',
  'settings.queueRunning': '取得中…',
  'settings.refetchMissing': '不足している表紙をすべて再取得',
  'settings.refetchMarked': '{n} 冊を取得します',
  'settings.coversSize': '表紙：{count} 枚、{size}',
  'settings.calcSize': '表紙の使用容量を計算',
  'settings.clearCache': '表紙キャッシュを削除',
  'settings.cleared': '削除しました',
  'settings.advanced': '詳細',
  'settings.endpoints': 'サイトのエンドポイント',
  'settings.endpointWarning': 'サイトの URL が変わった時だけ変更してください。https のみ、不明なドメインは入力しないでください。',
  'settings.endpointDetail': '詳細 API v2（{id} を含む）',
  'settings.endpointCdn': '表紙サーバー一覧 API（CDN 設定）',
  'settings.endpointPage': 'ページ（{id} を含む）',
  'settings.save': '保存',
  'settings.restoreDefault': '初期値に戻す',
  'settings.saved': '保存しました',
  'settings.testConnection': '接続テスト',
  'settings.testing': 'テスト中…',
  'settings.testResult': '詳細：{detail}\n表紙：{cover}',
  'settings.diagnostics': '診断',
  'settings.fetchLog': '直近 {total} 回の成功率：{rate}',
  'settings.fetchLogEmpty': '取得履歴はまだありません',
  'settings.about': 'このアプリについて',
  'settings.help': '使い方',
  'settings.version': 'バージョン',
  'settings.devModeOn': '開発者モードをオンにしました',
  'settings.devModeOff': '開発者モードをオフにしました',
  'settings.fetchMode': '取得方法',
  'settings.fetchMode.auto': '自動',
  'settings.fetchMode.native': 'ネイティブ',
  'settings.fetchMode.webview': 'WebView',
  'settings.lastFetchVia': '前回の成功：{via}',
  'settings.resetVerification': '確認をリセット（Cookie を削除）',
  'settings.verificationReset': '確認データを削除しました',
  'settings.tempSize': '表紙キャッシュ（一時）：{count} 件、{size}。保存済みの表紙は削除されません。',
  'import.preview': '{ok} 件を追加、{skip} 件をスキップします。',
  'import.layout': 'フォルダの順序・区切り線・共有設定も復元します。',
  'import.syncEta': 'タイトルと表紙はインポート後に少しずつ取得します。約 {min} 分かかります。',
  'import.syncHintOff': 'アプリを画面に表示している間だけ取得します。他のアプリに切り替えたり画面をオフにすると一時停止し、次に開いたときに再開します。バックグラウンドでも続けたい場合は、先に「設定 → データ → バックグラウンドでダウンロード」をオンにしてください。',
  'import.syncHintOn': 'バックグラウンドでのダウンロードがオンです。他のアプリを使っているときや画面オフのときも取得を続け、通知に進み具合を表示します。',
  'import.reasons': 'スキップ理由：',
  'import.reason.invalid_id': '{line} 行目：ID が無効',
  'import.reason.duplicate': '{line} 行目：保存済み',
  'import.reason.duplicate_in_file': '{line} 行目：ファイル内で重複',
  'import.reason.invalid_folder': '{line} 行目：フォルダ名が無効',
  'import.reason.invalid_date': '{line} 行目：日付が無効',
  'import.reason.too_many_rows': '20,000 行を超えた分は無視しました',
  'import.confirm': 'インポート',
  'import.done': "{n} 件をインポートしました。詳細と表紙はバックグラウンドで順次取得されます。",
  'common.ok': 'OK',
  'common.cancel': 'キャンセル',
  'common.close': '閉じる',
  'common.retry': '再試行',
  'common.delete': '削除',
  'common.copied': 'ブラウザを開けないため、リンクをコピーしました',
  'common.copy': 'コピー',
  'common.copiedText': 'コピーしました',
  'common.copyFailed': 'コピーできませんでした',
  'common.pressAgainToExit': 'もう一度戻るで終了',
  'err.INVALID_ID': "数字の ID（例：228922 や #228922）を入力するか、/g/ の URL を貼り付けてください",
  'err.DUPLICATE': 'すでにコレクションにあります',
  'err.OFFLINE': 'ネットワークにつながりません。接続を確認してから「再試行」を押してください',
  'err.TIMEOUT': 'サイトの応答が遅いです。少し待ってから「再試行」を押してください',
  'err.NOT_FOUND': 'この ID の作品が見つかりません。番号を確認してください',
  'err.BLOCKED': 'サイトが一時的に接続を拒否しています。数分後にお試しください',
  'err.CHALLENGE': 'サイトのセキュリティ確認が必要です。「確認する」を押すと、完了後に自動で再試行します',
  'challenge.verify': '確認する',
  'challenge.title': 'サイトのセキュリティ確認',
  'challenge.notPassed': '確認が完了しませんでした',
  'err.RATE_LIMITED': '検索が多すぎるため、サイトから一時停止を求められました。{sec} 秒後に再試行できます',
  'err.BAD_FORMAT': 'サイトのデータ形式が変わった可能性があります。「設定 → 詳細 → 接続テスト」で確認するか、アプリの更新をお待ちください',
  'err.COVER_FAILED': '表紙を取得できませんでした。表紙右上の「⋮」を開き、メニュー右上の再読み込みをタップしてください',
  'err.STORAGE_FULL': 'ストレージが不足しています。空き容量を作る（または設定の「表紙キャッシュを削除」）してから再試行してください',
  'err.DB_FAILED': 'データを保存できませんでした。アプリを再起動して再試行してください',
  'err.FOLDER_NAME_INVALID': '1〜30 文字で、組み込みフォルダ名以外にしてください',
  'err.FOLDER_NAME_DUP': '同じ名前のフォルダがあります',
  'err.SEPARATOR_NAME_INVALID': '区切り線の名前は 30 文字までです',
  'err.ENDPOINT_INVALID': 'エンドポイントが正しくありません（https と必須項目が必要）',
  'err.CSV_INVALID': 'CSV を読み込めません（UTF-8、5 MB 以内、gallery_id 列が必要）',
  'err.TAGDB_FAILED': '翻訳データを更新できませんでした。後で自動的に再試行します',
  'err.UNKNOWN': '予期しないエラーが発生しました。アプリを再起動し、続く場合は報告してください',
  'err.WRITE_FAILED': '表紙ファイルを保存できませんでした（ネットワークの問題ではありません）。設定の「表紙キャッシュを削除」を押して再試行し、続く場合は報告してください',
  'book.menu': "その他の操作",
  'book.loading': "読み込み中",
  'book.notFound': "見つかりません",
  'book.metaFailed': "データ取得失敗",
  'book.coverFailed': "表紙取得失敗",
  'book.copyId': "ID をコピー",
  'book.idCopied': "#{id} をコピーしました",
  'book.changeId': "ID を修正",
  'book.classify': "フォルダを選択",
  'book.requeued': 'タグと表紙をバックグラウンドで更新します',
  'book.refresh': '再読み込み（タグと表紙を更新）',
  'select.count': "{n} 件選択中",
  'select.all': "すべて選択",
  'select.none': "選択を解除",
  'select.classify': "フォルダに追加",
  'select.classifyTitle': "{n} 件をフォルダに追加",
  'select.classified': "{n} 件を {f} 個のフォルダに追加しました",
  'select.removeFromFolder': "このフォルダから外す",
  'select.removed': "{n} 件を外しました",
  'select.delete': "削除",
  'select.deleteConfirm': "{n} 件をライブラリから削除しますか？\n表紙ファイルも削除され、元に戻せません。",
  'select.deleted': "{n} 件を削除しました",
  'queue.rateLimited': "リクエストが多すぎます。自動で再試行します（{sec} 秒）",
  'queue.offline': "接続できません。{sec} 秒後に自動で再試行します",
  'queue.challenge': "サイトの認証が必要なため、バックグラウンド取得を一時停止しています",
  'queue.progress': "バックグラウンドで取得中：残り {n} 件",
  'add.recent': "最近追加",
  'add.alreadyHere': "#{id} は保存済みです。フォルダは変更していません（{names}）",
  'add.addedExisting': "#{id} を追加しました（既存：{names}）",
  'share.noId': "共有された内容に ID が見つかりません",
  'book.note': "メモ",
  'book.notePlaceholder': "メモを入力（ほかの場所をタップで自動保存）",
  'settings.showNote': "表紙の下にメモを表示",
  'settings.recentLimit': "「最近追加」の表示件数",
  'settings.web': "ページを開く",
  'settings.openMode': "ページの開き方",
  'settings.openMode.external': "外部ブラウザ",
  'settings.openMode.custom_tab': "アプリ内ブラウザ",
  'settings.openModeHint': "外部ブラウザなら、ページから「共有」でアプリに戻っても元のページが残ります。アプリ内ブラウザは共有時に閉じられます。",
  'settings.mama': "ママモード",
  'settings.mamaHint': "画面を見られても気まずくならないように隠します。「⋮」メニューは通常どおり表示されます。",
  'settings.mamaDetail': "詳細設定",
  'settings.mamaScope': "適用するページ",
  'settings.mamaScope.library': "フォルダページ（表紙一覧）",
  'settings.mamaScope.add': "追加ページの「最近追加」（フォルダ名も隠す）",
  'settings.mamaHide': "隠す内容",
  'settings.mamaHide.cover': "表紙",
  'settings.mamaHide.title': "タイトル",
  'settings.mamaHide.note': "メモ",
  'filter.mode': '条件',
  'filter.mode.exclude': '除外',
  'filter.mode.any': 'いずれか',
  'filter.mode.all': 'すべて',
  'filter.modeHint.exclude': '選んだものを 1 つも含まない',
  'filter.modeHint.any': '選んだもののどれか 1 つを含む',
  'filter.modeHint.all': '選んだものをすべて含む',
  'filter.modePrefix': '{mode}：{text}',
  'filter.modeDefault': '（既定）',
  'settings.tagShowOriginal': '原文も表示',
  'settings.tagShowOriginalHint': '翻訳名の横に原文を小さな灰色の文字で表示します（例：「フルカラー full color」）。上の翻訳表示をオンにしているときだけ有効です。',
  'settings.helpHint': '各機能の使い方はこちら',
  help: `見出しをタップすると開閉できます。

# 📥 作品を追加
## 作品を追加するには？
- 「追加」ページで ID（URL や #228922 も可）を入力し、「追加」を押すだけで完了です。通信を待つ必要はありません。
- タイトルと表紙はバックグラウンドで自動的に取得され、「最近追加」の一覧も更新されます。
## フォルダの選び方
- 前回選んだフォルダを覚えているので、続けて追加するときに毎回選び直す必要はありません。
- フォルダ欄の右にある灰色のアイコンで初期設定（未分類・未読）に戻せます。
## 保存済みの作品を追加すると？
- 二重には保存されず、新しく選んだフォルダに入るだけです。

# 🔗 ブラウザから共有
## ブラウザから保存するには？
- nhentai のウェブページで Android の「共有」から NH Shelfie を選びます。
## 2 つの共有方法
- 「アプリを開いて選ぶ」（既定）：アプリが開いて ID が入力されるので、フォルダを選んで「追加」を押します。
- 「すぐに保存」：ブラウザに留まったまま「保存しました」と表示されます。タイトルと表紙は次にアプリを開いたときに取得します。
- 「設定」ページの「共有」で切り替えます。
## すぐに保存した作品はどこに入る？
- 「すぐに保存するときの追加先」のフォルダ（既定は未読）に入ります。
- 保存済みの作品は何も変更されません。

# 📁 フォルダと分類
## 固定の 4 つのフォルダ
- 「すべて」「未分類」「未読」「⭐ お気に入り」は常に先頭にあり、名前の変更や削除はできません。
- 「未分類」は自分で作ったフォルダに 1 つも入っていない作品です（未読・お気に入りは含みません）。
## 未読とお気に入りの使い方
- 新しい作品は既定で「未読」に入ります。読み終えたら「⋮」→『「未読」から外す』を選びます。
- 気に入った作品は「お気に入り」に追加できます。
## 自分のフォルダを整理するには？
- 1 つの作品を複数のフォルダに入れられます。
- フォルダメニューでは、「≡」を押さえてドラッグで並べ替え、「⋯」で名前の変更・削除、一番下で新規作成ができます。
- 「フォルダを管理」では区切り線を追加して、フォルダをグループ分けできます。

# 🔍 検索と絞り込み
## 作品を探すには？
- 「フォルダ」ページ上部の 1 行目：文字を入力してタグ・作者・サークルを探し、チェックすると絞り込まれます。
- 2 行目：タイトル・メモ・ID で検索します。右側はフォルダの絞り込みで、複数チェックできます。
## 「条件」とは？
- 除外：選んだものを 1 つも含まない。
- いずれか：選んだもののどれか 1 つを含む。
- すべて：選んだものをすべて含む。
- タグとフォルダは別々に設定します。タグの既定は「すべて」、フォルダの既定は「いずれか」です。
## 絞り込みを解除するには？
- 「すべて解除」はチェックを外すだけです。
- 「絞り込みをすべて解除」は絞り込みのない状態に戻します。
## 並べ替えるには？
- 1 行目の右側で並び順を選べます。フォルダごとに覚えています。

# 📖 作品メニュー（⋮）
## 開き方
- 表紙右上の「⋮」をタップ、または「最近追加」の行を長押しします。
## できること
- 完全なタイトルの確認、メモ（ほかの場所をタップで自動保存）、ID のコピー。
- フォルダ選択：チェックするとすぐ保存されます。確定ボタンは不要です。
- 今のフォルダから外す、または作品を削除する。
## 表紙や情報がおかしいときは？
- メニュー右上の灰色の再読み込みアイコンで作品を再取得し、タグと表紙を更新します。
- 見つからなかった作品はここで「ID を修正」できます。

# ☑️ 複数選択
## まとめて操作する
- 表紙を長押しすると複数選択モードになり、表紙をタップして選択・解除します。
- 下のバーでまとめてフォルダ追加・このフォルダから外す・削除ができます。
- 戻るボタンで終了します。

# 🌐 ページを開く
## 作品のウェブページを見るには？
- 表紙または「最近追加」の行をタップすると、その作品のウェブページを開きます。
## どのブラウザで開く？
- 「設定」ページの「ページを開く」で外部ブラウザ（既定）かアプリ内ブラウザを選べます。

# 🏷️ タグ翻訳
## タグを中国語・日本語で表示する
- 「設定」ページで「タグ翻訳」をオンにすると、タグの絞り込みに翻訳名が表示されます。
- 繁中・简中は中国語、日本語は日本語、English は原文で表示されます。翻訳のないタグは原文のままです。
- 原文でも翻訳名でも検索できます。
## 原文も一緒に見たいときは？
- 「原文も表示」をオンにすると、翻訳名の横に原文が小さな灰色の文字で表示されます。
## データは変更される？
- いいえ。タグの絞り込みの表示だけに影響します。
- 翻訳データは GitHub から 1 日 1 回まで取得します。

# 🙈 ママモード
## 表紙を人に見られたくないとき
- 「設定」ページで「ママモード」をオンにすると、表紙が灰色の四角になります。
- タイトルやメモも隠せます。
## 調整できること
- 「詳細設定」で適用するページと隠す内容を選べます。
- 「⋮」で開くメニューは通常どおり表示されます。

# 💾 バックアップと機種変更
## バックアップするには？
- 「設定」ページの「データ」で「CSV をエクスポート」を押し、共有メニューからクラウドに保存するか自分に送ります。
- 月に 1 回ほどエクスポートしておくと安心です。
## 新しい端末に移すには？
- 新しい端末にインストールして「CSV をインポート」を押すと、タイトルと表紙を ID から再取得します。
- CSV にはフォルダの順序・区切り線・未読とお気に入り・共有設定も含まれます。

# ⏬ バックグラウンドでダウンロード
## タイトルと表紙はいつ取得される？
- 既定では、アプリを画面に表示している間だけ取得します。
## スマホを使いながら取得したいときは？
- 「設定」ページの「データ」で「バックグラウンドでダウンロード」をオンにすると、ほかのアプリに切り替えたり画面を消したりしても続行し、通知に進み具合が表示されます。
- 通知の許可が必要です。取得が速くなるわけではありません。

# ❓ 取得できない時
## 「リクエストが多すぎます」「接続できません」と表示される
- 自動で再試行されます。操作は不要です。
## サイトの認証を求められた
- 通知バーの「確認する」を押してください。
## ずっと取得できない
- 「設定」ページの「詳細」で「接続テスト」を押して確認してください。

🔒 すべてのデータはこの端末内だけに保存され、どこにもアップロードされません。`,
}

export const DICTS = { 'zh-TW': zhTW, 'zh-CN': zhCN, en, ja }
export const LANGUAGES = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
]

/**
 * 手機語言標籤 → App 語言。
 * zh-CN / zh-SG / zh-Hans(-*) → 简体；zh-TW / zh-HK / zh-MO / zh-Hant(-*) 與其他中文 → 繁體；ja → 日本語；其餘 → English。
 */
export function detectLang(tag) {
  const l = String(tag || '').replace(/_/g, '-').toLowerCase()
  if (/^ja\b/.test(l)) return 'ja'
  if (/^zh\b/.test(l)) {
    if (/\bhant\b/.test(l)) return 'zh-TW'
    if (/\bhans\b/.test(l) || /^zh-(cn|sg|my)\b/.test(l)) return 'zh-CN'
    return 'zh-TW'
  }
  return 'en'
}

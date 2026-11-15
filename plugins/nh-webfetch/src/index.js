// 本地 Capacitor 外掛 NhWebFetch 的 JS 端。只有 src/services/nhSource.js 可以 import 這個模組。
//
// NhWebFetch.fetchText({ url, timeoutMs })  → { status, contentType, body, ...診斷欄位 }
//   成功與失敗（err.data）都附診斷：href、title、stage、probeHref、probeTitle、readyTitle、
//   reloaded、mainFrameError、webMessageListener、webViewVersion（見 NhWebFetchPlugin.diag）
// NhWebFetch.showChallenge({ url })         → { passed: boolean }
// NhWebFetch.clearSession()                 → {}
// NhWebFetch.takeSharedText()               → { text }：取出並清除瀏覽器「分享」進來的文字（沒有時為 ''）
// NhWebFetch.openExternal({ url })         → {}：以系統瀏覽器開啟（只接受 https + nhentai 網域；沒有瀏覽器時 reject NO_BROWSER）
// NhWebFetch.addListener('shareReceived')   ：App 已在背景時收到新的分享（之後呼叫 takeSharedText 取出）
//
// 快速分享（設定「直接收藏」；入口是外掛 manifest 的 ShareReceiverActivity，原生端不碰 SQLite，只記收件匣）：
// NhWebFetch.setQuickShareConfig({ mode, hosts, ids, msgSaved, msgDuplicate, msgNotNh, msgFailed }) → {}
//   mode：'open'｜'quick'；hosts／ids：逗號分隔字串（允許的網域、已收藏 ID 快照）；提示文字含 {id}
// NhWebFetch.peekQuickShares()              → { items: [{ id, at }] }：讀出收件匣，不清除
// NhWebFetch.ackQuickShares({ ids })        → {}：把已寫進資料庫的 ID 從收件匣移除
// NhWebFetch.addListener('quickShareReceived')：App 還活著時收到直接收藏（之後呼叫 peekQuickShares）
//
// 軟鍵盤（Android 15 edge-to-edge 下網頁量不到鍵盤）：
// NhWebFetch.getKeyboardOverlap()           → { height }：鍵盤蓋住 WebView 底部的高度（CSS px）
// NhWebFetch.addListener('keyboardOverlap') ：高度改變時 { height }
//
// 背景下載（設定 bg_sync；前景服務 SyncService 只保活與顯示通知，不做網路、不碰資料庫）：
// NhWebFetch.getNotificationPermission()    → { granted }：API 32 以下一律 true；33+ 要有 POST_NOTIFICATIONS 且通知沒被關
// NhWebFetch.requestNotificationPermission()→ { granted }：API 33+ 跳系統視窗；32 以下直接回通知是否開著
// NhWebFetch.startBgSync({ title, text, stopLabel, channelName }) → {}：啟動服務並顯示通知（只在 App 於前景時呼叫）；
//   失敗 reject BG_SYNC_FAILED（例：App 已在背景、權限問題）
// NhWebFetch.updateBgSync({ text })        → {}：更新通知文字；服務沒在跑就不做事
// NhWebFetch.stopBgSync({ paused, text })   → {}：停止服務、移除通知；paused 為 true 時另留一則「已暫停」通知（文字＝text）
// NhWebFetch.clearBgSyncNotice()            → {}：清掉「已暫停」通知
// NhWebFetch.delay({ ms })                  → {}：等 ms（0–60000）毫秒；原生計時，不受背景網頁計時器限速影響
// NhWebFetch.addListener('bgSyncStopped')   ：服務自己停下 { reason: 'user'（按通知的停止）| 'timeout'（6 小時到期）
//   | 'failed'（startBgSync 已 resolve，但服務進不了前景狀態）}
import { registerPlugin } from '@capacitor/core'

export const NhWebFetch = registerPlugin('NhWebFetch')

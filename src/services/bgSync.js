// 背景下載（前景服務＋通知）的純函式：無 I/O。服務的啟停由 library.syncBgService() 依這裡的結果呼叫 nhSource。
// 規格見 docs/tasks/2026-11-background-download.md 第 2.3、2.9 節。

/**
 * 決定背景下載服務現在要做什麼。判斷順序：stop → paused → done → update → start → none。
 * 服務只在 App 於前景時啟動（Android 12 起背景不能啟動前景服務）。
 * @param {object} state
 * @param {boolean} state.enabled   設定 bg_sync === '1' 且已有通知權限
 * @param {boolean} state.active    App 在前景
 * @param {boolean} state.serviceOn JS 認為服務正在跑
 * @param {number}  state.pending   待補資料或封面的本數（pendingCount）
 * @param {boolean} state.running   佇列工作者正在跑（queueRunning）
 * @param {boolean} state.waiting   有重試計時器在等（429 或網路重試）
 * @param {boolean} state.halted    要使用者處理（Cloudflare 驗證或寫檔／空間／資料庫錯誤）
 * @returns {'start'|'update'|'done'|'paused'|'stop'|'none'}
 */
export function planBgSync(state) {
  const s = state || {}
  const enabled = !!s.enabled
  const active = !!s.active
  const serviceOn = !!s.serviceOn
  const pending = Number(s.pending) > 0 ? Number(s.pending) : 0
  const running = !!s.running
  const busy = running || !!s.waiting
  const halted = !!s.halted

  if (serviceOn && !enabled) return 'stop'
  if (serviceOn && halted) return 'paused'
  if (serviceOn && pending === 0 && !running) return 'done'
  if (serviceOn && pending > 0 && busy) return 'update'
  if (enabled && active && !serviceOn && pending > 0 && busy && !halted) return 'start'
  return 'none'
}

/**
 * 預估補完 n 本需要幾分鐘：瓶頸是 API 隊伍（每本 3 秒）；封面隊伍同時進行，不另外加。
 * @param {number} n
 * @returns {number}
 */
export function estimateSyncMinutes(n) {
  const count = Number(n)
  if (!Number.isFinite(count) || count <= 0) return 0
  return Math.ceil((Math.ceil(count) * 3) / 60)
}

/**
 * 把範本裡的 {n} 換成數字（服務層不 import i18n，通知文字範本由介面傳入）。
 * @param {string} template
 * @param {number} n
 * @returns {string}
 */
export function fillCount(template, n) {
  return String(template ?? '').replace(/\{n\}/g, String(n))
}

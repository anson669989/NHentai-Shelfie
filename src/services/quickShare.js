// 快速分享（直接收藏）的純函式：無 I/O。收件匣由原生端（QuickShareStore）保管，JS 在前景時處理。
import { hostOf } from './parse.js'

export const MAX_GALLERY_ID = 9_999_999

/** 合法的 gallery ID：1–9,999,999 的整數 */
export function isValidId(id) {
  return Number.isInteger(id) && id >= 1 && id <= MAX_GALLERY_ID
}

/**
 * 解出「直接收藏」要自動加入的資料夾 id。
 * - ''（還沒設定）、壞掉的 JSON、不是陣列 → [unreadId]
 * - 合法 JSON 陣列 → 只留存在於 folders 的 id（去重、保持順序）；'[]' 代表使用者明確選了「都不加」
 * @param {string} setting settings.share_auto_folders
 * @param {Array<{id:number}>} folders 目前存在的資料夾（含未讀、典藏）
 * @param {number|null} unreadId
 * @returns {number[]}
 */
export function resolveAutoFolders(setting, folders, unreadId) {
  const fallback = Number.isInteger(unreadId) ? [unreadId] : []
  if (typeof setting !== 'string' || setting === '') return fallback
  let arr
  try {
    arr = JSON.parse(setting)
  } catch {
    return fallback
  }
  if (!Array.isArray(arr)) return fallback
  const exist = new Set((folders || []).map((f) => f.id))
  const out = []
  for (const v of arr) {
    const n = Number(v)
    if (Number.isInteger(n) && exist.has(n) && !out.includes(n)) out.push(n)
  }
  return out
}

/**
 * 決定怎麼處理收件匣。
 * 不合法、已收藏、同一批裡重複的 ID 只進 ack（清掉但不新增）；其餘進 add（保持原順序）。
 * @param {Array<{id:number, at:number}>} items
 * @param {Iterable<number>} existingIds 資料庫裡已有的 gallery_id
 * @returns {{ add: Array<{id:number, at:number}>, ack: number[] }}
 */
export function planQuickShareDrain(items, existingIds) {
  const have = new Set(existingIds || [])
  const seen = new Set()
  const add = []
  const ack = []
  for (const it of Array.isArray(items) ? items : []) {
    const id = Number(it?.id)
    if (!isValidId(id)) {
      if (Number.isFinite(id)) ack.push(id)
      continue
    }
    if (!ack.includes(id)) ack.push(id)
    if (have.has(id) || seen.has(id)) continue
    seen.add(id)
    const at = Number(it.at)
    add.push({ id, at: Number.isFinite(at) && at > 0 ? at : Date.now() })
  }
  return { add, ack }
}

/** 直接收藏接受的網域：nhentai.net 加上「開啟網頁」端點的網域（開發者模式改過時），去重 */
export function shareHosts(endpointPage) {
  const out = ['nhentai.net']
  const h = hostOf(endpointPage)
  if (h && /^[a-z0-9.-]+$/.test(h) && !out.includes(h)) out.push(h)
  return out
}

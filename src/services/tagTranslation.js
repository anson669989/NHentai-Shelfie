// 標籤翻譯（EhTagTranslation/Database 的 db.text.json）的純函式：解析、簡繁轉換列、寫入語句、更新判斷。
// 無 I/O。只取 tag／artist／group 三類、且「翻譯與原文不同」的項目，只用 name（不存 intro 與 links）。
import { AppError, E } from './errors.js'

export const DAY_MS = 24 * 60 * 60 * 1000
export const RETRY_AFTER_FAIL_MS = 60 * 60 * 1000
const MAX_NAME_CHARS = 100

// nhentai 的 tag 沒有 namespace：依序找這幾個，先找到的為準（mixed 的翻譯是中性說法，所以排第一）
export const TAG_NAMESPACES = Object.freeze(['mixed', 'female', 'male', 'other', 'location'])

/** 40 位十六進位（commit sha） */
export function isSha(s) {
  return typeof s === 'string' && /^[0-9a-f]{40}$/i.test(s.trim())
}

/** 含平假名或片假名（U+3040–U+30FF）＝視為日文名稱，不做簡轉繁 */
export function hasKana(s) {
  return /[぀-ヿ]/.test(String(s ?? ''))
}

function entriesOf(ns) {
  const data = ns && typeof ns === 'object' ? ns.data : null
  return data && typeof data === 'object' ? Object.entries(data) : []
}

/**
 * 解析 db.text.json，輸出 { sha, rows: [{ type, name, zh }] }。
 * @throws {AppError} TAGDB_FAILED：結構不對，或完全找不到 artist／group／任何 tag namespace
 */
export function parseTagDb(json) {
  const list = json?.data
  if (!Array.isArray(list)) throw new AppError(E.TAGDB_FAILED, { cause: 'data is not an array' })
  const byNs = new Map()
  for (const ns of list) {
    if (ns && typeof ns.namespace === 'string') byNs.set(ns.namespace, ns)
  }
  const hasTagNs = TAG_NAMESPACES.some((n) => byNs.has(n))
  if (!byNs.has('artist') && !byNs.has('group') && !hasTagNs) {
    throw new AppError(E.TAGDB_FAILED, { cause: 'no usable namespace' })
  }
  const sha = isSha(json?.head?.sha) ? json.head.sha.trim().toLowerCase() : ''

  const rows = []
  const seen = new Set()
  const push = (type, rawKey, entry) => {
    const name = String(rawKey ?? '').trim().toLowerCase()
    const zh = typeof entry?.name === 'string' ? entry.name.trim() : ''
    if (!name || !zh || zh.length > MAX_NAME_CHARS) return
    if (zh.toLowerCase() === name) return // 翻譯和原文相同：不存
    const key = `${type}\u0000${name}`
    if (seen.has(key)) return // 先找到的 namespace 為準
    seen.add(key)
    rows.push({ type, name, zh })
  }
  for (const nsName of TAG_NAMESPACES) for (const [k, v] of entriesOf(byNs.get(nsName))) push('tag', k, v)
  for (const [k, v] of entriesOf(byNs.get('artist'))) push('artist', k, v)
  for (const [k, v] of entriesOf(byNs.get('group'))) push('group', k, v)
  return { sha, rows }
}

/**
 * 產生要寫進資料庫的列：zh_cn 原樣、zh_tw 用 cnToTw 轉換；含日文假名的名稱不轉換（zh_tw = zh_cn）。
 * @param {{type:string,name:string,zh:string}[]} rows
 * @param {(s:string)=>string} cnToTw
 */
export function toTranslationRows(rows, cnToTw) {
  return rows.map((r) => ({
    type: r.type,
    name: r.name,
    zh_cn: r.zh,
    zh_tw: hasKana(r.zh) ? r.zh : String(cnToTw(r.zh) || r.zh),
  }))
}

/**
 * 整批取代的交易語句：先 DELETE 全部，再每 chunk 筆組成一句多列 INSERT。
 * 每句參數數 = 4 × chunk，必須 ≤ 999（舊版 Android 的 SQLite 上限），預設 200 筆 = 800。
 */
export function translationStatements(rows, chunk = 200) {
  if (chunk * 4 > 999) throw new RangeError('chunk too large for SQLite variable limit')
  const out = [{ statement: 'DELETE FROM tag_translations', values: [] }]
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk)
    const values = []
    for (const r of part) values.push(r.type, r.name, r.zh_cn, r.zh_tw)
    out.push({
      statement: `INSERT OR REPLACE INTO tag_translations(type, name, zh_cn, zh_tw) VALUES ${part.map(() => '(?,?,?,?)').join(',')}`,
      values,
    })
  }
  return out
}

/**
 * 該不該在背景檢查更新：開關開啟，且（資料表是空的 或 距上次成功檢查已滿 24 小時），
 * 並且上次失敗後已超過 1 小時。
 */
export function isUpdateDue({ enabled, now, checkedAt = 0, lastFailedAt = 0, hasData = false }) {
  if (!enabled) return false
  if (lastFailedAt && now - lastFailedAt < RETRY_AFTER_FAIL_MS) return false
  if (!hasData) return true
  return !checkedAt || now - checkedAt >= DAY_MS
}

/** 介面語言對應的翻譯欄位名稱（寫死的對照表，不可把使用者輸入拼進 SQL）；其他語言回傳 null */
export function translationColumn(lang) {
  return { 'zh-TW': 'zh_tw', 'zh-CN': 'zh_cn' }[lang] ?? null
}

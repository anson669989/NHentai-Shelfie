// CSV 匯出 / 匯入的純函式部分（無 I/O），方便測試「匯出再匯入後資料相同」。
//
// 格式 v2（向下相容 v1）：
//   gallery_id,folders,note,added_at,system
//   #nh-shelfie,2,,,                        ← 中繼列：第一欄 # 開頭＋英文小寫代號，放在書之前
//   #folder,<名稱>,<sort_mode>,,            ← 使用者資料夾與分隔線，依畫面順序
//   #separator,<名稱>,,,
//   #setting,share_mode,quick,,              ← 只有 share_mode／share_auto_system／share_auto_folders
//   177013,收藏|巨乳,備註,2026-11-06T10:55:00+08:00,unread|fav
// - system 欄：系統資料夾的固定英文代號（unread、fav）以 | 相接；folders 欄只放使用者資料夾名稱。
// - 不認得的 #xxx 列安靜略過（不算進「跳過 N 筆」）；舊版 App 會把中繼列當成「ID 無效」跳過，書照常匯入。
import { parseGalleryId, normalizeFolderName, normalizeSeparatorName } from './parse.js'

export const CSV_HEADER = ['gallery_id', 'folders', 'note', 'added_at', 'system']
export const CSV_VERSION = 2
export const CSV_MAX_BYTES = 5 * 1024 * 1024
export const CSV_MAX_ROWS = 20000
/** 書的 system 欄允許的代號（固定英文，不隨語言變） */
export const SYSTEM_CODES = Object.freeze(['unread', 'fav'])
/** 資料夾 sort_mode 的允許值（與 library.js 的 SORT_MODES 相同） */
export const CSV_SORT_MODES = Object.freeze(['added_desc', 'added_asc', 'id_desc', 'id_asc', 'title'])
const BOM = '﻿'
const UNCATEGORIZED_ALIASES = new Set(['未分類', '未分类', 'Uncategorized', '未分類 '])
const META_RE = /^#[a-z][a-z-]*$/

/** 防止 Excel 把 = + - @ 開頭的儲存格當公式 */
function guardFormula(s) {
  return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
}
function unguardFormula(s) {
  return /^'[=+\-@\t\r]/.test(s) ? s.slice(1) : s
}
function quote(s) {
  s = String(s ?? '')
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const cell = (v) => quote(guardFormula(String(v ?? '')))

/** 以裝置時區輸出 ISO 8601，例如 2026-11-06T10:55:00+08:00 */
export function toLocalIso(unixSec) {
  const d = new Date(unixSec * 1000)
  const pad = (n) => String(Math.abs(n)).padStart(2, '0')
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
  )
}

/** 只留 unread／fav，順序固定、去重 */
const pickSystem = (list) => SYSTEM_CODES.filter((c) => (list || []).includes(c))

/** 中繼列補滿與標頭相同的欄數 */
function metaLine(cells) {
  const out = [...cells]
  while (out.length < CSV_HEADER.length) out.push('')
  return out.join(',')
}

/**
 * @param {{gallery_id:number, folders:string[], note:string|null, added_at:number, system?:string[]}[]} rows
 * @param {{
 *   layout?: {type:'folder'|'separator', name:string, sortMode?:string}[],
 *   settings?: {share_mode?:string, share_auto_system?:string[], share_auto_folders?:string[]},
 * }} [meta] layout：使用者資料夾與分隔線（依畫面順序）；settings：要備份的設定（沒給的鍵不輸出）
 * @returns {string} 含 BOM 的 CSV 文字
 */
export function buildCsv(rows, meta = {}) {
  const lines = [CSV_HEADER.join(','), metaLine(['#nh-shelfie', String(CSV_VERSION)])]
  for (const it of meta?.layout || []) {
    if (it.type === 'folder') {
      lines.push(metaLine(['#folder', cell(it.name), CSV_SORT_MODES.includes(it.sortMode) ? it.sortMode : '']))
    } else if (it.type === 'separator') {
      lines.push(metaLine(['#separator', cell(it.name)]))
    }
  }
  const st = meta?.settings || {}
  if (st.share_mode === 'open' || st.share_mode === 'quick') {
    lines.push(metaLine(['#setting', 'share_mode', st.share_mode]))
  }
  if (Array.isArray(st.share_auto_system)) {
    lines.push(metaLine(['#setting', 'share_auto_system', pickSystem(st.share_auto_system).join('|')]))
  }
  if (Array.isArray(st.share_auto_folders)) {
    lines.push(metaLine(['#setting', 'share_auto_folders', cell(st.share_auto_folders.join('|'))]))
  }
  for (const r of rows) {
    lines.push(
      [
        String(r.gallery_id),
        cell((r.folders || []).join('|')),
        cell(r.note || ''),
        toLocalIso(r.added_at),
        pickSystem(r.system).join('|'),
      ].join(','),
    )
  }
  return BOM + lines.join('\r\n') + '\r\n'
}

/** RFC 4180 風格的 CSV 解析（支援引號、跳脫雙引號、引號內換行）。 */
export function parseCsvText(text) {
  if (text.startsWith(BOM)) text = text.slice(1)
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field !== '' || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''))
}

/** 資料夾名稱清單（| 相接）：不合法的略過、去重 */
function parseFolderList(value) {
  const out = []
  for (const part of unguardFormula(String(value ?? '')).split('|')) {
    const n = normalizeFolderName(part.trim())
    if (n && !out.includes(n)) out.push(n)
  }
  return out
}

const parseSystemList = (value) =>
  pickSystem(
    String(value ?? '')
      .split('|')
      .map((s) => s.trim().toLowerCase()),
  )

/** 處理一列中繼列（寫進 meta）。不認得的代號、名稱不合法的資料夾／分隔線一律安靜略過。 */
function readMetaRow(r, meta) {
  const tag = String(r[0]).trim()
  const a = r[1] ?? ''
  const b = r[2] ?? ''
  if (tag === '#nh-shelfie') {
    const v = Number(String(a).trim())
    if (Number.isInteger(v) && v > 0) meta.version = v
  } else if (tag === '#folder') {
    const name = normalizeFolderName(unguardFormula(a).trim())
    if (!name || meta.layout.some((x) => x.type === 'folder' && x.name === name)) return
    const sortMode = String(b).trim()
    meta.layout.push(CSV_SORT_MODES.includes(sortMode) ? { type: 'folder', name, sortMode } : { type: 'folder', name })
  } else if (tag === '#separator') {
    const name = normalizeSeparatorName(unguardFormula(a))
    if (name != null) meta.layout.push({ type: 'separator', name })
  } else if (tag === '#setting') {
    const key = String(a).trim()
    if (key === 'share_mode') {
      const v = String(b).trim()
      if (v === 'open' || v === 'quick') meta.settings.share_mode = v
    } else if (key === 'share_auto_system') {
      meta.settings.share_auto_system = parseSystemList(b)
    } else if (key === 'share_auto_folders') {
      meta.settings.share_auto_folders = parseFolderList(b)
    }
  }
}

/**
 * 逐列驗證 CSV。
 * @param {string} text
 * @param {Set<number>} existingIds 已收藏的 ID（將被跳過）
 * @returns {{
 *   ok: {gallery_id:number, folders:string[], note:string, added_at:number, system:string[]}[],
 *   skipped: {line:number, reason:string, raw?:string}[],
 *   headerOk: boolean,
 *   meta: {version:number, layout:{type:'folder'|'separator', name:string, sortMode?:string}[],
 *          settings:{share_mode?:string, share_auto_system?:string[], share_auto_folders?:string[]}},
 * }} meta.version 為 0 代表沒有 #nh-shelfie 列（舊版 CSV）
 */
export function validateCsv(text, existingIds = new Set()) {
  const rows = parseCsvText(text)
  const meta = { version: 0, layout: [], settings: {} }
  const result = { ok: [], skipped: [], headerOk: false, meta }
  if (!rows.length) return result
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const idx = Object.fromEntries(CSV_HEADER.map((h) => [h, header.indexOf(h)]))
  if (idx.gallery_id < 0) return result
  result.headerOk = true

  const seen = new Set()
  let bookRows = 0
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    const line = i + 1
    // 中繼列：不進 ok 也不進 skipped
    if (META_RE.test(String(r[0] ?? '').trim())) {
      readMetaRow(r, meta)
      continue
    }
    // CSV_MAX_ROWS 只計算書的列
    if (++bookRows > CSV_MAX_ROWS) {
      result.skipped.push({ line, reason: 'too_many_rows' })
      break
    }
    const id = parseGalleryId(r[idx.gallery_id])
    if (!id || !/^\s*\d+\s*$/.test(r[idx.gallery_id] ?? '')) {
      result.skipped.push({ line, reason: 'invalid_id', raw: r[idx.gallery_id] })
      continue
    }
    if (existingIds.has(id)) {
      result.skipped.push({ line, reason: 'duplicate', raw: String(id) })
      continue
    }
    if (seen.has(id)) {
      result.skipped.push({ line, reason: 'duplicate_in_file', raw: String(id) })
      continue
    }
    const folderCell = idx.folders >= 0 ? unguardFormula(r[idx.folders] ?? '') : ''
    const folders = []
    let badFolder = false
    for (const part of folderCell.split('|')) {
      const t = part.trim()
      if (!t || UNCATEGORIZED_ALIASES.has(t)) continue
      const n = normalizeFolderName(t)
      if (!n) badFolder = true
      else if (!folders.includes(n)) folders.push(n)
    }
    if (badFolder) {
      result.skipped.push({ line, reason: 'invalid_folder', raw: folderCell })
      continue
    }
    // 備註不限長度（整個檔案受 CSV_MAX_BYTES 限制）
    const note = idx.note >= 0 ? unguardFormula(r[idx.note] ?? '') : ''
    let addedAt = Math.floor(Date.now() / 1000)
    if (idx.added_at >= 0 && (r[idx.added_at] ?? '').trim()) {
      const t = Date.parse(r[idx.added_at].trim())
      if (Number.isNaN(t)) {
        result.skipped.push({ line, reason: 'invalid_date', raw: r[idx.added_at] })
        continue
      }
      addedAt = Math.floor(t / 1000)
    }
    // system 欄（舊版 CSV 沒有＝空陣列）：只認 unread、fav，其他忽略
    const system = idx.system >= 0 ? parseSystemList(r[idx.system]) : []
    seen.add(id)
    result.ok.push({ gallery_id: id, folders, note, added_at: addedAt, system })
  }
  return result
}

/** 中繼資料是否有東西要還原（版面或設定） */
export function hasLayoutMeta(meta) {
  return !!(meta && ((meta.layout && meta.layout.length) || (meta.settings && Object.keys(meta.settings).length)))
}

/**
 * 匯入時還原「使用者資料夾＋分隔線」的順序。
 * - 資料夾以名稱比對，本機沒有的才建立（existingId 為 null）。
 * - 分隔線以「同名的第幾條」比對：CSV 第 k 條叫 X 的對應本機第 k 條叫 X 的；本機不夠才新建。
 *   所以同一個檔案匯入兩次不會多出分隔線。
 * - 順序：CSV 列出的項目依 CSV 順序在前；本機原有但 CSV 沒列的接在後面，維持原本相對順序。
 * - sortMode：只對新建的資料夾帶（既有資料夾的書本排序方式不動）。
 * @param {{type:'folder'|'separator', id:number, name:string}[]} localItems 本機的使用者資料夾與分隔線（畫面順序）
 * @param {{type:'folder'|'separator', name:string, sortMode?:string}[]} csvLayout
 * @returns {{order: {type:'folder'|'separator', name:string, existingId:number|null, sortMode?:string}[]}}
 */
export function planLayoutImport(localItems = [], csvLayout = []) {
  const local = (localItems || []).filter((x) => x && (x.type === 'folder' || x.type === 'separator'))
  const used = new Set()
  const order = []
  const seenFolders = new Set()
  const sepCount = new Map() // 名稱 → CSV 裡已出現幾條
  for (const it of csvLayout || []) {
    if (!it || (it.type !== 'folder' && it.type !== 'separator')) continue
    const name = String(it.name ?? '')
    let match = null
    if (it.type === 'folder') {
      if (seenFolders.has(name)) continue
      seenFolders.add(name)
      match = local.find((x) => x.type === 'folder' && x.name === name) || null
    } else {
      const k = sepCount.get(name) || 0
      sepCount.set(name, k + 1)
      match = local.filter((x) => x.type === 'separator' && x.name === name)[k] || null
    }
    if (match) used.add(match)
    const entry = { type: it.type, name, existingId: match ? Number(match.id) : null }
    if (it.type === 'folder' && !match && CSV_SORT_MODES.includes(it.sortMode)) entry.sortMode = it.sortMode
    order.push(entry)
  }
  for (const x of local) {
    if (!used.has(x)) order.push({ type: x.type, name: String(x.name ?? ''), existingId: Number(x.id) })
  }
  return { order }
}

// 純函式：資料夾與分隔線的合併排序與重排（不碰資料庫，由 library.js 套用）。
// 項目鍵：資料夾 'f:<id>'、分隔線 's:<id>'。
// 排列規則：系統資料夾（未讀 → 典藏）固定在最前面；其後「使用者資料夾＋分隔線」共用 sort_order 由小到大，
// sort_order 相同時資料夾在前、再依 id。

const SYSTEM_ORDER = Object.freeze(['unread', 'fav'])

/** 系統資料夾（未讀、典藏）：不能改名、刪除、排序 */
export function isSystemKind(kind) {
  return SYSTEM_ORDER.includes(kind)
}

const isPosInt = (n) => Number.isSafeInteger(n) && n > 0

/**
 * @param {'folder'|'separator'} type
 * @param {number|string} id
 * @returns {string|null} 'f:12'／'s:3'；格式不對回傳 null
 */
export function itemKey(type, id) {
  const n = Number(id)
  if (!isPosInt(n)) return null
  if (type === 'folder') return `f:${n}`
  if (type === 'separator') return `s:${n}`
  return null
}

/**
 * @param {unknown} key
 * @returns {{type:'folder'|'separator', id:number}|null}
 */
export function parseItemKey(key) {
  const m = typeof key === 'string' ? key.match(/^([fs]):(\d{1,15})$/) : null
  if (!m) return null
  const id = Number(m[2])
  if (!isPosInt(id)) return null
  return { type: m[1] === 'f' ? 'folder' : 'separator', id }
}

/**
 * 合併資料夾與分隔線成畫面上的順序。
 * @param {{id:number, name:string, kind?:string, sort_order:number, sort_mode?:string}[]} folders
 * @param {{id:number, name:string, sort_order:number}[]} separators
 * @returns {{type:'folder'|'separator', key:string, id:number, name:string, kind?:string, sort_mode?:string}[]}
 */
export function mergeFolderItems(folders = [], separators = []) {
  const sys = []
  const rest = []
  for (const f of folders || []) {
    const kind = f.kind || 'user'
    const item = { type: 'folder', key: itemKey('folder', f.id), id: Number(f.id), name: f.name, kind, sort_mode: f.sort_mode }
    if (isSystemKind(kind)) sys.push(item)
    else rest.push({ item, order: Number(f.sort_order) || 0, rank: 0 })
  }
  for (const s of separators || []) {
    const item = { type: 'separator', key: itemKey('separator', s.id), id: Number(s.id), name: s.name ?? '' }
    rest.push({ item, order: Number(s.sort_order) || 0, rank: 1 })
  }
  sys.sort((a, b) => SYSTEM_ORDER.indexOf(a.kind) - SYSTEM_ORDER.indexOf(b.kind) || a.id - b.id)
  rest.sort((a, b) => a.order - b.order || a.rank - b.rank || a.item.id - b.item.id)
  return [...sys, ...rest.map((r) => r.item)]
}

/**
 * 依拖曳結果算出最終順序：requestedKeys 中存在於 currentKeys 的（去重、保持順序）在前，
 * currentKeys 中沒被列到的（例如拖曳時別處新增的）接在後面並維持原相對順序。
 * @param {string[]} currentKeys 目前資料庫裡的順序
 * @param {unknown[]} requestedKeys 畫面送來的順序
 * @returns {string[]}
 */
export function planReorder(currentKeys = [], requestedKeys = []) {
  const known = new Set(currentKeys)
  const seen = new Set()
  const out = []
  for (const k of requestedKeys || []) {
    if (typeof k !== 'string' || !known.has(k) || seen.has(k)) continue
    seen.add(k)
    out.push(k)
  }
  for (const k of currentKeys) {
    if (!seen.has(k)) {
      seen.add(k)
      out.push(k)
    }
  }
  return out
}

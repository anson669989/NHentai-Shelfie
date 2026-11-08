// 純函式：收藏頁的搜尋與篩選（不碰資料庫；SQL 只組參數化的 WHERE，由 library.js 執行）。
// 三個條件的組合：標籤（且）且 資料夾（或）且 文字。

/** 資料夾篩選的值：'all' | 'uncat' | 資料夾 id（整數） */
const ALL = 'all'
const UNCAT = 'uncat'

/**
 * 整理資料夾篩選：只留 'uncat' 與存在的資料夾 id（去重、維持順序）；空的或含 'all' 時回到 ['all']。
 * @param {any} value 陣列或 JSON 字串
 * @param {number[]|null} validIds 目前存在的資料夾 id；null＝不檢查
 */
export function normalizeFolderFilter(value, validIds = null) {
  let arr = value
  if (typeof arr === 'string') {
    try {
      arr = JSON.parse(arr)
    } catch {
      arr = null
    }
  }
  if (!Array.isArray(arr) || arr.includes(ALL)) return [ALL]
  const valid = validIds ? new Set(validIds.map(Number)) : null
  const out = []
  for (const v of arr) {
    const k = v === UNCAT ? UNCAT : Number.isSafeInteger(Number(v)) && Number(v) > 0 ? Number(v) : null
    if (k == null || out.includes(k)) continue
    if (k !== UNCAT && valid && !valid.has(k)) continue
    out.push(k)
  }
  return out.length ? out : [ALL]
}

/**
 * 勾選／取消一個資料夾：勾「全部」清掉其他；勾其他項取消「全部」；全都不勾就回到「全部」。
 */
export function toggleFolderFilter(current, key) {
  if (key === ALL) return [ALL]
  const cur = normalizeFolderFilter(current).filter((k) => k !== ALL)
  const k = key === UNCAT ? UNCAT : Number(key)
  const next = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]
  return next.length ? next : [ALL]
}

export const isAllFolders = (f) => !f?.length || f.includes(ALL)

/** 排序依據：只選一個（含「全部」「未分類」）用它記住的排序；選多個用「全部」的排序 */
export function sortKeyOf(folderFilter) {
  const f = normalizeFolderFilter(folderFilter)
  return f.length === 1 ? f[0] : ALL
}

/** LIKE 用：跳脫 \ % _，搭配 ESCAPE '\' */
export function escapeLike(s) {
  return String(s ?? '').replace(/[\\%_]/g, (c) => '\\' + c)
}

/** 文字搜尋整理：去頭尾空白；空字串＝不篩選 */
export function normalizeSearchText(s) {
  return String(s ?? '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
}

/**
 * 組出列表查詢的 WHERE（books 別名 b）。全部參數化。
 * @param {{folders?:any[], tagIds?:number[], text?:string}} filter
 * @returns {{where:string, values:any[]}} where 不含 "WHERE" 關鍵字；沒有條件時為空字串
 */
export function buildFilterWhere({ folders = [ALL], tagIds = [], text = '' } = {}) {
  const parts = []
  const values = []

  const f = normalizeFolderFilter(folders)
  if (!isAllFolders(f)) {
    const or = []
    if (f.includes(UNCAT)) or.push('NOT EXISTS (SELECT 1 FROM book_folders bf WHERE bf.gallery_id = b.gallery_id)')
    const ids = f.filter((k) => k !== UNCAT)
    if (ids.length) {
      or.push(
        `EXISTS (SELECT 1 FROM book_folders bf WHERE bf.gallery_id = b.gallery_id AND bf.folder_id IN (${ids.map(() => '?').join(',')}))`,
      )
      values.push(...ids)
    }
    parts.push(`(${or.join(' OR ')})`)
  }

  const tags = [...new Set((tagIds || []).map(Number).filter((n) => Number.isSafeInteger(n) && n > 0))]
  if (tags.length) {
    parts.push(
      `b.gallery_id IN (SELECT gallery_id FROM book_tags WHERE tag_id IN (${tags.map(() => '?').join(',')}) GROUP BY gallery_id HAVING COUNT(DISTINCT tag_id) = ?)`,
    )
    values.push(...tags, tags.length)
  }

  const q = normalizeSearchText(text)
  if (q) {
    const like = `%${escapeLike(q)}%`
    const idq = q.replace(/^[#＃]\s*/, '')
    const idLike = /^\d+$/.test(idq) ? `%${idq}%` : like
    parts.push(
      "(b.title LIKE ? ESCAPE '\\' OR b.title_ja LIKE ? ESCAPE '\\' OR b.title_en LIKE ? ESCAPE '\\'" +
        " OR COALESCE(b.note, '') LIKE ? ESCAPE '\\' OR CAST(b.gallery_id AS TEXT) LIKE ? ESCAPE '\\')",
    )
    values.push(like, like, like, like, idLike)
  }

  return { where: parts.join(' AND '), values }
}

/** 是否有任何篩選（顯示「找到 N 本」與「清除全部篩選」） */
export function hasActiveFilter({ folders = [ALL], tagIds = [], text = '' } = {}) {
  return !isAllFolders(normalizeFolderFilter(folders)) || tagIds.length > 0 || !!normalizeSearchText(text)
}

/**
 * 標籤選項清單：打字即時篩選（不分大小寫、比對名稱任一部分）；
 * 已勾選的排最上面（不受打字影響），其他依本數多到少、同本數依名稱。最多回傳 limit 筆。
 * @param {{id:number, type:string, name:string, n:number}[]} options
 * @param {string} query
 * @param {Iterable<number>} selectedIds
 * @returns {{items:object[], more:number}} more：因數量上限沒列出的筆數
 */
export function filterTagOptions(options, query, selectedIds = [], limit = 200) {
  const sel = new Set([...selectedIds].map(Number))
  const q = normalizeSearchText(query).toLowerCase()
  const picked = []
  const rest = []
  for (const o of options || []) {
    if (sel.has(o.id)) picked.push(o)
    else if (!q || String(o.name).toLowerCase().includes(q)) rest.push(o)
  }
  const cmp = (a, b) => b.n - a.n || String(a.name).localeCompare(String(b.name))
  picked.sort(cmp)
  rest.sort(cmp)
  const all = [...picked, ...rest]
  return { items: all.slice(0, limit), more: Math.max(0, all.length - limit) }
}

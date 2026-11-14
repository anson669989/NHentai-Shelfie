// 純函式（介面層共用）：資料夾的顯示名稱與選單列。t 由參數傳入，方便單元測試。
// 系統資料夾（未讀、典藏）在資料庫裡的 name 只是佔位字串，任何畫面都不可直接顯示——一律經 folderLabel。

const SYSTEM_LABEL = { unread: 'folder.unread', fav: 'folder.fav' }
// 系統資料夾名稱前的圖示（寫在程式裡、不放進 locales.js）
const SYSTEM_ICON = { fav: '⭐ ' }

const systemName = (kind, t) => (SYSTEM_ICON[kind] || '') + t(SYSTEM_LABEL[kind])

/** 資料夾顯示名稱：未讀／典藏取翻譯（典藏前面加 ⭐），其他用自己的名稱 */
export function folderLabel(folder, t) {
  if (!folder) return ''
  return SYSTEM_LABEL[folder.kind] ? systemName(folder.kind, t) : String(folder.name ?? '')
}

/**
 * 一本書所在資料夾的顯示文字（新增頁「最近加入」、已收藏提示…）。
 * 順序：未分類（沒有任何使用者資料夾時）→ 未讀 → 典藏 → 使用者資料夾（維持輸入順序）。
 * @param {{kind?:string, name:string}[]} folders
 * @returns {string[]}
 */
export function bookFolderLabels(folders, t) {
  const list = Array.isArray(folders) ? folders : []
  const kindOf = (f) => f?.kind || 'user'
  const user = list.filter((f) => !SYSTEM_LABEL[kindOf(f)])
  const out = []
  if (!user.length) out.push(t('folder.uncat'))
  for (const kind of ['unread', 'fav']) if (list.some((f) => kindOf(f) === kind)) out.push(systemName(kind, t))
  for (const f of user) out.push(String(f.name ?? ''))
  return out
}

/**
 * listFolderItems() 的結果 → 選單列（actionSheet／checklist 共用）。
 * - 資料夾：{ label, value: id, check: true }；opts.counts 有給就在名稱後加 (n)
 * - 分隔線：{ separator: true, label, value: 's:ID' }
 * - 系統資料夾（未讀、典藏）與後面的使用者資料夾之間自動加一條 { divider: true }（兩邊都有項目時）
 * - opts.sortable：使用者資料夾與分隔線都多帶 more、drag（≡ 拖曳、⋯ 選單）；系統資料夾永遠不帶
 * - opts.keyValues：資料夾的 value 改用項目鍵 'f:ID'、不帶 check（管理資料夾用）
 * @param {{type:string, key:string, id:number, name:string, kind?:string}[]} items
 * @param {(key:string, vars?:object)=>string} t
 * @param {{counts?:Record<number,number>|{byFolder:Record<number,number>}, sortable?:boolean, keyValues?:boolean}} [opts]
 */
export function buildFolderRows(items, t, opts = {}) {
  const counts = opts.counts?.byFolder ?? opts.counts ?? null
  const rows = []
  let prevSystem = false
  for (const it of items || []) {
    const system = !!SYSTEM_LABEL[it.kind]
    if (prevSystem && !system) rows.push({ divider: true }) // 分開系統資料夾與自建資料夾
    prevSystem = system
    const movable = !!opts.sortable && !system
    if (it.type === 'separator') {
      rows.push({ separator: true, label: String(it.name ?? ''), value: it.key, ...(movable ? { more: true, drag: true } : {}) })
      continue
    }
    const name = folderLabel(it, t)
    const row = {
      label: counts ? `${name} (${counts[it.id] || 0})` : name,
      value: opts.keyValues ? it.key : it.id,
    }
    if (!opts.keyValues) row.check = true
    if (movable) Object.assign(row, { more: true, drag: true })
    rows.push(row)
  }
  return rows
}

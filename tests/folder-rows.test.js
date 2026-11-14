import { describe, it, expect } from 'vitest'
import { folderLabel, bookFolderLabels, buildFolderRows } from '../src/components/folderRows.js'
import { mergeFolderItems } from '../src/services/folderOrder.js'

const dict = { 'folder.uncat': '未分類', 'folder.unread': '未讀', 'folder.fav': '典藏' }
const t = (k) => dict[k] ?? k

const unread = { kind: 'unread', name: '::nhs-unread::' }
const fav = { kind: 'fav', name: '::nhs-fav::' }

describe('folderLabel', () => {
  it('系統資料夾顯示翻譯名稱，不顯示佔位字串', () => {
    expect(folderLabel(unread, t)).toBe('未讀')
    expect(folderLabel(fav, t)).toBe('⭐ 典藏')
    expect(folderLabel({ kind: 'user', name: '收藏' }, t)).toBe('收藏')
    expect(folderLabel({ name: '舊資料' }, t)).toBe('舊資料')
    expect(folderLabel(null, t)).toBe('')
  })
})

describe('bookFolderLabels（未分類 → 未讀 → 典藏 → 使用者資料夾）', () => {
  it('都沒有：未分類', () => {
    expect(bookFolderLabels([], t)).toEqual(['未分類'])
    expect(bookFolderLabels(undefined, t)).toEqual(['未分類'])
  })
  it('只有未讀：未分類＋未讀', () => {
    expect(bookFolderLabels([unread], t)).toEqual(['未分類', '未讀'])
  })
  it('未讀＋使用者資料夾：不算未分類', () => {
    expect(bookFolderLabels([{ kind: 'user', name: '收藏' }, unread], t)).toEqual(['未讀', '收藏'])
  })
  it('三者都有：系統資料夾在前，使用者資料夾維持原順序', () => {
    expect(
      bookFolderLabels([{ kind: 'user', name: 'B' }, fav, { kind: 'user', name: 'A' }, unread], t),
    ).toEqual(['未讀', '⭐ 典藏', 'B', 'A'])
  })
  it('只有典藏：仍算未分類', () => {
    expect(bookFolderLabels([fav], t)).toEqual(['未分類', '⭐ 典藏'])
  })
})

describe('buildFolderRows', () => {
  const items = mergeFolderItems(
    [
      { id: 1, name: '::nhs-unread::', kind: 'unread', sort_order: -2 },
      { id: 2, name: '::nhs-fav::', kind: 'fav', sort_order: -1 },
      { id: 3, name: 'A', kind: 'user', sort_order: 1 },
      { id: 4, name: 'B', kind: 'user', sort_order: 3 },
    ],
    [{ id: 9, name: '分組', sort_order: 2 }],
  )
  it('一般勾選清單：資料夾可勾選、分隔線不可勾選', () => {
    expect(buildFolderRows(items, t)).toEqual([
      { label: '未讀', value: 1, check: true },
      { label: '⭐ 典藏', value: 2, check: true },
      { divider: true },
      { label: 'A', value: 3, check: true },
      { separator: true, label: '分組', value: 's:9' },
      { label: 'B', value: 4, check: true },
    ])
  })
  it('帶本數（接受 folderCounts() 結果或 byFolder）', () => {
    const rows = buildFolderRows(items, t, { counts: { byFolder: { 1: 5, 3: 2 } } })
    expect(rows.map((r) => r.label)).toEqual(['未讀 (5)', '⭐ 典藏 (0)', undefined, 'A (2)', '分組', 'B (0)'])
    expect(buildFolderRows(items, t, { counts: { 4: 7 } }).at(-1).label).toBe('B (7)')
  })
  it('sortable：使用者資料夾與分隔線可拖，系統資料夾永遠不帶 ≡／⋯', () => {
    const rows = buildFolderRows(items, t, { sortable: true })
    expect(rows[0]).toEqual({ label: '未讀', value: 1, check: true })
    expect(rows[2]).toEqual({ divider: true })
    expect(rows[3]).toEqual({ label: 'A', value: 3, check: true, more: true, drag: true })
    expect(rows[4]).toEqual({ separator: true, label: '分組', value: 's:9', more: true, drag: true })
  })
  it('系統資料夾與自建資料夾之間有分隔線；只有一邊時不加', () => {
    expect(buildFolderRows(items.slice(0, 2), t).some((r) => r.divider)).toBe(false)
    expect(buildFolderRows(items.slice(2), t).some((r) => r.divider)).toBe(false)
    // 只有典藏（例如批次分類排除了目前的「未讀」）
    expect(buildFolderRows(items.slice(1), t).map((r) => !!r.divider)).toEqual([false, true, false, false, false])
  })
  it('keyValues（管理資料夾）：value 用項目鍵、不帶 check', () => {
    const rows = buildFolderRows(items.slice(2), t, { sortable: true, keyValues: true })
    expect(rows).toEqual([
      { label: 'A', value: 'f:3', more: true, drag: true },
      { separator: true, label: '分組', value: 's:9', more: true, drag: true },
      { label: 'B', value: 'f:4', more: true, drag: true },
    ])
  })
})

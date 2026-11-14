import { describe, it, expect } from 'vitest'
import { itemKey, parseItemKey, mergeFolderItems, planReorder, isSystemKind } from '../src/services/folderOrder.js'

describe('項目鍵', () => {
  it('itemKey／parseItemKey 互轉', () => {
    expect(itemKey('folder', 12)).toBe('f:12')
    expect(itemKey('separator', '3')).toBe('s:3')
    expect(parseItemKey('f:12')).toEqual({ type: 'folder', id: 12 })
    expect(parseItemKey('s:3')).toEqual({ type: 'separator', id: 3 })
  })
  it('格式不對回傳 null', () => {
    for (const bad of [null, 12, '', 'f:', 'x:1', 'f:0', 'f:-1', 'f:1.5', 's: 3', 'F:1', 'f:1 ']) {
      expect(parseItemKey(bad), String(bad)).toBeNull()
    }
    expect(itemKey('folder', 0)).toBeNull()
    expect(itemKey('folder', 'abc')).toBeNull()
    expect(itemKey('other', 1)).toBeNull()
  })
})

describe('isSystemKind', () => {
  it('只有未讀與典藏', () => {
    expect(isSystemKind('unread')).toBe(true)
    expect(isSystemKind('fav')).toBe(true)
    expect(isSystemKind('user')).toBe(false)
    expect(isSystemKind(undefined)).toBe(false)
  })
})

describe('mergeFolderItems', () => {
  const folders = [
    { id: 5, name: 'B', kind: 'user', sort_order: 2, sort_mode: 'title' },
    { id: 2, name: '::nhs-fav::', kind: 'fav', sort_order: -1, sort_mode: 'added_desc' },
    { id: 3, name: 'A', kind: 'user', sort_order: 1, sort_mode: 'added_desc' },
    { id: 1, name: '::nhs-unread::', kind: 'unread', sort_order: -2, sort_mode: 'added_desc' },
  ]
  it('系統資料夾永遠在最前面（未讀 → 典藏），其餘依 sort_order', () => {
    const out = mergeFolderItems(folders, [{ id: 7, name: '分組', sort_order: 1.5 }])
    expect(out.map((x) => x.key)).toEqual(['f:1', 'f:2', 'f:3', 's:7', 'f:5'])
    expect(out[0]).toEqual({ type: 'folder', key: 'f:1', id: 1, name: '::nhs-unread::', kind: 'unread', sort_mode: 'added_desc' })
    expect(out[3]).toEqual({ type: 'separator', key: 's:7', id: 7, name: '分組' })
  })
  it('系統資料夾的 sort_order 被改大也照樣在最前面', () => {
    const odd = folders.map((f) => (f.kind === 'fav' ? { ...f, sort_order: 999 } : f))
    expect(mergeFolderItems(odd, []).map((x) => x.key).slice(0, 2)).toEqual(['f:1', 'f:2'])
  })
  it('sort_order 相同：資料夾在前，再依 id', () => {
    const out = mergeFolderItems(
      [
        { id: 9, name: 'x', kind: 'user', sort_order: 1 },
        { id: 4, name: 'y', kind: 'user', sort_order: 1 },
      ],
      [
        { id: 2, name: '', sort_order: 1 },
        { id: 1, name: '', sort_order: 1 },
      ],
    )
    expect(out.map((x) => x.key)).toEqual(['f:4', 'f:9', 's:1', 's:2'])
  })
  it('沒有 kind 欄位當作使用者資料夾；分隔線名稱缺少時為空字串', () => {
    const out = mergeFolderItems([{ id: 1, name: 'a', sort_order: 1 }], [{ id: 1, sort_order: 0 }])
    expect(out).toEqual([
      { type: 'separator', key: 's:1', id: 1, name: '' },
      { type: 'folder', key: 'f:1', id: 1, name: 'a', kind: 'user', sort_mode: undefined },
    ])
  })
  it('空輸入', () => {
    expect(mergeFolderItems()).toEqual([])
    expect(mergeFolderItems(null, null)).toEqual([])
  })
})

describe('planReorder', () => {
  const cur = ['f:1', 's:1', 'f:2', 'f:3']
  it('照要求的順序', () => {
    expect(planReorder(cur, ['f:3', 'f:1', 's:1', 'f:2'])).toEqual(['f:3', 'f:1', 's:1', 'f:2'])
  })
  it('未知的 key 略過、重複的只算第一次', () => {
    expect(planReorder(cur, ['f:9', 'f:2', 'f:2', 's:1', 42, null, 'f:1', 'f:3'])).toEqual(['f:2', 's:1', 'f:1', 'f:3'])
  })
  it('漏列的接在後面，維持原相對順序', () => {
    expect(planReorder(cur, ['f:3'])).toEqual(['f:3', 'f:1', 's:1', 'f:2'])
    expect(planReorder(cur, [])).toEqual(cur)
    expect(planReorder(cur, undefined)).toEqual(cur)
  })
  it('目前沒有項目', () => {
    expect(planReorder([], ['f:1'])).toEqual([])
  })
})

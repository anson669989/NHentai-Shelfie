import { describe, it, expect } from 'vitest'
import { buildCsv, parseCsvText, validateCsv, planLayoutImport, hasLayoutMeta, CSV_MAX_ROWS } from '../src/services/csv.js'

const rows = [
  { gallery_id: 177013, folders: ['收藏', '待看'], note: '', added_at: 1762397700 },
  { gallery_id: 228922, folders: [], note: '好看, "推"\n第二行', added_at: 1762398120 },
  { gallery_id: 5, folders: ['-負號開頭'], note: '=SUM(A1:A2)', added_at: 1762398200 },
]

describe('CSV', () => {
  it('匯出含 BOM 與標頭', () => {
    const csv = buildCsv(rows)
    expect(csv.startsWith('﻿gallery_id,folders,note,added_at,system\r\n#nh-shelfie,2,,,\r\n')).toBe(true) // v2：多 system 欄與版本列
  })

  it('公式開頭的儲存格加單引號', () => {
    const csv = buildCsv(rows)
    expect(csv).toContain("'=SUM(A1:A2)")
    expect(csv).toContain("'-負號開頭")
  })

  it('匯出再匯入後資料相同', () => {
    const csv = buildCsv(rows)
    const res = validateCsv(csv)
    expect(res.headerOk).toBe(true)
    expect(res.skipped).toEqual([])
    // v2：每筆多一個 system（沒有系統資料夾＝空陣列）
    expect(res.ok).toEqual(rows.map((r) => ({ ...r, system: [] })))
  })

  it('跳過已存在、重複與壞行，並給出原因', () => {
    const text = [
      'gallery_id,folders,note,added_at',
      '177013,收藏,,2026-11-06T10:55:00+08:00',
      '228922,未分類,好看,2026-11-06T11:02:00+08:00',
      'abc,收藏,,',
      '228922,,,',
      '300000,,,not-a-date',
      `400000,${'x'.repeat(31)},,`,
    ].join('\n')
    const res = validateCsv(text, new Set([177013]))
    expect(res.ok.map((r) => r.gallery_id)).toEqual([228922])
    expect(res.ok[0].folders).toEqual([])
    expect(res.ok[0].note).toBe('好看')
    expect(res.skipped.map((s) => s.reason)).toEqual([
      'duplicate',
      'invalid_id',
      'duplicate_in_file',
      'invalid_date',
      'invalid_folder',
    ])
  })

  it('缺少 gallery_id 欄時標頭無效', () => {
    expect(validateCsv('id,folders\n1,a').headerOk).toBe(false)
  })

  it('解析引號內逗號與換行', () => {
    expect(parseCsvText('a,"b,c","d\n""e"""\r\n1,2,3')).toEqual([
      ['a', 'b,c', 'd\n"e"'],
      ['1', '2', '3'],
    ])
  })
})

describe('CSV v2：系統資料夾與中繼列', () => {
  const meta = {
    layout: [
      { type: 'folder', name: '收藏', sortMode: 'title' },
      { type: 'separator', name: '標籤, "分組"' },
      { type: 'folder', name: '=公式資料夾', sortMode: 'added_desc' },
      { type: 'separator', name: '' },
      { type: 'folder', name: '待看' },
      { type: 'separator', name: '-負號' },
    ],
    settings: { share_mode: 'quick', share_auto_system: ['fav', 'unread'], share_auto_folders: ['收藏', '=公式資料夾'] },
  }
  const v2rows = [
    { gallery_id: 177013, folders: ['收藏'], note: '', added_at: 1762397700, system: ['unread', 'fav'] },
    { gallery_id: 228922, folders: [], note: 'x', added_at: 1762398120, system: ['fav'] },
    { gallery_id: 5, folders: ['=公式資料夾'], note: '', added_at: 1762398200, system: [] },
  ]

  it('含中繼列的來回一致（名稱含逗號、引號、= 與 - 開頭）', () => {
    const csv = buildCsv(v2rows, meta)
    const res = validateCsv(csv)
    expect(res.headerOk).toBe(true)
    expect(res.skipped).toEqual([])
    expect(res.ok).toEqual(v2rows)
    expect(res.meta.version).toBe(2)
    expect(res.meta.layout).toEqual(meta.layout)
    expect(res.meta.settings).toEqual({
      share_mode: 'quick',
      share_auto_system: ['unread', 'fav'], // 順序固定
      share_auto_folders: ['收藏', '=公式資料夾'],
    })
    expect(hasLayoutMeta(res.meta)).toBe(true)
  })

  it('中繼列補滿 5 欄、放在書之前；名稱有防公式', () => {
    const lines = buildCsv(v2rows, meta).replace(/^\uFEFF/, '').split('\r\n')
    expect(lines[1]).toBe('#nh-shelfie,2,,,')
    expect(lines[2]).toBe('#folder,收藏,title,,')
    expect(lines[3]).toBe('#separator,"標籤, ""分組""",,,')
    expect(lines[4]).toBe("#folder,'=公式資料夾,added_desc,,")
    expect(lines[5]).toBe('#separator,,,,')
    expect(lines).toContain('#setting,share_mode,quick,,')
    expect(lines).toContain('#setting,share_auto_system,unread|fav,,')
    expect(lines.findIndex((l) => l.startsWith('177013,'))).toBeGreaterThan(lines.indexOf('#setting,share_mode,quick,,'))
    expect(lines.find((l) => l.startsWith('177013,'))).toMatch(/,unread\|fav$/)
  })

  it('share_auto_folders 沒設定時不輸出後兩列；設成「都不加」時輸出空值', () => {
    const none = buildCsv([], { layout: [], settings: { share_mode: 'open' } })
    expect(none).not.toContain('share_auto')
    const empty = buildCsv([], { settings: { share_mode: 'open', share_auto_system: [], share_auto_folders: [] } })
    const res = validateCsv(empty)
    expect(res.meta.settings).toEqual({ share_mode: 'open', share_auto_system: [], share_auto_folders: [] })
  })

  it('舊版 CSV（無 system 欄、無中繼列）：system 為空陣列、meta 是空的', () => {
    const text = ['gallery_id,folders,note,added_at', '177013,收藏|待看,,2026-11-06T10:55:00+08:00', '228922,,,'].join('\n')
    const res = validateCsv(text)
    expect(res.ok.map((r) => r.system)).toEqual([[], []])
    expect(res.ok[0].folders).toEqual(['收藏', '待看'])
    expect(res.meta).toEqual({ version: 0, layout: [], settings: {} })
    expect(hasLayoutMeta(res.meta)).toBe(false)
  })

  it('不認得的 #xxx 列與壞掉的中繼值安靜略過，不算進跳過', () => {
    const text = [
      'gallery_id,folders,note,added_at,system',
      '#nh-shelfie,2,,,',
      '#future-thing,a,b,,',
      '#folder,::nhs-unread::,,,',
      `#folder,${'x'.repeat(31)},,,`,
      '#folder,收藏,bogus,,',
      '#folder,收藏,title,,',
      `#separator,${'y'.repeat(31)},,,`,
      '#setting,share_mode,sometimes,,',
      '#setting,theme_color,#000,,',
      '#setting,share_auto_system,unread|bogus|UNREAD,,',
      '177013,收藏,,,fav|other|fav',
    ].join('\n')
    const res = validateCsv(text)
    expect(res.skipped).toEqual([])
    expect(res.meta.layout).toEqual([{ type: 'folder', name: '收藏' }]) // 第二個同名資料夾不重複
    expect(res.meta.settings).toEqual({ share_auto_system: ['unread'] })
    expect(res.ok).toEqual([
      expect.objectContaining({ gallery_id: 177013, folders: ['收藏'], system: ['fav'] }),
    ])
  })

  it('CSV_MAX_ROWS 只計算書的列', () => {
    const books = Array.from({ length: CSV_MAX_ROWS + 1 }, (_, i) => `${i + 1},,,`)
    const text = ['gallery_id,folders,note,added_at', '#nh-shelfie,2', '#separator,a', ...books].join('\n')
    const res = validateCsv(text)
    expect(res.ok).toHaveLength(CSV_MAX_ROWS)
    expect(res.skipped).toEqual([{ line: CSV_MAX_ROWS + 4, reason: 'too_many_rows' }])
  })
})

describe('planLayoutImport', () => {
  const local = [
    { type: 'folder', id: 10, name: 'A' },
    { type: 'separator', id: 1, name: 'S' },
    { type: 'folder', id: 11, name: 'B' },
    { type: 'separator', id: 2, name: '' },
    { type: 'folder', id: 12, name: 'Local only' },
  ]

  it('新本機（全空）：全部新建、依 CSV 順序、新資料夾帶 sortMode', () => {
    const { order } = planLayoutImport([], [
      { type: 'folder', name: 'A', sortMode: 'title' },
      { type: 'separator', name: 'S' },
      { type: 'folder', name: 'B' },
    ])
    expect(order).toEqual([
      { type: 'folder', name: 'A', existingId: null, sortMode: 'title' },
      { type: 'separator', name: 'S', existingId: null },
      { type: 'folder', name: 'B', existingId: null },
    ])
  })

  it('以名稱對應資料夾、以「同名的第幾條」對應分隔線；本機多出的接在後面', () => {
    const { order } = planLayoutImport(local, [
      { type: 'folder', name: 'B', sortMode: 'title' },
      { type: 'separator', name: 'S' },
      { type: 'separator', name: 'S' },
      { type: 'folder', name: 'New' },
      { type: 'folder', name: 'A' },
    ])
    expect(order).toEqual([
      { type: 'folder', name: 'B', existingId: 11 }, // 既有資料夾不帶 sortMode
      { type: 'separator', name: 'S', existingId: 1 },
      { type: 'separator', name: 'S', existingId: null }, // 本機只有一條 S，第二條新建
      { type: 'folder', name: 'New', existingId: null },
      { type: 'folder', name: 'A', existingId: 10 },
      { type: 'separator', name: '', existingId: 2 },
      { type: 'folder', name: 'Local only', existingId: 12 },
    ])
  })

  it('同一份資料做兩次結果相同（不重複建立分隔線或資料夾）', () => {
    const csv = [
      { type: 'separator', name: 'S' },
      { type: 'separator', name: 'S' },
      { type: 'folder', name: 'A' },
      { type: 'separator', name: '' },
    ]
    const first = planLayoutImport([], csv).order
    // 模擬套用第一次的結果（依序給 id）
    let nextId = 100
    const after = first.map((x) => ({ type: x.type, id: x.existingId ?? nextId++, name: x.name }))
    const second = planLayoutImport(after, csv).order
    expect(second.every((x) => x.existingId != null)).toBe(true)
    expect(second.map((x) => x.existingId)).toEqual(after.map((x) => x.id))
  })

  it('CSV 重複列出的資料夾只算一次；沒有 layout 時維持本機順序', () => {
    const { order } = planLayoutImport(local, [
      { type: 'folder', name: 'A' },
      { type: 'folder', name: 'A' },
    ])
    expect(order.map((x) => x.existingId)).toEqual([10, 1, 11, 2, 12])
    expect(planLayoutImport(local, []).order.map((x) => x.existingId)).toEqual([10, 1, 11, 2, 12])
  })
})

import { describe, it, expect } from 'vitest'
import { normalizeNote, singleLine, normalizeRecentLimit } from '../src/services/parse.js'
import { buildCsv, validateCsv } from '../src/services/csv.js'

describe('normalizeNote', () => {
  it('換行轉空白、去頭尾空白', () => {
    expect(normalizeNote('  第一行\n第二行\r\n第三行\r ')).toBe('第一行 第二行 第三行')
    expect(normalizeNote('a\u2028b')).toBe('a b')
  })
  it('空字串與只有空白存成空值', () => {
    expect(normalizeNote('')).toBeNull()
    expect(normalizeNote('  \n ')).toBeNull()
    expect(normalizeNote(null)).toBeNull()
    expect(normalizeNote(undefined)).toBeNull()
  })
  it('不限制長度', () => {
    const long = '字'.repeat(10000)
    expect(normalizeNote(long)).toBe(long)
  })
  it('singleLine 保留前後空白（輸入中途貼上用）', () => {
    expect(singleLine(' a\nb ')).toBe(' a b ')
  })
})

describe('normalizeRecentLimit', () => {
  it('只接受 10／20／30／40／50，其他回到 20', () => {
    expect(normalizeRecentLimit('10')).toBe(10)
    expect(normalizeRecentLimit(50)).toBe(50)
    expect(normalizeRecentLimit('25')).toBe(20)
    expect(normalizeRecentLimit('')).toBe(20)
  })
})

describe('CSV 備註一來一回', () => {
  it('含逗號、引號、公式開頭、長文字的備註不遺失不變形', () => {
    const rows = [
      { gallery_id: 1, folders: [], note: '好看, "推" 100%_\\', added_at: 1762397700 },
      { gallery_id: 2, folders: ['收藏'], note: '=1+1 開頭像公式', added_at: 1762397800 },
      { gallery_id: 3, folders: [], note: '長'.repeat(5000), added_at: 1762397900 },
      { gallery_id: 4, folders: [], note: '', added_at: 1762398000 },
    ]
    const res = validateCsv(buildCsv(rows))
    expect(res.skipped).toEqual([])
    expect(res.ok).toEqual(rows)
  })
})

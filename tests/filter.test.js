import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseSearchFields, parseSearchFieldsRaw, TAG_TYPES } from '../src/services/parse.js'
import {
  normalizeFolderFilter,
  toggleFolderFilter,
  sortKeyOf,
  escapeLike,
  buildFilterWhere,
  hasActiveFilter,
  filterTagOptions,
} from '../src/services/filter.js'

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8')

describe('parseSearchFields（標籤解析）', () => {
  it('api-v2 真實回應：英文標題與 7 種類型的標籤', () => {
    const f = parseSearchFieldsRaw(fixture('gallery-api-v2'), 'api-v2')
    expect(f.titleEn).toBe('[Anthology] EROGROS Vol. 2 [Digital]')
    expect(f.titleJa).toBe('[アンソロジー] エログロス Vol.2 [DL版]')
    expect(f.tags).toContainEqual({ type: 'tag', name: 'big breasts' })
    expect(f.tags).toContainEqual({ type: 'language', name: 'japanese' })
    expect(f.tags.filter((x) => x.type === 'artist').length).toBe(9)
    expect(f.tags.every((x) => TAG_TYPES.includes(x.type))).toBe(true)
  })
  it('api-v2（webp 封面）含 parody／group 以外的類型也照存', () => {
    const f = parseSearchFieldsRaw(fixture('gallery-api-v2-webp'), 'api-v2')
    expect(f.tags.some((x) => x.type === 'parody')).toBe(true)
    expect(f.tags.some((x) => x.type === 'artist')).toBe(true)
  })
  it('api-v1 舊資料也能解析', () => {
    const f = parseSearchFieldsRaw(fixture('gallery-api-v1'), 'api-v1')
    expect(f.titleEn).toBe('[Sample] Sample Title (English)')
    expect(f.tags.some((x) => x.type === 'artist')).toBe(true)
  })
  it('欄位缺少或格式怪異不崩潰；未知類型、空名稱略過；重複去掉', () => {
    expect(parseSearchFields(null)).toEqual({ titleEn: '', titleJa: '', tags: [] })
    expect(parseSearchFields({}, 'api-v2')).toEqual({ titleEn: '', titleJa: '', tags: [] })
    expect(parseSearchFields({ title: 'x', tags: 'nope' }, 'api-v2').tags).toEqual([])
    const f = parseSearchFields(
      {
        tags: [
          null,
          { type: 'tag', name: ' glasses ' },
          { type: 'TAG', name: 'glasses' },
          { type: 'weird', name: 'x' },
          { type: 'artist', name: '  ' },
          { type: 'group', name: 5 },
          { type: 'group', name: 'circle' },
        ],
      },
      'api-v2',
    )
    expect(f.tags).toEqual([
      { type: 'tag', name: 'glasses' },
      { type: 'group', name: 'circle' },
    ])
    expect(parseSearchFields({ tags: [{ type: 'tag', name: 'a' }] }, 'api-v9').tags).toEqual([])
    expect(parseSearchFieldsRaw('{broken', 'api-v2').tags).toEqual([])
  })
})

describe('資料夾篩選（多選「或」）', () => {
  it('勾「全部」清掉其他；勾其他取消「全部」；全不勾回到「全部」', () => {
    expect(toggleFolderFilter(['all'], 3)).toEqual([3])
    expect(toggleFolderFilter([3], 'uncat')).toEqual([3, 'uncat'])
    expect(toggleFolderFilter([3, 'uncat'], 'all')).toEqual(['all'])
    expect(toggleFolderFilter([3], 3)).toEqual(['all'])
    expect(toggleFolderFilter([3, 5], 3)).toEqual([5])
  })
  it('整理：JSON 字串、去重、刪掉已不存在的資料夾', () => {
    expect(normalizeFolderFilter('["uncat",3,3,"7"]')).toEqual(['uncat', 3, 7])
    expect(normalizeFolderFilter([3, 9], [3])).toEqual([3])
    expect(normalizeFolderFilter([9], [3])).toEqual(['all'])
    expect(normalizeFolderFilter('bad json')).toEqual(['all'])
    expect(normalizeFolderFilter(['all', 3])).toEqual(['all'])
    expect(normalizeFolderFilter([-1, 0, 'x', 1.5])).toEqual(['all'])
  })
  it('排序：只選一個用它的排序，多選用「全部」', () => {
    expect(sortKeyOf(['all'])).toBe('all')
    expect(sortKeyOf(['uncat'])).toBe('uncat')
    expect(sortKeyOf([4])).toBe(4)
    expect(sortKeyOf([4, 'uncat'])).toBe('all')
  })
})

describe('buildFilterWhere', () => {
  it('沒有條件時沒有 WHERE', () => {
    expect(buildFilterWhere({})).toEqual({ where: '', values: [] })
    expect(hasActiveFilter({})).toBe(false)
  })
  it('資料夾「或」：未分類＋指定資料夾', () => {
    const { where, values } = buildFilterWhere({ folders: ['uncat', 2, 5] })
    expect(where).toMatch(/NOT EXISTS .* OR EXISTS .*folder_id IN \(\?,\?\)/)
    expect(values).toEqual([2, 5])
  })
  it('標籤「且」：HAVING COUNT 等於勾選數', () => {
    const { where, values } = buildFilterWhere({ tagIds: [7, 8, 7] })
    expect(where).toContain('HAVING COUNT(DISTINCT tag_id) = ?')
    expect(values).toEqual([7, 8, 2])
  })
  it('文字：跳脫 % _ \\，比對英日標題、備註、ID', () => {
    expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b')
    const { where, values } = buildFilterWhere({ text: '  50%_off ' })
    expect(where).toContain("b.title_en LIKE ? ESCAPE '\\'")
    expect(where).toContain('COALESCE(b.note')
    expect(where).toContain('CAST(b.gallery_id AS TEXT)')
    expect(values).toEqual(Array(5).fill('%50\\%\\_off%'))
  })
  it('文字 #123 也能比對 ID', () => {
    const { values } = buildFilterWhere({ text: '#228' })
    expect(values[4]).toBe('%228%')
  })
  it('三個條件以 AND 串起來，參數順序對應', () => {
    const r = buildFilterWhere({ folders: [3], tagIds: [9], text: 'x' })
    expect(r.where.split(' AND ').length).toBeGreaterThanOrEqual(3)
    expect(r.values).toEqual([3, 9, 1, '%x%', '%x%', '%x%', '%x%', '%x%'])
    expect(hasActiveFilter({ folders: [3], tagIds: [], text: '' })).toBe(true)
    expect(hasActiveFilter({ folders: ['all'], tagIds: [], text: '  ' })).toBe(false)
  })
  it('不會把使用者文字拼進 SQL', () => {
    const r = buildFilterWhere({ text: "'; DROP TABLE books; --" })
    expect(r.where).not.toContain('DROP')
  })
})

describe('filterTagOptions', () => {
  const opts = [
    { id: 1, type: 'tag', name: 'Glasses', n: 5 },
    { id: 2, type: 'artist', name: 'Kuroihi', n: 2 },
    { id: 3, type: 'tag', name: 'big breasts', n: 9 },
    { id: 4, type: 'group', name: 'glass works', n: 2 },
  ]
  it('依本數多到少；打字不分大小寫、比對任一部分', () => {
    expect(filterTagOptions(opts, '').items.map((o) => o.id)).toEqual([3, 1, 4, 2])
    expect(filterTagOptions(opts, 'GLASS').items.map((o) => o.id)).toEqual([1, 4])
  })
  it('已勾選的排最上面（不受打字影響）', () => {
    expect(filterTagOptions(opts, 'glass', [2]).items.map((o) => o.id)).toEqual([2, 1, 4])
  })
  it('超過上限只回傳前 N 筆並告知剩幾筆', () => {
    const many = Array.from({ length: 250 }, (_, i) => ({ id: i + 1, type: 'tag', name: 't' + i, n: i }))
    const r = filterTagOptions(many, '', [], 200)
    expect(r.items.length).toBe(200)
    expect(r.more).toBe(50)
  })
})

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  parseTagDb,
  hasKana,
  isSha,
  toTranslationRows,
  translationStatements,
  isUpdateDue,
  translationSource,
  tagDataset,
  tagtrKeys,
  isSha256,
  parseSourcesVersion,
  jaTranslationStatements,
  MIN_TAGDB_ROWS,
  DAY_MS,
  RETRY_AFTER_FAIL_MS,
} from '../src/services/tagTranslation.js'
import { E } from '../src/services/errors.js'

const sample = JSON.parse(readFileSync(new URL('./fixtures/ehtag-db-sample.json', import.meta.url), 'utf-8'))
const find = (rows, type, name) => rows.find((r) => r.type === type && r.name === name)

describe('parseTagDb', () => {
  const { sha, rows } = parseTagDb(sample)

  it('取出 commit sha', () => {
    expect(sha).toBe('0123456789abcdef0123456789abcdef01234567')
  })
  it('tag 依 mixed → female → male → other → location 先找到的為準', () => {
    expect(find(rows, 'tag', 'group').label).toBe('团体') // mixed 優先
    expect(find(rows, 'tag', 'glasses').label).toBe('眼镜') // female 優先於 male
    expect(find(rows, 'tag', 'oyakodon').label).toBe('母女丼')
    expect(find(rows, 'tag', 'incest').label).toBe('近亲')
    expect(find(rows, 'tag', 'full color').label).toBe('全彩')
    expect(find(rows, 'tag', 'school').label).toBe('学校')
  })
  it('key 一律 trim＋小寫，name 去頭尾空白', () => {
    expect(find(rows, 'tag', 'necktie').label).toBe('领带')
    expect(find(rows, 'artist', 'upper case').label).toBe('大写作者')
  })
  it('artist／group 對應各自的 namespace', () => {
    expect(find(rows, 'artist', 'han artist').label).toBe('国产作者')
    expect(find(rows, 'group', 'circle x').label).toBe('社团X')
  })
  it('三類以外（rows、parody、character、language）不輸出', () => {
    expect(rows.every((r) => ['tag', 'artist', 'group'].includes(r.type))).toBe(true)
    const names = rows.map((r) => r.name)
    for (const n of ['reimu', 'touhou project', 'chinese', 'reclass']) expect(names).not.toContain(n)
  })
  it('略過：空白名稱、與原文相同（不分大小寫）', () => {
    expect(find(rows, 'tag', 'blank')).toBeUndefined()
    expect(find(rows, 'artist', 'same name')).toBeUndefined()
  })
  it('同一類型 + 名稱不重複', () => {
    const keys = rows.map((r) => `${r.type}|${r.name}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
  it('超過 100 字的名稱略過', () => {
    const big = { data: [{ namespace: 'artist', data: { a: { name: 'x'.repeat(101) }, b: { name: '好' } } }] }
    expect(parseTagDb(big).rows.map((r) => r.name)).toEqual(['b'])
  })
  it('head.sha 格式不對給空字串', () => {
    expect(parseTagDb({ ...sample, head: { sha: 'nope' } }).sha).toBe('')
    expect(parseTagDb({ data: sample.data }).sha).toBe('')
  })
  it('結構不對丟 TAGDB_FAILED', () => {
    for (const bad of [null, {}, { data: 'x' }, { data: [] }, { data: [{ namespace: 'parody', data: {} }] }]) {
      expect(() => parseTagDb(bad)).toThrowError(expect.objectContaining({ code: E.TAGDB_FAILED }))
    }
  })
})

describe('hasKana / isSha', () => {
  it('偵測平假名與片假名', () => {
    expect(hasKana('ひらがな')).toBe(true)
    expect(hasKana('サークル')).toBe(true)
    expect(hasKana('国产作者')).toBe(false)
    expect(hasKana('')).toBe(false)
  })
  it('sha 為 40 位十六進位', () => {
    expect(isSha('0123456789abcdef0123456789abcdef01234567\n')).toBe(true)
    expect(isSha('abc')).toBe(false)
    expect(isSha(null)).toBe(false)
  })
})

describe('toTranslationRows', () => {
  const conv = (s) => s.replace(/国/g, '國').replace(/眼镜/g, '眼鏡')
  it('zh_cn 原樣、zh_tw 轉換；含假名不轉換', () => {
    const out = toTranslationRows(
      [
        { type: 'tag', name: 'glasses', label: '眼镜' },
        { type: 'artist', name: 'k', label: '国ひら' },
      ],
      conv,
    )
    expect(out[0]).toEqual({ type: 'tag', name: 'glasses', zh_cn: '眼镜', zh_tw: '眼鏡' })
    expect(out[1]).toEqual({ type: 'artist', name: 'k', zh_cn: '国ひら', zh_tw: '国ひら' })
  })
})

describe('translationStatements', () => {
  const mk = (n) => Array.from({ length: n }, (_, i) => ({ type: 'tag', name: `t${i}`, zh_cn: 'a', zh_tw: 'b' }))
  it('第一句是 DELETE，其後分批 INSERT', () => {
    const st = translationStatements(mk(450))
    expect(st[0].statement).toBe('DELETE FROM tag_translations')
    expect(st).toHaveLength(1 + 3)
    expect(st[1].values).toHaveLength(800)
    expect(st[3].values).toHaveLength(50 * 4)
  })
  it('每句參數不超過 999', () => {
    for (const s of translationStatements(mk(1000))) expect(s.values.length).toBeLessThanOrEqual(999)
    expect(() => translationStatements(mk(10), 300)).toThrow()
  })
  it('佔位符數量與參數相符、全參數化', () => {
    for (const s of translationStatements(mk(7), 3)) {
      expect((s.statement.match(/\?/g) || []).length).toBe(s.values.length)
    }
  })
  it('沒有資料時只有 DELETE', () => {
    expect(translationStatements([])).toHaveLength(1)
  })
})

describe('isUpdateDue', () => {
  const now = 10 * DAY_MS
  it('開關關閉不更新', () => {
    expect(isUpdateDue({ enabled: false, now, hasData: false })).toBe(false)
  })
  it('沒有資料就更新', () => {
    expect(isUpdateDue({ enabled: true, now, checkedAt: now - 1000, hasData: false })).toBe(true)
  })
  it('有資料：未滿 24 小時不更新、滿了更新', () => {
    expect(isUpdateDue({ enabled: true, now, checkedAt: now - DAY_MS + 1, hasData: true })).toBe(false)
    expect(isUpdateDue({ enabled: true, now, checkedAt: now - DAY_MS, hasData: true })).toBe(true)
    expect(isUpdateDue({ enabled: true, now, checkedAt: 0, hasData: true })).toBe(true)
  })
  it('失敗後 1 小時內不重試', () => {
    expect(isUpdateDue({ enabled: true, now, lastFailedAt: now - RETRY_AFTER_FAIL_MS + 1, hasData: false })).toBe(false)
    expect(isUpdateDue({ enabled: true, now, lastFailedAt: now - RETRY_AFTER_FAIL_MS, hasData: false })).toBe(true)
  })
})

describe('translationSource', () => {
  it('四種介面語言各自對應的表與欄位（寫死的對照表）', () => {
    expect(translationSource('zh-TW')).toEqual({ table: 'tag_translations', column: 'zh_tw' })
    expect(translationSource('zh-CN')).toEqual({ table: 'tag_translations', column: 'zh_cn' })
    expect(translationSource('ja')).toEqual({ table: 'tag_translations_ja', column: 'ja' })
    expect(translationSource('en')).toBeNull()
  })
  it('不認得的值一律 null（不會被拼進 SQL）', () => {
    for (const bad of ['zh_tw; DROP TABLE x', 'toString', '__proto__', '', null, undefined, 1]) {
      expect(translationSource(bad)).toBeNull()
    }
  })
})

describe('tagDataset / tagtrKeys', () => {
  it('介面語言 → 資料', () => {
    expect(tagDataset('zh-TW')).toBe('zh')
    expect(tagDataset('zh-CN')).toBe('zh')
    expect(tagDataset('ja')).toBe('ja')
    expect(tagDataset('en')).toBeNull()
    expect(tagDataset('constructor')).toBeNull()
    expect(tagDataset('')).toBeNull()
  })
  it('每份資料的設定鍵', () => {
    expect(tagtrKeys('zh')).toEqual({
      sha: 'tagtr_sha',
      count: 'tagtr_count',
      updatedAt: 'tagtr_updated_at',
      checkedAt: 'tagtr_checked_at',
    })
    expect(tagtrKeys('ja')).toEqual({
      sha: 'tagtr_ja_sha',
      count: 'tagtr_ja_count',
      updatedAt: 'tagtr_ja_updated_at',
      checkedAt: 'tagtr_ja_checked_at',
    })
    expect(tagtrKeys(null)).toBeNull()
    expect(tagtrKeys('en')).toBeNull()
    expect(tagtrKeys('toString')).toBeNull()
  })
  it('四種介面語言串起來', () => {
    expect(tagtrKeys(tagDataset('zh-TW')).count).toBe('tagtr_count')
    expect(tagtrKeys(tagDataset('zh-CN')).count).toBe('tagtr_count')
    expect(tagtrKeys(tagDataset('ja')).count).toBe('tagtr_ja_count')
    expect(tagtrKeys(tagDataset('en'))).toBeNull()
  })
})

const jaSample = JSON.parse(readFileSync(new URL('./fixtures/ehpanda-ja-sample.json', import.meta.url), 'utf-8'))

describe('parseTagDb（日文 ja.json）', () => {
  const { sha, rows } = parseTagDb(jaSample)

  it('沒有 head：sha 為空字串', () => {
    expect(sha).toBe('')
  })
  it('tag 依 mixed → female → male → other → location 先找到的為準', () => {
    expect(find(rows, 'tag', 'group').label).toBe('グループセックス')
    expect(find(rows, 'tag', 'incest').label).toBe('近親相姦')
    expect(find(rows, 'tag', 'glasses').label).toBe('眼鏡')
    expect(find(rows, 'tag', 'bondage').label).toBe('拘束, 緊縛')
    expect(find(rows, 'tag', 'full color').label).toBe('フルカラー')
    expect(find(rows, 'tag', 'school').label).toBe('学校')
  })
  it('artist／group 對應各自的 namespace，帶 links 的只取 name', () => {
    expect(find(rows, 'artist', '10eki')).toEqual({ type: 'artist', name: '10eki', label: '10駅' })
    expect(find(rows, 'group', 'circle x').label).toBe('サークルX')
  })
  it('略過：空字串名稱、與原文相同（不分大小寫）', () => {
    expect(find(rows, 'artist', '13')).toBeUndefined()
    expect(find(rows, 'artist', '0-g')).toBeUndefined()
    expect(find(rows, 'group', 'no name circle')).toBeUndefined()
    expect(find(rows, 'tag', 'human pet')).toBeUndefined()
  })
  it('temp、parody、reclass 不輸出', () => {
    expect(rows.every((r) => ['tag', 'artist', 'group'].includes(r.type))).toBe(true)
    const names = rows.map((r) => r.name)
    for (const n of ['temp artist', 'touhou project', 'doujinshi']) expect(names).not.toContain(n)
  })
  it('日文名稱原樣保留（不做字形轉換）', () => {
    expect(find(rows, 'artist', 'kana artist').label).toBe('かなさっか')
  })
})

describe('isSha256 / parseSourcesVersion', () => {
  const H = 'ABCDEF0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
  it('64 位十六進位', () => {
    expect(isSha256(H)).toBe(true)
    expect(isSha256('0123456789abcdef0123456789abcdef01234567')).toBe(false)
    expect(isSha256(null)).toBe(false)
  })
  it('取出 datasets.ja.sha256（小寫）', () => {
    const json = {
      upstream_release: 'v7.29805.1',
      datasets: { ja: { file: 'ja.json', sha256: H, tags: 46227 }, en: { file: 'en.json', sha256: 'x' } },
    }
    expect(parseSourcesVersion(json)).toBe(H.toLowerCase())
  })
  it('壞資料一律回傳空字串、不丟錯', () => {
    const bads = [
      null,
      'text',
      42,
      [],
      {},
      { datasets: null },
      { datasets: {} },
      { datasets: { ja: 'x' } },
      { datasets: { ja: { file: 'ja.json' } } },
      { datasets: { ja: { file: 'en.json', sha256: H } } },
      { datasets: { ja: { file: 'ja.json', sha256: 'abc' } } },
      { datasets: { ja: { file: 'ja.json', sha256: 123 } } },
    ]
    for (const b of bads) expect(parseSourcesVersion(b)).toBe('')
  })
})

describe('jaTranslationStatements', () => {
  const mk = (n) => Array.from({ length: n }, (_, i) => ({ type: 'tag', name: `t${i}`, label: 'ラベル' }))
  it('第一句是 DELETE，其後每 300 筆一句 INSERT', () => {
    const st = jaTranslationStatements(mk(650))
    expect(st[0]).toEqual({ statement: 'DELETE FROM tag_translations_ja', values: [] })
    expect(st).toHaveLength(1 + 3)
    expect(st[1].values).toHaveLength(900)
    expect(st[3].values).toHaveLength(50 * 3)
    expect(st[1].statement.startsWith('INSERT OR REPLACE INTO tag_translations_ja(type, name, ja) VALUES (?,?,?),')).toBe(true)
    expect(st[1].values.slice(0, 3)).toEqual(['tag', 't0', 'ラベル'])
  })
  it('每句參數不超過 999；chunk 太大丟 RangeError', () => {
    for (const s of jaTranslationStatements(mk(2000))) expect(s.values.length).toBeLessThanOrEqual(999)
    expect(() => jaTranslationStatements(mk(10), 334)).toThrow(RangeError)
    expect(() => jaTranslationStatements(mk(10), 333)).not.toThrow()
  })
  it('佔位符數量與參數相符、全參數化', () => {
    for (const s of jaTranslationStatements(mk(7), 3)) {
      expect((s.statement.match(/\?/g) || []).length).toBe(s.values.length)
    }
  })
  it('沒有資料時只有 DELETE', () => {
    expect(jaTranslationStatements([])).toHaveLength(1)
  })
  it('MIN_TAGDB_ROWS 是 1000', () => {
    expect(MIN_TAGDB_ROWS).toBe(1000)
  })
})

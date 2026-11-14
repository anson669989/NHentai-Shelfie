import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  parseTagDb,
  hasKana,
  isSha,
  toTranslationRows,
  translationStatements,
  isUpdateDue,
  translationColumn,
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
    expect(find(rows, 'tag', 'group').zh).toBe('团体') // mixed 優先
    expect(find(rows, 'tag', 'glasses').zh).toBe('眼镜') // female 優先於 male
    expect(find(rows, 'tag', 'oyakodon').zh).toBe('母女丼')
    expect(find(rows, 'tag', 'incest').zh).toBe('近亲')
    expect(find(rows, 'tag', 'full color').zh).toBe('全彩')
    expect(find(rows, 'tag', 'school').zh).toBe('学校')
  })
  it('key 一律 trim＋小寫，name 去頭尾空白', () => {
    expect(find(rows, 'tag', 'necktie').zh).toBe('领带')
    expect(find(rows, 'artist', 'upper case').zh).toBe('大写作者')
  })
  it('artist／group 對應各自的 namespace', () => {
    expect(find(rows, 'artist', 'han artist').zh).toBe('国产作者')
    expect(find(rows, 'group', 'circle x').zh).toBe('社团X')
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
        { type: 'tag', name: 'glasses', zh: '眼镜' },
        { type: 'artist', name: 'k', zh: '国ひら' },
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

describe('translationColumn', () => {
  it('只有中文介面有欄位', () => {
    expect(translationColumn('zh-TW')).toBe('zh_tw')
    expect(translationColumn('zh-CN')).toBe('zh_cn')
    expect(translationColumn('en')).toBeNull()
    expect(translationColumn('zh_tw; DROP TABLE x')).toBeNull()
  })
})

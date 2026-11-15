// 使用說明：locales 的 help（純文字）要能解析成「主題＋條列」，且四種語言的主題數相同
import { describe, it, expect } from 'vitest'
import { parseHelp } from '../src/components/helpText.js'
import { DICTS } from '../src/locales.js'

describe('parseHelp', () => {
  it('# 開新主題、- 是條列；主題前的文字是開頭說明、之後的是附註', () => {
    const r = parseHelp('先看這裡\n\n# 甲\n- 一\n-  二 \n\n# 乙\n- 三\n\n最後一行')
    expect(r).toEqual({
      intro: ['先看這裡'],
      sections: [
        { title: '甲', items: ['一', '二'] },
        { title: '乙', items: ['三'] },
      ],
      footer: ['最後一行'],
    })
  })
  it('空白、空字串、CRLF 換行都不出錯', () => {
    expect(parseHelp('')).toEqual({ intro: [], sections: [], footer: [] })
    expect(parseHelp(null)).toEqual({ intro: [], sections: [], footer: [] })
    expect(parseHelp('# A\r\n- x\r\n').sections).toEqual([{ title: 'A', items: ['x'] }])
  })
  it('沒有主題時的條列當成開頭說明（不丟掉內容）', () => {
    expect(parseHelp('- 只有一條').intro).toEqual(['只有一條'])
  })
})

describe('四種語言的使用說明', () => {
  const base = parseHelp(DICTS['zh-TW'].help)

  it('繁中：有開頭說明、12 個主題、最後有隱私附註', () => {
    expect(base.intro.length).toBe(1)
    expect(base.sections.length).toBe(12)
    expect(base.footer.length).toBe(1)
  })

  for (const lang of Object.keys(DICTS)) {
    it(`${lang}：每個主題都有標題與至少兩條說明，主題數、各主題條數與繁中相同`, () => {
      const r = parseHelp(DICTS[lang].help)
      expect(r.sections.map((s) => s.items.length)).toEqual(base.sections.map((s) => s.items.length))
      expect(r.intro.length).toBe(base.intro.length)
      expect(r.footer.length).toBe(base.footer.length)
      for (const s of r.sections) {
        expect(s.title, lang).not.toBe('')
        expect(s.items.length, `${lang} ${s.title}`).toBeGreaterThanOrEqual(2)
        for (const item of s.items) expect(item.trim(), `${lang} ${s.title}`).not.toBe('')
      }
    })
  }
})

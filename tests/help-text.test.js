// 使用說明：locales 的 help（純文字）要能解析成「主題 → 粗體小標 → 條列」，且四種語言的結構相同
import { describe, it, expect } from 'vitest'
import { parseHelp } from '../src/components/helpText.js'
import { DICTS } from '../src/locales.js'

describe('parseHelp', () => {
  it('# 開新主題、## 是粗體小標、- 是小標底下的條列；主題前的文字是開頭說明、之後的是附註', () => {
    const r = parseHelp('先看這裡\n\n# 甲\n## 怎麼做？\n- 一\n-  二 \n## 另一件事\n- 三\n\n# 乙\n## 小標\n- 四\n\n最後一行')
    expect(r).toEqual({
      intro: ['先看這裡'],
      sections: [
        {
          title: '甲',
          groups: [
            { lead: '怎麼做？', items: ['一', '二'] },
            { lead: '另一件事', items: ['三'] },
          ],
        },
        { title: '乙', groups: [{ lead: '小標', items: ['四'] }] },
      ],
      footer: ['最後一行'],
    })
  })
  it('空白、空字串、CRLF 換行都不出錯', () => {
    expect(parseHelp('')).toEqual({ intro: [], sections: [], footer: [] })
    expect(parseHelp(null)).toEqual({ intro: [], sections: [], footer: [] })
    expect(parseHelp('# A\r\n## q\r\n- x\r\n').sections).toEqual([{ title: 'A', groups: [{ lead: 'q', items: ['x'] }] }])
  })
  it('沒有小標就出現的條列放進空白小標的一組；沒有主題時當成開頭說明（不丟掉內容）', () => {
    expect(parseHelp('# A\n- x\n## q\n- y').sections[0].groups).toEqual([
      { lead: '', items: ['x'] },
      { lead: 'q', items: ['y'] },
    ])
    expect(parseHelp('- 只有一條\n## 小標').intro).toEqual(['只有一條', '小標'])
  })
  it('換主題後，條列不會接到上一個主題的小標', () => {
    const r = parseHelp('# A\n## q\n- x\n# B\n- y')
    expect(r.sections[0].groups).toEqual([{ lead: 'q', items: ['x'] }])
    expect(r.sections[1].groups).toEqual([{ lead: '', items: ['y'] }])
  })
})

describe('四種語言的使用說明', () => {
  const base = parseHelp(DICTS['zh-TW'].help)
  /** 結構：每個主題底下各小標的條數，例如 [[2, 2, 1], [1, 3, 2], …] */
  const shape = (r) => r.sections.map((s) => s.groups.map((g) => g.items.length))

  it('繁中：有開頭說明、12 個主題、最後有隱私附註', () => {
    expect(base.intro.length).toBe(1)
    expect(base.sections.length).toBe(12)
    expect(base.footer.length).toBe(1)
  })

  for (const lang of Object.keys(DICTS)) {
    it(`${lang}：每個主題的內容都是「粗體小標＋底下的條列」，結構與繁中相同`, () => {
      const r = parseHelp(DICTS[lang].help)
      expect(shape(r)).toEqual(shape(base))
      expect(r.intro.length).toBe(base.intro.length)
      expect(r.footer.length).toBe(base.footer.length)
      for (const s of r.sections) {
        expect(s.title, lang).not.toBe('')
        expect(s.groups.length, `${lang} ${s.title}`).toBeGreaterThanOrEqual(1)
        for (const g of s.groups) {
          expect(g.lead, `${lang} ${s.title}：條列前要先有小標`).not.toBe('')
          expect(g.items.length, `${lang} ${s.title} ${g.lead}`).toBeGreaterThanOrEqual(1)
          for (const item of g.items) expect(item, `${lang} ${s.title} ${g.lead}`).not.toBe('')
        }
      }
    })
  }

  it('提到 App 的頁面時寫成「名稱」頁面（不寫分頁、タブ、tab）', () => {
    const tw = DICTS['zh-TW'].help
    expect(tw).not.toMatch(/分頁|」頁(?!面)/)
    expect(tw).not.toMatch(/「設定 →|「設定」(?!頁面)/) // 不再寫成「設定 → 分享」，「設定」後面一定接「頁面」
    for (const name of ['新增', '資料夾', '設定']) expect(tw, name).toContain(`「${name}」頁面`)
    expect(DICTS['zh-CN'].help).not.toMatch(/”页(?!面)|“设置 →/)
    expect(DICTS['zh-CN'].help).toContain('“设置”页面')
    expect(DICTS.ja.help).not.toContain('タブ')
    expect(DICTS.ja.help).toContain('「設定」ページ')
    expect(DICTS.en.help).not.toMatch(/\btab\b/i)
    expect(DICTS.en.help).toContain('Settings page')
  })
})

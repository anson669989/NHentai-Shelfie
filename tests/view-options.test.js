import { describe, it, expect } from 'vitest'
import { viewOptions } from '../src/components/viewOptions.js'
import { DEFAULTS } from '../src/services/settings.js'

describe('viewOptions（顯示備註、媽媽模式）', () => {
  it('預設：不顯示備註、媽媽模式關閉時什麼都不隱藏', () => {
    for (const scope of ['library', 'add']) {
      expect(viewOptions(DEFAULTS, scope)).toEqual({ showNote: false, hideCover: false, hideTitle: false, hideNote: false })
    }
  })
  it('開媽媽模式（預設細項）只隱藏封面，兩頁都套用', () => {
    const s = { ...DEFAULTS, mama_mode: '1' }
    expect(viewOptions(s, 'library')).toEqual({ showNote: false, hideCover: true, hideTitle: false, hideNote: false })
    expect(viewOptions(s, 'add').hideCover).toBe(true)
  })
  it('只套用到其中一頁', () => {
    const s = { ...DEFAULTS, mama_mode: '1', mama_scope_add: '0', mama_hide_title: '1', mama_hide_note: '1', show_note: '1' }
    expect(viewOptions(s, 'library')).toEqual({ showNote: true, hideCover: true, hideTitle: true, hideNote: true })
    expect(viewOptions(s, 'add')).toEqual({ showNote: true, hideCover: false, hideTitle: false, hideNote: false })
  })
  it('總開關關閉時細項不生效', () => {
    const s = { ...DEFAULTS, mama_mode: '0', mama_hide_title: '1' }
    expect(viewOptions(s, 'library').hideTitle).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import { keyboardCovered } from '../src/viewport.js'

describe('keyboardCovered', () => {
  it('取原生與網頁量到的較大者，不重複相加', () => {
    expect(keyboardCovered(300, 0)).toBe(300)
    expect(keyboardCovered(0, 280)).toBe(280)
    expect(keyboardCovered(300, 300)).toBe(300)
  })
  it('負數與非數字當作 0', () => {
    expect(keyboardCovered(-5, NaN)).toBe(0)
    expect(keyboardCovered(undefined, 120.4)).toBe(120)
  })
})

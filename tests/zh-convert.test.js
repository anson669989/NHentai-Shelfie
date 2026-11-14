import { describe, it, expect } from 'vitest'
import { loadCnToTw } from '../src/services/zhConvert.js'

describe('zhConvert', () => {
  it('簡體轉台灣繁體與用語', async () => {
    const conv = await loadCnToTw()
    expect(conv('汉语')).toBe('漢語')
    expect(conv('自行车')).toBe('腳踏車')
  })
  it('載入一次後重複使用同一個轉換函式', async () => {
    expect(await loadCnToTw()).toBe(await loadCnToTw())
  })
})

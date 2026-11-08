import { describe, it, expect } from 'vitest'
import { moveItem, dropIndex, edgeSpeed } from '../src/components/dragSort.js'

describe('拖曳排序（純函式）', () => {
  it('moveItem：往下、往上、原地', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
    expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b'])
    expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b'])
  })
  it('dropIndex：越過誰的中心誰就讓位', () => {
    const c = [25, 75, 125, 175] // 每列高 50
    expect(dropIndex(c, 1, 75)).toBe(1)
    expect(dropIndex(c, 1, 130)).toBe(2)
    expect(dropIndex(c, 1, 999)).toBe(3)
    expect(dropIndex(c, 2, 70)).toBe(1)
    expect(dropIndex(c, 2, -50)).toBe(0) // 不會超出第一列（「全部」「未分類」不在可拖清單內）
  })
  it('edgeSpeed：中間不捲，越靠邊越快', () => {
    expect(edgeSpeed(300, 0, 600)).toBe(0)
    expect(edgeSpeed(50, 0, 600)).toBeLessThan(0)
    expect(edgeSpeed(0, 0, 600)).toBeLessThan(edgeSpeed(40, 0, 600))
    expect(edgeSpeed(590, 0, 600)).toBeGreaterThan(edgeSpeed(560, 0, 600))
  })
})

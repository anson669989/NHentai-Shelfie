import { describe, it, expect } from 'vitest'
import { extractNhGalleryId } from '../src/services/parse.js'
import { resolveAutoFolders, planQuickShareDrain, shareHosts, isValidId } from '../src/services/quickShare.js'

describe('extractNhGalleryId（直接收藏只認 nhentai 網址）', () => {
  it('一般網址', () => {
    expect(extractNhGalleryId('https://nhentai.net/g/228922/')).toBe(228922)
    expect(extractNhGalleryId('https://nhentai.net/g/228922')).toBe(228922)
    expect(extractNhGalleryId('https://nhentai.net/g/228922/?page=2')).toBe(228922)
    expect(extractNhGalleryId('https://nhentai.net/g/228922#comments')).toBe(228922)
  })
  it('含網址的一段文字、多個網址取第一個', () => {
    expect(extractNhGalleryId('看這本 https://nhentai.net/g/123/ 很棒')).toBe(123)
    expect(extractNhGalleryId('標題\nhttps://nhentai.net/g/2/ 與 https://nhentai.net/g/1/')).toBe(2)
    expect(extractNhGalleryId('https://example.com/g/9/ https://nhentai.net/g/5/')).toBe(5)
  })
  it('http、子網域、大小寫', () => {
    expect(extractNhGalleryId('http://nhentai.net/g/77/')).toBe(77)
    expect(extractNhGalleryId('https://www.nhentai.net/g/78/')).toBe(78)
    expect(extractNhGalleryId('HTTPS://NHentai.NET/G/79/')).toBe(79)
  })
  it('其他網站、仿冒網域、純數字與 # 開頭都不算', () => {
    expect(extractNhGalleryId('https://example.com/g/123/')).toBeNull()
    expect(extractNhGalleryId('https://evilnhentai.net/g/123/')).toBeNull()
    expect(extractNhGalleryId('https://nhentai.net.evil.com/g/123/')).toBeNull()
    expect(extractNhGalleryId('https://nhentai.net@evil.com/g/123/')).toBeNull()
    expect(extractNhGalleryId('228922')).toBeNull()
    expect(extractNhGalleryId('#228922')).toBeNull()
    expect(extractNhGalleryId('')).toBeNull()
    expect(extractNhGalleryId(null)).toBeNull()
  })
  it('8 位數與 0 不算；7 位數可以', () => {
    expect(extractNhGalleryId('https://nhentai.net/g/12345678/')).toBeNull()
    expect(extractNhGalleryId('https://nhentai.net/g/1234567/')).toBe(1234567)
    expect(extractNhGalleryId('https://nhentai.net/g/0/')).toBeNull()
    expect(extractNhGalleryId('https://nhentai.net/g/12ab/')).toBeNull()
  })
  it('全形數字', () => {
    expect(extractNhGalleryId('https://nhentai.net/g/１２３４/')).toBe(1234)
  })
  it('只看前 4096 字', () => {
    const far = ' '.repeat(5000) + 'https://nhentai.net/g/1/'
    expect(extractNhGalleryId(far)).toBeNull()
  })
  it('額外網域（開發者模式改過端點）', () => {
    expect(extractNhGalleryId('https://mirror.example/g/9/', ['nhentai.net', 'mirror.example'])).toBe(9)
    expect(extractNhGalleryId('https://mirror.example/g/9/')).toBeNull()
    expect(extractNhGalleryId('https://nhentai.net/g/9/', [])).toBeNull()
    // 網域裡的特殊字元不會被當成正規表示式
    expect(extractNhGalleryId('https://nhentaixnet/g/9/', ['nhentai.net'])).toBeNull()
    expect(extractNhGalleryId('https://a.com/g/9/', ['(a|b).com'])).toBeNull()
  })
})

describe('resolveAutoFolders', () => {
  const folders = [{ id: 1 }, { id: 2 }, { id: 5 }]
  it('空字串＝只有未讀', () => {
    expect(resolveAutoFolders('', folders, 1)).toEqual([1])
  })
  it("'[]'＝使用者明確選了都不加", () => {
    expect(resolveAutoFolders('[]', folders, 1)).toEqual([])
  })
  it('只留存在的 id、去重、保持順序', () => {
    expect(resolveAutoFolders('[5,2,2,99,"1"]', folders, 1)).toEqual([5, 2, 1])
  })
  it('壞掉的 JSON、非陣列都當成未設定', () => {
    expect(resolveAutoFolders('{oops', folders, 1)).toEqual([1])
    expect(resolveAutoFolders('{"a":1}', folders, 1)).toEqual([1])
    expect(resolveAutoFolders(undefined, folders, 1)).toEqual([1])
  })
  it('沒有未讀資料夾時回空陣列', () => {
    expect(resolveAutoFolders('', folders, null)).toEqual([])
  })
})

describe('planQuickShareDrain', () => {
  it('新書進 add、全部進 ack', () => {
    const r = planQuickShareDrain(
      [
        { id: 1, at: 1000 },
        { id: 2, at: 2000 },
      ],
      [],
    )
    expect(r.add).toEqual([
      { id: 1, at: 1000 },
      { id: 2, at: 2000 },
    ])
    expect(r.ack).toEqual([1, 2])
  })
  it('已收藏的只清掉、不新增', () => {
    const r = planQuickShareDrain([{ id: 1, at: 1 }, { id: 2, at: 2 }], new Set([1]))
    expect(r.add.map((x) => x.id)).toEqual([2])
    expect(r.ack).toEqual([1, 2])
  })
  it('同一批裡重複的只加一次', () => {
    const r = planQuickShareDrain([{ id: 3, at: 1 }, { id: 3, at: 2 }], [])
    expect(r.add).toEqual([{ id: 3, at: 1 }])
    expect(r.ack).toEqual([3])
  })
  it('不合法的 id 只進 ack', () => {
    const r = planQuickShareDrain([{ id: 0, at: 1 }, { id: 10_000_000, at: 1 }, { id: 4, at: 1 }], [])
    expect(r.add.map((x) => x.id)).toEqual([4])
    expect(r.ack).toContain(0)
    expect(r.ack).toContain(10_000_000)
  })
  it('時間壞掉就用現在', () => {
    const before = Date.now()
    const r = planQuickShareDrain([{ id: 8, at: 'x' }], [])
    expect(r.add[0].at).toBeGreaterThanOrEqual(before)
  })
  it('不是陣列也不會丟錯', () => {
    expect(planQuickShareDrain(null, [])).toEqual({ add: [], ack: [] })
  })
})

describe('shareHosts / isValidId', () => {
  it('預設端點只有 nhentai.net', () => {
    expect(shareHosts('https://nhentai.net/g/{id}/')).toEqual(['nhentai.net'])
  })
  it('端點改過就加入那個網域', () => {
    expect(shareHosts('https://mirror.example/g/{id}/')).toEqual(['nhentai.net', 'mirror.example'])
    expect(shareHosts('not a url')).toEqual(['nhentai.net'])
  })
  it('isValidId', () => {
    expect(isValidId(1)).toBe(true)
    expect(isValidId(9_999_999)).toBe(true)
    expect(isValidId(0)).toBe(false)
    expect(isValidId(1.5)).toBe(false)
  })
})

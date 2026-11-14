// 標籤翻譯下載流程（假的 Filesystem／CapacitorHttp，不需要手機）。
// 涵蓋：gz 下載與解壓、沒有 DecompressionStream 時退回 json、壞掉的 gz、暫存檔清理、sha 查詢與轉址備案、網址白名單；
// 日文：ja.json 下載、sources.json 的版本。
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { gzipSync } from 'node:zlib'

const SHA = '0123456789abcdef0123456789abcdef01234567'
const JSON_TEXT = JSON.stringify({ head: { sha: SHA }, data: [{ namespace: 'artist', data: { a: { name: '好' } } }] })
const JA_TEXT = JSON.stringify({ data: [{ namespace: 'artist', data: { a: { name: 'エー' } } }] })
const SHA256 = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
const SOURCES = { datasets: { ja: { file: 'ja.json', sha256: SHA256.toUpperCase() } } }

const fsState = {
  dirs: new Set(),
  files: new Map(),
  downloadError: null,
  gzBytes: null, // 覆寫 .gz 下載到的內容
  calls: [],
}
const key = (d, p) => `${d}:${p}`

const Filesystem = {
  async mkdir({ path, directory }) {
    fsState.calls.push({ op: 'mkdir', path })
    if (fsState.dirs.has(key(directory, path))) throw new Error('Directory exists')
    fsState.dirs.add(key(directory, path))
  },
  async downloadFile({ url, path, directory, headers }) {
    fsState.calls.push({ op: 'download', url, path, ua: headers?.['User-Agent'] })
    if (fsState.downloadError) throw new Error(fsState.downloadError)
    const parent = path.split('/').slice(0, -1).join('/')
    if (parent && !fsState.dirs.has(key(directory, parent))) throw new Error('open failed: ENOENT (No such file or directory)')
    const data = url.endsWith('.gz')
      ? (fsState.gzBytes ?? gzipSync(Buffer.from(JSON_TEXT)))
      : Buffer.from(url.endsWith('/ja.json') ? JA_TEXT : JSON_TEXT)
    fsState.files.set(key(directory, path), data)
  },
  async stat({ path, directory }) {
    const f = fsState.files.get(key(directory, path))
    if (!f) throw new Error('File does not exist')
    return { size: f.length }
  },
  async readFile({ path, directory, encoding }) {
    const f = fsState.files.get(key(directory, path))
    return { data: encoding ? f.toString('utf-8') : f.toString('base64') }
  },
  async deleteFile({ path, directory }) {
    fsState.files.delete(key(directory, path))
  },
}

const http = { get: vi.fn() }
vi.mock('@capacitor/filesystem', () => ({
  Filesystem,
  Directory: { Cache: 'CACHE', Data: 'DATA' },
  Encoding: { UTF8: 'utf8' },
}))
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isPluginAvailable: () => true },
  CapacitorHttp: http,
}))
vi.mock('@capacitor/app', () => ({ App: { getInfo: async () => ({ version: '0.4.0' }) } }))
vi.mock('@capacitor/browser', () => ({ Browser: { open: async () => {} } }))
vi.mock('nh-webfetch', () => ({ NhWebFetch: {} }))
vi.mock('../src/services/settings.js', () => ({
  settings: {},
  DEFAULT_ENDPOINTS: {
    endpoint_detail: 'https://nhentai.net/api/v2/galleries/{id}',
    endpoint_cdn: 'https://nhentai.net/api/v2/cdn',
    endpoint_page: 'https://nhentai.net/g/{id}/',
  },
}))

let src
beforeEach(async () => {
  fsState.dirs.clear()
  fsState.files.clear()
  fsState.downloadError = null
  fsState.gzBytes = null
  fsState.calls.length = 0
  http.get.mockReset()
  vi.resetModules()
  src = await import('../src/services/tagDbSource.js')
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('downloadTagDb', () => {
  it('下載 .gz、解壓成文字，並刪掉暫存檔', async () => {
    const text = await src.downloadTagDb()
    expect(JSON.parse(text).head.sha).toBe(SHA)
    const dl = fsState.calls.filter((c) => c.op === 'download')
    expect(dl).toHaveLength(1)
    expect(dl[0].url).toBe('https://github.com/EhTagTranslation/Database/releases/latest/download/db.text.json.gz')
    expect(dl[0].path).toBe('tagdb/db.text.json.gz')
    expect(dl[0].ua).toMatch(/^NH-Shelfie\/0\.4\.0 /)
    // 先建資料夾再下載（規則 12）
    expect(fsState.calls[0]).toEqual({ op: 'mkdir', path: 'tagdb' })
    expect(fsState.files.size).toBe(0)
  })

  it('沒有 DecompressionStream：改下載未壓縮的 db.text.json', async () => {
    vi.stubGlobal('DecompressionStream', undefined)
    const text = await src.downloadTagDb()
    expect(text).toBe(JSON_TEXT)
    const dl = fsState.calls.filter((c) => c.op === 'download')
    expect(dl).toHaveLength(1)
    expect(dl[0].url.endsWith('/db.text.json')).toBe(true)
    expect(fsState.files.size).toBe(0)
  })

  it('gz 內容壞掉（不是 gzip 檔頭）：退回下載 db.text.json', async () => {
    fsState.gzBytes = Buffer.from('<html>not gzip</html>')
    const text = await src.downloadTagDb()
    expect(text).toBe(JSON_TEXT)
    expect(fsState.calls.filter((c) => c.op === 'download')).toHaveLength(2)
    expect(fsState.files.size).toBe(0)
  })

  it('寫檔失敗 → WRITE_FAILED，不退回另一個檔案，且清暫存檔', async () => {
    fsState.downloadError = 'open failed: ENOENT (No such file or directory)'
    await expect(src.downloadTagDb()).rejects.toMatchObject({ code: 'WRITE_FAILED' })
    expect(fsState.calls.filter((c) => c.op === 'download')).toHaveLength(1)
  })

  it('連不上網路 → OFFLINE', async () => {
    fsState.downloadError = 'Unable to resolve host "github.com"'
    await expect(src.downloadTagDb()).rejects.toMatchObject({ code: 'OFFLINE' })
  })

  it('其他錯誤歸成 TAGDB_FAILED（不是封面的 COVER_FAILED）', async () => {
    fsState.downloadError = 'something odd'
    await expect(src.downloadTagDb()).rejects.toMatchObject({ code: 'TAGDB_FAILED' })
  })
})

describe('fetchTagDbSha', () => {
  it('200 且內容是 sha', async () => {
    http.get.mockResolvedValueOnce({ status: 200, data: `${SHA}\n` })
    expect(await src.fetchTagDbSha()).toBe(SHA)
    expect(http.get.mock.calls[0][0].url).toBe('https://github.com/EhTagTranslation/Database/releases/latest/download/sha')
    expect(http.get.mock.calls[0][0].headers['User-Agent']).toMatch(/^NH-Shelfie\//)
  })
  it('狀態不是 200、內容不是 sha、丟錯 → 空字串', async () => {
    http.get.mockResolvedValueOnce({ status: 404, data: 'x' })
    expect(await src.fetchTagDbSha()).toBe('')
    http.get.mockResolvedValueOnce({ status: 200, data: '<html>' })
    expect(await src.fetchTagDbSha()).toBe('')
    http.get.mockRejectedValueOnce(new Error('offline'))
    expect(await src.fetchTagDbSha()).toBe('')
  })
  it('原生沒有自動轉址時，跟隨 Location（只限 GitHub 網域）', async () => {
    http.get
      .mockResolvedValueOnce({ status: 302, headers: { Location: 'https://release-assets.githubusercontent.com/x/sha' } })
      .mockResolvedValueOnce({ status: 200, data: SHA })
    expect(await src.fetchTagDbSha()).toBe(SHA)
    expect(http.get).toHaveBeenCalledTimes(2)
    expect(http.get.mock.calls[1][0].url).toBe('https://release-assets.githubusercontent.com/x/sha')
  })
  it('轉址到其他網域一律拒絕', async () => {
    http.get.mockResolvedValueOnce({ status: 302, headers: { location: 'https://evil.example.com/sha' } })
    expect(await src.fetchTagDbSha()).toBe('')
    expect(http.get).toHaveBeenCalledTimes(1)
  })
  it('轉址最多跟 3 次', async () => {
    http.get.mockResolvedValue({ status: 302, headers: { location: 'https://github.com/a' } })
    expect(await src.fetchTagDbSha()).toBe('')
    expect(http.get).toHaveBeenCalledTimes(4)
  })
})

describe('isAllowedRedirect', () => {
  it('只准 https 的 github.com 與 *.githubusercontent.com', () => {
    expect(src.isAllowedRedirect('https://github.com/a/b')).toBe(true)
    expect(src.isAllowedRedirect('https://release-assets.githubusercontent.com/x')).toBe(true)
    expect(src.isAllowedRedirect('http://github.com/a')).toBe(false)
    expect(src.isAllowedRedirect('https://githubusercontent.com.evil.com/a')).toBe(false)
    expect(src.isAllowedRedirect('https://evilgithub.com/a')).toBe(false)
    expect(src.isAllowedRedirect('not a url')).toBe(false)
  })
})

describe('downloadTagDb（日文）', () => {
  it('下載 ja.json（沒有 gz），以文字讀入並刪掉暫存檔', async () => {
    const text = await src.downloadTagDb('ja')
    expect(text).toBe(JA_TEXT)
    const dl = fsState.calls.filter((c) => c.op === 'download')
    expect(dl).toHaveLength(1)
    expect(dl[0].url).toBe('https://github.com/EhPanda-Team/ehpanda-tag-database/releases/latest/download/ja.json')
    expect(dl[0].path).toBe('tagdb/ja.json')
    expect(dl[0].ua).toMatch(/^NH-Shelfie\/0\.4\.0 /)
    expect(fsState.calls[0]).toEqual({ op: 'mkdir', path: 'tagdb' })
    expect(fsState.files.size).toBe(0)
  })
  it('寫檔失敗 → WRITE_FAILED，只試一次', async () => {
    fsState.downloadError = 'open failed: ENOENT (No such file or directory)'
    await expect(src.downloadTagDb('ja')).rejects.toMatchObject({ code: 'WRITE_FAILED' })
    expect(fsState.calls.filter((c) => c.op === 'download')).toHaveLength(1)
  })
  it('連不上網路 → OFFLINE', async () => {
    fsState.downloadError = 'Unable to resolve host "github.com"'
    await expect(src.downloadTagDb('ja')).rejects.toMatchObject({ code: 'OFFLINE' })
  })
  it('不認得的 dataset → TAGDB_FAILED，不連線', async () => {
    await expect(src.downloadTagDb('ko')).rejects.toMatchObject({ code: 'TAGDB_FAILED' })
    expect(fsState.calls.filter((c) => c.op === 'download')).toHaveLength(0)
  })
})

describe('fetchTagDbVersion', () => {
  it("'ja'：從 sources.json 取出 datasets.ja.sha256（小寫）", async () => {
    http.get.mockResolvedValueOnce({ status: 200, data: JSON.stringify(SOURCES) })
    expect(await src.fetchTagDbVersion('ja')).toBe(SHA256)
    expect(http.get.mock.calls[0][0].url).toBe(
      'https://github.com/EhPanda-Team/ehpanda-tag-database/releases/latest/download/sources.json',
    )
    expect(http.get.mock.calls[0][0].headers['User-Agent']).toMatch(/^NH-Shelfie\//)
  })
  it("'ja'：原生已把 JSON 解析成物件也能讀", async () => {
    http.get.mockResolvedValueOnce({ status: 200, data: SOURCES })
    expect(await src.fetchTagDbVersion('ja')).toBe(SHA256)
  })
  it("'ja'：不是 JSON、缺 datasets.ja、狀態不是 200、太大、丟錯 → 空字串", async () => {
    http.get.mockResolvedValueOnce({ status: 200, data: '<html>' })
    expect(await src.fetchTagDbVersion('ja')).toBe('')
    http.get.mockResolvedValueOnce({ status: 200, data: JSON.stringify({ datasets: { en: {} } }) })
    expect(await src.fetchTagDbVersion('ja')).toBe('')
    http.get.mockResolvedValueOnce({ status: 404, data: JSON.stringify(SOURCES) })
    expect(await src.fetchTagDbVersion('ja')).toBe('')
    http.get.mockResolvedValueOnce({ status: 200, data: JSON.stringify(SOURCES) + ' '.repeat(100_001) })
    expect(await src.fetchTagDbVersion('ja')).toBe('')
    http.get.mockRejectedValueOnce(new Error('offline'))
    expect(await src.fetchTagDbVersion('ja')).toBe('')
  })
  it("'ja'：跟隨 GitHub 轉址；轉到其他網域拒絕", async () => {
    http.get
      .mockResolvedValueOnce({ status: 302, headers: { Location: 'https://release-assets.githubusercontent.com/x/sources.json' } })
      .mockResolvedValueOnce({ status: 200, data: JSON.stringify(SOURCES) })
    expect(await src.fetchTagDbVersion('ja')).toBe(SHA256)
    http.get.mockReset()
    http.get.mockResolvedValueOnce({ status: 302, headers: { location: 'https://evil.example.com/sources.json' } })
    expect(await src.fetchTagDbVersion('ja')).toBe('')
    expect(http.get).toHaveBeenCalledTimes(1)
  })
  it("'zh'：同 fetchTagDbSha；其他值不連線、回傳空字串", async () => {
    http.get.mockResolvedValueOnce({ status: 200, data: SHA })
    expect(await src.fetchTagDbVersion('zh')).toBe(SHA)
    expect(await src.fetchTagDbVersion('en')).toBe('')
    expect(await src.fetchTagDbVersion(null)).toBe('')
    expect(http.get).toHaveBeenCalledTimes(1)
  })
})

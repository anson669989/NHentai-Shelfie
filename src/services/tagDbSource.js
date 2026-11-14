// 標籤翻譯資料的下載來源。這是 **唯一對 GitHub 發請求的地方**（nhentai 以外的第一個對外連線）。
//
// 規則：
// - 網址是寫死的常數，只准 https://github.com/EhTagTranslation/Database/releases/latest/download/ 開頭；
//   轉址由原生 HTTP 自動跟隨（目的地是 *.githubusercontent.com）。
// - 不可用 fetch()（CSP connect-src 'self' 會擋，也不要為此放寬 CSP）；一律走原生 HTTP（CapacitorHttp／Filesystem.downloadFile）。
// - 不經 nhSource 的兩條節流隊伍（不是 nhentai 的請求）。帶 NH-Shelfie/<版本> 的 User-Agent，不送出任何使用者資料。
// - 只下載 db.text.json.gz（純文字版，約 1.3 MB）；WebView 沒有 DecompressionStream 才退回未壓縮的 db.text.json。
import { CapacitorHttp } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { AppError, E } from './errors.js'
import { classifyDownloadError } from './parse.js'
import { appUserAgent, ensureParentDir } from './nhSource.js'
import { isSha } from './tagTranslation.js'

export const TAGDB_BASE = 'https://github.com/EhTagTranslation/Database/releases/latest/download/'
const SHA_URL = `${TAGDB_BASE}sha`
const GZ_URL = `${TAGDB_BASE}db.text.json.gz`
const JSON_URL = `${TAGDB_BASE}db.text.json`
const TAGDB_DIR = 'tagdb'
const GZ_PATH = `${TAGDB_DIR}/db.text.json.gz`
const JSON_PATH = `${TAGDB_DIR}/db.text.json`

const TIMEOUT_MS = 30_000
const MAX_GZ_BYTES = 10 * 1024 * 1024
const MAX_JSON_BYTES = 30 * 1024 * 1024
const MAX_REDIRECTS = 3

/** 只准寫死的 GitHub 下載網址 */
function assertTagDbUrl(url) {
  if (typeof url !== 'string' || !url.startsWith(TAGDB_BASE)) throw new AppError(E.TAGDB_FAILED, { cause: 'url' })
}

/** 轉址目的地：https 且網域是 github.com 或 *.githubusercontent.com */
export function isAllowedRedirect(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && (u.hostname === 'github.com' || u.hostname.endsWith('.githubusercontent.com'))
  } catch {
    return false
  }
}

function toTagDbError(err) {
  if (err instanceof AppError) return err
  const code = classifyDownloadError(err)
  // COVER_FAILED 是封面專用的「其他」，在這裡歸成翻譯資料失敗
  return new AppError(code === E.COVER_FAILED ? E.TAGDB_FAILED : code, {
    cause: String(err?.message || err || '').slice(0, 300),
  })
}

const header = (res, name) => {
  const h = res?.headers || {}
  const k = Object.keys(h).find((x) => x.toLowerCase() === name)
  return k ? String(h[k]) : ''
}

/**
 * 取得目前最新版本的 commit sha（40 bytes 的小檔）。
 * 狀態不是 200 或內容不是 sha → 回傳 ''（當作不知道，呼叫端繼續下載）。
 * 原生 HTTP 若沒有自動跟隨轉址（301／302…），讀 Location 再請求一次，最多 3 次，且只跟隨 GitHub 網域。
 */
export async function fetchTagDbSha() {
  try {
    const ua = await appUserAgent()
    let url = SHA_URL
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await CapacitorHttp.get({
        url,
        responseType: 'text',
        headers: { 'User-Agent': ua },
        connectTimeout: TIMEOUT_MS,
        readTimeout: TIMEOUT_MS,
      })
      if ([301, 302, 303, 307, 308].includes(res?.status)) {
        const next = header(res, 'location')
        if (!next || !isAllowedRedirect(next)) return ''
        url = next
        continue
      }
      if (res?.status !== 200) return ''
      const text = typeof res.data === 'string' ? res.data.trim() : ''
      return isSha(text) ? text.toLowerCase() : ''
    }
    return ''
  } catch {
    return ''
  }
}

function base64ToBytes(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function gunzipToText(bytes) {
  if (bytes.length < 2 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) throw new AppError(E.TAGDB_FAILED, { cause: 'not gzip' })
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  const reader = stream.getReader()
  const chunks = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > MAX_JSON_BYTES) {
      reader.cancel().catch(() => {})
      throw new AppError(E.TAGDB_FAILED, { cause: 'too large' })
    }
    chunks.push(value)
  }
  const out = new Uint8Array(total)
  let off = 0
  for (const c of chunks) {
    out.set(c, off)
    off += c.length
  }
  return new TextDecoder('utf-8').decode(out)
}

async function download(url, path, maxBytes, ua) {
  assertTagDbUrl(url)
  await ensureParentDir(path, Directory.Cache)
  await Filesystem.downloadFile({
    url,
    path,
    directory: Directory.Cache,
    headers: { 'User-Agent': ua },
    connectTimeout: TIMEOUT_MS,
    readTimeout: TIMEOUT_MS,
  })
  const st = await Filesystem.stat({ path, directory: Directory.Cache })
  if (!st.size || st.size > maxBytes) throw new AppError(E.TAGDB_FAILED, { cause: `size ${st.size}` })
}

async function removeTemp() {
  for (const p of [GZ_PATH, JSON_PATH]) {
    await Filesystem.deleteFile({ path: p, directory: Directory.Cache }).catch(() => {})
  }
}

/**
 * 下載翻譯資料，回傳 db.text.json 的文字。
 * 1. 有 DecompressionStream：下載 .gz → 讀成位元組 → 檢查 gzip 檔頭 → 解壓（超過 30 MB 中止）。
 * 2. 沒有 DecompressionStream，或解壓失敗：改下載未壓縮的 db.text.json。
 * 無論成功失敗都刪掉暫存檔。
 * @throws {AppError} OFFLINE／TIMEOUT／WRITE_FAILED／STORAGE_FULL／RATE_LIMITED 原樣；其餘 TAGDB_FAILED
 */
export async function downloadTagDb() {
  try {
    const ua = await appUserAgent()
    if (typeof DecompressionStream === 'function') {
      try {
        await download(GZ_URL, GZ_PATH, MAX_GZ_BYTES, ua)
        const file = await Filesystem.readFile({ path: GZ_PATH, directory: Directory.Cache })
        const bytes =
          typeof file.data === 'string' ? base64ToBytes(file.data) : new Uint8Array(await file.data.arrayBuffer())
        return await gunzipToText(bytes)
      } catch (err) {
        // 網路、空間、寫檔類的錯誤換成未壓縮版也沒用；只有格式／解壓問題才退回
        const e = toTagDbError(err)
        if (e.code !== E.TAGDB_FAILED) throw e
      }
    }
    await download(JSON_URL, JSON_PATH, MAX_JSON_BYTES, ua)
    const file = await Filesystem.readFile({ path: JSON_PATH, directory: Directory.Cache, encoding: Encoding.UTF8 })
    if (typeof file.data !== 'string') throw new AppError(E.TAGDB_FAILED, { cause: 'not text' })
    return file.data
  } catch (err) {
    throw toTagDbError(err)
  } finally {
    await removeTemp()
  }
}

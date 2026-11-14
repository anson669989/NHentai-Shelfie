// 標籤翻譯資料的下載來源。這是 **唯一對 GitHub 發請求的地方**（nhentai 以外的對外連線）。
//
// 兩個來源（都只用 releases/latest/download/，不寫死版本號）：
// - 中文（dataset 'zh'）：EhTagTranslation/Database —— sha（版本，40 bytes）、db.text.json.gz（約 1.3 MB）；
//   WebView 沒有 DecompressionStream 才退回未壓縮的 db.text.json。
// - 日文（dataset 'ja'）：EhPanda-Team/ehpanda-tag-database —— sources.json（版本＝datasets.ja.sha256，約 3 KB）、
//   ja.json（約 1.6 MB，來源沒有壓縮版）。
//
// 規則：
// - 網址是寫死的常數，只准以下兩個開頭（assertTagDbUrl）：
//     https://github.com/EhTagTranslation/Database/releases/latest/download/
//     https://github.com/EhPanda-Team/ehpanda-tag-database/releases/latest/download/
//   轉址由原生 HTTP 自動跟隨（目的地是 *.githubusercontent.com）；手動跟隨時只准 github.com 與 *.githubusercontent.com。
// - 不可用 fetch()（CSP connect-src 'self' 會擋，也不要為此放寬 CSP）；一律走原生 HTTP（CapacitorHttp／Filesystem.downloadFile）。
// - 不經 nhSource 的兩條節流隊伍（不是 nhentai 的請求）。帶 NH-Shelfie/<版本> 的 User-Agent，不送出任何使用者資料。
import { CapacitorHttp } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { AppError, E } from './errors.js'
import { classifyDownloadError } from './parse.js'
import { appUserAgent, ensureParentDir } from './nhSource.js'
import { isSha, parseSourcesVersion } from './tagTranslation.js'

export const TAGDB_BASE = 'https://github.com/EhTagTranslation/Database/releases/latest/download/'
const SHA_URL = `${TAGDB_BASE}sha`
const GZ_URL = `${TAGDB_BASE}db.text.json.gz`
const JSON_URL = `${TAGDB_BASE}db.text.json`
const TAGDB_DIR = 'tagdb'
const GZ_PATH = `${TAGDB_DIR}/db.text.json.gz`
const JSON_PATH = `${TAGDB_DIR}/db.text.json`

export const TAGDB_JA_BASE = 'https://github.com/EhPanda-Team/ehpanda-tag-database/releases/latest/download/'
const JA_SOURCES_URL = `${TAGDB_JA_BASE}sources.json`
const JA_JSON_URL = `${TAGDB_JA_BASE}ja.json`
const JA_JSON_PATH = `${TAGDB_DIR}/ja.json`
const MAX_SOURCES_CHARS = 100_000

const TIMEOUT_MS = 30_000
const MAX_GZ_BYTES = 10 * 1024 * 1024
const MAX_JSON_BYTES = 30 * 1024 * 1024
const MAX_REDIRECTS = 3

/** 只准寫死的 GitHub 下載網址（兩個開頭） */
function assertTagDbUrl(url) {
  if (typeof url !== 'string' || !(url.startsWith(TAGDB_BASE) || url.startsWith(TAGDB_JA_BASE))) {
    throw new AppError(E.TAGDB_FAILED, { cause: 'url' })
  }
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
 * GET 一個小的文字檔：成功（200）回傳文字，其他任何情況回傳 ''（不丟錯）。
 * 原生 HTTP 若沒有自動跟隨轉址（301／302…），讀 Location 再請求一次，最多 3 次，且只跟隨 GitHub 網域。
 */
async function getText(url) {
  try {
    assertTagDbUrl(url)
    const ua = await appUserAgent()
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
      if (typeof res.data === 'string') return res.data
      // 原生 HTTP 依 Content-Type 可能已把 JSON 解析成物件：轉回文字，交給呼叫端照常解析
      if (res.data && typeof res.data === 'object') return JSON.stringify(res.data)
      return ''
    }
    return ''
  } catch {
    return ''
  }
}

/**
 * 取得中文資料目前最新版本的 commit sha（40 bytes 的小檔）。
 * 狀態不是 200 或內容不是 sha → 回傳 ''（當作不知道，呼叫端繼續下載）。
 */
export async function fetchTagDbSha() {
  const text = (await getText(SHA_URL)).trim()
  return isSha(text) ? text.toLowerCase() : ''
}

/**
 * 取得某份資料目前最新的版本字串；任何失敗都回傳 ''（不丟錯）。
 * 'zh' → EhTagTranslation 的 sha；'ja' → EhPanda sources.json 的 datasets.ja.sha256。
 */
export async function fetchTagDbVersion(dataset) {
  if (dataset === 'zh') return fetchTagDbSha()
  if (dataset !== 'ja') return ''
  const text = await getText(JA_SOURCES_URL)
  if (!text || text.length > MAX_SOURCES_CHARS) return ''
  try {
    return parseSourcesVersion(JSON.parse(text))
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
  for (const p of [GZ_PATH, JSON_PATH, JA_JSON_PATH]) {
    await Filesystem.deleteFile({ path: p, directory: Directory.Cache }).catch(() => {})
  }
}

/**
 * 下載翻譯資料，回傳 JSON 文字。
 * 'ja'：下載 ja.json（沒有壓縮版），以 UTF-8 讀入。
 * 'zh'（預設）：
 * 1. 有 DecompressionStream：下載 .gz → 讀成位元組 → 檢查 gzip 檔頭 → 解壓（超過 30 MB 中止）。
 * 2. 沒有 DecompressionStream，或解壓失敗：改下載未壓縮的 db.text.json。
 * 無論成功失敗都刪掉暫存檔。
 * @throws {AppError} OFFLINE／TIMEOUT／WRITE_FAILED／STORAGE_FULL／RATE_LIMITED 原樣；其餘 TAGDB_FAILED
 */
export async function downloadTagDb(dataset = 'zh') {
  try {
    const ua = await appUserAgent()
    if (dataset === 'ja') {
      await download(JA_JSON_URL, JA_JSON_PATH, MAX_JSON_BYTES, ua)
      const file = await Filesystem.readFile({ path: JA_JSON_PATH, directory: Directory.Cache, encoding: Encoding.UTF8 })
      if (typeof file.data !== 'string') throw new AppError(E.TAGDB_FAILED, { cause: 'not text' })
      return file.data
    }
    if (dataset !== 'zh') throw new AppError(E.TAGDB_FAILED, { cause: 'dataset' })
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

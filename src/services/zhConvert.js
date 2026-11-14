// 簡體 → 繁體（台灣用語）轉換。純 JavaScript 的 opencc-js，沒有 I/O。
// 一定要用動態 import()：Vite 會把這個約 1.1 MB 的字典拆成獨立檔案，只有更新標籤翻譯時才載入。
let cached = null

/** 回傳 (簡體字串) => 台灣繁體字串 的函式；載入一次後快取。 */
export async function loadCnToTw() {
  if (cached) return cached
  const mod = await import('opencc-js/cn2t')
  const OpenCC = mod.default ?? mod
  const Converter = OpenCC.Converter ?? mod.Converter
  cached = Converter({ from: 'cn', to: 'twp' })
  return cached
}

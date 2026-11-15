// 純函式：把 locales.js 的使用說明（help，純文字）解析成「主題＋條列」，給使用說明對話框顯示。
// 寫法（一行一項）：
//   # 主題名稱        → 新的主題
//   - 一條說明        → 目前主題底下的一條
//   其他非空白的行    → 第一個主題之前＝開頭的說明（intro），之後＝最後的附註（footer）
// 只產生純文字，畫面一律以文字節點顯示（不使用 v-html）。

/**
 * @param {string} text
 * @returns {{intro:string[], sections:{title:string, items:string[]}[], footer:string[]}}
 */
export function parseHelp(text) {
  const intro = []
  const sections = []
  const footer = []
  let cur = null
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('# ')) {
      cur = { title: line.slice(2).trim(), items: [] }
      sections.push(cur)
    } else if (line.startsWith('- ') && cur) {
      cur.items.push(line.slice(2).trim())
    } else if (cur) {
      footer.push(line)
    } else {
      intro.push(line.startsWith('- ') ? line.slice(2).trim() : line)
    }
  }
  return { intro, sections, footer }
}

// 純函式：把 locales.js 的使用說明（help，純文字）解析成「主題 → 小標 → 條列」，給使用說明對話框顯示。
// 寫法（一行一項）：
//   # 主題名稱        → 新的主題（對話框裡可展開的一列）
//   ## 小標           → 主題底下的粗體小標：一個問題或一句簡單的功能描述
//   - 一條說明        → 目前小標底下的一條詳細說明
//   其他非空白的行    → 第一個主題之前＝開頭的說明（intro），之後＝最後的附註（footer）
// 每個主題的內容都要先有小標、底下才是條列（tests/help-text.test.js 會檢查四種語言）。
// 只產生純文字，畫面一律以文字節點顯示（不使用 v-html）。

/**
 * @param {string} text
 * @returns {{intro:string[], sections:{title:string, groups:{lead:string, items:string[]}[]}[], footer:string[]}}
 *   groups[].lead：粗體小標；主題底下還沒有小標就出現的條列，會放進 lead 為空字串的一組（不丟掉內容）
 */
export function parseHelp(text) {
  const intro = []
  const sections = []
  const footer = []
  let cur = null // 目前的主題
  let group = null // 目前的小標
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (line.startsWith('## ') && cur) {
      group = { lead: line.slice(3).trim(), items: [] }
      cur.groups.push(group)
    } else if (line.startsWith('# ')) {
      cur = { title: line.slice(2).trim(), groups: [] }
      group = null
      sections.push(cur)
    } else if (line.startsWith('- ') && cur) {
      if (!group) {
        group = { lead: '', items: [] }
        cur.groups.push(group)
      }
      group.items.push(line.slice(2).trim())
    } else if (cur) {
      footer.push(line)
    } else {
      intro.push(line.replace(/^(##|-) /, '').trim())
    }
  }
  return { intro, sections, footer }
}

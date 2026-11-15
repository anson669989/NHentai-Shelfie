// 簡單的對話框、選單與提示訊息服務（不依賴 UI 套件，外掛最少化）。
import { reactive } from 'vue'

export const ui = reactive({
  dialogs: [], // { id, kind: 'confirm'|'prompt'|'sheet'|'alert'|'checklist'|'help', ...opts, resolve }
  toast: null, // { text, id }
})

let seq = 0
function open(kind, opts) {
  return new Promise((resolve) => {
    ui.dialogs.push({ id: ++seq, kind, ...opts, resolve })
  })
}
export function closeDialog(d, value) {
  const i = ui.dialogs.indexOf(d)
  if (i >= 0) ui.dialogs.splice(i, 1)
  d.resolve(value)
}
/** 關閉最上層對話框；回傳是否有關閉（給返回鍵用） */
export function closeTopDialog() {
  const d = ui.dialogs[ui.dialogs.length - 1]
  if (!d) return false
  closeDialog(d, d.kind === 'checklist' ? null : d.kind === 'prompt' ? null : false)
  return true
}

// 返回鍵處理堆疊（例如多選模式）：對話框之後、切換分頁之前處理
const backHandlers = []
/** 註冊返回鍵處理；回傳取消註冊的函式 */
export function pushBackHandler(fn) {
  backHandlers.push(fn)
  return () => {
    const i = backHandlers.lastIndexOf(fn)
    if (i >= 0) backHandlers.splice(i, 1)
  }
}
/** 交給最上層的返回鍵處理；回傳是否有處理 */
export function runBackHandler() {
  const fn = backHandlers[backHandlers.length - 1]
  if (!fn) return false
  fn()
  return true
}

/** @returns {Promise<boolean>} */
export const confirmDialog = (message, { okText, danger = false } = {}) =>
  open('confirm', { message, okText, danger })

/**
 * @param {{title?:string, diagnostics?:string}} [opts] diagnostics：額外顯示可捲動、可複製的純文字（開發者模式）
 */
export const alertDialog = (message, { title, diagnostics } = {}) => open('alert', { message, title, diagnostics })

/**
 * 使用說明：每個主題一列，點標題展開內容（粗體小標＋底下的條列）。內容由 components/helpText.js 的 parseHelp 解析而來（純文字）。
 * @param {string} title
 * @param {{intro?:string[], sections:{title:string, groups:{lead:string, items:string[]}[]}[], footer?:string[]}} content
 */
export const helpDialog = (title, { intro = [], sections = [], footer = [] } = {}) =>
  open('help', { title, intro, sections, footer, opened: {} })

/** @returns {Promise<string|null>} */
export const promptDialog = (title, { value = '', placeholder = '', maxlength = 30, validate } = {}) =>
  open('prompt', { title, value, placeholder, maxlength, validate, error: '' })

/**
 * 動作選單：固定的標題列＋會捲動的內容＋固定在底部的「取消／完成」
 * 每列可帶：danger（紅字）、checked（列尾勾號）、more（右側「⋯」按鈕，點它 resolve { more: value }）、
 *   drag（左側 ≡ 拖曳把手，需搭配 more；可拖的列要相鄰）；
 * `{ divider: true }` 為細分隔線；`{ separator: true, label }` 為使用者建立的分隔線（置中灰字、左右有線，
 *   不可點、不可勾選；搭配 more／drag 時左邊有 ≡、右邊有 ⋯，可和資料夾列一起拖曳）。
 * @param {{label?:string, value?:any, danger?:boolean, checked?:boolean, more?:boolean, drag?:boolean, divider?:boolean, separator?:boolean}[]} actions
 * @param {{tall?:boolean, lines?:string[], note?:{value:string, label?:string, placeholder?:string, save?:(v:string)=>any}, onReorder?:(values:any[])=>any, multi?:{selected:any[], toggle:(value:any)=>any[]|Promise<any[]>, clear?:()=>any[]|Promise<any[]>, clearLabel?:string, mode?:{value:string, set:(mode:string)=>string|Promise<string>}}, headAction?:{icon:'refresh', label:string, value:any}}} [opts]
 *   tall：最大高度 70vh、可捲動（長清單用）；lines：標題下方的純文字行（例如完整書名），可選取複製；
 *   note：單行備註輸入框（直接改 note.value；離開輸入框時呼叫 note.save；貼上的換行轉成空白）
 *   onReorder：拖曳放開後以新順序的 value 陣列呼叫；回傳的 Promise 失敗時畫面還原、顯示錯誤
 *   multi：多選模式。帶 check: true 的列顯示勾選框，點了呼叫 multi.toggle(value) 換成回傳的勾選結果、選單不關；
 *     有 multi.clear 時標題列右邊出現「全部清除」；最下方的按鈕變成「完成」；
 *     有 multi.mode 時標題旁出現「篩選方式」（排除／包含任一／全部符合），選了呼叫 mode.set(值) 並換成回傳的值
 *   headAction：標題列右側的灰色小圖示鈕（目前只有 refresh），點了關閉選單並回傳 headAction.value
 *   scroll：捲動位置記憶 `{ top: 0 }`（呼叫端建立一次）。選單捲動時寫入 top、開啟時捲回 top——
 *     「改名／新增後重開同一個選單」的迴圈傳同一個物件，就會停在原本的位置，不會跳回最上方
 * @returns {Promise<any|{more:any}|false>}
 */
export const actionSheet = (
  title,
  actions,
  { tall = false, lines = [], note = null, onReorder = null, multi = null, headAction = null, scroll = null } = {},
) => open('sheet', { title, actions, tall, lines: lines.filter(Boolean), note, onReorder, multi, headAction, scroll })

/**
 * 多選清單
 * @param {({label:string, value:any}|{divider:true}|{separator:true, label:string})[]} items
 *   divider：細分隔線；separator：使用者建立的分隔線（不可勾選）
 * @param {any[]} selected
 * @returns {Promise<any[]|null>}
 */
export const checklistDialog = (title, items, selected = [], { extraAction } = {}) =>
  open('checklist', { title, items, selected: [...selected], extraAction })

let toastTimer = null
/**
 * 提示訊息（幾秒後自動消失）
 * @param {string} text
 * @param {number|{ms?:number, top?:boolean}} [opts] 數字＝顯示毫秒；top：顯示在畫面上半部、加寬（新增頁的重複收藏提示，
 *   使用者輸入 ID 後視線在上方）
 */
export function toast(text, opts = {}) {
  const { ms = 2200, top = false } = typeof opts === 'number' ? { ms: opts } : opts
  ui.toast = { text, id: ++seq, top }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (ui.toast = null), ms)
}

/** v-longpress 指令：長按 500ms 觸發，並吞掉隨後的 click */
export const vLongpress = {
  mounted(el, binding) {
    let timer = null
    let fired = false
    let sx = 0
    let sy = 0
    const start = (e) => {
      fired = false
      const p = e.touches ? e.touches[0] : e
      sx = p.clientX
      sy = p.clientY
      clearTimeout(timer)
      timer = setTimeout(() => {
        fired = true
        if (navigator.vibrate) navigator.vibrate(15)
        binding.value?.(e)
      }, 500)
    }
    const move = (e) => {
      const p = e.touches ? e.touches[0] : e
      if (Math.abs(p.clientX - sx) > 10 || Math.abs(p.clientY - sy) > 10) clearTimeout(timer)
    }
    const cancel = () => clearTimeout(timer)
    const click = (e) => {
      if (fired) {
        e.stopImmediatePropagation()
        e.preventDefault()
        fired = false
      }
    }
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', move, { passive: true })
    el.addEventListener('touchend', cancel)
    el.addEventListener('touchcancel', cancel)
    el.addEventListener('mousedown', start)
    el.addEventListener('mousemove', move)
    el.addEventListener('mouseup', cancel)
    el.addEventListener('mouseleave', cancel)
    el.addEventListener('click', click, true)
    el.addEventListener('contextmenu', (e) => e.preventDefault())
    el._lp = { cancel }
  },
  unmounted(el) {
    el._lp?.cancel()
  },
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

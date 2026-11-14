// 軟鍵盤出現時，讓對話框／選單浮到鍵盤上方（鍵盤收起後自動復位）。
//
// 兩種情況都處理：
//  1. 視窗被鍵盤縮小（manifest 的 adjustResize）：innerHeight 跟著變小，版面自己會調整，
//     這裡只要把「可用高度」--vvh 同步成最新值。
//  2. 視窗沒縮小、只有「可視區」縮小（visualViewport 變小）：--vv-bottom 記下被鍵盤蓋住的高度，
//     對話框圖層的底部往上抬同樣的距離。
// CSS 用 --vvh 限制選單最大高度（內容超出時 .sheet-body 自己捲動，背景框仍在畫面內）。
export function initViewportVars() {
  const vv = window.visualViewport
  const root = document.documentElement
  let raf = 0

  const apply = () => {
    raf = 0
    const h = vv ? vv.height : window.innerHeight
    const covered = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0
    root.style.setProperty('--vvh', `${Math.round(h)}px`)
    root.style.setProperty('--vv-bottom', `${covered}px`)
    // 鍵盤剛出現：把正在輸入的欄位捲進選單的可視範圍
    const el = document.activeElement
    if (covered > 0 || (vv && window.innerHeight - vv.height > 80)) {
      if (el && el.closest?.('.sheet-body, .dialog') && /^(INPUT|TEXTAREA)$/.test(el.tagName)) {
        el.scrollIntoView({ block: 'nearest' })
      }
    }
  }
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply)
  }

  window.addEventListener('resize', schedule)
  vv?.addEventListener('resize', schedule)
  vv?.addEventListener('scroll', schedule)
  // 欄位取得焦點時鍵盤還在動畫中，稍後再量一次
  document.addEventListener('focusin', () => setTimeout(schedule, 300))
  apply()
}

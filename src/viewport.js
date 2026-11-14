// 軟鍵盤出現時，讓對話框／選單浮到鍵盤上方（鍵盤收起後自動復位）。
//
// Android 15 起 edge-to-edge 強制啟用：視窗不會被鍵盤縮小，網頁的 innerHeight／visualViewport 也不會變，
// 光靠網頁量不到鍵盤。所以有兩個來源，取較大者（不會重複扣）：
//  1. 原生外掛讀系統 IME insets 算出的「鍵盤蓋住 WebView 底部的高度」（nativeOverlap，主要來源）；
//  2. 網頁自己量的 visualViewport（舊版 Android／其他 WebView 行為，備援）。
// 結果寫成 CSS 變數：--vv-bottom（對話框圖層底部上抬的距離）、--vvh（目前可用高度）。
// CSS 用 --vvh 限制選單最大高度，內容超出時 .sheet-body 自己捲動，背景框仍在畫面內。

/** 取較大的鍵盤高度；負數與非數字當作 0 */
export function keyboardCovered(nativeOverlap, webCovered) {
  const a = Number.isFinite(nativeOverlap) ? Math.max(0, nativeOverlap) : 0
  const b = Number.isFinite(webCovered) ? Math.max(0, webCovered) : 0
  return Math.round(Math.max(a, b))
}

/**
 * @param {{ getOverlap?: () => Promise<number>, onOverlap?: (cb: (h:number)=>void) => unknown }} [native]
 *   原生鍵盤高度來源（由 main.js 從 nhSource 傳入，這裡不直接碰外掛）
 */
export function initViewportVars(native = {}) {
  const vv = window.visualViewport
  const root = document.documentElement
  let raf = 0
  let nativeOverlap = 0
  let lastCovered = 0

  const apply = () => {
    raf = 0
    const webCovered = vv ? Math.round(window.innerHeight - vv.height - vv.offsetTop) : 0
    const covered = keyboardCovered(nativeOverlap, webCovered)
    const h = Math.max(0, window.innerHeight - covered)
    root.style.setProperty('--vvh', `${Math.round(h)}px`)
    root.style.setProperty('--vv-bottom', `${covered}px`)
    root.classList.toggle('kb-open', covered > 0)
    // 鍵盤剛出現：把正在輸入的欄位捲進選單的可視範圍
    if (covered > 0 && lastCovered === 0) scrollFocusedIntoView()
    lastCovered = covered
  }
  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(apply)
  }
  const scrollFocusedIntoView = () => {
    const el = document.activeElement
    if (el && el.closest?.('.sheet-body, .dialog') && /^(INPUT|TEXTAREA)$/.test(el.tagName)) {
      // 等圖層上抬、選單重新排版後再捲
      setTimeout(() => el.scrollIntoView({ block: 'nearest' }), 80)
    }
  }

  window.addEventListener('resize', schedule)
  vv?.addEventListener('resize', schedule)
  vv?.addEventListener('scroll', schedule)
  // 欄位取得焦點時鍵盤還在動畫中，稍後再量一次
  document.addEventListener('focusin', () => setTimeout(schedule, 300))
  // 欄位失去焦點（鍵盤收起）後再確認一次，確保復位
  document.addEventListener('focusout', () => setTimeout(schedule, 300))

  native.onOverlap?.((h) => {
    nativeOverlap = h
    schedule()
  })
  native.getOverlap?.().then((h) => {
    nativeOverlap = h
    schedule()
  })
  apply()
}

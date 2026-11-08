// 清單拖曳排序（Pointer Events 自己寫，不用套件）。
// 只有按住把手才拖：按下後等 DELAY 毫秒才開始，期間手指移動超過 SLOP 就當作沒事。
// 拖到捲動容器上下緣時自動捲動，越靠邊越快；放開才呼叫 onDrop(from, to)。

const DELAY = 150 // ms
const SLOP = 8 // px
const EDGE = 56 // 邊緣自動捲動的感應範圍（px）
const MAX_SPEED = 14 // 每個畫格最多捲幾 px

/** 純函式：把 arr[from] 移到 to，回傳新陣列 */
export function moveItem(arr, from, to) {
  const out = arr.slice()
  if (from < 0 || from >= out.length) return out
  const [x] = out.splice(from, 1)
  out.splice(Math.max(0, Math.min(to, out.length)), 0, x)
  return out
}

/**
 * 純函式：被拖的那一列中心在 center 時，應該放到第幾個位置。
 * centers：各列（原本位置）的中心座標；被拖列越過誰的中心，誰就讓位。
 */
export function dropIndex(centers, from, center) {
  let to = from
  for (let i = from + 1; i < centers.length; i++) if (center > centers[i]) to = i
  for (let i = from - 1; i >= 0; i--) if (center < centers[i]) to = i
  return to
}

/** 純函式：靠近邊緣時每個畫格的捲動量（負數往上） */
export function edgeSpeed(y, top, bottom, edge = EDGE, max = MAX_SPEED) {
  if (y < top + edge) return -max * Math.min(1, (top + edge - y) / edge)
  if (y > bottom - edge) return max * Math.min(1, (y - (bottom - edge)) / edge)
  return 0
}

/**
 * 在把手的 pointerdown 呼叫。
 * @param {PointerEvent} e
 * @param {{container:HTMLElement, rows:HTMLElement[], from:number, onDrop:(from:number,to:number)=>void}} opts
 *   container：會捲動的容器；rows：可拖的各列（依畫面順序）；from：被拖的是第幾列
 */
export function startDragSort(e, { container, rows, from, onDrop }) {
  if (e.button > 0 || from < 0) return
  const handle = e.currentTarget
  const pid = e.pointerId
  const sx = e.clientX
  const sy = e.clientY
  let lastY = sy
  let active = false
  let raf = 0
  let to = from
  let pos, centers, h, startScroll, minDy, maxDy
  try {
    handle.setPointerCapture(pid)
  } catch {
    /* 舊 WebView 不支援也能用 */
  }
  const timer = setTimeout(activate, DELAY)

  function activate() {
    active = true
    startScroll = container.scrollTop
    const rects = rows.map((r) => r.getBoundingClientRect())
    pos = rects.map((r) => r.top + startScroll) // 換成容器內容座標，捲動後仍一致
    centers = rects.map((r, i) => pos[i] + r.height / 2)
    h = rects[from].height
    const last = rows.length - 1
    minDy = pos[0] - pos[from]
    maxDy = pos[last] + rects[last].height - (pos[from] + h)
    rows.forEach((r, i) => r.classList.add(i === from ? 'drag-lifted' : 'drag-shift'))
    container.classList.add('drag-active')
    if (navigator.vibrate) navigator.vibrate(15)
    raf = requestAnimationFrame(tick)
  }

  function update() {
    const dy = Math.max(minDy, Math.min(maxDy, lastY - sy + (container.scrollTop - startScroll)))
    to = dropIndex(centers, from, centers[from] + dy)
    rows.forEach((r, i) => {
      if (i === from) r.style.transform = `translateY(${dy}px)`
      else {
        const shift = from < i && i <= to ? -h : to <= i && i < from ? h : 0
        r.style.transform = shift ? `translateY(${shift}px)` : ''
      }
    })
  }

  function tick() {
    const rect = container.getBoundingClientRect()
    const v = edgeSpeed(lastY, rect.top, rect.bottom)
    if (v) {
      const before = container.scrollTop
      container.scrollTop = before + v
      if (container.scrollTop !== before) update()
    }
    raf = requestAnimationFrame(tick)
  }

  function onMove(ev) {
    if (ev.pointerId !== pid) return
    if (!active) {
      if (Math.abs(ev.clientX - sx) > SLOP || Math.abs(ev.clientY - sy) > SLOP) finish(false)
      return
    }
    ev.preventDefault()
    lastY = ev.clientY
    update()
  }

  function finish(commit) {
    clearTimeout(timer)
    cancelAnimationFrame(raf)
    handle.removeEventListener('pointermove', onMove)
    handle.removeEventListener('pointerup', onUp)
    handle.removeEventListener('pointercancel', onCancel)
    try {
      handle.releasePointerCapture(pid)
    } catch {
      /* 已釋放 */
    }
    if (!active) return
    active = false
    // 先改資料（Vue 在下一個 microtask 重畫，畫面不會閃回舊順序），再清掉位移
    if (commit && to !== from) onDrop(from, to)
    rows.forEach((r) => {
      r.style.transform = ''
      r.classList.remove('drag-lifted', 'drag-shift')
    })
    container.classList.remove('drag-active')
  }
  const onUp = (ev) => ev.pointerId === pid && finish(true)
  const onCancel = (ev) => ev.pointerId === pid && finish(false)

  handle.addEventListener('pointermove', onMove)
  handle.addEventListener('pointerup', onUp)
  handle.addEventListener('pointercancel', onCancel)
}

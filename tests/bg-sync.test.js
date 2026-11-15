import { describe, it, expect } from 'vitest'
import { planBgSync, estimateSyncMinutes, fillCount } from '../src/services/bgSync.js'

// 預設：開關開著、在前景、服務沒在跑、還有 10 本、工作者在跑、沒有要處理的事
const base = { enabled: true, active: true, serviceOn: false, pending: 10, running: true, waiting: false, halted: false }
const plan = (patch) => planBgSync({ ...base, ...patch })

describe('planBgSync（2.3 表格）', () => {
  it("start：開關開、前景、服務沒跑、有待處理、在跑或在等、沒卡住", () => {
    expect(plan({})).toBe('start')
    expect(plan({ running: false, waiting: true })).toBe('start')
  })

  it('start 的每個條件少一個就不啟動', () => {
    expect(plan({ enabled: false })).toBe('none')
    expect(plan({ pending: 0 })).toBe('none')
    expect(plan({ running: false, waiting: false })).toBe('none')
    expect(plan({ halted: true })).toBe('none')
  })

  it('背景時不會 start（Android 12 起背景不能啟動前景服務）', () => {
    expect(plan({ active: false })).toBe('none')
    expect(plan({ active: false, running: false, waiting: true })).toBe('none')
  })

  it('update：服務在跑、有待處理、在跑或在等、沒卡住（前景背景都一樣）', () => {
    expect(plan({ serviceOn: true })).toBe('update')
    expect(plan({ serviceOn: true, active: false })).toBe('update')
    expect(plan({ serviceOn: true, running: false, waiting: true })).toBe('update')
  })

  it('done：服務在跑、沒有待處理、工作者已停', () => {
    expect(plan({ serviceOn: true, pending: 0, running: false })).toBe('done')
    expect(plan({ serviceOn: true, pending: 0, running: false, active: false })).toBe('done')
    // 計時器還在也算做完（沒東西可抓了）
    expect(plan({ serviceOn: true, pending: 0, running: false, waiting: true })).toBe('done')
  })

  it('pending 為 0 但工作者還在收尾：先不動', () => {
    expect(plan({ serviceOn: true, pending: 0, running: true })).toBe('none')
  })

  it('paused：服務在跑但要使用者處理（驗證／錯誤）', () => {
    expect(plan({ serviceOn: true, halted: true })).toBe('paused')
    expect(plan({ serviceOn: true, halted: true, active: false })).toBe('paused')
    expect(plan({ serviceOn: true, halted: true, running: false })).toBe('paused')
  })

  it('stop：服務在跑但開關被關掉', () => {
    expect(plan({ serviceOn: true, enabled: false })).toBe('stop')
    expect(plan({ serviceOn: true, enabled: false, pending: 0, running: false })).toBe('stop')
  })

  it('none：服務在跑、有待處理，但工作者沒跑也沒在等（例如佇列被停下）', () => {
    expect(plan({ serviceOn: true, running: false, waiting: false })).toBe('none')
  })

  it('判斷順序：stop → paused → done → update → start', () => {
    // stop 優先於 paused
    expect(plan({ serviceOn: true, enabled: false, halted: true })).toBe('stop')
    // paused 優先於 done
    expect(plan({ serviceOn: true, halted: true, pending: 0, running: false })).toBe('paused')
    // paused 優先於 update
    expect(plan({ serviceOn: true, halted: true, running: true })).toBe('paused')
  })

  it('輸入不完整或奇怪時不出錯', () => {
    expect(planBgSync()).toBe('none')
    expect(planBgSync({})).toBe('none')
    expect(plan({ pending: -3 })).toBe('none')
    expect(plan({ pending: '5' })).toBe('start')
    expect(plan({ pending: NaN })).toBe('none')
    expect(plan({ serviceOn: true, pending: undefined, running: false })).toBe('done')
  })
})

describe('estimateSyncMinutes（每本 3 秒）', () => {
  it('基本值', () => {
    expect(estimateSyncMinutes(0)).toBe(0)
    expect(estimateSyncMinutes(1)).toBe(1)
    expect(estimateSyncMinutes(20)).toBe(1)
    expect(estimateSyncMinutes(21)).toBe(2)
    expect(estimateSyncMinutes(1000)).toBe(50)
  })
  it('負數、非數字回 0', () => {
    expect(estimateSyncMinutes(-5)).toBe(0)
    expect(estimateSyncMinutes(NaN)).toBe(0)
    expect(estimateSyncMinutes(undefined)).toBe(0)
    expect(estimateSyncMinutes(Infinity)).toBe(0)
  })
})

describe('fillCount', () => {
  it('把 {n} 換成數字（全部出現的地方）', () => {
    expect(fillCount('還有 {n} 本', 12)).toBe('還有 12 本')
    expect(fillCount('{n} left', 0)).toBe('0 left')
    expect(fillCount('{n}/{n}', 3)).toBe('3/3')
  })
  it('沒有 {n} 或範本是空的', () => {
    expect(fillCount('同步中', 5)).toBe('同步中')
    expect(fillCount('', 5)).toBe('')
    expect(fillCount(null, 5)).toBe('')
    expect(fillCount(undefined, 5)).toBe('')
  })
})

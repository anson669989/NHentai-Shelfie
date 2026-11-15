<template>
  <div class="app" :class="{ dark: isDark }" :style="themeVars">
    <div v-if="initError" class="init-error">
      <p>{{ initError }}</p>
    </div>
    <template v-else-if="ready">
      <main class="pages">
        <FoldersPage v-show="tab === 'folders'" :active="tab === 'folders'" />
        <AddPage v-show="tab === 'add'" :active="tab === 'add'" />
        <SettingsPage v-show="tab === 'settings'" :active="tab === 'settings'" />
      </main>
      <nav class="bottom-nav">
        <button :class="{ on: tab === 'folders' }" @click="tab = 'folders'">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h5l2 2h8A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" /></svg>
          <span>{{ t('nav.folders') }}</span>
        </button>
        <button class="center" :class="{ on: tab === 'add' }" @click="tab = 'add'">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          <span>{{ t('nav.add') }}</span>
        </button>
        <button :class="{ on: tab === 'settings' }" @click="tab = 'settings'">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
          <span>{{ t('nav.settings') }}</span>
        </button>
      </nav>
    </template>
    <DialogHost />
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { App as CapApp } from '@capacitor/app'
import FoldersPage from './components/FoldersPage.vue'
import AddPage from './components/AddPage.vue'
import SettingsPage from './components/SettingsPage.vue'
import DialogHost from './components/DialogHost.vue'
import {
  initLibrary,
  runQueue,
  setAppActive,
  nudgeQueue,
  setBgSyncLabels,
  clearBgSyncNotice,
  listenForShares,
  listenForQuickShares,
  drainQuickShares,
  setShareLabels,
  sharedInput,
  maybeUpdateTagTranslations,
  setTagLang,
} from './services/library.js'
import { settings } from './services/settings.js'
import { t, currentLang } from './i18n.js'
import { closeTopDialog, runBackHandler, toast } from './ui.js'

const tab = ref('folders')
const ready = ref(false)
const initError = ref('')

const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
const systemDark = ref(mq?.matches ?? false)
const onMq = (e) => (systemDark.value = e.matches)

const isDark = computed(() =>
  settings.dark_mode === 'dark' ? true : settings.dark_mode === 'light' ? false : systemDark.value,
)
const themeVars = computed(() => ({ '--primary': settings.theme_color }))

let lastBack = 0
const listeners = []
/** App 是否在前景（appStateChange 更新；啟動時一定在前景） */
let foreground = true

onMounted(async () => {
  mq?.addEventListener?.('change', onMq)
  try {
    await initLibrary()
    ready.value = true
    // 標籤翻譯只處理目前介面語言那一份資料（服務層不 import i18n，語言由這裡傳進去；不 await 更新）
    setTagLang(currentLang.value)
    pushBgSyncLabels()
  } catch (err) {
    console.error(err)
    initError.value = `初始化失敗 / Init failed: ${err?.message || err}`
    return
  }

  listeners.push(
    await CapApp.addListener('backButton', () => {
      if (closeTopDialog()) return
      if (runBackHandler()) return // 例如：退出多選模式
      if (tab.value !== 'folders') {
        tab.value = 'folders'
        return
      }
      if (Date.now() - lastBack < 2000) {
        CapApp.exitApp()
      } else {
        lastBack = Date.now()
        toast(t('common.pressAgainToExit'))
      }
    }),
  )
  // 背景佇列預設只在前景執行：切到背景就停（背景下載開著且服務在跑時繼續），回到前景、網路恢復時自動續跑；
  // App 重開後也會從資料庫接著做。停／跑佇列與背景下載服務都在 setAppActive 裡處理
  listeners.push(
    await CapApp.addListener('appStateChange', ({ isActive }) => {
      foreground = !!isActive
      setAppActive(isActive)
      if (isActive) {
        clearBgSyncNotice().catch(() => {}) // 「同步已暫停」通知：回到 App 就不需要了
        drainShares()
        maybeUpdateTagTranslations()
      }
    }),
  )
  window.addEventListener('online', onOnline)
  // 直接收藏：先同步提示文字與設定給原生，再處理收件匣（要在啟動佇列之前，新書才會排進去）
  await pushShareLabels()
  await drainShares()
  listenForQuickShares(onDrained).catch((e) => console.warn('quick share listener', e))
  runQueue().catch(() => {})
  // 從瀏覽器「分享」進來：切到「新增」頁（AddPage 會填入 ID）
  listenForShares().catch((e) => console.warn('share listener', e))
})

// App 在背景時網路恢復：不另外啟動佇列（不在背景連網）；背景下載正在跑時才叫醒工作者
const onOnline = () => (foreground ? runQueue().catch(() => {}) : nudgeQueue())

// ---- 背景下載的通知文字（{n} 原樣傳下去，由服務層代換）----
const pushBgSyncLabels = () =>
  setBgSyncLabels({
    title: t('bgSync.title'),
    progress: t('bgSync.progress'),
    paused: t('bgSync.paused'),
    stop: t('bgSync.stop'),
    channel: t('bgSync.channel'),
  })

// ---- 快速分享（直接收藏）----
// {id} 佔位符原樣傳給原生端，由原生代換（t() 對沒給的變數會保留它）
const pushShareLabels = () =>
  setShareLabels({
    saved: t('share.saved'),
    duplicate: t('share.duplicate'),
    notNh: t('share.notNh'),
    failed: t('share.failed'),
  })
// App 在背景時處理掉的直接收藏本數：回到前景時一次提示（背景時跳的 toast 看不到）
let drainedAway = 0
/**
 * 收件匣處理完（n＝新增本數）。
 * - 前景：提示（連同背景時累積的）並啟動佇列
 * - 背景：只累加，不提示、不啟動佇列（書已寫進資料庫，回到前景才抓）；背景下載正在跑時才叫醒工作者
 */
function onDrained(n) {
  const added = n > 0 ? n : 0
  if (!foreground) {
    if (added) {
      drainedAway += added
      nudgeQueue()
    }
    return
  }
  const total = added + drainedAway
  drainedAway = 0
  if (total > 0) toast(t('share.drained', { n: total }))
  if (added) runQueue().catch(() => {})
}
async function drainShares() {
  let n = 0
  try {
    n = await drainQuickShares()
  } catch (e) {
    console.warn('drain quick shares failed', e)
  }
  onDrained(n)
}
watch(currentLang, (lang) => {
  if (!ready.value) return
  pushShareLabels()
  pushBgSyncLabels()
  setTagLang(lang) // 開關開著時，依新語言檢查一次（沒有資料就下載，有資料照 24 小時規則）
})
watch(sharedInput, (v) => {
  if (v) tab.value = 'add'
})

onBeforeUnmount(() => {
  mq?.removeEventListener?.('change', onMq)
  window.removeEventListener('online', onOnline)
  listeners.forEach((l) => l.remove())
})
</script>

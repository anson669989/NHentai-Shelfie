<template>
  <section class="page folders-page">
    <!-- 多選模式的上方列 -->
    <header v-if="selecting" class="folder-bar select-bar">
      <button class="btn text" @click="exitSelect">{{ t('common.cancel') }}</button>
      <span class="select-count">{{ t('select.count', { n: selected.size }) }}</span>
      <button class="btn text" @click="selectAll">
        {{ allSelected ? t('select.none') : t('select.all') }}
      </button>
    </header>
    <header v-else class="folder-bar">
      <button class="select-like folder-select" :aria-label="t('folder.pick')" @click="openPicker">
        <span class="folder-select-name">{{ currentName }}</span>
        <small class="muted">({{ currentCount }})</small>
        <span class="caret">▾</span>
      </button>
      <select class="sort-select" :value="sortMode" @change="changeSort($event.target.value)">
        <option v-for="m in SORT_MODES" :key="m" :value="m">{{ t('sort.' + m) }}</option>
      </select>
    </header>

    <QueueBanner />

    <div v-if="loaded && !books.length" class="empty">
      <p>{{ t('folder.empty') }}</p>
      <p class="muted">{{ t('folder.emptyHint') }}</p>
    </div>
    <CoverGrid
      v-else
      ref="grid"
      :books="books"
      :columns="Number(settings.grid_columns) || 3"
      :selecting="selecting"
      :selected-ids="selected"
      v-bind="view"
      @open="openBook"
      @longpress="startSelect"
      @toggle="toggle"
      @menu="bookMenu"
    />

    <!-- 多選模式的下方動作列 -->
    <footer v-if="selecting" class="select-actions">
      <button class="select-action" :disabled="!selected.size" @click="batchClassify">
        <span class="sa-icon" aria-hidden="true">📁</span>{{ t('select.classify') }}
      </button>
      <button v-if="currentFolder" class="select-action" :disabled="!selected.size" @click="batchRemove">
        <span class="sa-icon" aria-hidden="true">➖</span>{{ t('select.removeFromFolder') }}
      </button>
      <button class="select-action danger" :disabled="!selected.size" @click="batchDelete">
        <span class="sa-icon" aria-hidden="true">🗑</span>{{ t('select.delete') }}
      </button>
    </footer>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import CoverGrid from './CoverGrid.vue'
import QueueBanner from './QueueBanner.vue'
import {
  dataVersion,
  listBooks,
  listFolders,
  folderCounts,
  getSortMode,
  setSortMode,
  SORT_MODES,
  createFolder,
  renameFolder,
  deleteFolder,
  reorderFolders,
  addBooksToFolders,
  removeBooksFromFolder,
  deleteBooks,
} from '../services/library.js'
import { settings } from '../services/settings.js'
import { t, errText } from '../i18n.js'
import { actionSheet, confirmDialog, promptDialog, toast, pushBackHandler } from '../ui.js'
import { openBook, openBookMenu, pickFoldersDialog } from './bookActions.js'
import { viewOptions } from './viewOptions.js'

const props = defineProps({ active: Boolean })

const folders = ref([])
const books = ref([])
const current = ref('all')
const sortMode = ref('added_desc')
const counts = ref({ all: 0, uncat: 0, byFolder: {} })
const loaded = ref(false)
const grid = ref(null)

// ---- 多選模式 ----
const selecting = ref(false)
const selected = ref(new Set())
let removeBack = null

const countOf = (key) =>
  key === 'all' ? counts.value.all : key === 'uncat' ? counts.value.uncat : counts.value.byFolder[key] || 0
/** 目前所在的自建資料夾；「全部」「未分類」為 null（預設資料夾不顯示「從此資料夾移除」） */
const currentFolder = computed(() =>
  typeof current.value === 'number' ? folders.value.find((f) => f.id === current.value) || null : null,
)
const currentName = computed(() =>
  current.value === 'all' ? t('folder.all') : current.value === 'uncat' ? t('folder.uncat') : currentFolder.value?.name || '',
)
const currentCount = computed(() => countOf(current.value))
/** 顯示備註與媽媽模式（收藏頁） */
const view = computed(() => viewOptions(settings, 'library'))
const allSelected = computed(() => books.value.length > 0 && selected.value.size === books.value.length)

async function reload() {
  folders.value = await listFolders()
  if (typeof current.value === 'number' && !folders.value.some((f) => f.id === current.value)) {
    current.value = 'all' // 目前所在的資料夾被刪除 → 回到「全部」
    grid.value?.scrollToTop?.()
  }
  sortMode.value = await getSortMode(current.value)
  books.value = await listBooks(current.value, sortMode.value)
  counts.value = await folderCounts()
  loaded.value = true
  if (selecting.value) {
    // 已不在列表中的書（被刪除、被移出）從選取中拿掉
    const ids = new Set(books.value.map((b) => b.gallery_id))
    selected.value = new Set([...selected.value].filter((id) => ids.has(id)))
  }
}

watch(
  () => [props.active, dataVersion.value],
  ([active]) => {
    if (active) reload().catch((e) => toast(errText(e)))
    else exitSelect()
  },
  { immediate: true },
)

function startSelect(book) {
  if (!selecting.value) {
    selecting.value = true
    selected.value = new Set()
    removeBack = pushBackHandler(exitSelect) // 返回鍵先退出多選模式
  }
  toggle(book, true)
}

function toggle(book, forceOn = false) {
  const s = new Set(selected.value)
  if (s.has(book.gallery_id) && !forceOn) s.delete(book.gallery_id)
  else s.add(book.gallery_id)
  selected.value = s
}

function selectAll() {
  selected.value = allSelected.value ? new Set() : new Set(books.value.map((b) => b.gallery_id))
}

function exitSelect() {
  selecting.value = false
  selected.value = new Set()
  removeBack?.()
  removeBack = null
}

async function batchClassify() {
  const ids = [...selected.value]
  const others = folders.value.filter((f) => f.id !== current.value)
  const picked = await pickFoldersDialog(
    t('select.classifyTitle', { n: ids.length }),
    others.map((f) => ({ label: f.name, value: f.id })),
  )
  if (!picked?.length) return
  try {
    await addBooksToFolders(ids, picked)
    toast(t('select.classified', { n: ids.length, f: picked.length }))
    exitSelect()
  } catch (err) {
    toast(errText(err))
  }
}

async function batchRemove() {
  const ids = [...selected.value]
  const f = currentFolder.value
  if (!f) return
  try {
    await removeBooksFromFolder(ids, f.id)
    toast(t('select.removed', { n: ids.length }))
    exitSelect()
  } catch (err) {
    toast(errText(err))
  }
}

async function batchDelete() {
  const ids = [...selected.value]
  const ok = await confirmDialog(t('select.deleteConfirm', { n: ids.length }), {
    okText: t('common.delete'),
    danger: true,
  })
  if (!ok) return
  try {
    await deleteBooks(ids)
    toast(t('select.deleted', { n: ids.length }))
    exitSelect()
  } catch (err) {
    toast(errText(err))
  }
}

// ---- 資料夾選單 ----
async function openPicker() {
  const row = (key, label) => ({ label: `${label} (${countOf(key)})`, value: key, checked: current.value === key })
  const action = await actionSheet(
    t('folder.pick'),
    [
      row('all', t('folder.all')),
      row('uncat', t('folder.uncat')),
      { divider: true },
      ...folders.value.map((f) => ({ ...row(f.id, f.name), more: true, drag: true })),
      ...(folders.value.length ? [{ divider: true }] : []),
      { label: '＋ ' + t('folder.new'), value: '__new' },
    ],
    { tall: true, onReorder: (ids) => reorderFolders(ids) }, // 按住 ≡ 拖曳排序，放開才寫入
  )
  if (action === false || action == null) return
  if (action === '__new') return newFolder()
  if (typeof action === 'object' && 'more' in action) {
    const f = folders.value.find((x) => x.id === action.more)
    if (f && (await folderMenu(f))) openPicker() // 管理完回到選單，方便連續操作
    return
  }
  select(action)
}

async function select(key) {
  current.value = key
  await reload()
  grid.value?.scrollToTop?.()
}

async function changeSort(mode) {
  await setSortMode(current.value, mode)
  await reload()
}

async function newFolder() {
  let newId = null
  const name = await promptDialog(t('folder.new'), {
    placeholder: t('folder.namePlaceholder'),
    validate: async (v) => {
      newId = await createFolder(v)
    },
  })
  if (name != null && newId) select(newId)
}

async function folderMenu(f) {
  const action = await actionSheet(f.name, [
    { label: t('folder.rename'), value: 'rename' },
    { label: t('folder.delete'), value: 'delete', danger: true },
  ])
  if (!action) return false
  try {
    if (action === 'rename') {
      await promptDialog(t('folder.rename'), {
        value: f.name,
        placeholder: t('folder.namePlaceholder'),
        validate: (v) => renameFolder(f.id, v),
      })
    } else if (action === 'delete') {
      const ok = await confirmDialog(t('folder.deleteConfirm', { name: f.name }), {
        okText: t('common.delete'),
        danger: true,
      })
      if (ok) await deleteFolder(f.id)
    }
    await reload() // 先更新清單與本數，再讓呼叫端重開選單
  } catch (err) {
    toast(errText(err))
  }
  return true
}

// ---- 單本（選單與開網頁與新增頁共用 bookActions.js） ----
function bookMenu(book) {
  return openBookMenu(book, { currentFolder: currentFolder.value })
}
</script>

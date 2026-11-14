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
    <header v-else class="folder-bar filter-bar">
      <!-- 第一列：標籤／作者／社團（可打字）｜排序 -->
      <div class="filter-row">
        <TagFilter ref="tagFilter" v-model="tagIds" :options="tagOptions" />
        <select class="sort-select" :value="sortMode" @change="changeSort($event.target.value)">
          <option v-for="m in SORT_MODES" :key="m" :value="m">{{ t('sort.' + m) }}</option>
        </select>
      </div>
      <!-- 第二列：作品名稱／備註／ID｜資料夾篩選（多選） -->
      <div class="filter-row">
        <div class="tag-input-wrap">
          <input
            v-model="textInput"
            class="input text-search"
            type="search"
            enterkeyhint="search"
            autocomplete="off"
            :aria-label="t('filter.textPlaceholder')"
            :placeholder="t('filter.textPlaceholder')"
            @keydown.enter.prevent="$event.target.blur()"
          />
          <button v-if="textInput" class="input-clear" type="button" :aria-label="t('filter.clear')" @click="clearText">
            ✕
          </button>
        </div>
        <button class="select-like folder-select" :aria-label="t('filter.folderTitle')" @click="openPicker">
          <span class="folder-select-name">{{ pickerLabel }}</span>
          <small v-if="folderCount != null" class="muted">({{ folderCount }})</small>
          <span class="caret">▾</span>
        </button>
      </div>
    </header>

    <div v-if="!selecting && filtering" class="filter-result">
      <span>{{ t('filter.found', { n: books.length }) }}</span>
      <button class="btn text" @click="clearAllFilters">{{ t('filter.clearAll') }}</button>
    </div>

    <QueueBanner />

    <div v-if="loaded && !books.length" class="empty">
      <p v-if="filtering">{{ t('filter.noResult') }}</p>
      <template v-else>
        <p>{{ t('folder.empty') }}</p>
        <p class="muted">{{ t('folder.emptyHint') }}</p>
      </template>
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
import TagFilter from './TagFilter.vue'
import {
  dataVersion,
  listBooks,
  listTagOptions,
  listFolders,
  listFolderItems,
  folderCounts,
  getSortMode,
  setSortMode,
  SORT_MODES,
  reorderFolderItems,
  addBooksToFolders,
  removeBooksFromFolder,
  deleteBooks,
} from '../services/library.js'
import { settings, setSetting } from '../services/settings.js'
import {
  normalizeFolderFilter,
  toggleFolderFilter,
  sortKeyOf,
  hasActiveFilter,
  normalizeSearchText,
} from '../services/filter.js'
import { t, errText } from '../i18n.js'
import { actionSheet, confirmDialog, toast, pushBackHandler } from '../ui.js'
import { openBook, openBookMenu, pickFoldersDialog } from './bookActions.js'
import { viewOptions } from './viewOptions.js'
import { folderLabel, buildFolderRows } from './folderRows.js'
import { openFolderManager, openFolderItemMenu, newFolderPrompt, findItem } from './folderManager.js'

const props = defineProps({ active: Boolean })

const folders = ref([])
const books = ref([])
// 篩選：資料夾（多選「或」，記在設定）、標籤（多選「且」）、文字；文字與標籤每次開 App 清空
const folderFilter = ref(normalizeFolderFilter(settings.folder_filter))
const tagIds = ref([])
const tagOptions = ref([])
const textInput = ref('')
const searchText = ref('') // 停止輸入約 300 ms 後才更新
const tagFilter = ref(null)
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
/**
 * 只篩選一個資料夾時才有（⋮ 與多選批次的「從此資料夾移除」）；含系統資料夾「未讀」「典藏」。
 * 「全部」「未分類」或多選為 null
 */
const currentFolder = computed(() => {
  const f = folderFilter.value
  return f.length === 1 && typeof f[0] === 'number' ? folders.value.find((x) => x.id === f[0]) || null : null
})
const nameOf = (key) =>
  key === 'all'
    ? t('folder.all')
    : key === 'uncat'
      ? t('folder.uncat')
      : folderLabel(folders.value.find((f) => f.id === key), t)
const pickerLabel = computed(() =>
  folderFilter.value.length === 1 ? nameOf(folderFilter.value[0]) : t('filter.foldersN', { n: folderFilter.value.length }),
)
const folderCount = computed(() => (folderFilter.value.length === 1 ? countOf(folderFilter.value[0]) : null))
const filter = computed(() => ({ folders: folderFilter.value, tagIds: tagIds.value, text: searchText.value }))
const filtering = computed(() => hasActiveFilter(filter.value))
/** 顯示備註與媽媽模式（收藏頁） */
const view = computed(() => viewOptions(settings, 'library'))
const allSelected = computed(() => books.value.length > 0 && selected.value.size === books.value.length)

let reloadSeq = 0
async function reload() {
  const seq = ++reloadSeq // 連續觸發時只採用最後一次的結果
  folders.value = await listFolders()
  // 勾選的資料夾被刪除 → 從篩選拿掉（全都沒了就回到「全部」）
  const ff = normalizeFolderFilter(folderFilter.value, folders.value.map((f) => f.id))
  if (JSON.stringify(ff) !== JSON.stringify(folderFilter.value)) {
    await setFolderFilter(ff, false)
    grid.value?.scrollToTop?.()
  }
  tagOptions.value = await listTagOptions()
  const known = new Set(tagOptions.value.map((o) => o.id))
  if (tagIds.value.some((id) => !known.has(id))) tagIds.value = tagIds.value.filter((id) => known.has(id))
  sortMode.value = await getSortMode(sortKeyOf(folderFilter.value))
  const list = await listBooks(filter.value, sortMode.value)
  if (seq !== reloadSeq) return
  books.value = list
  counts.value = await folderCounts()
  loaded.value = true
  if (selecting.value) {
    // 已不在列表中的書（被刪除、被移出）從選取中拿掉
    const ids = new Set(books.value.map((b) => b.gallery_id))
    selected.value = new Set([...selected.value].filter((id) => ids.has(id)))
  }
}

// 篩選條件改變 → 重新查詢並捲回頂端
async function applyFilter() {
  try {
    await reload()
    grid.value?.scrollToTop?.()
  } catch (e) {
    toast(errText(e))
  }
}
watch(tagIds, applyFilter)
watch(searchText, applyFilter)
let textTimer = null
watch(textInput, (v) => {
  clearTimeout(textTimer)
  textTimer = setTimeout(() => (searchText.value = normalizeSearchText(v)), 300)
})

function clearText() {
  clearTimeout(textTimer)
  textInput.value = ''
  searchText.value = ''
}

async function setFolderFilter(value, apply = true) {
  folderFilter.value = normalizeFolderFilter(value)
  await setSetting('folder_filter', JSON.stringify(folderFilter.value)) // 只有資料夾篩選在重開 App 後保留
  if (apply) await applyFilter()
}

function clearAllFilters() {
  tagFilter.value?.hide()
  tagIds.value = []
  clearText()
  setFolderFilter(['all']).catch((e) => toast(errText(e)))
}

watch(
  () => [props.active, dataVersion.value],
  ([active]) => {
    if (active) reload().catch((e) => toast(errText(e)))
    else {
      exitSelect()
      tagFilter.value?.hide() // 切到別頁時收合標籤清單
    }
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
  let items = []
  try {
    items = await listFolderItems()
  } catch (err) {
    toast(errText(err))
    return
  }
  // 排除目前所在的資料夾；含未讀、典藏與分隔線（順序和管理資料夾一致）
  const others = items.filter((x) => !(x.type === 'folder' && x.id === currentFolder.value?.id))
  const picked = await pickFoldersDialog(t('select.classifyTitle', { n: ids.length }), buildFolderRows(others, t))
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

// ---- 資料夾篩選（多選「或」）：勾選即時套用、選單不關；右上角「全部清除」回到「全部」 ----
// 使用者資料夾與分隔線可在這裡直接拖曳排序（≡）、改名或刪除（⋯）；結果和「管理資料夾」同步
async function openPicker() {
  const row = (key, label) => ({ label: `${label} (${countOf(key)})`, value: key, check: true })
  let items = []
  try {
    items = await listFolderItems()
  } catch (e) {
    toast(errText(e))
    return
  }
  // 最上方固定四列：全部、未分類、未讀、典藏（沒有 ≡／⋯），之後自動接一條分隔線與可拖曳的使用者資料夾、分隔線
  const action = await actionSheet(
    t('filter.folderTitle'),
    [
      row('all', t('folder.all')),
      row('uncat', t('folder.uncat')),
      ...buildFolderRows(items, t, { counts: counts.value, sortable: true }),
      { divider: true },
      { label: '＋ ' + t('folder.new'), value: '__new' },
      { label: '⚙ ' + t('folder.manage'), value: '__manage' },
    ],
    {
      tall: true,
      // 按住 ≡ 拖曳排序，放開才寫入；資料夾列的 value 是數字 id，分隔線是 's:ID'
      onReorder: (values) => reorderFolderItems(values.map((v) => (typeof v === 'number' ? 'f:' + v : v))),
      multi: {
        selected: folderFilter.value.slice(),
        toggle: async (key) => {
          await setFolderFilter(toggleFolderFilter(folderFilter.value, key))
          return folderFilter.value.slice()
        },
        clear: async () => {
          await setFolderFilter(['all'])
          return folderFilter.value.slice()
        },
      },
    },
  )
  if (action === '__new') return newFolder()
  if (action === '__manage') {
    await openFolderManager()
    await reload().catch((e) => toast(errText(e)))
    return openPicker()
  }
  if (action && typeof action === 'object' && 'more' in action) {
    const key = typeof action.more === 'number' ? 'f:' + action.more : action.more
    if (await openFolderItemMenu(findItem(items, key))) {
      await reload().catch((e) => toast(errText(e))) // 先更新清單與本數，再重開選單，方便連續操作
      openPicker()
    }
  }
}

async function select(key) {
  await setFolderFilter([key])
}

async function changeSort(mode) {
  await setSortMode(sortKeyOf(folderFilter.value), mode) // 多選資料夾時改的是「全部」的排序
  await reload()
}

async function newFolder() {
  const newId = await newFolderPrompt()
  if (newId) select(newId)
}

// ---- 單本（選單與開網頁與新增頁共用 bookActions.js） ----
function bookMenu(book) {
  return openBookMenu(book, { currentFolder: currentFolder.value })
}
</script>

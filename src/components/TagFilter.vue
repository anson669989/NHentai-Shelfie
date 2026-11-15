<template>
  <!-- 標籤／作者／社團篩選：點了仍可打字，下方展開可勾選的清單；
       多選的邏輯由「篩選方式」決定（排除／包含任一／全部符合，預設全部符合） -->
  <div ref="root" class="tag-filter" :class="{ open }">
    <div class="tag-input-wrap">
      <input
        ref="input"
        v-model="query"
        class="input tag-input"
        :class="{ 'has-sel': !open && modelValue.length }"
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        :aria-label="t('filter.tagFilter')"
        :placeholder="!open && modelValue.length ? selectedText : t('filter.tagPlaceholder')"
        @focus="show"
        @click="show"
        @keydown.enter.prevent="$event.target.blur()"
      />
      <button
        v-if="modelValue.length || query"
        class="input-clear"
        type="button"
        :aria-label="t('filter.clear')"
        @mousedown.prevent
        @click="clearAll"
      >
        ✕
      </button>
    </div>

    <div v-if="open" class="tag-panel" @mousedown.prevent>
      <div class="tag-panel-head">
        <span class="muted small tag-panel-count">{{ t('filter.tagsSelected', { n: modelValue.length }) }}</span>
        <ModePicker :model-value="mode" :default-mode="DEFAULT_TAG_MODE" @update:model-value="emit('update:mode', $event)" />
        <span class="spacer" />
        <button class="btn text sheet-clear" :disabled="!modelValue.length" @click="clearSelected">
          {{ t('filter.clear') }}
        </button>
        <button class="btn text sheet-clear" @click="hide">{{ t('filter.done') }}</button>
      </div>
      <div ref="listEl" class="tag-list" @scroll.passive="onListScroll">
        <button v-for="o in visible" :key="o.id" class="tag-row" @click="toggle(o.id)">
          <span class="sheet-box" :class="{ on: selectedSet.has(o.id) }" aria-hidden="true" />
          <span class="tag-type" :class="'tt-' + o.type">{{ t('tagType.' + o.type) }}</span>
          <span class="tag-name"
            >{{ o.label || o.name
            }}<span v-if="showOriginal && o.label && o.label !== o.name" class="tag-orig">{{ o.name }}</span></span
          >
          <span class="tag-count">{{ o.n }}</span>
        </button>
        <p v-if="!list.items.length" class="tag-hint">
          {{ options.length ? t('filter.noOption') : t('filter.noTags') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { t } from '../i18n.js'
import { pushBackHandler } from '../ui.js'
import { filterTagOptions, DEFAULT_TAG_MODE } from '../services/filter.js'
import ModePicker from './ModePicker.vue'

const props = defineProps({
  options: { type: Array, default: () => [] }, // [{id, type, name, n}]
  modelValue: { type: Array, default: () => [] }, // 勾選的 tag id
  mode: { type: String, default: DEFAULT_TAG_MODE }, // 篩選方式：'exclude' | 'any' | 'all'
  showOriginal: { type: Boolean, default: false }, // 翻譯名稱旁附註原文（設定 tag_show_original）
})
const emit = defineEmits(['update:modelValue', 'update:mode'])

const PAGE = 200 // 清單沒有數量上限；為了不卡，先畫 200 筆，捲到接近底部再多畫 200 筆
const root = ref(null)
const input = ref(null)
const open = ref(false)
const query = ref('')
let removeBack = null

const selectedSet = computed(() => new Set(props.modelValue))
const listEl = ref(null)
const shown = ref(PAGE)
const list = computed(() => filterTagOptions(props.options, query.value, props.modelValue, Infinity))
const visible = computed(() => list.value.items.slice(0, shown.value))
/** 捲到離底部不到 300 px 就再多畫一批，直到全部畫完 */
function onListScroll(e) {
  const el = e.target
  if (shown.value < list.value.items.length && el.scrollHeight - el.scrollTop - el.clientHeight < 300) shown.value += PAGE
}
// 打字換了關鍵字：回到第一批並捲回最上面
watch(query, () => {
  shown.value = PAGE
  if (listEl.value) listEl.value.scrollTop = 0
})
/** 收合時輸入框顯示的「已選 N 個」；篩選方式不是預設（全部符合）時在前面標出來，例如「排除：已選 2 個」 */
const selectedText = computed(() => {
  const text = t('filter.tagsSelected', { n: props.modelValue.length })
  return props.mode === DEFAULT_TAG_MODE ? text : t('filter.modePrefix', { mode: t('filter.mode.' + props.mode), text })
})

function show() {
  if (open.value) return
  shown.value = PAGE
  open.value = true
  removeBack = pushBackHandler(hide) // 返回鍵先收合清單
  document.addEventListener('pointerdown', onOutside, true)
}

function hide() {
  if (!open.value) return
  open.value = false
  query.value = ''
  removeBack?.()
  removeBack = null
  document.removeEventListener('pointerdown', onOutside, true)
  input.value?.blur()
}

/** 點清單外面只收合清單，不要同時點到下面的封面（吞掉緊接著的那一次 click） */
function onOutside(e) {
  if (!root.value || root.value.contains(e.target)) return
  hide()
  const swallow = (ev) => {
    ev.stopPropagation()
    ev.preventDefault()
  }
  document.addEventListener('click', swallow, { capture: true, once: true })
  setTimeout(() => document.removeEventListener('click', swallow, true), 400)
}

function toggle(id) {
  const s = new Set(props.modelValue)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  emit('update:modelValue', [...s])
}

/** 清單右上角「全部清除」：只清勾選，保留打的字 */
function clearSelected() {
  emit('update:modelValue', [])
}

/** 輸入框旁的 ✕：清掉打的字與勾選 */
function clearAll() {
  query.value = ''
  emit('update:modelValue', [])
}

defineExpose({ hide })
onBeforeUnmount(hide)
</script>

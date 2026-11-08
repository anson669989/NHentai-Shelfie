<template>
  <!-- 標籤／作者／社團篩選：點了仍可打字，下方展開可勾選的清單（多選邏輯「且」） -->
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
        :placeholder="!open && modelValue.length ? t('filter.tagsSelected', { n: modelValue.length }) : t('filter.tagPlaceholder')"
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
        <span class="muted small">{{ t('filter.tagsSelected', { n: modelValue.length }) }}</span>
        <span class="spacer" />
        <button class="btn text sheet-clear" :disabled="!modelValue.length" @click="clearSelected">
          {{ t('filter.clear') }}
        </button>
        <button class="btn text sheet-clear" @click="hide">{{ t('filter.done') }}</button>
      </div>
      <div class="tag-list">
        <button v-for="o in list.items" :key="o.id" class="tag-row" @click="toggle(o.id)">
          <span class="sheet-box" :class="{ on: selectedSet.has(o.id) }" aria-hidden="true" />
          <span class="tag-type" :class="'tt-' + o.type">{{ t('tagType.' + o.type) }}</span>
          <span class="tag-name">{{ o.name }}</span>
          <span class="tag-count">{{ o.n }}</span>
        </button>
        <p v-if="!list.items.length" class="tag-hint">
          {{ options.length ? t('filter.noOption') : t('filter.noTags') }}
        </p>
        <p v-if="list.more" class="tag-hint">{{ t('filter.more', { n: list.more }) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { t } from '../i18n.js'
import { pushBackHandler } from '../ui.js'
import { filterTagOptions } from '../services/filter.js'

const props = defineProps({
  options: { type: Array, default: () => [] }, // [{id, type, name, n}]
  modelValue: { type: Array, default: () => [] }, // 勾選的 tag id
})
const emit = defineEmits(['update:modelValue'])

const LIMIT = 200 // 只渲染前 200 筆，其餘提示「繼續輸入以縮小範圍」
const root = ref(null)
const input = ref(null)
const open = ref(false)
const query = ref('')
let removeBack = null

const selectedSet = computed(() => new Set(props.modelValue))
const list = computed(() => filterTagOptions(props.options, query.value, props.modelValue, LIMIT))

function show() {
  if (open.value) return
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

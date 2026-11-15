<template>
  <!-- 「篩選方式」小按鈕＋下拉選單（排除／包含任一／全部符合）。標籤篩選的清單與資料夾篩選的選單共用。
       選單相對於「最近的 position: relative 祖先」（清單或選單的標題列）定位，才不會超出邊界被裁掉 -->
  <span ref="root" class="mode-pick">
    <button type="button" class="mode-btn" :class="{ on: open }" :aria-expanded="open" @click="open ? hide() : show()">
      <span class="mode-btn-label">{{ t('filter.mode') }}</span>
      <span class="mode-btn-value">{{ t('filter.mode.' + modelValue) }}</span>
      <span class="mode-caret" aria-hidden="true">▾</span>
    </button>
    <div v-if="open" class="mode-menu" role="menu">
      <button
        v-for="m in FILTER_MODES"
        :key="m"
        type="button"
        class="mode-opt"
        :class="{ on: m === modelValue }"
        role="menuitemradio"
        :aria-checked="m === modelValue"
        @click="choose(m)"
      >
        <span class="mode-opt-mark" aria-hidden="true">{{ m === modelValue ? '✓' : '' }}</span>
        <span class="mode-opt-text">
          <span class="mode-opt-name"
            >{{ t('filter.mode.' + m) }}<span v-if="m === defaultMode" class="mode-opt-default">{{ t('filter.modeDefault') }}</span></span
          >
          <span class="mode-opt-hint">{{ t('filter.modeHint.' + m) }}</span>
        </span>
      </button>
    </div>
  </span>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { t } from '../i18n.js'
import { pushBackHandler } from '../ui.js'
import { FILTER_MODES } from '../services/filter.js'

defineProps({
  modelValue: { type: String, required: true }, // 'exclude' | 'any' | 'all'
  defaultMode: { type: String, default: '' }, // 預設的篩選方式：選單裡那一項後面標「（預設）」（標籤＝all、資料夾＝any）
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const open = ref(false)
let removeBack = null

function show() {
  if (open.value) return
  open.value = true
  removeBack = pushBackHandler(hide) // 返回鍵先收起這個小選單
  document.addEventListener('pointerdown', onOutside, true)
}

function hide() {
  if (!open.value) return
  open.value = false
  removeBack?.()
  removeBack = null
  document.removeEventListener('pointerdown', onOutside, true)
}

function onOutside(e) {
  if (root.value && !root.value.contains(e.target)) hide()
}

function choose(m) {
  hide()
  emit('update:modelValue', m)
}

onBeforeUnmount(hide)
</script>

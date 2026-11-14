<template>
  <div class="dialog-layer">
    <div v-for="d in ui.dialogs" :key="d.id" class="backdrop" @click.self="cancel(d)">
      <!-- 確認 / 提示 -->
      <div v-if="d.kind === 'confirm' || d.kind === 'alert'" class="dialog">
        <h3 v-if="d.title">{{ d.title }}</h3>
        <p class="pre">{{ d.message }}</p>
        <template v-if="d.diagnostics">
          <h4 class="diag-title">{{ t('settings.diagnostics') }}</h4>
          <pre class="diag">{{ d.diagnostics }}</pre>
        </template>
        <div class="dialog-actions">
          <button v-if="d.diagnostics" class="btn text" @click="copyDiag(d)">{{ t('common.copy') }}</button>
          <span v-if="d.diagnostics" class="spacer" />
          <button v-if="d.kind === 'confirm'" class="btn text" @click="closeDialog(d, false)">
            {{ t('common.cancel') }}
          </button>
          <button class="btn" :class="d.danger ? 'danger' : 'primary'" @click="closeDialog(d, true)">
            {{ d.okText || t('common.ok') }}
          </button>
        </div>
      </div>

      <!-- 輸入 -->
      <form v-else-if="d.kind === 'prompt'" class="dialog" @submit.prevent="submitPrompt(d)">
        <h3>{{ d.title }}</h3>
        <input
          v-model="d.value"
          class="input"
          :placeholder="d.placeholder"
          :maxlength="d.maxlength"
          enterkeyhint="done"
          autofocus
          @vue:mounted="({ el }) => el.focus()"
        />
        <p v-if="d.error" class="field-error">{{ d.error }}</p>
        <div class="dialog-actions">
          <button type="button" class="btn text" @click="closeDialog(d, null)">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn primary">{{ t('common.ok') }}</button>
        </div>
      </form>

      <!-- 動作選單 -->
      <div v-else-if="d.kind === 'sheet'" class="sheet" :class="{ tall: d.tall }">
        <!-- 標題列（固定、不捲動）：右側可有重新載入等小圖示鈕；多選模式有「全部清除」 -->
        <div v-if="d.title || d.multi?.clear || d.headAction" class="sheet-head">
          <h3 class="sheet-title">{{ d.title }}</h3>
          <button
            v-if="d.headAction"
            class="sheet-head-btn"
            :aria-label="d.headAction.label"
            :title="d.headAction.label"
            @click="closeDialog(d, d.headAction.value)"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20 12a8 8 0 1 1-2.34-5.66" />
              <path d="M20 4v5h-5" />
            </svg>
          </button>
          <button v-if="d.multi?.clear" class="btn text sheet-clear" @click="clearMulti(d)">
            {{ d.multi.clearLabel || t('filter.clear') }}
          </button>
        </div>
        <!-- 內容（會捲動）：完整書名、備註、所有動作列 -->
        <div class="sheet-body">
          <p v-for="(line, i) in d.lines" :key="'l' + i" class="sheet-line">{{ line }}</p>
          <!-- 單行備註：不限長度，離開輸入框自動儲存；Enter 只收起鍵盤 -->
          <label v-if="d.note" class="sheet-note">
            <span class="sheet-note-label">{{ d.note.label }}</span>
            <input
              v-model="d.note.value"
              class="input"
              type="text"
              enterkeyhint="done"
              autocomplete="off"
              :placeholder="d.note.placeholder"
              @paste="onNotePaste($event, d)"
              @keydown.enter.prevent="$event.target.blur()"
              @blur="d.note.save?.(d.note.value)"
            />
          </label>
          <template v-for="(a, i) in d.actions" :key="i">
            <hr v-if="a.divider" class="sheet-divider" />
            <!-- 使用者建立的分隔線（不可點、不可勾選） -->
            <div v-else-if="a.separator && !a.more" class="sheet-sep">
              <span v-if="a.label" class="sheet-sep-label">{{ a.label }}</span>
            </div>
            <div v-else-if="a.more" class="sheet-row" :data-drag="a.drag ? '' : null">
              <span
                v-if="a.drag"
                class="drag-handle"
                role="button"
                :aria-label="t('folder.dragHandle')"
                @pointerdown="onDragStart($event, d)"
                @contextmenu.prevent
                >≡</span
              >
              <div v-if="a.separator" class="sheet-sep">
                <span v-if="a.label" class="sheet-sep-label">{{ a.label }}</span>
              </div>
              <button v-else class="sheet-item" :class="{ danger: a.danger }" @click="pick(d, a)">
                <span v-if="isMulti(d, a)" class="sheet-box" :class="{ on: isChecked(d, a) }" aria-hidden="true" />
                <span class="sheet-label">{{ a.label }}</span>
                <span v-if="!isMulti(d, a) && a.checked" class="sheet-check">✓</span>
              </button>
              <button class="sheet-more" :aria-label="t('folder.more')" @click="closeDialog(d, { more: a.value })">⋯</button>
            </div>
            <button v-else class="sheet-item" :class="{ danger: a.danger }" @click="pick(d, a)">
              <span v-if="isMulti(d, a)" class="sheet-box" :class="{ on: isChecked(d, a) }" aria-hidden="true" />
              <span class="sheet-label">{{ a.label }}</span>
              <span v-if="!isMulti(d, a) && a.checked" class="sheet-check">✓</span>
            </button>
          </template>
        </div>
        <button class="sheet-item cancel" @click="closeDialog(d, false)">
          {{ d.multi ? t('filter.done') : t('common.cancel') }}
        </button>
      </div>

      <!-- 多選清單（項目可含 { divider: true } 與分隔線 { separator: true, label }） -->
      <div v-else-if="d.kind === 'checklist'" class="sheet">
        <h3 class="sheet-title">{{ d.title }}</h3>
        <div class="checklist">
          <template v-for="(it, i) in d.items" :key="i">
            <hr v-if="it.divider" class="sheet-divider" />
            <div v-else-if="it.separator" class="sheet-sep">
              <span v-if="it.label" class="sheet-sep-label">{{ it.label }}</span>
            </div>
            <label v-else class="check-row">
              <input v-model="d.selected" type="checkbox" :value="it.value" />
              <span>{{ it.label }}</span>
            </label>
          </template>
        </div>
        <div class="dialog-actions">
          <button v-if="d.extraAction" class="btn text" @click="runExtra(d)">{{ d.extraAction.label }}</button>
          <span class="spacer" />
          <button class="btn text" @click="closeDialog(d, null)">{{ t('common.cancel') }}</button>
          <button class="btn primary" @click="closeDialog(d, d.selected)">{{ t('common.ok') }}</button>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div v-if="ui.toast" :key="ui.toast.id" class="toast" :class="{ top: ui.toast.top }">{{ ui.toast.text }}</div>
    </transition>
  </div>
</template>

<script setup>
import { nextTick } from 'vue'
import { ui, closeDialog, toast } from '../ui.js'
import { t, errText } from '../i18n.js'
import { singleLine } from '../services/parse.js'
import { startDragSort, moveItem } from './dragSort.js'

/** 動作選單裡可拖曳的列（a.drag）：按住 ≡ 拖曳，放開後先改畫面，再交給 d.onReorder 寫入；失敗就還原 */
function onDragStart(e, d) {
  const container = e.currentTarget.closest('.sheet-body')
  const rows = [...container.querySelectorAll('[data-drag]')]
  const from = rows.indexOf(e.currentTarget.closest('[data-drag]'))
  startDragSort(e, {
    container,
    rows,
    from,
    onDrop: (f, to) => {
      const before = d.actions.slice()
      const slots = d.actions.map((a, i) => (a.drag ? i : -1)).filter((i) => i >= 0)
      const moved = moveItem(
        slots.map((i) => d.actions[i]),
        f,
        to,
      )
      slots.forEach((ai, k) => (d.actions[ai] = moved[k]))
      Promise.resolve(d.onReorder?.(moved.map((a) => a.value))).catch((err) => {
        d.actions.splice(0, d.actions.length, ...before) // 寫入失敗：畫面還原成原本的順序
        toast(errText(err))
      })
    },
  })
}

// ---- 多選選單（d.multi）：a.check 的列點了只切換勾選、不關閉；其他列照常關閉並回傳 value ----
const isMulti = (d, a) => !!d.multi && !!a.check
const isChecked = (d, a) => d.multi.selected.some((v) => v === a.value)

async function pick(d, a) {
  if (!isMulti(d, a)) return closeDialog(d, a.value)
  try {
    d.multi.selected = await d.multi.toggle(a.value)
  } catch (err) {
    toast(errText(err))
  }
}

async function clearMulti(d) {
  try {
    d.multi.selected = await d.multi.clear()
  } catch (err) {
    toast(errText(err))
  }
}

/** 貼上多行文字到單行備註：換行轉空白後插入游標位置 */
function onNotePaste(e, d) {
  const text = e.clipboardData?.getData('text')
  if (text == null || singleLine(text) === text) return
  e.preventDefault()
  const el = e.target
  const v = el.value
  const start = el.selectionStart ?? v.length
  const end = el.selectionEnd ?? v.length
  const ins = singleLine(text)
  d.note.value = v.slice(0, start) + ins + v.slice(end)
  nextTick(() => {
    el.selectionStart = el.selectionEnd = start + ins.length
  })
}

function cancel(d) {
  closeDialog(d, d.kind === 'prompt' || d.kind === 'checklist' ? null : false)
}

async function submitPrompt(d) {
  if (d.validate) {
    try {
      const r = await d.validate(d.value)
      if (r === false) return
    } catch (err) {
      d.error = errText(err)
      return
    }
  }
  closeDialog(d, d.value)
}

async function copyDiag(d) {
  try {
    await navigator.clipboard.writeText(d.diagnostics)
    toast(t('common.copiedText'))
  } catch {
    toast(t('common.copyFailed'))
  }
}

async function runExtra(d) {
  const added = await d.extraAction.run()
  if (added) {
    d.items.push(added)
    d.selected.push(added.value)
  }
}
</script>

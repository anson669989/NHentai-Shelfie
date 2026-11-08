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
        <h3 v-if="d.title" class="sheet-title">{{ d.title }}</h3>
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
          <div v-else-if="a.more" class="sheet-row">
            <button class="sheet-item" :class="{ danger: a.danger }" @click="closeDialog(d, a.value)">
              <span class="sheet-label">{{ a.label }}</span>
              <span v-if="a.checked" class="sheet-check">✓</span>
            </button>
            <button class="sheet-more" :aria-label="t('folder.more')" @click="closeDialog(d, { more: a.value })">⋯</button>
          </div>
          <button v-else class="sheet-item" :class="{ danger: a.danger }" @click="closeDialog(d, a.value)">
            <span class="sheet-label">{{ a.label }}</span>
            <span v-if="a.checked" class="sheet-check">✓</span>
          </button>
        </template>
        <button class="sheet-item cancel" @click="closeDialog(d, false)">{{ t('common.cancel') }}</button>
      </div>

      <!-- 多選清單 -->
      <div v-else-if="d.kind === 'checklist'" class="sheet">
        <h3 class="sheet-title">{{ d.title }}</h3>
        <div class="checklist">
          <label v-for="it in d.items" :key="it.value" class="check-row">
            <input v-model="d.selected" type="checkbox" :value="it.value" />
            <span>{{ it.label }}</span>
          </label>
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
      <div v-if="ui.toast" :key="ui.toast.id" class="toast">{{ ui.toast.text }}</div>
    </transition>
  </div>
</template>

<script setup>
import { nextTick } from 'vue'
import { ui, closeDialog, toast } from '../ui.js'
import { t, errText } from '../i18n.js'
import { singleLine } from '../services/parse.js'

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

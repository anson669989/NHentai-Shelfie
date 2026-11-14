// 管理資料夾（介面層）：設定頁「管理資料夾」與收藏頁資料夾篩選選單共用。
// 使用者資料夾與分隔線混在一起拖曳排序；系統資料夾（全部、未分類、未讀、典藏）不列入、不能更改。
// 只呼叫服務層。
import {
  listFolderItems,
  folderCounts,
  reorderFolderItems,
  createFolder,
  renameFolder,
  deleteFolder,
  createSeparator,
  renameSeparator,
  deleteSeparator,
} from '../services/library.js'
import { isSystemKind, parseItemKey } from '../services/folderOrder.js'
import { t, errText } from '../i18n.js'
import { actionSheet, confirmDialog, promptDialog, toast } from '../ui.js'
import { buildFolderRows } from './folderRows.js'

/** 設定頁「管理資料夾」：改完回到清單，關閉才離開 */
export async function openFolderManager() {
  for (;;) {
    let items, counts
    try {
      items = (await listFolderItems()).filter((x) => !isSystemKind(x.kind))
      counts = await folderCounts()
    } catch (err) {
      toast(errText(err))
      return
    }
    const action = await actionSheet(
      t('folder.manage'),
      [
        ...buildFolderRows(items, t, { counts, sortable: true, keyValues: true }),
        ...(items.length ? [{ divider: true }] : []),
        { label: '＋ ' + t('folder.new'), value: '__new' },
        { label: '＋ ' + t('sep.new'), value: '__sep' },
      ],
      { tall: true, lines: [t('folder.manageHint')], onReorder: reorderFolderItems },
    )
    if (!action) return
    try {
      if (action === '__new') await newFolderPrompt()
      else if (action === '__sep') await newSeparatorPrompt()
      else {
        const key = typeof action === 'object' ? action.more : action
        const item = findItem(items, key)
        if (item) await openFolderItemMenu(item)
      }
    } catch (err) {
      toast(errText(err))
    }
  }
}

/** 依項目鍵（'f:ID'／'s:ID'）找清單裡的項目 */
export function findItem(items, key) {
  const k = parseItemKey(key)
  return k ? items.find((x) => x.type === k.type && x.id === k.id) || null : null
}

/** 新增資料夾的輸入框；回傳新資料夾 id（取消為 null） */
export async function newFolderPrompt() {
  let id = null
  const name = await promptDialog(t('folder.new'), {
    placeholder: t('folder.namePlaceholder'),
    validate: async (v) => {
      id = await createFolder(v)
    },
  })
  return name != null ? id : null
}

/** 新增分隔線（名稱可留空） */
export async function newSeparatorPrompt() {
  await promptDialog(t('sep.new'), {
    placeholder: t('sep.namePlaceholder'),
    validate: (v) => createSeparator(v),
  })
}

/**
 * 單一使用者資料夾或分隔線的 ⋯ 選單：改名／刪除（管理畫面與收藏頁篩選選單共用）。
 * 資料夾刪除前確認；分隔線不確認（不影響任何書）。
 * @param {{type:'folder'|'separator', id:number, name:string, kind?:string}} item
 * @returns {Promise<boolean>} 是否選了動作（取消為 false；呼叫端據此決定要不要重開上一層選單）
 */
export async function openFolderItemMenu(item) {
  if (!item || (item.type === 'folder' && isSystemKind(item.kind))) return false
  const isSep = item.type === 'separator'
  const action = await actionSheet(isSep ? item.name || t('sep.title') : item.name, [
    { label: t('folder.rename'), value: 'rename' },
    { label: isSep ? t('sep.delete') : t('folder.delete'), value: 'delete', danger: true },
  ])
  if (!action) return false
  try {
    if (action === 'rename') {
      await promptDialog(t('folder.rename'), {
        value: item.name,
        placeholder: isSep ? t('sep.namePlaceholder') : t('folder.namePlaceholder'),
        validate: (v) => (isSep ? renameSeparator(item.id, v) : renameFolder(item.id, v)),
      })
    } else if (action === 'delete') {
      if (isSep) await deleteSeparator(item.id)
      else {
        const ok = await confirmDialog(t('folder.deleteConfirm', { name: item.name }), {
          okText: t('common.delete'),
          danger: true,
        })
        if (ok) await deleteFolder(item.id)
      }
    }
  } catch (err) {
    toast(errText(err))
  }
  return true
}

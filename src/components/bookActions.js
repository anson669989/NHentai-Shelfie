// 單本動作（介面層共用）：資料夾頁封面的「⋮」與新增頁「最近加入」長按都開同一個選單。
// 只呼叫服務層；選單本身由 DialogHost 的 actionSheet 顯示。
import {
  createFolder,
  listFolderItems,
  getBook,
  getBookFolders,
  getBookTitles,
  addBooksToFolders,
  removeBooksFromFolder,
  deleteBooks,
  refreshBook,
  changeBookId,
  openUrlFor,
  openBookPage,
  setNote,
} from '../services/library.js'
import { normalizeNote, parseGalleryId } from '../services/parse.js'
import { AppError, E } from '../services/errors.js'
import { t, errText } from '../i18n.js'
import { actionSheet, confirmDialog, promptDialog, checklistDialog, toast } from '../ui.js'
import { folderLabel, buildFolderRows } from './folderRows.js'

/** 依設定「開啟網頁方式」開該本網頁；開不起來就複製連結並提示 */
export async function openBook(book) {
  let url
  try {
    url = openUrlFor(book.gallery_id)
    await openBookPage(book.gallery_id)
  } catch (err) {
    if (!url) {
      toast(errText(err))
      return
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* ignore */
    }
    toast(t('common.copied'))
  }
}

export async function copyId(id) {
  try {
    await navigator.clipboard.writeText(String(id))
    toast(t('book.idCopied', { id }))
  } catch {
    toast(t('common.copyFailed'))
  }
}

/** 「新增資料夾」輸入框；建立成功回傳 { id, name }，取消回傳 null */
export async function promptNewFolder() {
  let id = null
  const name = await promptDialog(t('folder.new'), {
    placeholder: t('folder.namePlaceholder'),
    validate: async (v) => {
      id = await createFolder(v)
    },
  })
  return name != null && id ? { id, name: name.trim() } : null
}

/**
 * 勾選資料夾（確定／取消；可在清單內「＋ 新增資料夾」）；items 用 buildFolderRows 產生（含分隔線）。
 * 只剩多選模式的「批次分類」在用（一次性動作，維持確定／取消）。回傳的陣列只含資料夾 id（數字）。
 */
export async function pickFoldersDialog(title, items, preselected = []) {
  return checklistDialog(title, items, preselected, {
    extraAction: {
      label: '＋ ' + t('folder.new'),
      run: async () => {
        const added = await promptNewFolder()
        return added ? { label: added.name, value: added.id } : null
      },
    },
  }).then((picked) => picked && picked.filter((v) => typeof v === 'number'))
}

/**
 * 「改了就存」的資料夾多選選單（單本分類、新增頁選資料夾共用）：
 * 列含未讀、典藏與分隔線（buildFolderRows），點一列立刻呼叫 toggle、選單不關；
 * 最下方「＋ 新增資料夾」建立後呼叫 onCreated，再重開選單。點空白處、返回鍵或「完成」關閉。
 * @param {string} title
 * @param {{getSelected:()=>Promise<number[]>|number[], toggle:(id:number)=>Promise<number[]>|number[], onCreated:(id:number)=>any}} opts
 */
export async function liveFolderSheet(title, { getSelected, toggle, onCreated }) {
  for (;;) {
    let items
    let selected
    try {
      items = await listFolderItems()
      selected = await getSelected()
    } catch (err) {
      toast(errText(err))
      return
    }
    const r = await actionSheet(
      title,
      [...buildFolderRows(items, t), { divider: true }, { label: '＋ ' + t('folder.new'), value: '__new' }],
      { tall: true, multi: { selected, toggle } },
    )
    if (r !== '__new') return
    try {
      const added = await promptNewFolder()
      if (added) await onCreated(added.id) // 建立後自動勾選
    } catch (err) {
      toast(errText(err))
    }
  }
}

/** ⋮ →「分類」：勾選或取消立刻寫入資料庫（以資料庫為準回傳勾選結果；失敗時錯誤往外丟、勾選不變） */
export async function openClassifySheet(bookId) {
  const current = async () => (await getBookFolders(bookId)).map((f) => f.id)
  await liveFolderSheet(t('book.classify'), {
    getSelected: current,
    toggle: async (folderId) => {
      if ((await current()).includes(folderId)) await removeBooksFromFolder([bookId], folderId)
      else await addBooksToFolders([bookId], [folderId])
      return current()
    },
    onCreated: (folderId) => addBooksToFolders([bookId], [folderId]),
  })
}

/**
 * 「⋮」單本選單：完整標題、備註（單行，離開輸入框自動儲存）與單本功能；右上角灰色圖示＝重新載入。
 * @param {{gallery_id:number, title?:string, fetch_status?:string}} book
 * @param {{currentFolder?: {id:number, name:string, kind?:string}|null}} [opts] 目前所在的資料夾（含未讀、典藏；顯示「從此資料夾移除」）
 */
export async function openBookMenu(book, { currentFolder = null } = {}) {
  const id = book.gallery_id
  let titles = { english: '', japanese: '', pretty: book.title }
  let savedNote = null
  try {
    titles = await getBookTitles(id)
  } catch {
    /* 讀不到就只顯示簡短標題 */
  }
  try {
    savedNote = (await getBook(id))?.note ?? null
  } catch {
    /* ignore */
  }
  const lines = [titles.english || titles.pretty, titles.japanese].filter((v, i, a) => v && a.indexOf(v) === i)
  const notFound = book.fetch_status === 'not_found'
  const f = currentFolder

  // 備註：DialogHost 直接改 note.value；blur 時與選單關閉時各存一次（內容沒變就不寫）
  const note = { value: savedNote ?? '', placeholder: t('book.notePlaceholder'), label: t('book.note'), save: saveNote }
  async function saveNote(v) {
    const n = normalizeNote(v)
    if (n === savedNote) return
    const prev = savedNote
    savedNote = n // 先記下，blur 與關閉同時觸發時不重複寫
    try {
      savedNote = await setNote(id, v)
    } catch (err) {
      savedNote = prev
      toast(errText(err))
    }
  }

  const action = await actionSheet(
    `#${id}`,
    [
      { label: t('book.copyId'), value: 'copy' },
      ...(notFound ? [{ label: t('book.changeId'), value: 'changeId' }] : []),
      { label: '📁 ' + t('book.classify'), value: 'folders' },
      ...(f ? [{ label: t('book.removeFromFolder', { name: folderLabel(f, t) }), value: 'remove' }] : []),
      { label: t('book.delete'), value: 'delete', danger: true },
    ],
    { lines, note, headAction: { icon: 'refresh', label: t('book.refresh'), value: 'refresh' } },
  )
  await saveNote(note.value) // 返回鍵或點背景關閉時，輸入框可能沒有觸發 blur

  try {
    if (action === 'copy') await copyId(id)
    else if (action === 'changeId') await changeId(book)
    else if (action === 'folders') await openClassifySheet(id)
    else if (action === 'remove') {
      await removeBooksFromFolder([id], f.id)
      toast(t('select.removed', { n: 1 }))
    } else if (action === 'refresh') {
      await refreshBook(id)
      toast(t('book.requeued'))
    } else if (action === 'delete') {
      const ok = await confirmDialog(t('book.deleteConfirm', { id }), { okText: t('common.delete'), danger: true })
      if (ok) await deleteBooks([id])
    }
  } catch (err) {
    toast(errText(err))
  }
}

async function changeId(book) {
  await promptDialog(t('book.changeId'), {
    value: String(book.gallery_id),
    placeholder: t('add.placeholder'),
    maxlength: 60,
    validate: async (v) => {
      const n = parseGalleryId(v)
      if (!n) throw new AppError(E.INVALID_ID)
      await changeBookId(book.gallery_id, n)
    },
  })
}

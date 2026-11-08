// 單本動作（介面層共用）：資料夾頁封面的「⋮」與新增頁「最近加入」長按都開同一個選單。
// 只呼叫服務層；選單本身由 DialogHost 的 actionSheet 顯示。
import {
  createFolder,
  listFolders,
  getBook,
  getBookFolders,
  getBookTitles,
  setBookFolders,
  removeBooksFromFolder,
  deleteBooks,
  requeueBook,
  changeBookId,
  openUrlFor,
  openBookPage,
  setNote,
} from '../services/library.js'
import { normalizeNote, parseGalleryId } from '../services/parse.js'
import { AppError, E } from '../services/errors.js'
import { t, errText } from '../i18n.js'
import { actionSheet, confirmDialog, promptDialog, checklistDialog, toast } from '../ui.js'

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

/** 勾選資料夾（可在清單內「＋ 新增資料夾」） */
export async function pickFoldersDialog(title, items, preselected = []) {
  return checklistDialog(title, items, preselected, {
    extraAction: {
      label: '＋ ' + t('folder.new'),
      run: async () => {
        let id = null
        const name = await promptDialog(t('folder.new'), {
          placeholder: t('folder.namePlaceholder'),
          validate: async (v) => {
            id = await createFolder(v)
          },
        })
        return name != null && id ? { label: name.trim(), value: id } : null
      },
    },
  })
}

/**
 * 「⋮」單本選單：完整標題、備註（單行，離開輸入框自動儲存）與單本功能。
 * @param {{gallery_id:number, title?:string, fetch_status?:string}} book
 * @param {{currentFolder?: {id:number, name:string}|null}} [opts] 目前所在的自建資料夾（顯示「從此資料夾移除」）
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
      ...(notFound ? [{ label: t('book.changeId'), value: 'changeId' }] : [{ label: t('book.open'), value: 'open' }]),
      { label: t('book.classify'), value: 'folders' },
      ...(f ? [{ label: t('book.removeFromFolder', { name: f.name }), value: 'remove' }] : []),
      ...(notFound ? [] : [{ label: t('book.refetch'), value: 'refetch' }]),
      { label: t('book.delete'), value: 'delete', danger: true },
    ],
    { lines, note },
  )
  await saveNote(note.value) // 返回鍵或點背景關閉時，輸入框可能沒有觸發 blur

  try {
    if (action === 'copy') await copyId(id)
    else if (action === 'open') await openBook(book)
    else if (action === 'changeId') await changeId(book)
    else if (action === 'folders') {
      const before = (await getBookFolders(id)).map((x) => x.id)
      const folders = await listFolders()
      const picked = await pickFoldersDialog(
        t('book.classify'),
        folders.map((x) => ({ label: x.name, value: x.id })),
        before,
      )
      if (picked) await setBookFolders(id, picked)
    } else if (action === 'remove') {
      await removeBooksFromFolder([id], f.id)
      toast(t('select.removed', { n: 1 }))
    } else if (action === 'refetch') {
      await requeueBook(id)
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


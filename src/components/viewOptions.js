// 純函式：封面牆／最近加入的顯示選項（顯示備註、媽媽模式）。
/**
 * 封面牆／最近加入的顯示選項：顯示備註與媽媽模式。
 * @param {Record<string,string>} settings
 * @param {'library'|'add'} scope
 */
export function viewOptions(settings, scope) {
  const mama = settings.mama_mode === '1' && settings['mama_scope_' + scope] === '1'
  return {
    showNote: settings.show_note === '1',
    hideCover: mama && settings.mama_hide_cover === '1',
    hideTitle: mama && settings.mama_hide_title === '1',
    hideNote: mama && settings.mama_hide_note === '1',
  }
}

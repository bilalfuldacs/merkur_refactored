export function formatAgo(
  iso: string | null | undefined,
  options?: { locale?: string; yesterday?: string },
): string {
  if (!iso) {
    return ''
  }

  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) {
    return ''
  }

  const locale = options?.locale ?? 'en'
  const yesterday = options?.yesterday ?? 'yesterday'
  const sec = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (sec < 60) {
    return `${sec}s`
  }
  if (sec < 3600) {
    return `${Math.floor(sec / 60)}m`
  }
  if (sec < 86400) {
    return `${Math.floor(sec / 3600)}h`
  }
  if (sec < 172800) {
    return yesterday
  }
  if (sec < 604800) {
    return new Date(iso).toLocaleDateString(locale, { weekday: 'long' })
  }

  return new Date(iso).toLocaleDateString(locale)
}

export function excerptNote(note: string | null | undefined): string {
  if (!note) {
    return ''
  }

  return note
    .replace(/<[^>]+>/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/[_#>`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function displayName(
  editor: { firstname?: string | null; lastname?: string | null } | null,
  unknownLabel = 'Unknown',
): string {
  if (!editor) {
    return unknownLabel
  }

  return [editor.firstname, editor.lastname].filter(Boolean).join(' ') || unknownLabel
}

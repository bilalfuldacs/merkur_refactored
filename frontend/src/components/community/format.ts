import type { CommunityPost } from '@/api'

export type ComposerKind = 'update' | 'question' | 'idea'
export type FeedTab = 'all' | 'idea' | 'question' | 'update'

export function personName(person: {
  firstname?: string | null
  lastname?: string | null
  username?: string | null
  initials?: string | null
} | null): string {
  if (!person) {
    return 'Unknown'
  }
  const name = [person.firstname, person.lastname].filter(Boolean).join(' ')
  return name || person.username || person.initials || 'Unknown'
}

export function stripPostHtml(note: string | null | undefined): string {
  if (!note) {
    return ''
  }

  return note
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

export function postTitle(note: string | null | undefined): string {
  const first = stripPostHtml(note).split('\n').find((line) => line.trim()) ?? ''
  if (first.length <= 92) {
    return first || 'Untitled post'
  }
  return `${first.slice(0, 89).trim()}…`
}

export function postBody(note: string | null | undefined): string {
  const lines = stripPostHtml(note).split('\n')
  const start = lines.findIndex((line) => line.trim())
  if (start < 0) {
    return ''
  }
  return lines.slice(start + 1).join('\n').trim()
}

export function postKind(post: Pick<CommunityPost, 'note'>): FeedTab {
  const text = stripPostHtml(post.note)
  if (/\?\s*$/m.test(text) || /^(how|why|what|when|who|can we|should we)\b/i.test(text)) {
    return 'question'
  }
  if (/\bidea\b/i.test(text) || /\bsuggest/i.test(text)) {
    return 'idea'
  }
  return 'update'
}

export function kindLabel(kind: FeedTab | ComposerKind): string {
  if (kind === 'idea') {
    return 'Idea'
  }
  if (kind === 'question') {
    return 'Question'
  }
  return 'Update'
}

export function formatFeedAgo(value: string | null | undefined): string {
  if (!value) {
    return ''
  }
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) {
    return value
  }
  const sec = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (sec < 45) {
    return 'just now'
  }
  if (sec < 3600) {
    const minutes = Math.max(1, Math.floor(sec / 60))
    return `${minutes} min ago`
  }
  if (sec < 86400) {
    const hours = Math.floor(sec / 3600)
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }
  if (sec < 172800) {
    return 'yesterday'
  }
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

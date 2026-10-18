import type { MessageTree, Translate } from './translate'

export type Phrase = (text: string) => string

export type FaqCopy = {
  title: string
  article: string
}

export function normalizeCatalogText(value: string): string {
  return value.replace(/\u00ad/g, '').replace(/&shy;/gi, '').replace(/[\s\u00a0]+/g, ' ').trim()
}

export function createPhraseLookup(messages: MessageTree | null, fallbackMessages: MessageTree | null): Phrase {
  return (text) => {
    const key = normalizeCatalogText(text)
    return lookupPhrase(messages, key) ?? lookupPhrase(fallbackMessages, key) ?? text
  }
}

export function lookupFaqCopy(tree: MessageTree | null, sourceTitle: string): FaqCopy | null {
  if (!tree || sourceTitle === '') {
    return null
  }
  const help = tree.help
  if (!help || typeof help !== 'object') {
    return null
  }
  const articles = help.articles
  if (!articles || typeof articles !== 'object') {
    return null
  }
  const row = articles[sourceTitle]
  if (!row || typeof row !== 'object') {
    return null
  }
  if (typeof row.title !== 'string' || typeof row.article !== 'string') {
    return null
  }
  return { title: row.title, article: row.article }
}

function lookupPhrase(tree: MessageTree | null, key: string): string | undefined {
  if (!tree || key === '') {
    return undefined
  }
  const tables = tree.tables
  if (!tables || typeof tables !== 'object') {
    return undefined
  }
  const phrases = tables.phrases
  if (!phrases || typeof phrases !== 'object') {
    return undefined
  }
  const value = phrases[key]
  return typeof value === 'string' ? value : undefined
}

export function translateCatalogText(text: string, phrase: Phrase): string {
  const normalized = normalizeCatalogText(text)
  if (!normalized) {
    return text
  }
  const translated = phrase(normalized)
  return translated === normalized ? text : translated
}

export function translateCatalogHtml(html: string, phrase: Phrase): string {
  if (!html.trim() || typeof DOMParser === 'undefined') {
    return html
  }
  const document = new DOMParser().parseFromString(`<div id="catalog-root">${html}</div>`, 'text/html')
  const root = document.getElementById('catalog-root')
  if (!root) {
    return html
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  let current = walker.nextNode()
  while (current) {
    nodes.push(current as Text)
    current = walker.nextNode()
  }
  for (const node of nodes) {
    const value = node.nodeValue ?? ''
    const normalized = normalizeCatalogText(value)
    if (!normalized) {
      continue
    }
    const translated = phrase(normalized)
    if (!translated || translated === normalized) {
      continue
    }
    const lead = value.match(/^[\s\u00a0]*/)?.[0] ?? ''
    const trail = value.match(/[\s\u00a0]*$/)?.[0] ?? ''
    node.nodeValue = `${lead}${translated}${trail}`
  }
  return root.innerHTML
}

export function catalogTitle(translate: Translate, table: string, fallback: string): string {
  return translate(`tables.titles.${table}`, fallback)
}

export function catalogItem(translate: Translate, table: string, fallback: string): string {
  return translate(`tables.items.${table}`, fallback || 'Item')
}

export function fieldLabel(translate: Translate, key: string, fallback: string): string {
  return translate(`fields.${key}`, fallback)
}

export function groupTitle(translate: Translate, title: string): string {
  const match = title.match(/^(\d+)\s+([\s\S]+)$/)
  if (!match) {
    return title
  }
  return `${match[1]} ${translate(`tables.groups.${match[2]}`, match[2])}`
}

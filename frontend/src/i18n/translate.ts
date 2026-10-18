export type MessageTree = {
  [key: string]: string | MessageTree
}

export type TranslateVars = Record<string, string | number>

export type Translate = (key: string, fallback?: string, vars?: TranslateVars) => string

export function lookupMessage(tree: MessageTree | null, key: string): string | undefined {
  if (!tree || key === '') {
    return undefined
  }

  let node: string | MessageTree | undefined = tree

  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) {
      return undefined
    }
    node = node[part]
  }

  return typeof node === 'string' ? node : undefined
}

export function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name]
    return value === undefined ? match : String(value)
  })
}

export function createTranslator(messages: MessageTree | null, fallbackMessages: MessageTree | null): Translate {
  return (key, fallback, vars) => {
    const template = lookupMessage(messages, key) ?? lookupMessage(fallbackMessages, key) ?? fallback ?? key
    return interpolate(template, vars)
  }
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return null
}

export function asText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return null
}

export function relationLabel(value: unknown): string | null {
  const record = asRecord(value)
  if (!record) {
    return asText(value)
  }

  const named =
    asText(record.name_name2_COMBINED)?.trim() ||
    asText(record.long_name_COMBINED)?.trim() ||
    asText(record.name_COMBINED)?.trim() ||
    asText(record.name)?.trim()
  if (named) {
    return named
  }

  const person = [asText(record.firstname), asText(record.lastname)].filter(Boolean).join(' ').trim()
  if (person) {
    return person
  }

  return asText(record.username)
}

export function isFilledBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

export type TableTagValue = {
  id: number
  name: string
}

export function asTagList(value: unknown): TableTagValue[] {
  if (!Array.isArray(value)) {
    return []
  }

  const tags: TableTagValue[] = []
  for (const item of value) {
    if (typeof item === 'number' && Number.isFinite(item) && item > 0) {
      tags.push({ id: item, name: `#${item}` })
      continue
    }

    const record = asRecord(item)
    if (!record) {
      continue
    }

    const id = Number(record.id ?? record.ID)
    if (!Number.isFinite(id) || id <= 0) {
      continue
    }

    const name = asText(record.name)?.trim() || asText(record.label)?.trim() || `#${id}`
    tags.push({ id, name })
  }

  return tags
}

export function fieldValue(row: Record<string, unknown>, key: string): unknown {
  return row[key]
}

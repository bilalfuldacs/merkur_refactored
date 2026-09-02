import type { ProductJurisdiction, ProductStatus, ProductVersion } from '@/api'

export function versionTitle(version: Pick<ProductVersion, 'name' | 'name2'>): string {
  return [version.name, version.name2].filter(Boolean).join(' ') || 'Untitled version'
}

export function countLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`
}

export function versionMeta(version: ProductVersion): string {
  return [
    version.platform?.name,
    countLabel(version.games_count ?? 0, 'game', 'games'),
    countLabel(version.features_count ?? 0, 'feature', 'features'),
    countLabel(version.builds_count ?? 0, 'build', 'builds'),
  ]
    .filter(Boolean)
    .join(' · ')
}

export function statusLabel(name: string | null | undefined): string {
  const value = (name ?? '').replace(/\u00a0/g, ' ').trim()
  if (!value) {
    return ''
  }
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function jurisdictionLabel(jurisdiction: ProductJurisdiction | null | undefined): string {
  if (!jurisdiction) {
    return 'Market'
  }
  const raw = (jurisdiction.name_english || jurisdiction.short_name_COMBINED || '').trim()
  const stripped = raw.replace(/^\((.*)\)$/, '$1').replace(/\s*[\u{1F30D}\u{1F3F4}]\s*$/u, '').trim()
  if (!stripped) {
    return jurisdiction.iso3166 || 'Market'
  }
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
}

export function formatDate(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function badgeTextColor(status: Pick<ProductStatus, 'color' | 'text_color'>): string {
  if (status.text_color) {
    return status.text_color
  }
  const hex = (status.color ?? '').replace('#', '')
  const normalized = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex
  if (normalized.length !== 6) {
    return '#022052'
  }
  const n = Number.parseInt(normalized, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (r * 299 + g * 587 + b * 114) / 1000 >= 140 ? '#022052' : '#ffffff'
}

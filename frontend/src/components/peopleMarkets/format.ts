export function personLabel(person: {
  firstname?: string | null
  lastname?: string | null
  name?: string | null
  initials?: string | null
}): string {
  const full = [person.firstname, person.lastname].filter(Boolean).join(' ')
  return full || person.name || person.initials || 'Unknown'
}

export function marketTitle(market: { name_english?: string | null; name?: string | null; id?: number }): string {
  return market.name_english || market.name || `Market ${market.id ?? ''}`
}

export function formatUpdated(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `Updated ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export function segmentLabel(segment: string | null | undefined): string {
  if (segment === 'land-based') {
    return 'Land-based'
  }
  if (segment === 'online') {
    return 'Online'
  }
  return segment || 'Market'
}

export function peopleCountLabel(count: number): string {
  return count === 1 ? '1 person' : `${count} people`
}

export function marketCountLabel(count: number): string {
  return count === 1 ? '1 market' : `${count} markets`
}

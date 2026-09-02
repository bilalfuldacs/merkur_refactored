import type { PeopleMarketsMarket, PeopleMarketsMarketRow, PeopleMarketsPerson, PeopleMarketsPersonRow } from '@/api'

export type SortField = 'market' | 'stakeholder'
export type SortDirection = 'asc' | 'desc'

function compareText(a: string, b: string, direction: SortDirection): number {
  const result = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  return direction === 'asc' ? result : -result
}

export function marketSortKey(market: Pick<PeopleMarketsMarket, 'name' | 'name_english'>): string {
  return (market.name_english || market.name || '').trim()
}

export function personSortKey(person: PeopleMarketsPerson): string {
  const lastFirst = [person.lastname, person.firstname].filter(Boolean).join(', ')
  return (lastFirst || person.name || person.initials || '').trim()
}

function sortPeople(people: PeopleMarketsPerson[], direction: SortDirection): PeopleMarketsPerson[] {
  return [...people].sort((a, b) => compareText(personSortKey(a), personSortKey(b), direction))
}

function sortMarketsList<T extends PeopleMarketsMarket>(markets: T[], direction: SortDirection): T[] {
  return [...markets].sort((a, b) => compareText(marketSortKey(a), marketSortKey(b), direction))
}

export function sortUnassignedMarkets(
  markets: PeopleMarketsMarket[],
  field: SortField,
  direction: SortDirection,
): PeopleMarketsMarket[] {
  if (field !== 'market') {
    return sortMarketsList(markets, 'asc')
  }

  return sortMarketsList(markets, direction)
}

function stakeholderKey(people: PeopleMarketsPerson[], direction: SortDirection): string {
  const names = people.map(personSortKey).filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  if (names.length === 0) {
    return ''
  }

  return direction === 'asc' ? names[0] : names[names.length - 1]
}

export function sortMarketRows(
  rows: PeopleMarketsMarketRow[],
  field: SortField,
  direction: SortDirection,
): PeopleMarketsMarketRow[] {
  const prepared = rows.map((row) => ({
    ...row,
    people: field === 'stakeholder' ? sortPeople(row.people, direction) : row.people,
    deputies: field === 'stakeholder' ? sortPeople(row.deputies, direction) : row.deputies,
  }))

  return prepared.sort((a, b) => {
    if (field === 'stakeholder') {
      const byPerson = compareText(stakeholderKey(a.people, direction), stakeholderKey(b.people, direction), direction)
      if (byPerson !== 0) {
        return byPerson
      }
    }

    return compareText(marketSortKey(a), marketSortKey(b), direction)
  })
}

export function sortPersonRows(
  rows: PeopleMarketsPersonRow[],
  field: SortField,
  direction: SortDirection,
): PeopleMarketsPersonRow[] {
  const prepared = rows.map((row) => ({
    ...row,
    markets: sortMarketsList(row.markets, field === 'market' ? direction : 'asc'),
  }))

  return prepared.sort((a, b) => {
    if (field === 'market') {
      const byMarket = compareText(
        marketSortKey(a.markets[0] ?? { name: '', name_english: '' }),
        marketSortKey(b.markets[0] ?? { name: '', name_english: '' }),
        direction,
      )
      if (byMarket !== 0) {
        return byMarket
      }
    }

    return compareText(personSortKey(a.person), personSortKey(b.person), direction)
  })
}

export function sortHint(field: SortField, direction: SortDirection, column: 'markets' | 'people'): string {
  const order = direction === 'asc' ? 'A–Z' : 'Z–A'
  if (column === 'markets') {
    return field === 'market' ? `${order} by market` : `${order} by stakeholder, then market`
  }

  return field === 'stakeholder' ? `${order} by stakeholder` : `${order} by first market, then name`
}

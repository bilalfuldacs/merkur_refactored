import type { PeopleMarketsMarket, PeopleMarketsMarketRow, PeopleMarketsPerson, PeopleMarketsPersonRow } from '@/api'

export type SegmentView = 'land-based' | 'online' | 'both'

function haystack(value: string | null | undefined): string {
  return (value ?? '').toLowerCase()
}

export function personMatches(person: PeopleMarketsPerson, query: string): boolean {
  if (!query) {
    return true
  }

  const q = query.toLowerCase()
  return [person.name, person.initials, person.firstname, person.lastname, person.jobtitle, person.role].some(
    (value) => haystack(value).includes(q),
  )
}

export function marketMatches(market: PeopleMarketsMarket, query: string): boolean {
  if (!query) {
    return true
  }

  const q = query.toLowerCase()
  return [market.name_english, market.name, market.segment].some((value) => haystack(value).includes(q))
}

export function segmentMatches(segment: string | null | undefined, view: SegmentView): boolean {
  if (view === 'both') {
    return true
  }

  return segment === view
}

export function filterMarketRows(
  rows: PeopleMarketsMarketRow[],
  query: string,
  view: SegmentView,
): PeopleMarketsMarketRow[] {
  const q = query.trim()
  return rows.filter((row) => {
    if (!segmentMatches(row.segment, view)) {
      return false
    }
    if (!q) {
      return true
    }
    return (
      marketMatches(row, q) ||
      row.people.some((person) => personMatches(person, q)) ||
      row.deputies.some((person) => personMatches(person, q))
    )
  })
}

export function filterPersonRows(
  rows: PeopleMarketsPersonRow[],
  query: string,
  view: SegmentView,
): PeopleMarketsPersonRow[] {
  const q = query.trim()
  return rows
    .filter((row) => {
      if (view === 'land-based' && row.landbased_count === 0) {
        return false
      }
      if (view === 'online' && row.online_count === 0) {
        return false
      }
      if (!q) {
        return true
      }
      return personMatches(row.person, q) || row.markets.some((market) => marketMatches(market, q))
    })
    .map((row) => ({
      ...row,
      markets: row.markets.filter((market) => {
        if (!segmentMatches(market.segment, view)) {
          return false
        }
        if (!q) {
          return true
        }
        return personMatches(row.person, q) || marketMatches(market, q)
      }),
    }))
}

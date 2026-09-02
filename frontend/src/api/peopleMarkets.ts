import { apiRequest } from './client'

export type PeopleMarketsPerson = {
  ID: number
  initials: string | null
  firstname: string | null
  lastname: string | null
  name: string
  jobtitle: string | null
  bcolor: string | null
  color: string | null
  role_ID: number | null
  role: string | null
}

export type PeopleMarketsMarket = {
  id: number
  name: string | null
  name_english: string | null
  flag: string | null
  segment: 'land-based' | 'online' | string | null
  cluster: string | null
  market_updated_at: string | null
}

export type PeopleMarketsMarketRow = PeopleMarketsMarket & {
  people: PeopleMarketsPerson[]
  deputies: PeopleMarketsPerson[]
}

export type PeopleMarketsPersonRow = {
  person: PeopleMarketsPerson
  markets: PeopleMarketsMarket[]
  landbased_count: number
  online_count: number
}

export type PeopleMarketsGroups = {
  product_organization: PeopleMarketsPerson[]
  sales: PeopleMarketsPerson[]
  c_level: PeopleMarketsPerson[]
  global_game_design: PeopleMarketsPerson[]
  game_design: PeopleMarketsPerson[]
  development: PeopleMarketsPerson[]
  other: PeopleMarketsPerson[]
}

export type PeopleMarketsPayload = {
  current_user_id: number | null
  can_show_deputies: boolean
  groups: PeopleMarketsGroups
  markets_to_people: PeopleMarketsMarketRow[]
  people_to_markets: PeopleMarketsPersonRow[]
  unassigned_markets: PeopleMarketsMarket[]
}

export function getPeopleMarkets(): Promise<PeopleMarketsPayload> {
  return apiRequest<PeopleMarketsPayload>('/people-markets')
}

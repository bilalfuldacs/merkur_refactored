import { apiRequest } from './client'

export type ProductScope = 'preparing' | 'available' | 'discontinued' | 'inactive'

export type ProductStatus = {
  ID: number
  name: string
  color: string | null
  text_color?: string | null
}

export type ProductPlatform = {
  ID: number
  name: string
  color: string | null
}

export type ProductJurisdiction = {
  ID: number
  flag: string | null
  iso3166: string | null
  name_english: string | null
  short_name_COMBINED: string | null
}

export type ProductMarket = {
  ID: number
  priority: string | null
  jurisdiction: ProductJurisdiction | null
}

export type ProductHardwareComponent = {
  compatibility_ID: number
  ID: number | null
  name: string | null
}

export type ProductCompatibilityGroup = {
  type_ID: number | null
  type: string
  components: ProductHardwareComponent[]
}

export type ProductMilestone = {
  ID: number
  expected_date: string | null
  actual_date: string | null
  jurisdiction: ProductJurisdiction | null
  expected_status: {
    ID: number
    name: string
    color: string | null
  } | null
}

export type ProductGame = {
  ID: number
  reuse_ID: number | null
  adopted: boolean
  name: string | null
  ID_text: string | null
  studio: { ID: number; name: string | null } | null
}

export type ProductFeature = {
  ID: number
  name: string | null
}

export type ProductBuildMilestone = {
  ID: number
  expected_date: string | null
  actual_date: string | null
  expected_status: {
    ID: number
    name: string
    color: string | null
  } | null
}

export type ProductBuild = {
  ID: number
  name: string | null
  comment: string | null
  jurisdiction: ProductJurisdiction | null
  status: ProductStatus | null
  release: { ID: number; release_date: string | null } | null
  milestones: ProductBuildMilestone[]
}

export type ProductVersion = {
  ID: number
  name: string | null
  name2: string | null
  subtitle: string | null
  description: string | null
  feat_in_products_pano: boolean
  sales_suspended: boolean
  platform: ProductPlatform | null
  status: ProductStatus | null
  markets: {
    available: ProductMarket[]
    intended: ProductMarket[]
    not_intended: ProductMarket[]
  }
  compatibilities: ProductCompatibilityGroup[]
  milestones: ProductMilestone[]
  games_count: number
  games: ProductGame[]
  features_count: number
  features: ProductFeature[]
  builds_count: number
  releases_count: number
  builds: ProductBuild[]
  focus_groups_count: number
  installations_count: number
}

export type ProductPanoramaResponse = {
  data: ProductVersion[]
  meta: { scope: ProductScope | string }
}

export function getProductPanorama(scope: ProductScope): Promise<ProductPanoramaResponse> {
  const params = new URLSearchParams({ scope })
  return apiRequest<ProductPanoramaResponse>(`/products/panorama?${params}`)
}

export type ProductGamesListGame = {
  ID: number
  name: string
  ID_text: string | null
  studio: string | null
  adopted: boolean
  gli11: boolean
  removed: boolean
  removed_in: string | null
}

export type ProductGamesListPayload = {
  version: { ID: number; name: string | null; name2: string | null }
  inheritance: { ID: number; name: string | null }[]
  new_games: number
  total_games: number
  sections: {
    version_ID: number
    name: string | null
    name2: string | null
    description: string | null
    is_current: boolean
    games: ProductGamesListGame[]
  }[]
  defects: {
    ID: number
    name: string | null
    scope: string
    game_ID: number | null
    game_name: string | null
  }[]
}

export function getProductGamesList(versionId: number): Promise<ProductGamesListPayload> {
  return apiRequest<ProductGamesListPayload>(`/products/games-list/${versionId}`)
}

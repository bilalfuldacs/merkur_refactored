import { apiRequest } from './client'

export type BdStatusCode = 'merkur' | 'open' | 'watch' | 'nogo'

export type BdPresenceCode = 'present' | 'limited' | 'planned' | 'absent'

export type BdStatus = {
  code: BdStatusCode
  label: string
  summary: string
  definition: string
  color: string
}

export type BdRegion = {
  id: number
  code: string
  name: string
}

export type BdSegmentOption = {
  id: number
  name: string
  modDate?: string | null
}

export type BdMarketSegment = {
  id: number
  name: string
  presence: BdPresenceCode
}

export type BdJurisdiction = {
  id: number
  name: string
  flag: string | null
  channel: string
  country: string
  bdSegmentIds: number[]
  bdSegmentNames: string[]
  suggest: boolean
  marketId: number | null
}

export type BdMarket = {
  id: number
  country: string
  status: BdStatusCode
  regionId: number
  region: string
  regionName: string
  modDate?: string | null
  jurisdictionIds: number[]
  segments: BdMarketSegment[]
}

export type BdRegionSegmentRow = {
  id: number
  name: string
  presence: BdPresenceCode
  markets: number
  total: number
}

export type BdRegionSegments = {
  code: string
  name: string
  sort: number
  segments: BdRegionSegmentRow[]
}

export type BdPayload = {
  statuses: BdStatus[]
  presence: Record<string, string>
  regions: BdRegion[]
  segments: string[]
  segmentOptions: BdSegmentOption[]
  jurisdictions: BdJurisdiction[]
  markets: BdMarket[]
  regionSegments: BdRegionSegments[]
  aliases: Record<string, string>
  mayEdit: boolean
}

export type BdMarketInput = {
  id?: number
  name: string
  status: BdStatusCode
  region_id: number
  segment_ids: number[]
  jurisdiction_ids: number[]
}

export type BdSegmentInput = {
  id?: number
  name: string
}

export type BdMutationResult = {
  ok: boolean
  market?: BdMarket
  segment?: { id: number; name: string }
  payload: BdPayload
  message?: string
  error?: string
}

export function getBusinessDevelopment() {
  return apiRequest<BdPayload>('/business-development')
}

export function createBdMarket(input: BdMarketInput) {
  return apiRequest<BdMutationResult>('/business-development/create-market', {
    method: 'POST',
    body: input,
  })
}

export function updateBdMarket(input: BdMarketInput & { id: number }) {
  return apiRequest<BdMutationResult>('/business-development/update-market', {
    method: 'POST',
    body: input,
  })
}

export function createBdSegment(input: BdSegmentInput) {
  return apiRequest<BdMutationResult>('/business-development/create-segment', {
    method: 'POST',
    body: input,
  })
}

export function updateBdSegment(input: BdSegmentInput & { id: number }) {
  return apiRequest<BdMutationResult>('/business-development/update-segment', {
    method: 'POST',
    body: input,
  })
}

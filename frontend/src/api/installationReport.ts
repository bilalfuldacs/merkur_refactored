import { apiRequest } from './client'

export type InstallationReportPerson = {
  ID: number
  firstname?: string | null
  lastname?: string | null
  initials?: string | null
  bcolor?: string | null
  color?: string | null
  role_ID?: number | null
}

export type InstallationReportVersion = {
  ID: number
  name: string
  name2: string | null
  label: string
  featured: boolean
}

export type InstallationReportTotals = {
  live: number
  test: number
  planned: number
  footprint: number
  records: number
  rated: number
  unrated: number
}

export type InstallationReportRatings = {
  a_plus: number
  a: number
  b: number
  c: number
  d: number
  d_minus: number
}

export type InstallationSite = {
  ID: number
  venue: string
  venue_ID: number | null
  date: string | null
  live: number
  test: number
  planned: number
  perf_rating: number | null
  perf_label: string | null
  tech_rating: 'red' | 'yellow' | 'green' | null
  comment: string | null
  rtp: string | null
  first_install_type: string | null
}

export type InstallationJurisdiction = {
  ID: number
  name: string
  name_english: string | null
  iso3166: string | null
  segment_name: string | null
  flag: string | null
  short_name: string | null
  first_installed: string | null
  live: number
  test: number
  planned: number
  records: number
  performance: string | null
  ratings: InstallationReportRatings
  tech: { red: number; yellow: number; green: number; reports: number }
  people: InstallationReportPerson[]
  sites: InstallationSite[]
}

export type AvailabilityMarket = {
  ID: number
  jurisdiction_ID: number
  code: string | null
  name: string | null
  flag: string | null
  priority: string | null
}

export type InstallationReportPayload = {
  generated_at: string
  can_edit: boolean
  version: InstallationReportVersion | null
  versions: InstallationReportVersion[]
  featured: InstallationReportVersion[]
  totals: InstallationReportTotals
  ratings: InstallationReportRatings
  last_install: { when: string | null; who: string | null; where: string | null } | null
  last_availability: { when: string | null; who: string | null; where: string | null } | null
  jurisdictions: InstallationJurisdiction[]
  availability: {
    available: AvailabilityMarket[]
    intent: AvailabilityMarket[]
    no_intent: AvailabilityMarket[]
  }
}

export function getInstallationReport(versionId?: number | null): Promise<InstallationReportPayload> {
  const params = new URLSearchParams()
  if (versionId != null) {
    params.set('v', String(versionId))
  }
  const query = params.toString()
  return apiRequest<InstallationReportPayload>(`/reports/installations${query ? `?${query}` : ''}`)
}

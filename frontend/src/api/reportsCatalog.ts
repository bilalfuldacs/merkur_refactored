import { apiRequest } from './client'

export type ReportsCatalogReport = {
  id: number
  name: string
  title: string
  description: string
  color: string
  icon: string | null
  in_launchpad: boolean
}

export type ReportsCatalogGroup = {
  title: string
  reports: ReportsCatalogReport[]
}

export type ReportsCatalog = {
  groups: ReportsCatalogGroup[]
}

export function getReportsCatalog(): Promise<ReportsCatalog> {
  return apiRequest<ReportsCatalog>('/reports-catalog')
}

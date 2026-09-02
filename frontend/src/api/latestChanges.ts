import { apiRequest } from './client'
import type { HomeEditor } from './homeDashboard'

export const LATEST_CHANGES_COUNTS = [5, 10, 25] as const

export type LatestChangesCount = (typeof LATEST_CHANGES_COUNTS)[number]

export type LatestChangesColumn = {
  key: string
  label: string
}

export type LatestChangesRow = {
  id: number | string | null
  modified_at: string | null
  editor: HomeEditor | null
  cells: string[]
}

export type LatestChangesTable = {
  table: string
  title: string
  icon: string | null
  color: string
  columns: LatestChangesColumn[]
  rows: LatestChangesRow[]
}

export type LatestChangesGroup = {
  index: number | null
  name: string | null
  tables: LatestChangesTable[]
}

export type LatestChangesPayload = {
  count: LatestChangesCount
  groups: LatestChangesGroup[]
}

export function getLatestChanges(count: LatestChangesCount): Promise<LatestChangesPayload> {
  return apiRequest<LatestChangesPayload>(`/reports/latest-changes?count=${count}`)
}

import { apiRequest } from './client'

export type TablesCatalogTable = {
  id: number
  table: string
  title: string
  description: string
  color: string
  icon: string | null
  item_count: number
  has_history: boolean
  is_system: boolean
  faded: boolean
  can_edit: boolean
}

export type TablesCatalogGroup = {
  title: string
  tables: TablesCatalogTable[]
}

export type TablesCatalog = {
  groups: TablesCatalogGroup[]
}

export function getTablesCatalog(): Promise<TablesCatalog> {
  return apiRequest<TablesCatalog>('/tables-catalog')
}

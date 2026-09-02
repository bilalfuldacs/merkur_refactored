import { apiRequest } from './client'

export type HomeEditor = {
  ID: number
  firstname: string | null
  lastname: string | null
  initials: string | null
  bcolor: string | null
  color: string | null
  role_ID: number | null
}

export type HomeChange = {
  id: string
  table: string
  table_title: string
  title: string
  subtitle: string | null
  color: string
  modified_at: string | null
  editor: HomeEditor | null
}

export type HomeCatalogItem = {
  ID: number
  name?: string
  table?: string
  group?: string | null
  title: string
  color: string
  icon?: string | null
}

export type HomeTable = HomeCatalogItem

export type HomeReport = HomeCatalogItem & {
  name: string
}

export type HomePost = {
  ID: number
  note: string | null
  modified_at: string | null
  num_likes: number
  num_comments: number
  editor: HomeEditor | null
}

export type HomeDashboard = {
  changes: HomeChange[]
  reports: HomeReport[]
  tables: HomeTable[]
  posts: HomePost[]
}

export function getHomeDashboard(): Promise<HomeDashboard> {
  return apiRequest<HomeDashboard>('/home-dashboard')
}

export type SortDirection = 'ASC' | 'DESC'
export type WidthMode = 's' | 'w'
export type TableColumnKind =
  | 'id'
  | 'relation'
  | 'text'
  | 'boolean'
  | 'json'
  | 'matrix'
  | 'url'
  | 'color'
  | 'traffic_light'
  | 'status_indicator'
  | 'enum'
  | 'tags'

export type TableTagMapping = {
  mappingTable: string
  masterColumn: string
  tagColumn: string
  tagsTable: string
  tagNameColumn: string
}

export type TableColumn = {
  key: string
  label: string
  kind: TableColumnKind
  link: boolean
  primary: boolean
  relationKey: string | null
  relatedTable: string | null
  relatedDisplay: string | null
  openRelated: boolean
  nullable: boolean
  disabled: boolean
  multiline: boolean
  maxLength: number | null
  enumOptions: string[]
  help: string | null
  placeholder: string | null
  tagMapping: TableTagMapping | null
}

export type TableViewState = {
  sortBy: string
  sortDir: SortDirection
  sortBy2: string
  sortDir2: SortDirection
  perPage: number
  widthMode: WidthMode
  visibleColumns: string[]
}

export type TableViewSchema = {
  table: string
  title: string
  itemName: string
  defaultViewName: string
  linkColumn: string | null
  hasHistory: boolean
  icon: string | null
  color: string
  infobox: string
  canEdit: boolean
  canDelete: boolean
  editExtras: string | null
  hasBacklink: 'none' | 'panorama' | 'market' | string
  incrementing: boolean
  collapseItem: string | null
  primaryColumnCount: number
  pageSizeOptions: number[]
  defaults: TableViewState
  columns: TableColumn[]
}

export type TableListQuery = {
  per_page: number
  sort_by: string
  sort_dir: SortDirection
  sort_by2?: string
  sort_dir2?: SortDirection
}

export type RelationLookup = {
  id: number
  label: string
}

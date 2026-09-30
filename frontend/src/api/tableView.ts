import { apiRequest } from './client'
import type {
  SortDirection,
  TableColumn,
  TableColumnKind,
  TableTagMapping,
  TableViewSchema,
  TableViewState,
  WidthMode,
} from '@/tableView'

type TableTagMappingResponse = {
  mappingTable: string
  masterColumn: string
  tagColumn: string
  tagsTable: string
  tagNameColumn: string
}

type TableViewSchemaResponse = {
  table: string
  title: string
  item_name: string
  default_view_name: string
  link_column: string | null
  has_history: boolean
  icon: string | null
  color: string
  infobox: string
  can_edit: boolean
  can_delete?: boolean
  edit_extras?: string | null
  has_backlink?: string | null
  incrementing?: boolean
  collapse_item: string | null
  primary_column_count: number
  page_size_options: number[]
  defaults: {
    sort_by: string
    sort_dir: SortDirection
    sort_by2: string
    sort_dir2: SortDirection
    per_page: number
    width_mode: WidthMode
    visible_columns: string[]
  }
  columns: Array<{
    key: string
    label: string
    kind: TableColumnKind
    link: boolean
    primary: boolean
    relation_key: string | null
    related_table: string | null
    related_display: string | null
    open_related: boolean
    nullable: boolean
    disabled: boolean
    multiline: boolean
    max_length: number | null
    enum_options: string[]
    help: string | null
    placeholder: string | null
    tag_mapping?: TableTagMappingResponse | null
  }>
}

function mapState(defaults: TableViewSchemaResponse['defaults']): TableViewState {
  return {
    sortBy: defaults.sort_by,
    sortDir: defaults.sort_dir,
    sortBy2: defaults.sort_by2,
    sortDir2: defaults.sort_dir2,
    perPage: defaults.per_page,
    widthMode: defaults.width_mode,
    visibleColumns: [...defaults.visible_columns],
  }
}

function mapTagMapping(value: TableTagMappingResponse | null | undefined): TableTagMapping | null {
  if (!value) {
    return null
  }

  return {
    mappingTable: value.mappingTable,
    masterColumn: value.masterColumn,
    tagColumn: value.tagColumn,
    tagsTable: value.tagsTable,
    tagNameColumn: value.tagNameColumn,
  }
}

function mapColumn(column: TableViewSchemaResponse['columns'][number]): TableColumn {
  return {
    key: column.key,
    label: column.label,
    kind: column.kind,
    link: column.link,
    primary: column.primary,
    relationKey: column.relation_key,
    relatedTable: column.related_table,
    relatedDisplay: column.related_display,
    openRelated: Boolean(column.open_related),
    nullable: Boolean(column.nullable),
    disabled: Boolean(column.disabled),
    multiline: Boolean(column.multiline),
    maxLength: column.max_length,
    enumOptions: column.enum_options ?? [],
    help: column.help,
    placeholder: column.placeholder,
    tagMapping: mapTagMapping(column.tag_mapping),
  }
}

export async function getTableView(table: string): Promise<TableViewSchema> {
  const payload = await apiRequest<TableViewSchemaResponse>(`/tables/${encodeURIComponent(table)}/view`)

  return {
    table: payload.table,
    title: payload.title,
    itemName: payload.item_name,
    defaultViewName: payload.default_view_name,
    linkColumn: payload.link_column,
    hasHistory: payload.has_history,
    icon: payload.icon,
    color: payload.color || '#E83181',
    infobox: payload.infobox,
    canEdit: payload.can_edit,
    canDelete: Boolean(payload.can_delete),
    editExtras: payload.edit_extras ?? null,
    hasBacklink: payload.has_backlink || 'none',
    incrementing: payload.incrementing !== false,
    collapseItem: payload.collapse_item,
    primaryColumnCount: payload.primary_column_count,
    pageSizeOptions: payload.page_size_options,
    defaults: mapState(payload.defaults),
    columns: payload.columns.map(mapColumn),
  }
}

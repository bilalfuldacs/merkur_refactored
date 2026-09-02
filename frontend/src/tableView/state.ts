import type { TableColumn, TableListQuery, TableViewSchema, TableViewState } from './types'

export function cloneViewState(state: TableViewState): TableViewState {
  return {
    ...state,
    visibleColumns: [...state.visibleColumns],
  }
}

export function viewStatesEqual(left: TableViewState, right: TableViewState): boolean {
  return (
    left.sortBy === right.sortBy &&
    left.sortDir === right.sortDir &&
    left.sortBy2 === right.sortBy2 &&
    left.sortDir2 === right.sortDir2 &&
    left.perPage === right.perPage &&
    left.widthMode === right.widthMode &&
    left.visibleColumns.join('\0') === right.visibleColumns.join('\0')
  )
}

export function serverViewKey(state: TableViewState): string {
  return [state.sortBy, state.sortDir, state.sortBy2, state.sortDir2, String(state.perPage)].join('|')
}

export function columnsForKeys(columns: TableColumn[], keys: string[]): TableColumn[] {
  const byKey = new Map(columns.map((column) => [column.key, column]))
  return keys.map((key) => byKey.get(key)).filter((column): column is TableColumn => column !== undefined)
}

export function toggleVisibleColumn(columns: TableColumn[], visible: string[], key: string): string[] {
  const next = new Set(visible)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }

  return columns.map((column) => column.key).filter((columnKey) => next.has(columnKey))
}

export function toListQuery(state: TableViewState): TableListQuery {
  return {
    per_page: state.perPage,
    sort_by: state.sortBy,
    sort_dir: state.sortDir,
    ...(state.sortBy2
      ? {
          sort_by2: state.sortBy2,
          sort_dir2: state.sortDir2,
        }
      : {}),
  }
}

export function isDefaultView(state: TableViewState, schema: TableViewSchema): boolean {
  return viewStatesEqual(state, schema.defaults)
}

export type TablePageConfig = {
  table: string
  path: string
  listPath: string
}

export function tableBrowsePath(table: string): string {
  return `/tables/${table}`
}

export function tableFromBrowsePath(path: string): string | undefined {
  const match = path.match(/^\/tables\/([A-Za-z_][A-Za-z0-9_]*)$/)
  return match?.[1]
}

export function tablePageConfig(table: string): TablePageConfig {
  return {
    table,
    path: tableBrowsePath(table),
    listPath: `/tables/${table}/rows`,
  }
}

import { apiRequest } from './client'

export type MatrixValue = {
  row_headers: string[]
  col_headers: string[]
  data: string[][]
}

export function getMatrixTemplate(table: string, column: string): Promise<MatrixValue> {
  return apiRequest<MatrixValue>(
    `/tables/${encodeURIComponent(table)}/columns/${encodeURIComponent(column)}/matrix-template`,
  )
}

export function emptyMatrix(cols = 3, rows = 3): MatrixValue {
  return {
    row_headers: Array.from({ length: rows }, (_, index) => `Row #${index + 1}`),
    col_headers: Array.from({ length: cols }, (_, index) => `Column #${index + 1}`),
    data: Array.from({ length: rows }, () => Array.from({ length: cols }, () => '')),
  }
}

export function parseMatrixValue(value: unknown): MatrixValue | null {
  let raw: unknown = value
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed === '') {
      return null
    }
    try {
      raw = JSON.parse(trimmed)
    } catch {
      return null
    }
  }

  if (!raw || typeof raw !== 'object') {
    return null
  }

  const record = raw as Record<string, unknown>
  const rowHeaders = asStringList(record.row_headers)
  const colHeaders = asStringList(record.col_headers)
  if (rowHeaders.length === 0 || colHeaders.length === 0) {
    return null
  }

  const source = Array.isArray(record.data) ? record.data : []
  const data = rowHeaders.map((_, rowIndex) => {
    const row = Array.isArray(source[rowIndex]) ? source[rowIndex] : []
    return colHeaders.map((__, colIndex) => {
      const cell = row[colIndex]
      return cell === null || cell === undefined ? '' : String(cell)
    })
  })

  return {
    row_headers: rowHeaders,
    col_headers: colHeaders,
    data,
  }
}

export function summarizeMatrix(value: MatrixValue): string {
  const first = firstNonEmpty(value.data) ?? '[empty]'
  return `${value.col_headers.length} × ${value.row_headers.length}: “${first}”, …`
}

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map((item) => (item === null || item === undefined ? '' : String(item)))
}

function firstNonEmpty(data: string[][]): string | null {
  for (const row of data) {
    for (const cell of row) {
      if (cell.trim() !== '') {
        return cell
      }
    }
  }
  return null
}

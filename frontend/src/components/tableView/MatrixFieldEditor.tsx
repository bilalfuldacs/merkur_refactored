import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import AddIcon from '@mui/icons-material/Add'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import RemoveIcon from '@mui/icons-material/Remove'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import {
  emptyMatrix,
  getMatrixTemplate,
  parseMatrixValue,
  type MatrixValue,
} from '@/api/matrixTemplate'
import { AppButton, AppTextField } from '@/components/ui'

const HISTORY_LIMIT = 50

type CellKind = 'cell' | 'rowHeader' | 'colHeader'

function cloneMatrix(value: MatrixValue): MatrixValue {
  return {
    row_headers: [...value.row_headers],
    col_headers: [...value.col_headers],
    data: value.data.map((row) => [...row]),
  }
}

function matricesEqual(a: MatrixValue, b: MatrixValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function MatrixFieldEditor({
  table,
  columnKey,
  value,
  readOnly,
  onChange,
}: {
  table: string
  columnKey: string
  value: unknown
  readOnly: boolean
  onChange: (next: MatrixValue) => void
}) {
  const parsed = parseMatrixValue(value)
  const needsRepair = parsed === null
  const [fallback, setFallback] = useState<MatrixValue | null>(null)
  const [loading, setLoading] = useState(needsRepair)
  const [error, setError] = useState<string | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const repaired = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const importInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)
  const historyRef = useRef<{ past: MatrixValue[]; future: MatrixValue[] }>({ past: [], future: [] })
  const editingKeyRef = useRef<string | null>(null)
  const matrixRef = useRef<MatrixValue | null>(null)

  useEffect(() => {
    if (!needsRepair) {
      setLoading(false)
      setError(null)
      repaired.current = false
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    void getMatrixTemplate(table, columnKey)
      .then((template) => {
        if (cancelled) {
          return
        }
        setFallback(template)
        if (!repaired.current) {
          repaired.current = true
          onChangeRef.current(template)
        }
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        const blank = emptyMatrix()
        setFallback(blank)
        setError('Matrix template could not be loaded; started with a blank 3×3 grid.')
        if (!repaired.current) {
          repaired.current = true
          onChangeRef.current(blank)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [table, columnKey, needsRepair])

  const matrix = parsed ?? fallback
  matrixRef.current = matrix

  function pushHistory(previous: MatrixValue) {
    const { past } = historyRef.current
    past.push(cloneMatrix(previous))
    if (past.length > HISTORY_LIMIT) {
      past.shift()
    }
    historyRef.current.future = []
  }

  function commit(next: MatrixValue, options?: { historyKey?: string }) {
    const current = matrixRef.current
    if (!current || matricesEqual(current, next)) {
      return
    }

    const historyKey = options?.historyKey
    if (historyKey) {
      if (editingKeyRef.current !== historyKey) {
        pushHistory(current)
        editingKeyRef.current = historyKey
      }
    } else {
      pushHistory(current)
      editingKeyRef.current = null
    }

    onChange(next)
  }

  function undo() {
    const current = matrixRef.current
    const { past, future } = historyRef.current
    if (!current || past.length === 0) {
      return
    }
    const previous = past.pop()!
    future.push(cloneMatrix(current))
    editingKeyRef.current = null
    onChange(previous)
  }

  function redo() {
    const current = matrixRef.current
    const { past, future } = historyRef.current
    if (!current || future.length === 0) {
      return
    }
    const next = future.pop()!
    past.push(cloneMatrix(current))
    editingKeyRef.current = null
    onChange(next)
  }

  function updateCell(row: number, col: number, text: string) {
    if (!matrix) {
      return
    }
    const data = matrix.data.map((cells, rowIndex) =>
      cells.map((cell, colIndex) => (rowIndex === row && colIndex === col ? text : cell)),
    )
    commit({ ...matrix, data }, { historyKey: `cell:${row}:${col}` })
  }

  function updateRowHeader(row: number, text: string) {
    if (!matrix) {
      return
    }
    commit(
      {
        ...matrix,
        row_headers: matrix.row_headers.map((header, index) => (index === row ? text : header)),
      },
      { historyKey: `rowHeader:${row}` },
    )
  }

  function updateColHeader(col: number, text: string) {
    if (!matrix) {
      return
    }
    commit(
      {
        ...matrix,
        col_headers: matrix.col_headers.map((header, index) => (index === col ? text : header)),
      },
      { historyKey: `colHeader:${col}` },
    )
  }

  function addRow() {
    if (!matrix) {
      return
    }
    commit({
      row_headers: [...matrix.row_headers, `Row #${matrix.row_headers.length + 1}`],
      col_headers: matrix.col_headers,
      data: [...matrix.data, matrix.col_headers.map(() => '')],
    })
  }

  function removeRow() {
    if (!matrix || matrix.row_headers.length <= 1) {
      return
    }
    commit({
      row_headers: matrix.row_headers.slice(0, -1),
      col_headers: matrix.col_headers,
      data: matrix.data.slice(0, -1),
    })
  }

  function addCol() {
    if (!matrix) {
      return
    }
    commit({
      row_headers: matrix.row_headers,
      col_headers: [...matrix.col_headers, `Column #${matrix.col_headers.length + 1}`],
      data: matrix.data.map((row) => [...row, '']),
    })
  }

  function removeCol() {
    if (!matrix || matrix.col_headers.length <= 1) {
      return
    }
    commit({
      row_headers: matrix.row_headers,
      col_headers: matrix.col_headers.slice(0, -1),
      data: matrix.data.map((row) => row.slice(0, -1)),
    })
  }

  function exportJson() {
    if (!matrix) {
      return
    }
    const blob = new Blob([JSON.stringify(cloneMatrix(matrix), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${columnKey || 'matrix'}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function importJson(file: File) {
    setImportError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : ''
      const next = parseMatrixValue(text)
      if (!next) {
        setImportError('JSON must include row_headers, col_headers, and data.')
        return
      }
      commit(next)
    }
    reader.onerror = () => {
      setImportError('The JSON file could not be read.')
    }
    reader.readAsText(file)
  }

  function focusMatrixField(kind: CellKind, row: number, col: number) {
    const root = editorRef.current
    if (!root) {
      return
    }
    const selector = `textarea[data-matrix-kind="${kind}"][data-matrix-row="${row}"][data-matrix-col="${col}"], input[data-matrix-kind="${kind}"][data-matrix-row="${row}"][data-matrix-col="${col}"]`
    const target = root.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)
    target?.focus()
    target?.select()
  }

  function handleCellKeyDown(
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    kind: CellKind,
    row: number,
    col: number,
  ) {
    if (!matrix || readOnly) {
      return
    }

    const key = event.key
    if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight') {
      return
    }

    const target = event.currentTarget
    const isMultiline = target instanceof HTMLTextAreaElement
    const atStart = target.selectionStart === 0
    const atEnd = target.selectionStart === target.value.length
    const singleLine = !isMultiline || !target.value.includes('\n')

    let nextKind = kind
    let nextRow = row
    let nextCol = col

    if (key === 'ArrowLeft' && atStart && (singleLine || target.selectionStart === target.selectionEnd)) {
      if (kind === 'cell' && col > 0) {
        nextCol = col - 1
      } else if (kind === 'cell' && col === 0) {
        nextKind = 'rowHeader'
        nextCol = 0
      } else if (kind === 'colHeader' && col > 0) {
        nextCol = col - 1
      } else {
        return
      }
    } else if (key === 'ArrowRight' && atEnd && (singleLine || target.selectionStart === target.selectionEnd)) {
      if (kind === 'rowHeader') {
        nextKind = 'cell'
        nextCol = 0
      } else if (kind === 'cell' && col < matrix.col_headers.length - 1) {
        nextCol = col + 1
      } else if (kind === 'colHeader' && col < matrix.col_headers.length - 1) {
        nextCol = col + 1
      } else {
        return
      }
    } else if (key === 'ArrowUp' && atStart) {
      if (kind === 'cell' && row > 0) {
        nextRow = row - 1
      } else if (kind === 'cell' && row === 0) {
        nextKind = 'colHeader'
        nextRow = 0
      } else if (kind === 'rowHeader' && row > 0) {
        nextRow = row - 1
      } else {
        return
      }
    } else if (key === 'ArrowDown' && (atEnd || singleLine)) {
      if (kind === 'colHeader') {
        nextKind = 'cell'
        nextRow = 0
      } else if (kind === 'cell' && row < matrix.row_headers.length - 1) {
        nextRow = row + 1
      } else if (kind === 'rowHeader' && row < matrix.row_headers.length - 1) {
        nextRow = row + 1
      } else {
        return
      }
    } else {
      return
    }

    event.preventDefault()
    focusMatrixField(nextKind, nextRow, nextCol)
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (readOnly) {
      return
    }
    const mod = event.metaKey || event.ctrlKey
    if (!mod) {
      return
    }

    const key = event.key.toLowerCase()
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault()
      undo()
      return
    }
    if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault()
      redo()
    }
  }

  if (loading || matrix === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  return (
    <Box
      ref={editorRef}
      tabIndex={-1}
      onKeyDown={handleEditorKeyDown}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1, outline: 'none' }}
    >
      {error ? (
        <Typography variant="caption" color="warning.main">
          {error}
        </Typography>
      ) : null}
      {importError ? (
        <Typography variant="caption" color="error">
          {importError}
        </Typography>
      ) : null}
      {!readOnly ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          <AppButton type="button" size="small" variant="outlined" color="inherit" startIcon={<AddIcon />} onClick={addCol}>
            Add column
          </AppButton>
          <AppButton
            type="button"
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<RemoveIcon />}
            disabled={matrix.col_headers.length <= 1}
            onClick={removeCol}
          >
            Remove column
          </AppButton>
          <AppButton type="button" size="small" variant="outlined" color="inherit" startIcon={<AddIcon />} onClick={addRow}>
            Add row
          </AppButton>
          <AppButton
            type="button"
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<RemoveIcon />}
            disabled={matrix.row_headers.length <= 1}
            onClick={removeRow}
          >
            Remove row
          </AppButton>
          <AppButton
            type="button"
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<FileUploadOutlinedIcon />}
            onClick={() => importInputRef.current?.click()}
          >
            Import JSON
          </AppButton>
          <AppButton
            type="button"
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={exportJson}
          >
            Export JSON
          </AppButton>
          <input
            ref={importInputRef}
            type="file"
            hidden
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) {
                importJson(file)
              }
              event.target.value = ''
            }}
          />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          <AppButton
            type="button"
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={exportJson}
          >
            Export JSON
          </AppButton>
        </Box>
      )}
      <Box sx={{ overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 420 }}>
        <Box
          component="table"
          sx={{
            borderCollapse: 'collapse',
            minWidth: '100%',
            '& th, & td': {
              border: '1px solid',
              borderColor: 'divider',
              p: 0.5,
              verticalAlign: 'top',
            },
            '& th': { bgcolor: 'grey.100', fontWeight: 700 },
          }}
        >
          <thead>
            <tr>
              <th style={{ minWidth: 120 }} />
              {matrix.col_headers.map((header, colIndex) => (
                <th key={`col-${colIndex}`}>
                  <AppTextField
                    size="small"
                    value={header}
                    disabled={readOnly}
                    onChange={(event) => updateColHeader(colIndex, event.target.value)}
                    sx={{ minWidth: 110 }}
                    slotProps={{
                      htmlInput: {
                        'data-matrix-kind': 'colHeader',
                        'data-matrix-row': 0,
                        'data-matrix-col': colIndex,
                        onKeyDown: (event: KeyboardEvent<HTMLInputElement>) =>
                          handleCellKeyDown(event, 'colHeader', 0, colIndex),
                      },
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.row_headers.map((header, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                <th>
                  <AppTextField
                    size="small"
                    value={header}
                    disabled={readOnly}
                    onChange={(event) => updateRowHeader(rowIndex, event.target.value)}
                    sx={{ minWidth: 110 }}
                    slotProps={{
                      htmlInput: {
                        'data-matrix-kind': 'rowHeader',
                        'data-matrix-row': rowIndex,
                        'data-matrix-col': 0,
                        onKeyDown: (event: KeyboardEvent<HTMLInputElement>) =>
                          handleCellKeyDown(event, 'rowHeader', rowIndex, 0),
                      },
                    }}
                  />
                </th>
                {(matrix.data[rowIndex] ?? []).map((cell, colIndex) => (
                  <td key={`cell-${rowIndex}-${colIndex}`}>
                    <AppTextField
                      size="small"
                      multiline
                      minRows={1}
                      value={cell}
                      disabled={readOnly}
                      onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                      sx={{ minWidth: 110 }}
                      slotProps={{
                        htmlInput: {
                          'data-matrix-kind': 'cell',
                          'data-matrix-row': rowIndex,
                          'data-matrix-col': colIndex,
                          onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) =>
                            handleCellKeyDown(event, 'cell', rowIndex, colIndex),
                        },
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Box>
      </Box>
    </Box>
  )
}

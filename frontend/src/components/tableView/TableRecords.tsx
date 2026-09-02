import { useMemo } from 'react'
import Box from '@mui/material/Box'
import Pagination from '@mui/material/Pagination'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import type { Paginated } from '@/api'
import type { TableColumn } from '@/tableView'
import { columnsForKeys, useColumnWidths } from '@/tableView'
import { ColumnResizeHandle } from './ColumnResizeHandle'
import { RecordCell } from './RecordCell'

export function TableRecords<T extends { ID: number }>({
  table,
  payload,
  page,
  visibleColumns,
  columns,
  onPageChange,
  onRowOpen,
}: {
  table?: string
  payload: Paginated<T> | null
  page: number
  visibleColumns: string[]
  columns: TableColumn[]
  onPageChange: (page: number) => void
  onRowOpen?: (id: number) => void
}) {
  const visible = useMemo(() => columnsForKeys(columns, visibleColumns), [columns, visibleColumns])
  const visibleKeys = useMemo(() => visible.map((column) => column.key), [visible])
  const {
    widthFor,
    isExplicit,
    tableMinWidth,
    activeKey,
    startResize,
    moveResize,
    endResize,
    resetWidth,
    onResizeKeyDown,
  } = useColumnWidths(table, visibleKeys)

  const rows = payload?.data ?? []
  const meta = payload?.meta
  const from = meta?.from ?? 0
  const to = meta?.to ?? 0
  const total = meta?.total ?? 0
  const lastPage = meta?.last_page ?? 1

  return (
    <Box>
      <Typography sx={{ mb: 1.5, textAlign: 'center' }}>
        <Box component="strong">{total}</Box> {total === 1 ? 'item' : 'items'}
        {total > 0 ? `, showing ${from}–${to}` : '.'}
      </Typography>

      <TableContainer sx={{ mb: 2, width: '100%', overflowX: 'auto' }}>
        <Table
          size="small"
          sx={{
            tableLayout: 'fixed',
            width: '100%',
            minWidth: Math.max(tableMinWidth, 320),
          }}
        >
          <colgroup>
            {visible.map((column) => (
              <col
                key={column.key}
                style={isExplicit(column.key) ? { width: widthFor(column.key) } : undefined}
              />
            ))}
          </colgroup>
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  bgcolor: 'rgba(13, 110, 253, 0.12)',
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                },
              }}
            >
              {visible.map((column) => {
                const width = widthFor(column.key)

                return (
                  <TableCell
                    key={column.key}
                    sx={{
                      position: 'relative',
                      overflow: 'hidden',
                      py: 1,
                      pr: 1.5,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {column.label}
                    </Box>
                    <ColumnResizeHandle
                      label={column.label}
                      width={width ?? 0}
                      active={activeKey === column.key}
                      onPointerDown={(event) => startResize(column.key, event)}
                      onPointerMove={moveResize}
                      onPointerUp={endResize}
                      onDoubleClick={() => resetWidth(column.key)}
                      onKeyDown={(event) => onResizeKeyDown(column.key, event)}
                    />
                  </TableCell>
                )
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 || visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Math.max(visible.length, 1)}>
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    {visible.length === 0 ? 'Select at least one column, then Apply.' : 'No items found.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={row.ID}
                  hover
                  tabIndex={onRowOpen ? 0 : undefined}
                  onClick={onRowOpen ? () => onRowOpen(row.ID) : undefined}
                  onKeyDown={
                    onRowOpen
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            onRowOpen(row.ID)
                          }
                        }
                      : undefined
                  }
                  sx={{
                    bgcolor: index % 2 === 1 ? 'grey.50' : 'background.paper',
                    cursor: onRowOpen ? 'pointer' : 'default',
                  }}
                >
                  {visible.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={{
                          verticalAlign: 'top',
                          overflow: 'hidden',
                          wordBreak: 'break-word',
                        }}
                      >
                        <RecordCell
                          row={row as Record<string, unknown>}
                          column={column}
                          onOpen={onRowOpen ? () => onRowOpen(row.ID) : undefined}
                        />
                      </TableCell>
                    ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {lastPage > 1 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
          <Pagination
            page={page}
            count={lastPage}
            onChange={(_event, next) => onPageChange(next)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      ) : null}
    </Box>
  )
}

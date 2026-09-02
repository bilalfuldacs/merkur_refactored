import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import type { MarketReportMatrix, MarketReportMatrixCell, MarketReportProperty } from '@/api'

export function emptyLabel(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  return String(value)
}

export function MatrixTable({ matrix }: { matrix: MarketReportMatrix | null | undefined }) {
  if (!matrix) {
    return (
      <Typography color="text.secondary" sx={{ py: 1 }}>
        —
      </Typography>
    )
  }

  return (
    <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'common.white', mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headSx} />
            {matrix.col_headers.map((header, index) => (
              <TableCell key={`h-${index}`} sx={headSx}>
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {matrix.row_headers.map((header, rowIndex) => (
            <TableRow key={`r-${rowIndex}`}>
              <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50', whiteSpace: 'pre-line' }}>{header}</TableCell>
              {(matrix.data[rowIndex] ?? []).map((cell, cellIndex) => (
                <TableCell key={`c-${rowIndex}-${cellIndex}`} sx={{ whiteSpace: 'pre-line' }}>
                  <MatrixCell cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

function MatrixCell({ cell }: { cell: MarketReportMatrixCell }) {
  if (cell && typeof cell === 'object' && 'color' in cell) {
    return <Box sx={{ width: 14, height: 14, bgcolor: cell.color, borderRadius: 0.3, mx: 'auto' }} />
  }
  return <>{emptyLabel(cell)}</>
}

export function PropertyTable({
  rows,
  execOnly = false,
}: {
  rows: MarketReportProperty[]
  execOnly?: boolean
}) {
  const visible = execOnly ? rows.filter((row) => row.in_exec_summary) : rows
  return (
    <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'common.white', mb: 2 }}>
      <Table size="small">
        <TableBody>
          {visible.map((row) => (
            <TableRow key={row.key} sx={execOnly || row.in_exec_summary ? undefined : execHiddenSx}>
              <TableCell sx={{ width: '25%', fontWeight: 700, bgcolor: 'grey.50' }}>{row.label}</TableCell>
              <TableCell sx={{ whiteSpace: 'pre-wrap' }}>{emptyLabel(row.value)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}

export function ReportSection({
  id,
  icon,
  title,
  cadence,
  exec = true,
  children,
}: {
  id: string
  icon: ReactNode
  title: string
  cadence: string
  exec?: boolean
  children: ReactNode
}) {
  return (
    <Box id={id} sx={{ mb: 4, ...(!exec ? execHiddenSx : null) }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          mt: 5,
          mb: 2,
          pb: 1,
        }}
      >
        <Typography
          component="h2"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: 800,
            fontSize: 22,
            counterIncrement: 'report',
            '&::before': { content: 'counter(report, upper-roman) ". "', fontSize: '0.88em' },
          }}
        >
          {icon}
          {title}
        </Typography>
        <Box sx={{ display: { xs: 'none', xl: 'block' } }}>
          <Box
            component="span"
            sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: 'info.main', color: 'common.white', fontSize: 12, fontWeight: 800 }}
          >
            {cadence}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display: { xl: 'none' }, mb: 2 }}>
        <Box
          component="span"
          sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: 'info.main', color: 'common.white', fontSize: 12, fontWeight: 800 }}
        >
          {cadence}
        </Box>
      </Box>
      {children}
    </Box>
  )
}

export const execHiddenSx = {
  '.exec-summary &': { display: 'none' },
} as const

const headSx = {
  fontWeight: 800,
  bgcolor: 'grey.50',
  whiteSpace: 'pre-line',
} as const

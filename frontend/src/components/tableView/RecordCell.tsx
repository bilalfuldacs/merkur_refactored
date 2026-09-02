import Box from '@mui/material/Box'
import type { TableColumn } from '@/tableView'
import { asText, isFilledBoolean, relationLabel } from '@/tableView'
import { EmptyCell } from './EmptyCell'

export function RecordCell({
  row,
  column,
  onOpen,
}: {
  row: Record<string, unknown>
  column: TableColumn
  onOpen?: () => void
}) {
  if (column.kind === 'id') {
    return <Box component="span">{asText(row.ID) ?? asText(row[column.key])}</Box>
  }

  if (column.kind === 'relation') {
    const related = column.relationKey ? row[column.relationKey] : null
    return <LinkedValue value={relationLabel(related)} link={column.link} onOpen={onOpen} />
  }

  if (column.kind === 'boolean') {
    const value = row[column.key]
    if (value === null || value === undefined) {
      return <EmptyCell value={null} />
    }

    return <Box component="span">{isFilledBoolean(value) ? 'Yes' : 'No'}</Box>
  }

  if (column.kind === 'json') {
    const value = row[column.key]
    if (value === null || value === undefined || value === '') {
      return <EmptyCell value={null} />
    }

    const text = typeof value === 'string' ? value : JSON.stringify(value)
    return <EmptyCell value={text} />
  }

  if (column.key === 'ID_text') {
    const code = asText(row[column.key])?.trim()
    if (!code) {
      return <EmptyCell value={asText(row[column.key])} />
    }

    return (
      <Box component="code" sx={{ fontWeight: 700 }}>
        {code}
      </Box>
    )
  }

  if (column.kind === 'url') {
    const url = asText(row[column.key])
    if (!url?.trim()) {
      return <EmptyCell value={url} />
    }

    return (
      <Box
        component="a"
        href={url}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        sx={{ color: 'info.main', fontWeight: 700 }}
      >
        {url}
      </Box>
    )
  }

  if (column.kind === 'color') {
    const color = asText(row[column.key])
    if (!color?.trim()) {
      return <EmptyCell value={color} />
    }

    return (
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 16, height: 16, bgcolor: color, border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }} />
        {color}
      </Box>
    )
  }

  return <LinkedValue value={asText(row[column.key])} link={column.link} onOpen={onOpen} />
}

function LinkedValue({
  value,
  link,
  onOpen,
}: {
  value: string | null
  link: boolean
  onOpen?: () => void
}) {
  if (!link) {
    return <EmptyCell value={value} />
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onOpen?.()
      }}
      sx={{
        border: 0,
        p: 0,
        bgcolor: 'transparent',
        color: 'info.main',
        font: 'inherit',
        fontWeight: 800,
        textAlign: 'left',
        cursor: 'pointer',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      {value?.trim() ? value : <EmptyCell value={value} />}
    </Box>
  )
}

import { useEffect, useMemo, useState } from 'react'
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { getLatestChanges, LATEST_CHANGES_COUNTS } from '@/api'
import type { LatestChangesCount, LatestChangesGroup, LatestChangesTable } from '@/api'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { iconForTable } from '@/components/tables/tableIcons'
import { AppTextField } from '@/components/ui'
import { UserAvatar } from '@/components/user'
import { tableBrowsePath } from '@/config/tablePages'
import { APP_PATHS, useAppPath } from '@/routing'

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

const headerCellSx = {
  bgcolor: 'info.light',
  color: 'secondary.main',
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const

function countFromSearch(): LatestChangesCount {
  const raw = Number(new URLSearchParams(window.location.search).get('c'))
  return (LATEST_CHANGES_COUNTS as readonly number[]).includes(raw)
    ? (raw as LatestChangesCount)
    : 5
}

function formatModifiedAt(value: string | null): string {
  if (!value) {
    return '—'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function NullBadge() {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 0.75,
        py: 0.1,
        borderRadius: 999,
        bgcolor: 'action.hover',
        color: 'text.secondary',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      NULL
    </Box>
  )
}

function ChangeTable({
  section,
  decolorize,
  onOpenTable,
  onOpenRow,
}: {
  section: LatestChangesTable
  decolorize: boolean
  onOpenTable: (table: string) => void
  onOpenRow: (table: string, id: number | string | null) => void
}) {
  const Icon = iconForTable(section.icon)

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        component="h3"
        sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: 18, mb: 1 }}
      >
        <Icon sx={{ color: section.color || 'merkur.pink', fontSize: 22 }} />
        <Box
          component="button"
          type="button"
          onClick={() => onOpenTable(section.table)}
          sx={{ ...crumbSx, color: 'info.main', fontWeight: 700, fontSize: 18 }}
        >
          {section.title}
        </Box>
      </Typography>
      <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'common.white' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell colSpan={2} sx={{ ...headerCellSx, width: '30%' }}>
                Last Modified
              </TableCell>
              {section.columns.map((column) => (
                <TableCell key={column.key} sx={headerCellSx}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {section.rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2 + section.columns.length}>
                  <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>No recent changes.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              section.rows.map((row) => (
                <TableRow key={`${section.table}-${row.id}`} hover>
                  <TableCell
                    align="right"
                    sx={{ bgcolor: 'rgba(0, 159, 227, 0.08)', width: 56, borderRight: 0 }}
                  >
                    <UserAvatar user={row.editor} decolorize={decolorize} />
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'rgba(0, 159, 227, 0.08)' }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => onOpenRow(section.table, row.id)}
                      sx={{ ...crumbSx, fontWeight: 800, color: 'info.main' }}
                    >
                      {formatModifiedAt(row.modified_at)}
                    </Box>
                  </TableCell>
                  {row.cells.map((cell, index) => (
                    <TableCell key={`${section.table}-${row.id}-${index}`}>
                      {cell ? cell : <NullBadge />}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}

function GroupBlock({
  group,
  decolorize,
  onOpenTable,
  onOpenRow,
}: {
  group: LatestChangesGroup
  decolorize: boolean
  onOpenTable: (table: string) => void
  onOpenRow: (table: string, id: number | string | null) => void
}) {
  return (
    <Box sx={{ mb: 2 }}>
      {group.name ? (
        <Typography component="h2" sx={{ fontWeight: 400, fontSize: { xs: 22, md: 26 }, mb: 2 }}>
          <Box component="strong" sx={{ mr: 1 }}>
            {group.index}
          </Box>
          {group.name}
        </Typography>
      ) : null}
      {group.tables.map((section) => (
        <ChangeTable
          key={section.table}
          section={section}
          decolorize={decolorize}
          onOpenTable={onOpenTable}
          onOpenRow={onOpenRow}
        />
      ))}
    </Box>
  )
}

export default function LatestChangesPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const [count, setCount] = useState<LatestChangesCount>(countFromSearch)
  const [groups, setGroups] = useState<LatestChangesGroup[] | null>(null)
  const [failed, setFailed] = useState(false)
  const decolorize = Boolean(user?.decolorize_avatars)

  useEffect(() => {
    document.title = 'Latest Changes (Report) | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    setGroups(null)
    void getLatestChanges(count)
      .then((payload) => {
        if (!cancelled) {
          setGroups(payload.groups)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          setGroups([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [count])

  const heading = useMemo(
    () => (
      <Typography sx={{ fontSize: { xs: 16, md: 18 }, mb: 0 }}>
        See{' '}
        <AppTextField
          select
          fullWidth={false}
          value={String(count)}
          onChange={(event) => {
            const next = Number(event.target.value) as LatestChangesCount
            setCount(next)
            window.history.replaceState(null, '', `${APP_PATHS.latestChanges}?c=${next}`)
          }}
          size="small"
          sx={{
            width: 88,
            display: 'inline-flex',
            mx: 1,
            verticalAlign: 'middle',
            '& .MuiInputBase-root': { fontSize: 18, fontWeight: 700 },
          }}
        >
          {LATEST_CHANGES_COUNTS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </AppTextField>{' '}
        most recent modifications (new or updated items) for most tables at a glance.
      </Typography>
    ),
    [count],
  )

  function openTable(table: string) {
    navigate(tableBrowsePath(table))
  }

  function openRow(table: string, id: number | string | null) {
    if (id === null || id === '') {
      openTable(table)
      return
    }
    navigate(`${tableBrowsePath(table)}?id=${id}`)
  }

  return (
    <PageBackground sx={{ height: '100vh', overflow: 'hidden' }}>
      <AppHeader variant="brand" />
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          px: { xs: 2, md: 3, lg: 4 },
          py: { xs: 1.5, md: 2 },
        }}
      >
        <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <Box sx={{ flexShrink: 0 }}>
            <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, fontSize: 13 }}>
              <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
                Start
              </Box>
              <Box component="span" color="text.secondary">
                /
              </Box>
              <Box component="button" type="button" onClick={() => navigate(APP_PATHS.reports)} sx={crumbSx}>
                Reports
              </Box>
              <Box component="span" color="text.secondary">
                /
              </Box>
              <Box component="span">Latest Changes</Box>
            </Box>
            <Typography
              component="h1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 24, md: 32 }, mb: 1.5 }}
            >
              <SyncOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 32 }} />
              Latest Changes
            </Typography>
            <Box sx={{ mb: 2 }}>{heading}</Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': { width: 10 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: 'rgba(0,0,0,0.28)',
                borderRadius: 8,
              },
            }}
          >
            {failed ? (
              <Typography color="text.secondary">Latest changes could not be loaded.</Typography>
            ) : groups === null ? null : groups.length === 0 ? (
              <Typography color="text.secondary">No recent changes.</Typography>
            ) : (
              groups.map((group, index) => (
                <GroupBlock
                  key={group.name ?? `group-${index}`}
                  group={group}
                  decolorize={decolorize}
                  onOpenTable={openTable}
                  onOpenRow={openRow}
                />
              ))
            )}
          </Box>
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

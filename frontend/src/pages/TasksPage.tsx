import { useEffect, useState } from 'react'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HourglassTopOutlinedIcon from '@mui/icons-material/HourglassTopOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { getTasks } from '@/api'
import type { TaskRow, TasksPayload, TasksPeople, TasksTime } from '@/api'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { StatusBadge } from '@/components/products/StatusBadge'
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

const pillGroupSx = {
  gap: 1,
  flexWrap: 'wrap',
  justifyContent: 'center',
  '& .MuiToggleButtonGroup-grouped': {
    borderRadius: '999px !important',
    border: '1px solid !important',
    mx: 0,
  },
} as const

const pillSx = {
  px: 1.5,
  py: 0.75,
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 700,
  bgcolor: 'common.white',
  color: 'secondary.main',
  borderColor: 'divider',
  '&.Mui-selected': {
    bgcolor: 'secondary.main',
    color: 'common.white',
    borderColor: 'secondary.main',
    '&:hover': { bgcolor: 'secondary.main' },
  },
}

const headerCellSx = {
  bgcolor: 'info.light',
  color: 'secondary.main',
  fontWeight: 700,
  whiteSpace: 'nowrap',
} as const

function peopleFromSearch(): TasksPeople {
  return new URLSearchParams(window.location.search).get('p') === 'e' ? 'e' : 'm'
}

function timeFromSearch(): TasksTime {
  const value = new URLSearchParams(window.location.search).get('t')
  return value === 'u' || value === 'd' || value === 'f' ? value : 'a'
}

function niceDate(value: string | null): string {
  if (!value) {
    return '—'
  }
  if (value.length !== 10) {
    return value
  }
  if (value.slice(4) === '-00-00') {
    return value.slice(0, 4)
  }
  if (value.slice(8) === '-00') {
    return value.slice(0, 7)
  }
  return value
}

function jurisdictionLabel(row: TaskRow): string {
  const market = row.jurisdiction
  if (!market) {
    return '—'
  }
  return [market.flag, market.iso3166, market.segment].filter(Boolean).join(' ')
}

export default function TasksPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const [people, setPeople] = useState<TasksPeople>(() => peopleFromSearch())
  const [time, setTime] = useState<TasksTime>(() => timeFromSearch())
  const [payload, setPayload] = useState<TasksPayload | null>(null)
  const [failed, setFailed] = useState(false)
  const decolorize = Boolean(user?.decolorize_avatars)

  useEffect(() => {
    document.title = 'My Tasks | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    const next = `${APP_PATHS.tasks}?p=${people}&t=${time}`
    const current = `${window.location.pathname}${window.location.search}`
    if (current !== next) {
      window.history.replaceState(null, '', next)
    }

    let cancelled = false
    void getTasks(people, time)
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
          setFailed(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPayload(null)
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [people, time])

  function openTable(table: string, id: number) {
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
          px: { xs: 2, md: 4, lg: 6 },
          pt: { xs: 2, md: 3 },
        }}
      >
        <Box
          sx={{
            maxWidth: 1280,
            mx: 'auto',
            width: '100%',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14 }}>
              <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
                Start
              </Box>
              <Box component="span" color="text.secondary">
                /
              </Box>
              <Box component="span">My Tasks</Box>
            </Box>

            <Typography
              component="h1"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 32, md: 40 }, mb: 2 }}
            >
              <CalendarMonthOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 36 }} />
              My Tasks
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              <ToggleButtonGroup
                exclusive
                value={people}
                onChange={(_event, value: TasksPeople | null) => {
                  if (value) {
                    setPeople(value)
                  }
                }}
                aria-label="Whose tasks"
                sx={pillGroupSx}
              >
                <ToggleButton value="m" sx={pillSx}>
                  <PersonOutlinedIcon sx={{ fontSize: 18, mr: 0.75 }} />
                  just mine
                </ToggleButton>
                <ToggleButton value="e" sx={pillSx}>
                  <GroupsOutlinedIcon sx={{ fontSize: 18, mr: 0.75 }} />
                  everyone’s
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <ToggleButtonGroup
                exclusive
                value={time}
                onChange={(_event, value: TasksTime | null) => {
                  if (value) {
                    setTime(value)
                  }
                }}
                aria-label="Task timing"
                sx={pillGroupSx}
              >
                <ToggleButton value="u" sx={pillSx}>
                  <HourglassTopOutlinedIcon sx={{ fontSize: 18, mr: 0.75 }} />
                  upcoming
                </ToggleButton>
                <ToggleButton value="d" sx={pillSx}>
                  <WarningAmberOutlinedIcon sx={{ fontSize: 18, mr: 0.75 }} />
                  due
                </ToggleButton>
                <ToggleButton value="a" sx={pillSx}>
                  active
                </ToggleButton>
                <ToggleButton value="f" sx={pillSx}>
                  <CheckCircleOutlinedIcon sx={{ fontSize: 18, mr: 0.75 }} />
                  finished
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              pb: 2,
            }}
          >
            {failed ? (
              <Typography color="text.secondary">My Tasks could not be loaded.</Typography>
            ) : !payload ? null : (
              <>
                <TaskSection
                  title="Versions"
                  emptyLabel="no “Versions” items"
                  rows={payload.versions}
                  milestoneTable="version_milestones"
                  decolorize={decolorize}
                  onOpen={openTable}
                />
                <TaskSection
                  title="Builds"
                  emptyLabel="no “Builds” items"
                  rows={payload.builds}
                  milestoneTable="build_milestones"
                  decolorize={decolorize}
                  onOpen={openTable}
                />
              </>
            )}
          </Box>
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

function TaskSection({
  title,
  emptyLabel,
  rows,
  milestoneTable,
  decolorize,
  onOpen,
}: {
  title: string
  emptyLabel: string
  rows: TaskRow[]
  milestoneTable: string
  decolorize: boolean
  onOpen: (table: string, id: number) => void
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography component="h2" sx={{ fontWeight: 800, fontSize: 24, mb: 1.5 }}>
        {title}
      </Typography>
      <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'common.white' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerCellSx, width: 160, textAlign: 'right' }}>People</TableCell>
              <TableCell sx={headerCellSx}>{title === 'Versions' ? 'Version' : 'Build'}</TableCell>
              <TableCell sx={headerCellSx}>Jurisdiction</TableCell>
              <TableCell sx={headerCellSx}>Expected Status</TableCell>
              <TableCell sx={headerCellSx}>Expected Date</TableCell>
              <TableCell sx={headerCellSx}>Actual Date</TableCell>
              <TableCell sx={headerCellSx}>Comment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', fontStyle: 'italic', color: 'text.secondary', py: 3 }}>
                  {emptyLabel}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.ID}
                  hover
                  sx={
                    row.due
                      ? {
                          bgcolor: 'merkur.lightGray',
                          '& > td': { bgcolor: 'merkur.lightGray' },
                          '& > td:first-of-type': { bgcolor: 'rgba(0, 159, 227, 0.14)' },
                        }
                      : undefined
                  }
                >
                  <TableCell
                    sx={{
                      bgcolor: 'rgba(0, 159, 227, 0.14)',
                      textAlign: 'right',
                      py: 0.75,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 0.25 }}>
                      {row.people.map((person) => (
                        <UserAvatar key={person.ID} user={person} size="sm" decolorize={decolorize} />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
                    {row.subject ? (
                      <Box
                        component="button"
                        type="button"
                        onClick={() => onOpen(row.subject!.table, row.subject!.ID)}
                        sx={{ ...crumbSx, fontWeight: 700, color: 'info.main' }}
                      >
                        {row.subject.name || 'Untitled'}
                      </Box>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {row.jurisdiction ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={jurisdictionLabel(row)}
                        onClick={() => onOpen('jurisdictions', row.jurisdiction!.ID)}
                        sx={{ fontWeight: 600 }}
                      />
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    {row.status ? <StatusBadge status={row.status} /> : '—'}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{niceDate(row.expected_date)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{niceDate(row.actual_date)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        aria-label={`Open ${title.toLowerCase()} milestone`}
                        onClick={() => onOpen(milestoneTable, row.ID)}
                        sx={{
                          bgcolor: 'secondary.main',
                          color: 'common.white',
                          borderRadius: 1,
                          '&:hover': { bgcolor: 'secondary.dark' },
                        }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography sx={{ fontSize: 13 }}>{row.comment || ''}</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}

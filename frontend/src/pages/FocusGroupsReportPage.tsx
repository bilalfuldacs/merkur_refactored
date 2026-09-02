import { Fragment, useEffect, useState } from 'react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { apiRequest } from '@/api/client'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { UserAvatar } from '@/components/user'
import { tableBrowsePath } from '@/config/tablePages'
import { APP_PATHS, useAppPath } from '@/routing'

type Person = {
  ID: number
  initials: string | null
  firstname: string | null
  lastname: string | null
  bcolor: string | null
  color: string | null
  role_ID: number | null
}

type FocusGroupRow = {
  ID: number
  start_date: string | null
  comment: string | null
  jurisdiction: {
    ID: number
    name: string | null
    flag: string | null
    iso3166: string | null
    segment: string | null
  } | null
  people: Person[]
}

type FocusVersion = {
  version_ID: number | null
  version_name: string
  first_date: string | null
  count: number
  groups: FocusGroupRow[]
}

type FocusPayload = {
  generated_at: string
  count: number
  versions: FocusVersion[]
  last_modified: { at: string | null; editor: Person | null; jurisdiction: string | null } | null
}

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
} as const

export default function FocusGroupsReportPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const [payload, setPayload] = useState<FocusPayload | null>(null)
  const [failed, setFailed] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const decolorize = Boolean(user?.decolorize_avatars)

  useEffect(() => {
    document.title = 'Focus Groups | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void apiRequest<FocusPayload>('/reports/focus-groups')
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, py: { xs: 2, md: 3 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.reports)} sx={crumbSx}>
              Reports
            </Box>
            <Box component="span" color="text.secondary">/</Box>
            <Box component="span">Focus Groups</Box>
          </Box>
          <Typography component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 32, md: 40 }, mb: 1 }}>
            <GroupsOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 36 }} />
            Focus Groups
          </Typography>
          <Typography sx={{ mb: 2 }}>
            See all Focus Groups for all{' '}
            <Box component="button" type="button" onClick={() => navigate(tableBrowsePath('versions'))} sx={crumbSx}>
              Versions
            </Box>
            .
          </Typography>
          {payload ? <Typography color="text.secondary" sx={{ mb: 2 }}>This report was generated on {payload.generated_at}.</Typography> : null}
          {failed ? <Typography color="text.secondary">The report could not be loaded.</Typography> : null}
          {payload ? (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx}>Version</TableCell>
                    <TableCell sx={{ ...headerCellSx, width: 110 }} />
                    <TableCell sx={{ ...headerCellSx, width: 140 }}>1st Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payload.versions.map((version, index) => {
                    const open = openId === index
                    return (
                      <Fragment key={`v-${version.version_ID ?? index}`}>
                        <TableRow key={`v-${version.version_ID ?? index}`}>
                          <TableCell sx={{ fontWeight: 800 }}>{version.version_name}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              aria-label="Show jurisdictions"
                              onClick={() => setOpenId(open ? null : index)}
                              sx={{ bgcolor: 'secondary.main', color: '#fff', '&:hover': { bgcolor: 'secondary.dark' } }}
                            >
                              <ExpandMoreIcon sx={{ transform: open ? 'rotate(180deg)' : 'none' }} />
                            </IconButton>
                          </TableCell>
                          <TableCell>{version.first_date || '—'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={3} sx={{ p: 0, border: 0 }}>
                            <Collapse in={open}>
                              <Box sx={{ py: 1.5, pl: { xs: 1, md: 6 } }}>
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 700 }}>Jurisdiction</TableCell>
                                      <TableCell sx={{ fontWeight: 700, width: 56 }} />
                                      <TableCell sx={{ fontWeight: 700, width: 120 }}>Date</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {version.groups.map((group) => (
                                      <TableRow key={group.ID} hover>
                                        <TableCell>
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                            {group.people.map((person) => (
                                              <UserAvatar key={person.ID} user={person} size="sm" decolorize={decolorize} />
                                            ))}
                                            <Box component="strong">
                                              {group.jurisdiction?.flag ? `${group.jurisdiction.flag} ` : ''}
                                              {group.jurisdiction?.name || '—'}
                                            </Box>
                                          </Box>
                                          {group.comment ? (
                                            <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5, textAlign: 'right' }}>
                                              {group.comment}
                                            </Typography>
                                          ) : null}
                                        </TableCell>
                                        <TableCell>
                                          <IconButton
                                            size="small"
                                            aria-label="Open focus group"
                                            onClick={() => navigate(`${tableBrowsePath('focus_groups')}?id=${group.ID}`)}
                                            sx={{ bgcolor: 'info.main', color: '#fff' }}
                                          >
                                            <ExpandMoreIcon sx={{ transform: 'rotate(-90deg)', fontSize: 16 }} />
                                          </IconButton>
                                        </TableCell>
                                        <TableCell>{group.start_date || '—'}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
              {payload.last_modified ? (
                <Typography sx={{ mt: 2, textAlign: 'right', fontSize: 13 }}>
                  Focus groups last modified on <strong>{payload.last_modified.at}</strong>
                  {payload.last_modified.editor
                    ? ` by ${payload.last_modified.editor.firstname ?? ''} ${payload.last_modified.editor.lastname ?? ''}`
                    : ''}
                  {payload.last_modified.jurisdiction ? `: ${payload.last_modified.jurisdiction}.` : '.'}
                </Typography>
              ) : null}
            </>
          ) : null}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

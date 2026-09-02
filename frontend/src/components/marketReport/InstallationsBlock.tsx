import { Fragment, useState } from 'react'
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined'
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import type { MarketReportAvailability, MarketReportVersion } from '@/api'
import { tableBrowsePath } from '@/config/tablePages'
import { APP_PATHS, useAppPath } from '@/routing'
import { execHiddenSx } from './ReportTables'

const PERF_COLOR: Record<string, string> = {
  'A+': '#51630c',
  A: '#A2C617',
  B: '#FFCC00',
  C: '#F07E26',
  D: '#EB0000',
  'D-': '#9d0000',
  mixed: '#009FE3',
}

const TECH_COLOR = { red: '#EB0000', yellow: '#FFCC00', green: '#A2C617' } as const

export function InstallationVersions({
  versions,
  totals,
}: {
  versions: MarketReportVersion[]
  totals: { live: number; test: number; planned: number }
}) {
  const { navigate } = useAppPath()
  const [openId, setOpenId] = useState<number | null>(null)

  if (versions.length === 0) {
    return <Typography color="text.secondary">No installations are recorded for this market.</Typography>
  }

  return (
    <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'common.white', mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headSx}>Version</TableCell>
            <TableCell sx={headSx} />
            <TableCell sx={headSx}>1st Date</TableCell>
            <TableCell sx={headSx} align="right">
              L
            </TableCell>
            <TableCell sx={headSx} align="right">
              T
            </TableCell>
            <TableCell sx={headSx} align="right">
              P
            </TableCell>
            <TableCell sx={headSx} align="center">
              Perf
            </TableCell>
            <TableCell sx={headSx} align="center">
              Tech
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {versions.map((version) => {
            const open = openId === version.ID
            return (
              <Fragment key={version.ID}>
                <TableRow hover>
                  <TableCell sx={{ fontWeight: 800 }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => navigate(`${APP_PATHS.installationsReport}?v=${version.ID}`)}
                      sx={{ border: 0, p: 0, bgcolor: 'transparent', color: 'info.main', cursor: 'pointer', font: 'inherit', fontWeight: 800 }}
                    >
                      {version.label}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => setOpenId(open ? null : version.ID)} aria-label="Show venues">
                      {open ? <KeyboardArrowUpOutlinedIcon /> : <KeyboardArrowDownOutlinedIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell>{version.first_installed ?? '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                    {version.live}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                    {version.test}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>
                    {version.planned}
                  </TableCell>
                  <TableCell align="center">
                    {version.performance ? (
                      <Box component="span" sx={{ fontWeight: 800, color: PERF_COLOR[version.performance] ?? 'text.primary' }}>
                        {version.performance}
                      </Box>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box component="span" sx={{ color: TECH_COLOR.red }}>
                      {version.tech.red}
                    </Box>
                    {'  '}
                    <Box component="span" sx={{ color: TECH_COLOR.yellow }}>
                      {version.tech.yellow}
                    </Box>
                    {'  '}
                    <Box component="span" sx={{ color: TECH_COLOR.green, fontWeight: 800 }}>
                      {version.tech.green}
                    </Box>
                  </TableCell>
                </TableRow>
                <TableRow key={`${version.ID}-sites`}>
                  <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                    <Collapse in={open} unmountOnExit>
                      <Box sx={{ p: 2, pl: 5 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={headSx} align="right">
                                Venue
                              </TableCell>
                              <TableCell sx={headSx}>Date</TableCell>
                              <TableCell sx={headSx} align="right">
                                L
                              </TableCell>
                              <TableCell sx={headSx} align="right">
                                T
                              </TableCell>
                              <TableCell sx={headSx} align="right">
                                P
                              </TableCell>
                              <TableCell sx={headSx} align="center">
                                Perf
                              </TableCell>
                              <TableCell sx={headSx} align="center">
                                Tech
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {version.sites.map((site) => (
                              <TableRow key={site.ID}>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>
                                  {site.venue}
                                </TableCell>
                                <TableCell>{site.date ?? '—'}</TableCell>
                                <TableCell align="right">{site.live}</TableCell>
                                <TableCell align="right">{site.test}</TableCell>
                                <TableCell align="right">{site.planned}</TableCell>
                                <TableCell align="center">{site.perf_label ?? '—'}</TableCell>
                                <TableCell align="center">{site.tech_rating ?? '—'}</TableCell>
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
          <TableRow>
            <TableCell colSpan={3} sx={{ fontWeight: 800, color: 'info.main', fontSize: 18, fontFamily: 'serif' }} align="right">
              Σ
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 800 }}>
              {totals.live}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 800 }}>
              {totals.test}
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 800 }}>
              {totals.planned}
            </TableCell>
            <TableCell colSpan={2} />
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  )
}

export function AvailabilityChips({
  title,
  items,
}: {
  title: string
  items: MarketReportAvailability[]
}) {
  const { navigate } = useAppPath()

  return (
    <Box sx={{ mb: 1.5, ...execHiddenSx }}>
      <Typography sx={{ mb: 0.75, fontWeight: 700 }}>{title}</Typography>
      {items.length === 0 ? (
        <Typography color="text.secondary">—</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {items.map((item) => (
            <Box
              key={item.ID}
              component="button"
              type="button"
              onClick={() => navigate(`${tableBrowsePath('availabilities')}?id=${item.ID}`)}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'common.white',
                px: 1,
                py: 0.4,
                cursor: 'pointer',
                font: 'inherit',
                fontSize: 13,
                '&:hover': { borderColor: 'info.main' },
              }}
            >
              {item.label}
              {item.priority === '‼️ high' ? ' ‼️' : item.priority === '⬇️ low' ? ' ⬇️' : ''}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

const headSx = { fontWeight: 800, bgcolor: 'grey.50', whiteSpace: 'nowrap' } as const

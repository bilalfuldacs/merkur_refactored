import { useMemo, useState } from 'react'
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined'
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { InstallationJurisdiction } from '@/api'
import { AppTextField } from '@/components/ui'
import { UserAvatar } from '@/components/user'
import { tableBrowsePath } from '@/config/tablePages'
import { useAppPath } from '@/routing'
import { PERF_SLICES } from './chartConfig'

type StatusFilter = 'all' | 'live' | 'test' | 'planned'

const headerSx = {
  bgcolor: 'grey.50',
  fontWeight: 800,
  whiteSpace: 'nowrap',
} as const

export function JurisdictionTable({
  rows,
  decolorize = false,
}: {
  rows: InstallationJurisdiction[]
  decolorize?: boolean
}) {
  const { navigate } = useAppPath()
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (filter === 'live' && row.live <= 0) {
        return false
      }
      if (filter === 'test' && row.test <= 0) {
        return false
      }
      if (filter === 'planned' && row.planned <= 0) {
        return false
      }
      if (needle === '') {
        return true
      }
      return [row.name, row.name_english, row.iso3166, row.short_name, row.segment_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [filter, query, rows])

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, p: 2 }}>
        <Box sx={{ flex: 1, minWidth: 180 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Installed by jurisdiction</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
            {visible.length} {visible.length === 1 ? 'jurisdiction' : 'jurisdictions'} shown
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filter}
          onChange={(_event, value: StatusFilter | null) => {
            if (value) {
              setFilter(value)
            }
          }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="live">Live</ToggleButton>
          <ToggleButton value="test">Test</ToggleButton>
          <ToggleButton value="planned">Planned</ToggleButton>
        </ToggleButtonGroup>
        <AppTextField
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Country, market or code"
          aria-label="Search jurisdictions"
          startIcon={<SearchIcon />}
          sx={{ width: { xs: '100%', sm: 240 } }}
        />
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...headerSx, width: 48 }} />
              <TableCell sx={headerSx}>Jurisdiction</TableCell>
              <TableCell sx={headerSx}>First installed</TableCell>
              <TableCell sx={{ ...headerSx, textAlign: 'right' }}>Live</TableCell>
              <TableCell sx={{ ...headerSx, textAlign: 'right' }}>Test</TableCell>
              <TableCell sx={{ ...headerSx, textAlign: 'right' }}>Planned</TableCell>
              <TableCell sx={{ ...headerSx, textAlign: 'center' }}>Performance</TableCell>
              <TableCell sx={{ ...headerSx, textAlign: 'center' }}>Technical</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    No jurisdictions match this view.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => {
                const open = openId === row.ID
                return (
                  <JurisdictionRows
                    key={row.ID}
                    row={row}
                    open={open}
                    decolorize={decolorize}
                    onToggle={() => setOpenId(open ? null : row.ID)}
                    onOpenSite={(id) => navigate(`${tableBrowsePath('installations')}?id=${id}`)}
                  />
                )
              })
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  )
}

function JurisdictionRows({
  row,
  open,
  decolorize,
  onToggle,
  onOpenSite,
}: {
  row: InstallationJurisdiction
  open: boolean
  decolorize: boolean
  onToggle: () => void
  onOpenSite: (id: number) => void
}) {
  return (
    <>
      <TableRow hover sx={{ '& td': { borderBottom: open ? 0 : undefined } }}>
        <TableCell>
          <IconButton size="small" aria-label={open ? 'Hide venues' : 'Show venues'} onClick={onToggle}>
            {open ? <KeyboardArrowUpOutlinedIcon /> : <KeyboardArrowDownOutlinedIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex' }}>
              {row.people.slice(0, 4).map((person) => (
                <Box key={person.ID} sx={{ mr: '-6px' }}>
                  <UserAvatar user={person} decolorize={decolorize} />
                </Box>
              ))}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800 }}>
                {row.flag ? `${row.flag} ` : ''}
                {row.name}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                {[row.iso3166, row.segment_name].filter(Boolean).join(' · ')}
              </Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell>{formatDate(row.first_installed)}</TableCell>
        <TableCell align="right" sx={{ fontWeight: 800 }}>
          {row.live}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 800 }}>
          {row.test}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 800 }}>
          {row.planned}
        </TableCell>
        <TableCell align="center">
          <PerfBadge value={row.performance} />
        </TableCell>
        <TableCell align="center">
          <TechCell red={row.tech.red} yellow={row.tech.yellow} green={row.tech.green} reports={row.tech.reports} />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={8} sx={{ py: 0, borderBottom: open ? undefined : 0 }}>
          <Collapse in={open} unmountOnExit>
            <Box sx={{ px: 2, pb: 2, pl: { md: 8 } }}>
              {row.sites.map((site) => (
                <Box
                  key={site.ID}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.4fr) 90px 70px 70px 70px 90px 90px' },
                    gap: 1,
                    alignItems: 'center',
                    py: 1,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => onOpenSite(site.ID)}
                      sx={{
                        border: 0,
                        p: 0,
                        bgcolor: 'transparent',
                        color: 'info.main',
                        font: 'inherit',
                        fontWeight: 800,
                        cursor: 'pointer',
                        textAlign: 'left',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {site.venue}
                    </Box>
                    <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
                      {[site.first_install_type, site.rtp ? `RTP ${site.rtp}` : null, site.comment]
                        .filter(Boolean)
                        .join(' · ') || 'No extra notes'}
                    </Typography>
                  </Box>
                  <Typography color="text.secondary">{formatDate(site.date)}</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{site.live} live</Typography>
                  <Typography>{site.test} test</Typography>
                  <Typography>{site.planned} planned</Typography>
                  <PerfBadge value={site.perf_label} />
                  <TechDot rating={site.tech_rating} />
                </Box>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

function PerfBadge({ value }: { value: string | null }) {
  if (!value) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
        No data
      </Typography>
    )
  }
  if (value === 'mixed') {
    return <Chip size="small" label="Mixed" />
  }
  const slice = PERF_SLICES.find((item) => item.label === value)
  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        mx: 'auto',
        borderRadius: '50%',
        bgcolor: slice?.color ?? 'merkur.cyan',
        color: value === 'B' || value === 'C' ? '#022052' : '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {value}
    </Box>
  )
}

function TechCell({
  red,
  yellow,
  green,
  reports,
}: {
  red: number
  yellow: number
  green: number
  reports: number
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
      <TechDot rating="red" dim={red === 0} />
      <TechDot rating="yellow" dim={yellow === 0} />
      <TechDot rating="green" dim={green === 0} />
      <Typography color="text.secondary" sx={{ fontSize: 12 }}>
        {reports} {reports === 1 ? 'report' : 'reports'}
      </Typography>
    </Box>
  )
}

function TechDot({ rating, dim = false }: { rating: 'red' | 'yellow' | 'green' | null; dim?: boolean }) {
  const color = rating === 'red' ? '#EB0000' : rating === 'yellow' ? '#FFCC00' : rating === 'green' ? '#A2C617' : 'grey.300'
  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        bgcolor: color,
        opacity: dim || !rating ? 0.25 : 1,
        display: 'inline-block',
      }}
    />
  )
}

function formatDate(value: string | null): string {
  if (!value) {
    return 'Not recorded'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined'
import CropSquareOutlinedIcon from '@mui/icons-material/CropSquareOutlined'
import EuroOutlinedIcon from '@mui/icons-material/EuroOutlined'
import FunctionsOutlinedIcon from '@mui/icons-material/FunctionsOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import PieChartOutlinedIcon from '@mui/icons-material/PieChartOutlined'
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import StarOutlinedIcon from '@mui/icons-material/StarOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { getMarketReport, isLandbasedMarket, isOnlineMarket } from '@/api'
import type { MarketReportLandbased, MarketReportPayload } from '@/api'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import {
  AvailabilityChips,
  InstallationVersions,
  MarketActionButton,
  MatrixTable,
  PropertyTable,
  ReportSection,
  SharePie,
  emptyLabel,
  execHiddenSx,
} from '@/components/marketReport'
import { TableRecordAssets } from '@/components/tableView'
import { UserAvatar } from '@/components/user'
import { tableBrowsePath } from '@/config/tablePages'
import { APP_PATHS, marketReportPath, useAppPath } from '@/routing'

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

const tocItemSx = {
  px: 1.5,
  py: 1,
  color: 'info.main',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
  display: 'block',
  '&:hover': { bgcolor: 'grey.50' },
} as const

type TocItem = { id: string; title: string; exec: boolean }

function jurisdictionIdFromSearch(search: string): number | null {
  const raw = Number(new URLSearchParams(search).get('j'))
  return Number.isInteger(raw) && raw > 0 ? raw : null
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—'
  }
  return value.toLocaleString('en-US')
}

function signedPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—'
  }
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value}%`
}

export default function MarketReportPage() {
  const { navigate, search } = useAppPath()
  const { user } = useAuth()
  const [payload, setPayload] = useState<MarketReportPayload | null>(null)
  const [failed, setFailed] = useState(false)
  const [execSummary, setExecSummary] = useState(false)
  const jurisdictionId = useMemo(() => jurisdictionIdFromSearch(search), [search])
  const decolorize = Boolean(user?.decolorize_avatars)

  useEffect(() => {
    if (jurisdictionId === null) {
      setFailed(true)
      return
    }
    let cancelled = false
    void getMarketReport(jurisdictionId)
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
  }, [jurisdictionId])

  useEffect(() => {
    const title = payload
      ? `#${payload.jurisdiction.id} ${payload.jurisdiction.flag ?? ''} ${payload.jurisdiction.name_english ?? ''} (Market)`
      : 'Market Report'
    document.title = `${title} | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [payload])

  useEffect(() => {
    if (!payload) {
      return
    }
    const hash = window.location.hash.replace('#', '')
    if (!hash) {
      return
    }
    window.requestAnimationFrame(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [payload])

  if (failed && payload === null) {
    return (
      <PageBackground>
        <AppHeader variant="brand" />
        <Box component="main" sx={{ flex: 1, px: 3, py: 4 }}>
          <Typography color="text.secondary">This market report could not be loaded.</Typography>
        </Box>
        <AppFooter />
      </PageBackground>
    )
  }

  if (payload === null) {
    return null
  }

  const { jurisdiction, market } = payload
  const english = jurisdiction.name_english || `Market #${jurisdiction.id}`
  const landbased = isLandbasedMarket(market) ? market : null
  const online = isOnlineMarket(market) ? market : null
  const marketId = market?.id ?? null
  const toc = tableOfContents(Boolean(marketId), Boolean(landbased))

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box className={execSummary ? 'exec-summary' : undefined} sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.peopleMarkets)} sx={crumbSx}>
              People & Markets
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">
              {jurisdiction.flag} {english}
            </Box>
          </Box>

          <Typography
            component="h1"
            sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, fontWeight: 800, fontSize: { xs: 32, md: 48 }, lineHeight: 1.1, mb: 0.5 }}
          >
            <Box component="span">
              {jurisdiction.flag} {english}
            </Box>
            <Chip
              label={jurisdiction.segment === 'online' ? 'Online' : 'Land-Based'}
              sx={{
                fontWeight: 800,
                color: '#fff',
                bgcolor: jurisdiction.segment === 'online' ? 'merkur.pink' : 'merkur.green',
              }}
            />
            {jurisdiction.cluster === 'focal' ? <StarOutlinedIcon sx={{ color: 'warning.main' }} /> : null}
          </Typography>
          {jurisdiction.name && jurisdiction.name !== english ? (
            <Typography sx={{ color: 'text.secondary', fontSize: 22, mb: 2 }}>{jurisdiction.name}</Typography>
          ) : (
            <Box sx={{ mb: 2 }} />
          )}

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 280px' },
              gap: 3,
              mb: 2,
            }}
          >
            <Box>
              <Typography component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: 22, mt: 2, mb: 1.5 }}>
                <GroupsOutlinedIcon sx={{ color: 'info.main' }} />
                Stakeholders
              </Typography>
              <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'common.white', mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, bgcolor: 'grey.50', width: '25%' }}>Person</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: 'grey.50', width: '50%' }}>Job Title</TableCell>
                      <TableCell sx={{ fontWeight: 800, bgcolor: 'grey.50', width: '25%' }}>MERKURflow Role</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payload.stakeholders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography color="text.secondary">No stakeholders are assigned.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      payload.stakeholders.map((person) => (
                        <TableRow key={person.ID}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <UserAvatar user={person} size="sm" decolorize={decolorize} />
                              {[person.firstname, person.lastname].filter(Boolean).join(' ') || person.initials}
                            </Box>
                          </TableCell>
                          <TableCell>{person.jobtitle || '—'}</TableCell>
                          <TableCell>{person.role || '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>

              <Typography component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: 22, mb: 1.5 }}>
                <CalendarMonthOutlinedIcon sx={{ color: 'info.main' }} />
                Last Modification
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(5, 1fr)' }, gap: 2, textAlign: 'center', mb: 2 }}>
                <ModCard icon={<HubOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 36 }} />} label="This report" value={payload.generated_at} italic />
                <ModCard icon={<TrendingUpOutlinedIcon sx={{ color: '#b2b2b2', fontSize: 36 }} />} label="Market" change={payload.last_modified.market} locked={!payload.access.allowed} />
                <ModCard icon={<AccountBalanceOutlinedIcon sx={{ color: '#b2b2b2', fontSize: 36 }} />} label="Jurisdiction" change={payload.last_modified.jurisdiction} />
                <ModCard icon={<RocketLaunchOutlinedIcon sx={{ color: '#898b8e', fontSize: 36 }} />} label="Installations" change={payload.last_modified.installations} execHidden />
                <ModCard icon={<ChecklistOutlinedIcon sx={{ color: '#898b8e', fontSize: 36 }} />} label="Availabilities" change={payload.last_modified.availabilities} execHidden />
              </Box>

              {marketId ? (
                <>
                  <Typography sx={{ mb: 1.5 }}>
                    For details about <Box component="strong">reporting periods</Box>, see section headings below.
                  </Typography>
                  {payload.access.reason ? (
                    <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 1.5, ...execHiddenSx }}>
                      We show <Chip size="small" label="TLP:RED" sx={{ bgcolor: '#EB0000', color: '#fff', fontWeight: 800, height: 22, mx: 0.5 }} /> sections
                      because {payload.access.reason}.
                    </Alert>
                  ) : null}
                  {payload.can_edit && market ? (
                    <MarketActionButton
                      appearance="outline"
                      startIcon={<TrendingUpOutlinedIcon />}
                      onClick={() => navigate(`${tableBrowsePath(market.table)}?id=${marketId}`)}
                      sx={{ mb: 1, ...execHiddenSx }}
                    >
                      Edit Market
                    </MarketActionButton>
                  ) : null}
                </>
              ) : payload.access.allowed ? (
                <>
                  <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 1.5 }}>
                    You can add data to this <Chip size="small" label="TLP:RED" sx={{ bgcolor: '#EB0000', color: '#fff', fontWeight: 800, height: 22, mx: 0.5 }} /> section
                    because {payload.access.reason}.
                  </Alert>
                  {payload.can_edit ? (
                    <MarketActionButton
                      appearance="filled"
                      startIcon={<TrendingUpOutlinedIcon />}
                      onClick={() => navigate(tableBrowsePath(jurisdiction.segment === 'online' ? 'markets_online' : 'markets_landbased'))}
                      sx={{ mb: 1 }}
                    >
                      Create
                    </MarketActionButton>
                  ) : null}
                </>
              ) : null}

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, ...execHiddenSx }}>
                <MarketActionButton
                  appearance="outline"
                  startIcon={<AccountBalanceOutlinedIcon />}
                  onClick={() => navigate(`${tableBrowsePath('jurisdictions')}?id=${jurisdiction.id}`)}
                >
                  Jurisdiction
                </MarketActionButton>
              </Box>
            </Box>

            {marketId ? (
              <Box>
                <Typography component="h2" sx={{ fontWeight: 800, fontSize: 22, mt: 2, mb: 1.5 }}>
                  On this page
                </Typography>
                <FormControlLabel
                  sx={{ mb: 1 }}
                  control={<Switch size="small" checked={execSummary} onChange={(event) => setExecSummary(event.target.checked)} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'info.main', fontWeight: 800 }}>
                      <BoltOutlinedIcon sx={{ fontSize: 18 }} />
                      Executive Summary
                    </Box>
                  }
                />
                <Box component="ol" sx={{ m: 0, pl: 0, listStyle: 'none', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', bgcolor: 'common.white', counterReset: 'toc' }}>
                  {toc.map((item) => (
                    <Box
                      key={item.id}
                      component="li"
                      sx={{
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        counterIncrement: 'toc',
                        '&:last-child': { borderBottom: 0 },
                        ...(!item.exec ? execHiddenSx : null),
                      }}
                    >
                      <Box
                        component="a"
                        href={`#${item.id}`}
                        onClick={(event) => {
                          event.preventDefault()
                          document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          window.history.replaceState(null, '', `${marketReportPath(jurisdiction.id)}#${item.id}`)
                        }}
                        sx={{
                          ...tocItemSx,
                          '&::before': { content: 'counter(toc, upper-roman) ". "', fontWeight: 800 },
                        }}
                      >
                        {item.title}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : null}
          </Box>

          <Box sx={{ counterReset: 'report' }}>
            {landbased ? (
              <LandbasedReport market={landbased} customers={payload.key_customers} currency={currencyLine(jurisdiction)} authority={authorityLine(jurisdiction)} />
            ) : null}
            {online ? (
              <>
                {online.groups.map((group, index) => (
                  <ReportSection key={group.title} id={`s${index + 1}`} icon={<TrendingUpOutlinedIcon sx={{ color: '#b2b2b2' }} />} title={group.title} cadence="as needed">
                    <PropertyTable rows={group.rows} execOnly={execSummary} />
                  </ReportSection>
                ))}
                <ReportSection id={`s${online.groups.length + 1}`} icon={<HubOutlinedIcon sx={{ color: 'merkur.pink' }} />} title="Notes" cadence="as needed" exec={false}>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{emptyLabel(online.notes)}</Typography>
                </ReportSection>
              </>
            ) : null}

            {marketId && market ? (
              <ReportSection id="attachments" icon={<AttachFileOutlinedIcon sx={{ color: 'merkur.pink' }} />} title="Attachments" cadence="as needed" exec={false}>
                <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white', overflow: 'hidden' }}>
                  <TableRecordAssets table={market.table} recordId={marketId} decolorize={decolorize} />
                </Box>
              </ReportSection>
            ) : null}

            <ReportSection id="i" icon={<RocketLaunchOutlinedIcon sx={{ color: '#898b8e' }} />} title="Installations & Availabilities" cadence="continuously" exec={false}>
              <InstallationVersions versions={payload.installations.versions} totals={payload.installations.totals} />
              <AvailabilityChips title="Versions ready to be rolled out:" items={payload.availabilities.available} />
              <AvailabilityChips title="Versions in R&D, QA, certification, or local homologation, so they cannot yet be used:" items={payload.availabilities.intent} />
              <AvailabilityChips title="Versions not suitable due to market or legal reasons:" items={payload.availabilities.no_intent} />
            </ReportSection>
          </Box>
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

function LandbasedReport({
  market,
  customers,
  currency,
  authority,
}: {
  market: MarketReportLandbased
  customers: MarketReportPayload['key_customers']
  currency: string
  authority: ReactNode
}) {
  const kpis = market.kpis

  return (
    <>
      <ReportSection id="s1" icon={<TrendingUpOutlinedIcon sx={{ color: '#b2b2b2' }} />} title="Basic Market Information" cadence="annually">
        <Box sx={execHiddenSx}>
          <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'common.white', mb: 2 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ width: '25%', fontWeight: 700, bgcolor: 'grey.50' }}>Currency</TableCell>
                  <TableCell>{currency}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.50' }}>Authority</TableCell>
                  <TableCell>{authority}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, textAlign: 'center' }}>
          <Box>
            <KpiCard title="Total # of EGMs" value={formatNumber(kpis.total_egms)} />
            <KpiCard title="Total # of Venues" value={formatNumber(kpis.total_venues)} />
            <KpiCard title="Total Market Revenue" value={kpis.total_market_revenue === null ? '—' : `${formatNumber(kpis.total_market_revenue)} MEUR`} />
          </Box>
          <Box>
            <KpiCard title="# of MERKUR EGMs" value={formatNumber(kpis.merkur_egms)} accent highlight>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>MERKUR Floor Share</Typography>
              {kpis.floor_share !== null ? (
                <>
                  <SharePie
                    size={120}
                    legend={false}
                    slices={[
                      { value: kpis.floor_share, color: '#ffcc00', label: 'MERKUR' },
                      { value: Math.max(0, 100 - kpis.floor_share), color: '#898B8E', label: 'others' },
                    ]}
                  />
                  <Typography sx={{ color: '#ffcc00', fontWeight: 800, fontSize: 32 }}>{kpis.floor_share}%</Typography>
                </>
              ) : (
                <Typography color="text.secondary">undefined</Typography>
              )}
            </KpiCard>
            <KpiCard title="Install Base Share Growth" value={signedPercent(kpis.share_growth)} accent highlight subtitle="MERKUR YoY" />
          </Box>
          <Box>
            <KpiCard title="Target Win Rate" value={kpis.target_win_rate === null ? '—' : `${kpis.target_win_rate}%`} accent highlight subtitle="MERKUR">
              {kpis.target_win_rate !== null ? (
                <SharePie
                  size={120}
                  legend={false}
                  slices={[
                    { value: kpis.target_win_rate, color: '#ffcc00', label: 'MERKUR' },
                    { value: Math.max(0, 100 - kpis.target_win_rate), color: '#898B8E', label: 'others' },
                  ]}
                />
              ) : null}
            </KpiCard>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white', p: 2, mb: 2 }}>
              <MetricLine label="ASP per Machine" value={emptyLabel(kpis.asp_per_machine)} />
              <MetricLine label="Replacement Rate" value={kpis.replacement_rate ? `${kpis.replacement_rate}%` : '—'} />
              <MetricLine label="Openness to Switch" value={kpis.openness_to_switch ? `${kpis.openness_to_switch}%` : '—'} />
            </Box>
          </Box>
        </Box>
      </ReportSection>

      <ReportSection id="s2" icon={<HubOutlinedIcon sx={{ color: '#b2b2b2' }} />} title="Key Customers" cadence="continuously" exec={false}>
        <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'common.white' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'grey.50', width: '25%' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'grey.50', width: '25%' }}># Machines</TableCell>
                <TableCell sx={{ fontWeight: 800, bgcolor: 'grey.50', width: '50%' }}>Share of Suppliers</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    Key Customers can be assigned in Partner Activities.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      {customer.website ? (
                        <Box component="a" href={customer.website} target="_blank" rel="noreferrer" sx={{ color: 'info.main' }}>
                          {customer.name}
                        </Box>
                      ) : (
                        customer.name || '—'
                      )}
                    </TableCell>
                    <TableCell>{emptyLabel(customer.total_machines)}</TableCell>
                    <TableCell>{emptyLabel(customer.share_of_mfrs)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </ReportSection>

      <ReportSection id="s3" icon={<PieChartOutlinedIcon sx={{ color: '#b2b2b2' }} />} title="Top Competitors × Market Share" cadence="annually">
        {market.competitors.slices.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            <SharePie size={280} slices={market.competitors.slices} />
          </Box>
        ) : null}
        <MatrixTable matrix={market.competitors.matrix} />
      </ReportSection>

      <ReportSection id="s4" icon={<TableChartOutlinedIcon sx={{ color: '#b2b2b2' }} />} title="SWOT Competitors" cadence="annually">
        <MatrixTable matrix={market.swot} />
      </ReportSection>

      <ReportSection id="s5" icon={<CasinoOutlinedIcon sx={{ color: '#ffcc00' }} />} title="Top Games × Performance Index" cadence="quarterly" exec={false}>
        <MatrixTable matrix={market.top_games} />
        {market.top_games_comment ? <Typography sx={{ whiteSpace: 'pre-wrap' }}>{market.top_games_comment}</Typography> : null}
      </ReportSection>

      <ReportSection id="s6" icon={<HubOutlinedIcon sx={{ color: '#ffcc00' }} />} title="Analysis by Game Type" cadence="quarterly/semi-annually" exec={false}>
        <MatrixTable matrix={market.game_types} />
        {market.game_types_comment ? <Typography sx={{ whiteSpace: 'pre-wrap' }}>{market.game_types_comment}</Typography> : null}
      </ReportSection>

      <ReportSection id="s7" icon={<FunctionsOutlinedIcon sx={{ color: '#ffcc00' }} />} title="Game Mechanics & Mathematics" cadence="semi-annually">
        <PropertyTable rows={market.mechanics} />
      </ReportSection>

      <ReportSection id="s8" icon={<CropSquareOutlinedIcon sx={{ color: '#a2c617' }} />} title="Top Cabinets × Performance" cadence="quarterly/semi-annually" exec={false}>
        <MatrixTable matrix={market.top_cabinets} />
      </ReportSection>

      <ReportSection id="s9" icon={<EuroOutlinedIcon sx={{ color: '#b2b2b2' }} />} title="Commercial Model" cadence="semi-annually">
        <PropertyTable rows={market.commercial} />
      </ReportSection>

      <ReportSection id="s10" icon={<SpeedOutlinedIcon sx={{ color: '#b2b2b2' }} />} title="Key Performance Metrics" cadence="quarterly">
        <MatrixTable matrix={market.key_perf_metrics} />
        {market.key_perf_metrics_comment ? <Typography sx={{ whiteSpace: 'pre-wrap' }}>{market.key_perf_metrics_comment}</Typography> : null}
      </ReportSection>

      <ReportSection id="s11" icon={<GroupsOutlinedIcon sx={{ color: '#b2b2b2' }} />} title="Player Segmentation" cadence="annually">
        <PropertyTable rows={market.players} />
      </ReportSection>

      <ReportSection id="s12" icon={<QueryStatsOutlinedIcon sx={{ color: '#b2b2b2' }} />} title="Key Local Insights" cadence="semi-annually">
        <PropertyTable rows={market.insights} />
      </ReportSection>

      <ReportSection id="s13" icon={<AccountBalanceOutlinedIcon sx={{ color: 'merkur.pink' }} />} title="Regulatory Landscape" cadence="semi-annually" exec={false}>
        <PropertyTable rows={market.regulatory} />
      </ReportSection>

      <ReportSection id="s14" icon={<StarOutlinedIcon sx={{ color: 'merkur.pink' }} />} title="Strategic Recommendations" cadence="semi-annually">
        <PropertyTable rows={market.recommendations} />
      </ReportSection>

      <ReportSection id="s15" icon={<HubOutlinedIcon sx={{ color: 'merkur.pink' }} />} title="Notes" cadence="as needed" exec={false}>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{emptyLabel(market.notes)}</Typography>
      </ReportSection>
    </>
  )
}

function tableOfContents(hasMarket: boolean, landbased: boolean): TocItem[] {
  if (!hasMarket) {
    return [{ id: 'i', title: 'Installations & Availabilities', exec: false }]
  }
  if (landbased) {
    return [
      { id: 's1', title: 'Basic Market Information', exec: true },
      { id: 's2', title: 'Key Customers', exec: false },
      { id: 's3', title: 'Top Competitors × Market Share', exec: true },
      { id: 's4', title: 'SWOT Competitors', exec: true },
      { id: 's5', title: 'Top Games × Performance Index', exec: false },
      { id: 's6', title: 'Analysis by Game Type', exec: false },
      { id: 's7', title: 'Game Mechanics & Mathematics', exec: true },
      { id: 's8', title: 'Top Cabinets × Performance', exec: false },
      { id: 's9', title: 'Commercial Model', exec: true },
      { id: 's10', title: 'Key Performance Metrics', exec: true },
      { id: 's11', title: 'Player Segmentation', exec: true },
      { id: 's12', title: 'Key Local Insights', exec: true },
      { id: 's13', title: 'Regulatory Landscape', exec: false },
      { id: 's14', title: 'Strategic Recommendations', exec: true },
      { id: 's15', title: 'Notes', exec: false },
      { id: 'attachments', title: 'Attachments', exec: false },
      { id: 'i', title: 'Installations & Availabilities', exec: false },
    ]
  }
  return [
    { id: 's1', title: 'Market', exec: true },
    { id: 's2', title: 'Games & themes', exec: true },
    { id: 's3', title: 'Devices', exec: true },
    { id: 's4', title: 'Players', exec: true },
    { id: 's5', title: 'Performance', exec: true },
    { id: 's6', title: 'Games', exec: true },
    { id: 's7', title: 'Notes', exec: false },
    { id: 'attachments', title: 'Attachments', exec: false },
    { id: 'i', title: 'Installations & Availabilities', exec: false },
  ]
}

function currencyLine(jurisdiction: MarketReportPayload['jurisdiction']): string {
  const name = jurisdiction.currency_name_english
  const code = jurisdiction.iso4217
  if (name && code) {
    return `${name} (${code})`
  }
  return name || code || '—'
}

function authorityLine(jurisdiction: MarketReportPayload['jurisdiction']) {
  const authority = jurisdiction.authority
  if (!authority?.name) {
    return '—'
  }
  if (authority.website) {
    return (
      <Box component="a" href={authority.website} target="_blank" rel="noreferrer" sx={{ color: 'info.main' }}>
        {authority.name}
      </Box>
    )
  }
  return authority.name
}

function KpiCard({
  title,
  value,
  subtitle,
  accent = false,
  highlight = false,
  children,
}: {
  title: string
  value: string
  subtitle?: string
  accent?: boolean
  highlight?: boolean
  children?: ReactNode
}) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: accent ? 'secondary.main' : 'divider',
        borderRadius: 2,
        bgcolor: 'common.white',
        mb: 2,
        overflow: 'hidden',
        transition: 'transform .2s',
        '&:hover': { transform: 'scale(1.03) translateY(-4px)' },
      }}
    >
      <Box sx={{ py: 1.25, px: 1, bgcolor: highlight ? 'secondary.main' : 'grey.50', color: highlight ? 'common.white' : 'text.primary' }}>
        <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        {subtitle ? <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{subtitle}</Typography> : null}
        <Typography sx={{ fontSize: 36, fontWeight: 800, color: accent ? '#ffcc00' : 'text.primary', lineHeight: 1.1 }}>{value}</Typography>
        {children}
      </Box>
    </Box>
  )
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ mb: 1.25 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{label}</Typography>
      <Typography sx={{ fontSize: value.length <= 10 ? 28 : 18, fontWeight: 700 }}>{value}</Typography>
    </Box>
  )
}

function ModCard({
  icon,
  label,
  value,
  change,
  italic = false,
  locked = false,
  execHidden = false,
}: {
  icon: ReactNode
  label: string
  value?: string | null
  change?: MarketReportPayload['last_modified']['market']
  italic?: boolean
  locked?: boolean
  execHidden?: boolean
}) {
  const shown = locked ? '(no access)' : (change?.at ?? value ?? '(never)')
  const who = locked ? '' : (change?.by ?? null)
  return (
    <Box sx={{ mb: 2, ...(execHidden ? execHiddenSx : null) }}>
      <Box sx={{ mb: 1 }}>{icon}</Box>
      <Typography sx={{ fontWeight: italic ? 400 : 800, fontStyle: italic ? 'italic' : 'normal' }}>{label}</Typography>
      <Typography>
        {italic ? 'generated on' : 'last modified on'}{' '}
        <Box component="span" sx={{ fontWeight: italic ? 400 : 800, fontStyle: italic || locked ? 'italic' : 'normal' }}>
          {shown}
        </Box>
      </Typography>
      {who ? <Typography>{who}</Typography> : null}
    </Box>
  )
}

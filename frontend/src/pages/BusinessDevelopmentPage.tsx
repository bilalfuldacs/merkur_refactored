import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, FormEvent } from 'react'
import AddIcon from '@mui/icons-material/Add'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import {
  createBdMarket,
  createBdSegment,
  getBusinessDevelopment,
  updateBdMarket,
  updateBdSegment,
} from '@/api/businessDevelopment'
import type {
  BdJurisdiction,
  BdMarket,
  BdPayload,
  BdPresenceCode,
  BdStatusCode,
} from '@/api/businessDevelopment'
import { AppFooter, AppHeader, CrumbHome, PageBackground } from '@/components/layout'
import { useI18n } from '@/i18n'
import { APP_PATHS, marketReportPath, useAppPath } from '@/routing'
import { merkurColors } from '@/theme/palette'

type BdView = 'overview' | 'markets' | 'segments' | 'definitions'

type GeoFeature = {
  type: string
  properties: { name: string }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

type GeoCollection = {
  type: string
  features: GeoFeature[]
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

const notes: Record<BdView, string> = {
  overview: 'Where MERKUR already sells, where a licence is possible, and where entry is out of scope.',
  markets: 'Every country in the portfolio, with the place types linked to it.',
  segments: 'A place type shows up in a region when at least one market there is linked to it.',
  definitions: 'The four statuses use the same meaning on the map, in the table, and in the segment view.',
}

function project(point: number[]): [number, number] {
  return [((point[0] + 180) / 360) * 1000, ((90 - point[1]) / 180) * 500]
}

function ring(points: number[][]): string {
  return (
    points
      .map((point, index) => {
        const [x, y] = project(point)
        return `${index ? 'L' : 'M'}${x},${y}`
      })
      .join('') + 'Z'
  )
}

function geometryPath(geometry: GeoFeature['geometry']): string {
  if (geometry.type === 'Polygon') {
    return (geometry.coordinates as number[][][]).map(ring).join('')
  }
  return (geometry.coordinates as number[][][][]).flatMap((polygon) => polygon.map(ring)).join('')
}

function presenceColor(code: BdPresenceCode): string {
  switch (code) {
    case 'present':
      return merkurColors.cyan
    case 'limited':
      return merkurColors.yellow
    case 'planned':
      return merkurColors.orange
    default:
      return merkurColors.gray
  }
}

function TipSection({ title, items, limit }: { title: string; items: string[]; limit?: number }) {
  const shown = typeof limit === 'number' ? items.slice(0, limit) : items
  const extra = items.length - shown.length
  return (
    <Box sx={{ mt: 0.75 }}>
      <Box
        sx={{
          fontSize: 10.5,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          opacity: 0.75,
          fontWeight: 700,
        }}
      >
        {title}
      </Box>
      {shown.length === 0 ? (
        <Box sx={{ mt: 0.2 }}>None</Box>
      ) : (
        <Box component="ul" sx={{ m: '0.15rem 0 0', pl: 2 }}>
          {shown.map((item) => (
            <Box component="li" key={item} sx={{ m: 0 }}>
              {item}
            </Box>
          ))}
          {extra > 0 ? (
            <Box component="li" sx={{ m: 0 }}>
              + {extra} more
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  )
}

type MarketFormState = {
  id?: number
  name: string
  status: BdStatusCode
  region_id: number
  segment_ids: number[]
  jurisdiction_ids: number[]
}

const emptyMarketForm = (payload: BdPayload | null): MarketFormState => ({
  name: '',
  status: 'open',
  region_id: payload?.regions[0]?.id ?? 0,
  segment_ids: [],
  jurisdiction_ids: [],
})

export default function BusinessDevelopmentPage() {
  const { t } = useI18n()
  const { navigate } = useAppPath()
  const [payload, setPayload] = useState<BdPayload | null>(null)
  const [geo, setGeo] = useState<GeoCollection | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<BdView>('overview')
  const [activeStatuses, setActiveStatuses] = useState<Set<BdStatusCode>>(new Set())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [segmentRegion, setSegmentRegion] = useState('')
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const drag = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const [marketForm, setMarketForm] = useState<MarketFormState | null>(null)
  const [segmentForm, setSegmentForm] = useState<{ id?: number; name: string } | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [tip, setTip] = useState<{ market: BdMarket | null; left: number; top: number } | null>(null)
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const tipRef = useRef<HTMLDivElement | null>(null)
  const mapFrameRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    document.title = `${t('pages.businessDevelopment', 'Business Development')} | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [t])

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      getBusinessDevelopment(),
      fetch(`${import.meta.env.BASE_URL}business-development-geo.json`).then((res) => {
        if (!res.ok) throw new Error('Could not load map data.')
        return res.json() as Promise<GeoCollection>
      }),
    ])
      .then(([bd, map]) => {
        if (cancelled) return
        setPayload(bd)
        setGeo(map)
        setActiveStatuses(new Set(bd.statuses.map((s) => s.code)))
        setSegmentRegion(bd.regionSegments[0]?.code ?? '')
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load Business Development.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const marketsByCountry = useMemo(() => {
    const map = new Map<string, BdMarket>()
    payload?.markets.forEach((market) => map.set(market.country, market))
    return map
  }, [payload])

  const jurisdictionsById = useMemo(() => {
    const map = new Map<number, BdJurisdiction>()
    payload?.jurisdictions.forEach((item) => map.set(item.id, item))
    return map
  }, [payload])

  const statusOf = useCallback(
    (code: string) => payload?.statuses.find((status) => status.code === code),
    [payload],
  )

  const marketFromGeo = useCallback(
    (name: string) => {
      if (!payload) return null
      return marketsByCountry.get(payload.aliases[name] || name) || null
    },
    [marketsByCountry, payload],
  )

  const filteredMarkets = useMemo(() => {
    if (!payload) return []
    const query = search.trim().toLowerCase()
    return payload.markets.filter((market) => {
      if (statusFilter && market.status !== statusFilter) return false
      if (regionFilter && market.region !== regionFilter) return false
      if (!query) return true
      return market.country.toLowerCase().includes(query) || market.regionName.toLowerCase().includes(query)
    })
  }, [payload, regionFilter, search, statusFilter])

  const selectedRegionSegments = useMemo(() => {
    if (!payload) return null
    return payload.regionSegments.find((row) => row.code === segmentRegion) ?? payload.regionSegments[0] ?? null
  }, [payload, segmentRegion])

  function toggleStatus(code: BdStatusCode) {
    if (!payload) return
    setActiveStatuses((prev) => {
      const next = new Set(prev)
      if (next.size === 1 && next.has(code)) {
        payload.statuses.forEach((status) => next.add(status.code))
      } else if (next.size === payload.statuses.length) {
        next.clear()
        next.add(code)
      } else if (next.has(code)) {
        next.delete(code)
        if (next.size === 0) payload.statuses.forEach((status) => next.add(status.code))
      } else {
        next.add(code)
      }
      return next
    })
  }

  function openMarket(market: BdMarket) {
    if (!payload?.mayEdit) {
      const first = market.jurisdictionIds[0]
      if (first) navigate(marketReportPath(first))
      return
    }
    setFormError(null)
    setMarketForm({
      id: market.id,
      name: market.country,
      status: market.status,
      region_id: market.regionId,
      segment_ids: market.segments.filter((s) => s.presence !== 'absent').map((s) => s.id),
      jurisdiction_ids: [...market.jurisdictionIds],
    })
  }

  function placeMapTip(event: ReactMouseEvent<SVGPathElement>, market: BdMarket | null) {
    const frame = mapFrameRef.current
    if (!frame) return
    const bounds = frame.getBoundingClientRect()
    let left = event.clientX - bounds.left + 14
    let top = event.clientY - bounds.top + 10
    const tipEl = tipRef.current
    const tipWidth = tipEl?.offsetWidth ?? 220
    const tipHeight = tipEl?.offsetHeight ?? 180
    if (left + tipWidth > bounds.width - 8) {
      left = Math.max(8, event.clientX - bounds.left - tipWidth - 14)
    }
    if (top + tipHeight > bounds.height - 8) {
      top = Math.max(8, event.clientY - bounds.top - tipHeight - 10)
    }
    setTip({ market, left, top })
  }

  function tipSections(market: BdMarket) {
    const byId = new Map(market.segments.map((segment) => [segment.id, segment]))
    const activeSegments: string[] = []
    const possibleSegments: string[] = []
    for (const option of payload?.segmentOptions ?? []) {
      const link = byId.get(option.id)
      if (link && link.presence !== 'absent') {
        activeSegments.push(`${option.name} · ${payload?.presence[link.presence] || link.presence}`)
      } else {
        possibleSegments.push(option.name)
      }
    }
    const jurisdictions = market.jurisdictionIds
      .map((id) => jurisdictionsById.get(id))
      .filter((item): item is BdJurisdiction => Boolean(item))
      .map((item) => `${item.flag ? `${item.flag} ` : ''}${item.name}`)
    return { activeSegments, possibleSegments, jurisdictions }
  }

  async function submitMarket(event: FormEvent) {
    event.preventDefault()
    if (!marketForm) return
    setSaving(true)
    setFormError(null)
    try {
      const result = marketForm.id
        ? await updateBdMarket({ ...marketForm, id: marketForm.id })
        : await createBdMarket(marketForm)
      setPayload(result.payload)
      setMarketForm(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save market.')
    } finally {
      setSaving(false)
    }
  }

  async function submitSegment(event: FormEvent) {
    event.preventDefault()
    if (!segmentForm) return
    setSaving(true)
    setFormError(null)
    try {
      const result = segmentForm.id
        ? await updateBdSegment({ id: segmentForm.id, name: segmentForm.name })
        : await createBdSegment({ name: segmentForm.name })
      setPayload(result.payload)
      setSegmentForm(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save segment.')
    } finally {
      setSaving(false)
    }
  }

  function onMapPointerDown(event: ReactMouseEvent<SVGSVGElement>) {
    drag.current = { x: event.clientX, y: event.clientY, tx, ty }
  }

  function onMapPointerMove(event: ReactMouseEvent<SVGSVGElement>) {
    if (!drag.current) return
    setTx(drag.current.tx + (event.clientX - drag.current.x))
    setTy(drag.current.ty + (event.clientY - drag.current.y))
  }

  function onMapPointerUp() {
    drag.current = null
  }

  if (error) {
    return (
      <PageBackground>
        <AppHeader variant="brand" />
        <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4 }, py: 3 }}>
          <Alert severity="warning">{error}</Alert>
        </Box>
        <AppFooter />
      </PageBackground>
    )
  }

  if (!payload || !geo) {
    return (
      <PageBackground>
        <AppHeader variant="brand" />
        <Box sx={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
        <AppFooter />
      </PageBackground>
    )
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, py: { xs: 2, md: 3 } }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label={t('common.breadcrumb', 'Breadcrumb')} sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              <CrumbHome />
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">{t('pages.businessDevelopment', 'Business Development')}</Box>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              mb: 3,
              borderRadius: 3,
              bgcolor: merkurColors.blue,
              color: '#fff',
              borderBottom: `5px solid ${merkurColors.pink}`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              alignItems: 'flex-end',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography sx={{ display: 'inline-block', bgcolor: merkurColors.yellow, color: merkurColors.blue, px: 1, py: 0.25, borderRadius: 1, fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', mb: 1 }}>
                Business Development
              </Typography>
              <Typography component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 28, md: 36 }, mb: 1 }}>
                <PublicOutlinedIcon sx={{ color: merkurColors.yellow, fontSize: 34 }} />
                {t('pages.globalOverview', 'Global overview')}
              </Typography>
              <Typography sx={{ opacity: 0.8 }}>{notes[view]}</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {payload.mayEdit ? (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setFormError(null)
                    setMarketForm(emptyMarketForm(payload))
                  }}
                  sx={{ bgcolor: merkurColors.yellow, color: merkurColors.blue, fontWeight: 800, '&:hover': { bgcolor: '#e6b800' } }}
                >
                  Add market
                </Button>
              ) : null}
              <ToggleButtonGroup
                exclusive
                size="small"
                value={view}
                onChange={(_e, next: BdView | null) => {
                  if (next) setView(next)
                }}
                sx={{ bgcolor: 'rgba(0,0,0,0.2)', p: 0.25, borderRadius: 1.5, '& .MuiToggleButton-root': { color: '#fff', border: 0, textTransform: 'none', fontWeight: 700 } }}
              >
                <ToggleButton value="overview">Overview</ToggleButton>
                <ToggleButton value="markets">Markets</ToggleButton>
                <ToggleButton value="segments">Segments</ToggleButton>
                <ToggleButton value="definitions">Definitions</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Paper>

          {view === 'overview' ? (
            <Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
                {payload.statuses.map((status) => {
                  const count = payload.markets.filter((market) => market.status === status.code).length
                  const on = activeStatuses.has(status.code)
                  return (
                    <Paper
                      key={status.code}
                      component="button"
                      type="button"
                      onClick={() => toggleStatus(status.code)}
                      elevation={0}
                      sx={{
                        textAlign: 'left',
                        border: `2px solid ${on ? status.color : 'transparent'}`,
                        borderLeft: `6px solid ${status.color}`,
                        opacity: on ? 1 : 0.45,
                        p: 2,
                        cursor: 'pointer',
                        bgcolor: '#fff',
                      }}
                    >
                      <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>{status.label}</Typography>
                      <Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1 }}>{count}</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: 13 }}>{status.summary}</Typography>
                    </Paper>
                  )
                })}
              </Box>

              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Global market map</Typography>
                    <Typography color="text.secondary" sx={{ fontSize: 13 }}>Hover a country for status and segments. Click a market to open it.</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => setScale((s) => Math.min(4, s * 1.2))}>+</Button>
                    <Button size="small" variant="outlined" onClick={() => setScale((s) => Math.max(0.6, s / 1.2))}>−</Button>
                    <Button size="small" variant="outlined" onClick={() => { setScale(1); setTx(0); setTy(0) }}>Reset</Button>
                  </Box>
                </Box>
                <Box ref={mapFrameRef} sx={{ position: 'relative', bgcolor: '#eef3f7', height: { xs: 320, md: 480 } }}>
                  <Box
                    component="svg"
                    viewBox="0 0 1000 500"
                    onMouseDown={onMapPointerDown}
                    onMouseMove={onMapPointerMove}
                    onMouseUp={onMapPointerUp}
                    onMouseLeave={onMapPointerUp}
                    sx={{ width: '100%', height: '100%', cursor: drag.current ? 'grabbing' : 'grab', userSelect: 'none' }}
                  >
                    <g transform={`translate(${500 + tx} ${250 + ty}) scale(${scale}) translate(-500 -250)`}>
                      {geo.features.map((feature) => {
                        const countryName = feature.properties.name
                        const market = marketFromGeo(countryName)
                        const dim = Boolean(market && !activeStatuses.has(market.status))
                        const fill = market ? statusOf(market.status)?.color ?? '#c5d0d8' : '#c5d0d8'
                        const hovered = hoveredCountry === countryName
                        return (
                          <path
                            key={countryName}
                            d={geometryPath(feature.geometry)}
                            fill={fill}
                            opacity={hovered ? 1 : dim ? 0.25 : 1}
                            stroke="#fff"
                            strokeWidth={0.7}
                            vectorEffect="non-scaling-stroke"
                            style={{
                              cursor: market ? 'pointer' : 'default',
                              filter: hovered ? 'brightness(1.12)' : undefined,
                            }}
                            onMouseEnter={() => setHoveredCountry(countryName)}
                            onMouseMove={(event) => placeMapTip(event, market)}
                            onMouseLeave={() => {
                              setHoveredCountry(null)
                              setTip(null)
                            }}
                            onClick={() => {
                              if (market) openMarket(market)
                            }}
                          />
                        )
                      })}
                      {hoveredCountry
                        ? (() => {
                            const feature = geo.features.find((item) => item.properties.name === hoveredCountry)
                            if (!feature) return null
                            const market = marketFromGeo(hoveredCountry)
                            const fill = market ? statusOf(market.status)?.color ?? '#c5d0d8' : '#c5d0d8'
                            return (
                              <path
                                d={geometryPath(feature.geometry)}
                                fill={fill}
                                stroke={merkurColors.yellow}
                                strokeWidth={2.8}
                                vectorEffect="non-scaling-stroke"
                                pointerEvents="none"
                                style={{ filter: 'brightness(1.12)' }}
                              />
                            )
                          })()
                        : null}
                    </g>
                  </Box>
                  {tip ? (
                    <Box
                      ref={tipRef}
                      sx={{
                        position: 'absolute',
                        left: tip.left,
                        top: tip.top,
                        pointerEvents: 'none',
                        bgcolor: merkurColors.blue,
                        color: '#fff',
                        px: 1.25,
                        py: 0.9,
                        borderRadius: 1,
                        fontSize: 12,
                        lineHeight: 1.35,
                        maxWidth: 272,
                        zIndex: 3,
                        boxShadow: '0 8px 24px rgba(2, 32, 82, 0.25)',
                      }}
                    >
                      {tip.market ? (
                        (() => {
                          const status = statusOf(tip.market.status)
                          const { activeSegments, possibleSegments, jurisdictions } = tipSections(tip.market)
                          return (
                            <>
                              <Box component="b" sx={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>
                                {tip.market.country}
                              </Box>
                              <Box sx={{ mt: 0.15 }}>
                                {status?.label ?? tip.market.status} · {tip.market.regionName}
                              </Box>
                              <TipSection title="Active segments" items={activeSegments} />
                              <TipSection title="Possible segments" items={possibleSegments} />
                              {jurisdictions.length > 0 ? (
                                <TipSection title="Jurisdictions" items={jurisdictions} limit={6} />
                              ) : null}
                            </>
                          )
                        })()
                      ) : (
                        <Box component="b" sx={{ display: 'block', fontSize: 13.5, fontWeight: 800 }}>
                          Not in the portfolio
                        </Box>
                      )}
                    </Box>
                  ) : null}
                </Box>
              </Paper>
            </Box>
          ) : null}

          {view === 'markets' ? (
            <Box>
              <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr 1fr auto' }, gap: 1.5, alignItems: 'end' }}>
                  <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Country or region" />
                  <TextField select size="small" label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {payload.statuses.map((status) => (
                      <MenuItem key={status.code} value={status.code}>{status.label}</MenuItem>
                    ))}
                  </TextField>
                  <TextField select size="small" label="Region" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
                    <MenuItem value="">All</MenuItem>
                    {payload.regions.map((region) => (
                      <MenuItem key={region.id} value={region.code}>{region.name}</MenuItem>
                    ))}
                  </TextField>
                  <Button variant="outlined" onClick={() => { setSearch(''); setStatusFilter(''); setRegionFilter('') }}>Reset</Button>
                </Box>
              </Paper>
              <Typography color="text.secondary" sx={{ mb: 1, fontSize: 13 }}>
                {filteredMarkets.length} {filteredMarkets.length === 1 ? 'market' : 'markets'}
              </Typography>
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Market</TableCell>
                      <TableCell>Market report</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell>Segments</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredMarkets.map((market) => {
                      const status = statusOf(market.status)
                      const reports = market.jurisdictionIds
                        .map((id) => jurisdictionsById.get(id))
                        .filter(Boolean) as BdJurisdiction[]
                      return (
                        <TableRow
                          key={market.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => openMarket(market)}
                        >
                          <TableCell sx={{ fontWeight: 700 }}>{market.country}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {reports.length === 0 ? (
                              <Typography color="text.secondary" sx={{ fontSize: 13 }}>—</Typography>
                            ) : reports.length === 1 ? (
                              <Button size="small" variant="outlined" onClick={() => navigate(marketReportPath(reports[0].id))}>
                                Market report
                              </Button>
                            ) : (
                              <TextField
                                select
                                size="small"
                                value=""
                                sx={{ minWidth: 190 }}
                                slotProps={{
                                  select: {
                                    displayEmpty: true,
                                    renderValue: () => `Select market report (${reports.length})`,
                                  },
                                }}
                                onChange={(e) => {
                                  const id = Number(e.target.value)
                                  if (id > 0) navigate(marketReportPath(id))
                                }}
                              >
                                <MenuItem value="" disabled>
                                  {`Reports (${reports.length})`}
                                </MenuItem>
                                {reports.map((item) => (
                                  <MenuItem key={item.id} value={item.id}>{`${item.flag ? `${item.flag} ` : ''}${item.name}`}</MenuItem>
                                ))}
                              </TextField>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={status?.label ?? market.status} sx={{ bgcolor: status?.color, color: '#fff', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>{market.regionName}</TableCell>
                          <TableCell>
                            {market.segments.length === 0 ? (
                              <Typography color="text.secondary" sx={{ fontSize: 13 }}>None</Typography>
                            ) : (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {market.segments.map((segment) => (
                                  <Box
                                    key={segment.id}
                                    title={`${segment.name}: ${payload.presence[segment.presence] || segment.presence}`}
                                    sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: presenceColor(segment.presence) }}
                                  />
                                ))}
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          ) : null}

          {view === 'segments' ? (
            <Box>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Each market belongs to one region. A segment is listed for that region when a market there is linked to it.
              </Typography>
              <Tabs
                value={selectedRegionSegments?.code ?? false}
                onChange={(_e, value: string) => setSegmentRegion(value)}
                variant="scrollable"
                sx={{ mb: 2 }}
              >
                {payload.regionSegments.map((region) => (
                  <Tab key={region.code} value={region.code} label={region.name} />
                ))}
              </Tabs>
              {selectedRegionSegments ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.4fr' }, gap: 2 }}>
                  <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider' }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>Selected region</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2 }}>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{selectedRegionSegments.name}</Typography>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>
                          {selectedRegionSegments.segments.filter((s) => s.presence !== 'absent').length}
                        </Typography>
                        <Typography color="text.secondary" sx={{ fontSize: 12 }}>present</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {selectedRegionSegments.segments.map((segment) => (
                        <Box
                          key={segment.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 1,
                            p: 1.25,
                            borderRadius: 1,
                            bgcolor: segment.presence === 'absent' ? 'transparent' : 'action.hover',
                            cursor: payload.mayEdit ? 'pointer' : 'default',
                          }}
                          onClick={() => {
                            if (!payload.mayEdit) return
                            setFormError(null)
                            setSegmentForm({ id: segment.id, name: segment.name })
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: presenceColor(segment.presence) }} />
                            <Typography sx={{ fontWeight: 700 }}>{segment.name}</Typography>
                          </Box>
                          <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                            {payload.presence[segment.presence] || segment.presence}
                            {segment.total > 0 ? ` · ${segment.total}` : ''}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    {payload.mayEdit ? (
                      <Button
                        sx={{ mt: 2 }}
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setFormError(null)
                          setSegmentForm({ name: '' })
                        }}
                      >
                        Add segment
                      </Button>
                    ) : null}
                  </Paper>
                  <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', overflow: 'auto' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Markets in this region</Typography>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Market</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Segments</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payload.markets
                          .filter((market) => market.region === selectedRegionSegments.code)
                          .map((market) => (
                            <TableRow key={market.id} hover sx={{ cursor: 'pointer' }} onClick={() => openMarket(market)}>
                              <TableCell sx={{ fontWeight: 700 }}>{market.country}</TableCell>
                              <TableCell>
                                <Chip size="small" label={statusOf(market.status)?.label ?? market.status} sx={{ bgcolor: statusOf(market.status)?.color, color: '#fff', fontWeight: 700 }} />
                              </TableCell>
                              <TableCell>{market.segments.filter((s) => s.presence !== 'absent').map((s) => s.name).join(', ') || '—'}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </Paper>
                </Box>
              ) : null}
            </Box>
          ) : null}

          {view === 'definitions' ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {payload.statuses.map((status) => (
                <Paper key={status.code} elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderLeft: `6px solid ${status.color}` }}>
                  <Typography sx={{ fontWeight: 800, mb: 0.5 }}>{status.label}</Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>{status.summary}</Typography>
                  <Typography>{status.definition}</Typography>
                </Paper>
              ))}
            </Box>
          ) : null}
        </Box>
      </Box>
      <AppFooter />

      <Dialog open={Boolean(marketForm)} onClose={() => !saving && setMarketForm(null)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={submitMarket}>
          <DialogTitle>{marketForm?.id ? 'Edit market' : 'Add market'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            <TextField
              required
              label="Market name"
              value={marketForm?.name ?? ''}
              onChange={(e) => setMarketForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
            />
            <TextField
              select
              required
              label="Status"
              value={marketForm?.status ?? 'open'}
              onChange={(e) => setMarketForm((prev) => (prev ? { ...prev, status: e.target.value as BdStatusCode } : prev))}
            >
              {payload.statuses.map((status) => (
                <MenuItem key={status.code} value={status.code}>{status.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              required
              label="Region"
              value={marketForm?.region_id ?? 0}
              onChange={(e) => setMarketForm((prev) => (prev ? { ...prev, region_id: Number(e.target.value) } : prev))}
            >
              {payload.regions.map((region) => (
                <MenuItem key={region.id} value={region.id}>{region.name}</MenuItem>
              ))}
            </TextField>
            {marketForm?.status !== 'nogo' ? (
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>Segments</Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        payload.segmentOptions.length > 0 &&
                        (marketForm?.segment_ids.length ?? 0) === payload.segmentOptions.length
                      }
                      indeterminate={
                        (marketForm?.segment_ids.length ?? 0) > 0 &&
                        (marketForm?.segment_ids.length ?? 0) < payload.segmentOptions.length
                      }
                      onChange={(e) => {
                        const allIds = payload.segmentOptions.map((segment) => segment.id)
                        setMarketForm((prev) =>
                          prev ? { ...prev, segment_ids: e.target.checked ? allIds : [] } : prev,
                        )
                      }}
                    />
                  }
                  label={<Box component="span" sx={{ fontWeight: 800 }}>Select all</Box>}
                />
                {payload.segmentOptions.map((segment) => (
                  <FormControlLabel
                    key={segment.id}
                    control={
                      <Checkbox
                        checked={marketForm?.segment_ids.includes(segment.id) ?? false}
                        onChange={(e) => {
                          setMarketForm((prev) => {
                            if (!prev) return prev
                            const next = new Set(prev.segment_ids)
                            if (e.target.checked) next.add(segment.id)
                            else next.delete(segment.id)
                            return { ...prev, segment_ids: [...next] }
                          })
                        }}
                      />
                    }
                    label={segment.name}
                  />
                ))}
              </Box>
            ) : null}
            <Autocomplete
              multiple
              options={payload.jurisdictions.filter((item) => !item.marketId || item.marketId === marketForm?.id)}
              getOptionLabel={(option) => `${option.flag ? `${option.flag} ` : ''}${option.name}`}
              value={payload.jurisdictions.filter((item) => marketForm?.jurisdiction_ids.includes(item.id))}
              onChange={(_e, value) => setMarketForm((prev) => (prev ? { ...prev, jurisdiction_ids: value.map((item) => item.id) } : prev))}
              renderInput={(params) => <TextField {...params} label="Jurisdictions" />}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMarketForm(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog open={Boolean(segmentForm)} onClose={() => !saving && setSegmentForm(null)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={submitSegment}>
          <DialogTitle>{segmentForm?.id ? 'Edit segment' : 'Add segment'}</DialogTitle>
          <DialogContent sx={{ pt: '12px !important' }}>
            {formError ? <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert> : null}
            <TextField
              required
              fullWidth
              label="Segment name"
              value={segmentForm?.name ?? ''}
              onChange={(e) => setSegmentForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSegmentForm(null)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </PageBackground>
  )
}

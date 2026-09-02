import { useEffect, useMemo, useState } from 'react'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { getInstallationReport } from '@/api'
import type { InstallationReportPayload, InstallationReportVersion } from '@/api'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AvailabilityPanel, JurisdictionTable, PerformanceChart } from '@/components/reports'
import type { ChartShape } from '@/components/reports'
import { AppButton } from '@/components/ui'
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
}

function versionFromSearch(): number | null {
  const raw = Number(new URLSearchParams(window.location.search).get('v'))
  return Number.isInteger(raw) && raw > 0 ? raw : null
}

function tabFromSearch(): 'installations' | 'availability' {
  return new URLSearchParams(window.location.search).get('tab') === 'availability' ? 'availability' : 'installations'
}

export default function InstallationsReportPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const [payload, setPayload] = useState<InstallationReportPayload | null>(null)
  const [versionId, setVersionId] = useState<number | null>(() => versionFromSearch())
  const [tab, setTab] = useState<'installations' | 'availability'>(() => tabFromSearch())
  const [shape, setShape] = useState<ChartShape>('bars')
  const decolorize = Boolean(user?.decolorize_avatars)

  useEffect(() => {
    document.title = payload?.version
      ? `${payload.version.label} | Installations (Report) | MERKURflow`
      : 'Installations (Report) | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [payload?.version])

  useEffect(() => {
    let cancelled = false
    void getInstallationReport(versionId)
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPayload(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [versionId])

  function updateQuery(nextVersion: number | null, nextTab: 'installations' | 'availability') {
    const params = new URLSearchParams()
    if (nextVersion) {
      params.set('v', String(nextVersion))
    }
    if (nextTab === 'availability') {
      params.set('tab', 'availability')
    }
    const query = params.toString()
    window.history.replaceState(null, '', `${APP_PATHS.installationsReport}${query ? `?${query}` : ''}`)
  }

  function selectVersion(id: number) {
    setVersionId(id)
    updateQuery(id, tab)
  }

  const coverage = useMemo(() => {
    const records = payload?.totals.records ?? 0
    const rated = payload?.totals.rated ?? 0
    return records > 0 ? Math.round((rated / records) * 1000) / 10 : 0
  }, [payload])

  if (payload === null) {
    return null
  }

  const version = payload.version

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, py: { xs: 2, md: 3 } }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5, fontSize: 14 }}>
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
            <Box component="span">Installations</Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography
                component="h1"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 32, md: 40 } }}
              >
                <RocketLaunchOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 36 }} />
                Installation report
              </Typography>
              <Typography color="text.secondary">
                {version?.label ?? 'No version'} · Generated {payload.generated_at}
              </Typography>
            </Box>
            <Autocomplete
              options={payload.versions}
              value={version}
              onChange={(_event, next: InstallationReportVersion | null) => {
                if (next) {
                  selectVersion(next.ID)
                }
              }}
              getOptionLabel={(option) => option.label}
              isOptionEqualToValue={(option, value) => option.ID === value.ID}
              sx={{ width: { xs: '100%', sm: 320 } }}
              renderInput={(params) => <TextField {...params} label="Version" />}
            />
          </Box>

          <Typography sx={{ mb: 1.5, maxWidth: 820 }}>
            See feedback on{' '}
            <Box
              component="button"
              type="button"
              onClick={() => navigate(tableBrowsePath('games'))}
              sx={crumbSx}
            >
              Game
            </Box>{' '}
            performance and technical performance for{' '}
            <Box
              component="button"
              type="button"
              onClick={() => navigate(tableBrowsePath('installations'))}
              sx={crumbSx}
            >
              Installations
            </Box>{' '}
            of any{' '}
            <Box
              component="button"
              type="button"
              onClick={() => navigate(tableBrowsePath('versions'))}
              sx={crumbSx}
            >
              Version
            </Box>
            .
          </Typography>

          {payload.featured.length > 0 ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {payload.featured.map((item) => (
                <AppButton
                  key={item.ID}
                  size="small"
                  variant={version?.ID === item.ID ? 'contained' : 'outlined'}
                  color={version?.ID === item.ID ? 'secondary' : 'inherit'}
                  onClick={() => selectVersion(item.ID)}
                >
                  {item.label}
                </AppButton>
              ))}
            </Box>
          ) : null}

          <ToggleButtonGroup
            exclusive
            value={tab}
            onChange={(_event, value: 'installations' | 'availability' | null) => {
              if (!value) {
                return
              }
              setTab(value)
              updateQuery(versionId, value)
            }}
            sx={{ ...pillGroupSx, mb: 3 }}
          >
            <ToggleButton value="installations" sx={pillSx}>
              <PlaceOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />
              Installations
            </ToggleButton>
            <ToggleButton value="availability" sx={pillSx}>
              <CheckCircleOutlinedIcon sx={{ mr: 0.75, fontSize: 18 }} />
              Availability
            </ToggleButton>
          </ToggleButtonGroup>

          {tab === 'installations' ? (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                  gap: 2,
                  mb: 2,
                }}
              >
                <StatCard label="Live installations" value={payload.totals.live} hint="Currently operating" />
                <StatCard label="Test installations" value={payload.totals.test} hint="Validation environments" />
                <StatCard label="Planned installations" value={payload.totals.planned} hint="Scheduled rollout" />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' },
                  gap: 2,
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'grey.50',
                  p: 2,
                }}
              >
                <Glance label="Total installation footprint" value={formatNumber(payload.totals.footprint)} />
                <Glance label="Performance feedback" value={`${payload.totals.rated} of ${payload.totals.records} records`} />
                <Glance label="Feedback coverage" value={`${coverage}%`} />
                <Glance label="Without a rating" value={`${payload.totals.unrated} records`} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <PerformanceChart ratings={payload.ratings} shape={shape} onShapeChange={setShape} />
              </Box>

              <JurisdictionTable rows={payload.jurisdictions} decolorize={decolorize} />

              {payload.last_install ? (
                <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'right', fontSize: 13 }}>
                  L, T, P = Live, Test, Planned
                  {payload.last_install.when
                    ? ` — Installations last modified on ${payload.last_install.when}`
                    : ''}
                  {payload.last_install.who ? ` by ${payload.last_install.who}` : ''}
                  {payload.last_install.where ? `: ${payload.last_install.where}` : ''}.
                </Typography>
              ) : null}
            </>
          ) : (
            <>
              <AvailabilityPanel
                available={payload.availability.available}
                intent={payload.availability.intent}
                noIntent={payload.availability.no_intent}
              />
              {payload.can_edit ? (
                <Box sx={{ mt: 3 }}>
                  <Typography sx={{ mb: 1 }}>If your jurisdiction is not listed yet, add it here:</Typography>
                  <AppButton
                    size="medium"
                    variant="outlined"
                    color="secondary"
                    onClick={() =>
                      navigate(
                        `${tableBrowsePath('availabilities')}?new=1`,
                      )
                    }
                  >
                    New availability
                  </AppButton>
                </Box>
              ) : null}
              {payload.last_availability ? (
                <Typography color="text.secondary" sx={{ mt: 2, textAlign: 'right', fontSize: 13 }}>
                  Availabilities last modified
                  {payload.last_availability.when ? ` on ${payload.last_availability.when}` : ''}
                  {payload.last_availability.who ? ` by ${payload.last_availability.who}` : ''}
                  {payload.last_availability.where ? `: ${payload.last_availability.where}` : ''}.
                </Typography>
              ) : null}
            </>
          )}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        p: 2.5,
      }}
    >
      <Typography color="text.secondary" sx={{ fontWeight: 700, mb: 0.5 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 36, color: 'secondary.main', lineHeight: 1.1 }}>
        {formatNumber(value)}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: 13 }}>
        {hint}
      </Typography>
    </Box>
  )
}

function Glance({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography color="text.secondary" sx={{ fontSize: 13 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{value}</Typography>
    </Box>
  )
}

function formatNumber(value: number): string {
  return value.toLocaleString()
}

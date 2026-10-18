import { useEffect, useMemo, useRef, useState } from 'react'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { getRoadmap } from '@/api'
import type { RoadmapGame, RoadmapPayload, RoadmapRow, RoadmapView } from '@/api'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, CrumbHome, PageBackground } from '@/components/layout'
import { useI18n } from '@/i18n'
import {
  AnalystStudio,
  GamesRoadmap,
  RoadmapFilters,
  RoadmapGrid,
  RoadmapPagination,
  clampRangeToSpan,
  defaultTimeRange,
  emptyRoadmapFilters,
  filterRoadmapGames,
  filterRoadmapRows,
  monthsForGrid,
  monthsFromGames,
  monthsFromRows,
  rangeParts,
  sliderMonthSpan,
} from '@/components/roadmap'
import type { RoadmapFilterState } from '@/components/roadmap'
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

function withLoadedFilters(view: RoadmapView, payload: RoadmapPayload): RoadmapFilterState {
  const dataMonths = view === 'games' ? monthsFromGames(payload.games) : monthsFromRows(payload.rows)
  return {
    ...emptyRoadmapFilters,
    ...clampRangeToSpan(defaultTimeRange(view), sliderMonthSpan(dataMonths)),
    showDevelopment: false,
  }
}

export default function RoadmapPage() {
  const { locale, t } = useI18n()
  const { path, navigate } = useAppPath()
  const { user } = useAuth()
  const view: RoadmapView = path === APP_PATHS.roadmapGames ? 'games' : 'versions'
  const [payload, setPayload] = useState<RoadmapPayload | null>(null)
  const [failed, setFailed] = useState(false)
  const [filters, setFilters] = useState<RoadmapFilterState>(emptyRoadmapFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const canShowDevelopment = payload?.can_show_development === true || user?.role?.['may_use_tlp-red'] === true

  useEffect(() => {
    document.title = view === 'games' ? `${t('pages.roadmapGames', 'Roadmap by Games')} | MERKURflow` : `${t('pages.roadmapVersions', 'Roadmap by Versions')} | MERKURflow`
    return () => {
      document.title = 'MERKURflow'
    }
  }, [view, t])

  useEffect(() => {
    let cancelled = false
    setPayload(null)
    setFailed(false)
    setFilters(emptyRoadmapFilters)
    setPage(1)
    void getRoadmap(view)
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
          setFilters(withLoadedFilters(view, result))
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
  }, [view])

  const dataMonths = useMemo(
    () => (view === 'games' ? monthsFromGames(payload?.games ?? [], locale) : monthsFromRows(payload?.rows ?? [], locale)),
    [payload, view, locale],
  )
  const monthSpan = useMemo(() => sliderMonthSpan(dataMonths, locale), [dataMonths, locale])
  const defaultRange = useMemo(() => clampRangeToSpan(defaultTimeRange(view), monthSpan), [view, monthSpan])
  const dataLastKey = dataMonths[dataMonths.length - 1]?.key
  const visibleRows = useMemo(
    () => filterRoadmapRows(payload?.rows ?? [], { ...filters, showDevelopment: canShowDevelopment ? filters.showDevelopment : false }, payload?.jurisdiction_presets ?? []),
    [payload, filters, canShowDevelopment],
  )
  const visibleGames = useMemo(() => filterRoadmapGames(payload?.games ?? [], filters), [payload, filters])
  const total = view === 'games' ? visibleGames.length : visibleRows.length
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, lastPage)
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return visibleRows.slice(start, start + pageSize)
  }, [visibleRows, currentPage, pageSize])
  const pagedGames = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return visibleGames.slice(start, start + pageSize)
  }, [visibleGames, currentPage, pageSize])
  const months = useMemo(() => monthsForGrid(monthSpan, filters, dataLastKey), [monthSpan, filters, dataLastKey])
  const milestoneCount = visibleRows.reduce((sum, row) => sum + row.milestones.length, 0)
  const headingMonths = view === 'games' ? monthsFromGames(visibleGames, locale) : months
  const headingRange = rangeParts(headingMonths, locale)
  const rangeText =
    headingRange.kind === 'month'
      ? t('roadmap.dynamicMonth', 'Dynamic roadmap {month}', { month: headingRange.from })
      : headingRange.kind === 'sameYear'
        ? t('roadmap.dynamicSameYear', 'Dynamic roadmap {from}–{to} {year}', {
            from: headingRange.from,
            to: headingRange.to,
            year: headingRange.year,
          })
        : headingRange.kind === 'years'
          ? t('roadmap.dynamicYears', 'Dynamic roadmap {from} – {to}', { from: headingRange.from, to: headingRange.to })
          : t('roadmap.dynamic', 'Dynamic roadmap')
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setPage(1)
  }, [filters, pageSize, view])

  function goToPage(next: number) {
    setPage(next)
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function openRow(row: RoadmapRow) {
    navigate(`${APP_PATHS.products}?id=${row.ID}`)
  }

  function openGame(game: RoadmapGame) {
    navigate(`${tableBrowsePath('games')}?id=${game.ID}`)
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label={t('common.breadcrumb', 'Breadcrumb')} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              <CrumbHome />
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">{view === 'games' ? t('pages.roadmapGames', 'Roadmap by Games') : t('pages.roadmapVersions', 'Roadmap by Versions')}</Box>
          </Box>

          <Typography
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 24, md: 30 }, lineHeight: 1.15, mb: 2 }}
          >
            <MapOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 28 }} />
            {view === 'games' ? t('pages.roadmapGames', 'Roadmap by Games') : t('pages.roadmapVersions', 'Roadmap by Versions')}
            {view === 'games' && payload ? (
              <Box component="span" sx={{ color: 'info.main', fontWeight: 800, fontSize: 22 }}>
                Σ {visibleGames.length}
              </Box>
            ) : null}
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
            <ToggleButtonGroup
              exclusive
              value={view}
              onChange={(_event, value: RoadmapView | null) => {
                if (value === 'games') {
                  navigate(APP_PATHS.roadmapGames)
                } else if (value === 'versions') {
                  navigate(APP_PATHS.roadmap)
                }
              }}
              aria-label={t('roadmap.viewAria', 'Roadmap view')}
              sx={pillGroupSx}
            >
              <ToggleButton value="versions" sx={pillSx}>
                {t('roadmap.versions', 'Versions')}
              </ToggleButton>
              <ToggleButton value="games" sx={pillSx}>
                {t('roadmap.games', 'Games')}
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography sx={{ color: 'text.secondary', fontWeight: 600 }}>{rangeText}</Typography>
          </Box>

          {failed ? (
            <Typography color="text.secondary">{t('roadmap.loadFailed', 'The roadmap could not be loaded.')}</Typography>
          ) : payload === null ? null : (
            <>
              <RoadmapFilters
                view={view}
                filters={filters}
                defaultRange={defaultRange}
                monthSpan={monthSpan}
                jurisdictionPresets={payload.jurisdiction_presets}
                platforms={payload.platforms}
                canShowDevelopment={canShowDevelopment}
                statusLabels={payload.game_status_labels}
                rowCount={view === 'games' ? visibleGames.length : visibleRows.length}
                milestoneCount={milestoneCount}
                onChange={setFilters}
              />
              {view === 'games' ? <AnalystStudio games={visibleGames} /> : null}
              <RoadmapPagination
                page={currentPage}
                pageSize={pageSize}
                total={total}
                kind={view === 'games' ? 'game' : 'version'}
                onPageChange={goToPage}
                onPageSizeChange={setPageSize}
              />
              <Box ref={listRef}>
                {view === 'games' ? (
                  <GamesRoadmap
                    games={pagedGames}
                    labels={payload.game_status_labels}
                    filters={filters}
                    decolorize={Boolean(user?.decolorize_avatars)}
                    onOpen={openGame}
                  />
                ) : (
                  <RoadmapGrid
                    rows={pagedRows}
                    months={months}
                    showSubtitles={filters.showSubtitles}
                    onOpenRow={openRow}
                  />
                )}
              </Box>
              {lastPage > 1 ? (
                <RoadmapPagination
                  page={currentPage}
                  pageSize={pageSize}
                  total={total}
                  kind={view === 'games' ? 'game' : 'version'}
                  onPageChange={goToPage}
                  onPageSizeChange={setPageSize}
                />
              ) : null}
            </>
          )}
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

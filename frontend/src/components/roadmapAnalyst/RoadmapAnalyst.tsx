import { useCallback, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
import DownloadIcon from '@mui/icons-material/FileDownloadOutlined'
import UploadIcon from '@mui/icons-material/UploadFileOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { buildFilteredCsv, downloadTextFile, filterRows, fmt, group } from './analytics'
import { DimensionsView } from './DimensionsView'
import { FeaturesView } from './FeaturesView'
import { GameModal } from './GameModal'
import { OverviewView } from './OverviewView'
import { parseRoadmapFile } from './parse'
import type { AnalystDataset } from './parse'
import { QualityView } from './QualityView'
import { RecordsView } from './RecordsView'
import { loadSampleDataset } from './sample'
import { DEFAULT_CHOSEN_FEATURES, FILTER_KEYS, FILTER_LABELS, H, emptyFilters } from './schema'
import type { AnalystFilters, FilterKey, TabKey } from './schema'
import { StrategyView } from './StrategyView'
import { Empty, FilterChips } from './ui'
import './roadmapAnalyst.css'

const TABS: ReadonlyArray<readonly [TabKey, string]> = [
  ['overview', 'Overview'],
  ['dimensions', 'Country & Portfolio Mix'],
  ['features', 'Game Features'],
  ['strategy', 'Strategic Coverage'],
  ['records', 'Game Explorer'],
  ['quality', 'Data Quality'],
]

const FILTER_FIELD_LABELS: Record<FilterKey, string> = {
  country: 'Country / target market',
  segment: 'Market segment',
  type: 'Game type',
  studio: 'Studio',
}

const INITIAL_NOTE = 'Import the original template after filling it with real records. Nothing leaves your device.'

export function RoadmapAnalyst() {
  const [dataset, setDataset] = useState<AnalystDataset | null>(null)
  const [warning, setWarning] = useState('')
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState(false)

  const [tab, setTab] = useState<TabKey>('overview')
  const [filters, setFilters] = useState<AnalystFilters>(emptyFilters)
  const [searchInput, setSearchInput] = useState('')
  const [sortCol, setSortCol] = useState(0)
  const [sortAsc, setSortAsc] = useState(true)
  const [selectedDimension, setSelectedDimension] = useState('country')
  const [featureGroup, setFeatureGroup] = useState<FilterKey>('segment')
  const [chosenFeatures, setChosenFeatures] = useState<number[]>([...DEFAULT_CHOSEN_FEATURES])
  const [strategyA, setStrategyA] = useState<FilterKey>('country')
  const [strategyB, setStrategyB] = useState<FilterKey>('type')
  const [minCoverage, setMinCoverage] = useState(2)
  const [strategyFeature, setStrategyFeature] = useState('33')
  const [onlyGaps, setOnlyGaps] = useState(false)
  const [openGame, setOpenGame] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const data = useMemo(() => dataset?.data ?? [], [dataset])
  const term = searchInput.trim().toLowerCase()
  const rows = useMemo(() => filterRows(data, filters, term), [data, filters, term])
  const filterOptions = useMemo(() => Object.fromEntries(FILTER_KEYS.map((k) => [k, group(data, k).map((x) => x[0])])) as Record<FilterKey, string[]>, [data])

  const applyDataset = useCallback((next: AnalystDataset) => {
    setDataset(next)
    setFilters(emptyFilters)
    setSearchInput('')
    const missing = next.unknownHeaders
    setWarning(missing ? `Note: ${missing} expected headers missing or renamed (missing values shown as blanks). See Data Quality.` : '')
  }, [])

  const importFile = useCallback(
    async (file: File) => {
      setWarning('Reading data locally...')
      try {
        applyDataset(await parseRoadmapFile(file))
      } catch (e) {
        setWarning('Import failed: ' + (e instanceof Error ? e.message : String(e)))
        console.error(e)
      }
    },
    [applyDataset],
  )

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) await importFile(file)
  }

  async function openSample() {
    setBusy(true)
    setWarning('Reading data locally...')
    try {
      applyDataset(await loadSampleDataset())
    } catch (e) {
      setWarning('Import failed: ' + (e instanceof Error ? e.message : String(e)))
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  function exportCsv() {
    if (!data.length) {
      setWarning('Import data before exporting.')
      return
    }
    downloadTextFile(buildFilteredCsv(rows), 'game_roadmap_filtered.csv')
  }

  const pick = useCallback((key: FilterKey, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }, [])

  function clearChip(key: FilterKey | 'search') {
    if (key === 'search') setSearchInput('')
    else setFilters((current) => ({ ...current, [key]: '' }))
  }

  function resetFilters() {
    setFilters(emptyFilters)
    setSearchInput('')
  }

  function onSort(col: number) {
    setSortAsc(sortCol === col ? !sortAsc : true)
    setSortCol(col)
  }

  function onStrategyA(k: FilterKey) {
    setStrategyA(k)
    if (k === strategyB) setStrategyB(k === 'country' ? 'type' : 'country')
  }

  function onStrategyB(k: FilterKey) {
    setStrategyB(k)
    if (k === strategyA) setStrategyA(k === 'type' ? 'country' : 'type')
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void importFile(file)
  }

  const closeGame = useCallback(() => setOpenGame(null), [])
  const gameRow = openGame !== null ? data[openGame] : undefined

  const fileName = dataset?.fileName ?? 'Awaiting your game roadmap data'
  const sourceNote = dataset
    ? `${fmt(data.length)} games loaded · ${fmt(dataset.sourceColumns)} source columns · interpreted using the ${H.length}-column roadmap schema.`
    : INITIAL_NOTE

  let body
  if (!rows.length && tab !== 'quality') {
    body = <Empty hasData={data.length > 0} />
  } else if (tab === 'overview') {
    body = <OverviewView rows={rows} filters={filters} onPick={pick} />
  } else if (tab === 'dimensions') {
    body = <DimensionsView rows={rows} filters={filters} selectedDimension={selectedDimension} onDimensionChange={setSelectedDimension} onPick={pick} />
  } else if (tab === 'features') {
    body = (
      <FeaturesView
        rows={rows}
        filters={filters}
        featureGroup={featureGroup}
        onFeatureGroupChange={setFeatureGroup}
        chosenFeatures={chosenFeatures}
        onToggleFeature={(i, on) => setChosenFeatures((cur) => (on ? [...new Set([...cur, i])] : cur.filter((x) => x !== i)))}
      />
    )
  } else if (tab === 'strategy') {
    body = (
      <StrategyView
        rows={rows}
        state={{
          a: strategyA,
          b: strategyB,
          minCoverage,
          feature: strategyFeature,
          onlyGaps,
        }}
        handlers={{
          onA: onStrategyA,
          onB: onStrategyB,
          onMinCoverage: setMinCoverage,
          onFeature: setStrategyFeature,
          onOnlyGaps: setOnlyGaps,
        }}
      />
    )
  } else if (tab === 'records') {
    body = <RecordsView rows={rows} data={data} sortCol={sortCol} sortAsc={sortAsc} onSort={onSort} onOpenGame={setOpenGame} onExport={exportCsv} />
  } else {
    body = <QualityView data={data} skipped={dataset?.skipped ?? 0} unknownHeaders={dataset?.unknownHeaders ?? 0} />
  }

  return (
    <div
      className={`ra-root${dragging ? ' drop' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        if (!dragging) setDragging(true)
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false)
      }}
      onDrop={onDrop}
    >
      <div className="shell">
        <header className="top">
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Button variant="contained" disabled={busy} startIcon={<DownloadIcon />} onClick={() => void openSample()}>
              Open Sample Data
            </Button>
            <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
              Open Excel/CSV
              <input ref={fileRef} type="file" accept=".xlsx,.csv" hidden onChange={(e) => void onFileChange(e)} />
            </Button>
            <Button variant="outlined" color="secondary" startIcon={<DownloadIcon />} onClick={exportCsv}>
              Save filtered as CSV
            </Button>
          </Box>
        </header>

        <section className="card" style={{ marginTop: 16 }}>
          <div className="card-body">
            <div>
              <strong>{fileName}</strong>
              <p>{sourceNote}</p>
              <div id="warning" role="status">
                {warning}
              </div>
            </div>
          </div>
          <span className="card-footer">
            {fmt(rows.length)} / {fmt(data.length)} games
          </span>
        </section>

        <div className="filters">
          <div className={`field${term ? ' is-on' : ''}`}>
            <label htmlFor="ra-search">Search games / theme</label>
            <input id="ra-search" placeholder="Name, brand, keyword..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          {FILTER_KEYS.map((k) => (
            <div key={k} className={`field${filters[k] ? ' is-on' : ''}`}>
              <label htmlFor={`ra-filter-${k}`}>{FILTER_FIELD_LABELS[k]}</label>
              <select id={`ra-filter-${k}`} value={filters[k]} onChange={(e) => pick(k, e.target.value)}>
                <option value="">All</option>
                {filterOptions[k].map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <button type="button" className="btn btn-outline-secondary" onClick={resetFilters}>
            Reset filters
          </button>
        </div>
        <div className="small">
          Showing {fmt(rows.length)} of {fmt(data.length)} records · Counts refer to games, not revenue or performance · All filters apply to all views.
        </div>

        <nav className="tabs" role="tablist">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} className={`tab${tab === key ? ' active' : ''}`} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </nav>

        <main>
          <FilterChips filters={filters} term={term} labels={FILTER_LABELS} onClear={clearChip} />
          {body}
        </main>
      </div>
      {gameRow && openGame !== null ? <GameModal row={gameRow} index={openGame} onClose={closeGame} /> : null}
    </div>
  )
}

import { featureStats, fmt, group, normalize, NOT_SPECIFIED, pct } from './analytics'
import { CORE_COLUMNS } from './schema'
import type { AnalystFilters, Row } from './schema'
import { Kpi, Panel, Pie } from './ui'
import type { PickHandler } from './ui'

export function OverviewView({ rows, filters, onPick }: { rows: Row[]; filters: AnalystFilters; onPick: PickHandler }) {
  const countryN = group(rows, 'country').filter((x) => x[0] !== NOT_SPECIFIED).length
  const studioN = group(rows, 'studio').filter((x) => x[0] !== NOT_SPECIFIED).length
  const complete = rows.filter((r) => CORE_COLUMNS.every((i) => normalize(r[i]))).length
  const hs = featureStats(rows, 33)
  return (
    <>
      <div className="grid kpis">
        <Kpi label="Games" num={fmt(rows.length)} detail="Selected portfolio" />
        <Kpi label="Target markets" num={fmt(countryN)} detail="Distinct market labels" />
        <Kpi label="Studios" num={fmt(studioN)} detail="With defined studio" />
        <Kpi label="Hold & Spin" num={`${hs.rate}%`} detail={`Among ${hs.known} known values`} />
        <Kpi label="Core field completeness" num={`${pct(complete, rows.length)}%`} detail="7 essential fields populated" />
      </div>
      <div className="grid two">
        <Panel title="Market footprint" hint="Click a slice to filter. Counts are games, with the share of this selection.">
          <Pie rows={rows} fieldKey="country" filters={filters} onPick={onPick} />
        </Panel>
        <Panel title="Market segment mix" hint="Game counts and share by segment">
          <Pie rows={rows} fieldKey="segment" filters={filters} onPick={onPick} />
        </Panel>
        <Panel title="Game type distribution" hint="Game counts and share by type">
          <Pie rows={rows} fieldKey="type" filters={filters} onPick={onPick} />
        </Panel>
        <Panel title="Studio portfolio" hint="Game counts and share by studio">
          <Pie rows={rows} fieldKey="studio" filters={filters} onPick={onPick} />
        </Panel>
      </div>
    </>
  )
}

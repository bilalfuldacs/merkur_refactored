import { useMemo } from 'react'
import { analyzeStrategy, buildCoverageCsv, downloadTextFile, featureByCombination, fmt, pct, rankedCombinations } from './analytics'
import { FEATURES, STRATEGY_DIM } from './schema'
import type { FilterKey, Row } from './schema'
import { Kpi, Panel, Tooltip } from './ui'

export type StrategyState = {
  a: FilterKey
  b: FilterKey
  minCoverage: number
  feature: string
  onlyGaps: boolean
}

export type StrategyHandlers = {
  onA: (k: FilterKey) => void
  onB: (k: FilterKey) => void
  onMinCoverage: (n: number) => void
  onFeature: (v: string) => void
  onOnlyGaps: (v: boolean) => void
}

export function StrategyView({ rows, state, handlers }: { rows: Row[]; state: StrategyState; handlers: StrategyHandlers }) {
  const { a: strategyA, b: strategyB, minCoverage, feature: strategyFeature, onlyGaps } = state
  const analysis = useMemo(() => analyzeStrategy(rows, strategyA, strategyB, minCoverage), [rows, strategyA, strategyB, minCoverage])
  const { av, bv, cells, gaps, low, adequate, indexed, cutoff } = analysis
  const many = av.length * bv.length > 600
  const displayA = av.slice(0, 25)
  const displayB = bv.slice(0, 16)
  const feature = FEATURES.find((x) => String(x[1]) === strategyFeature) ?? FEATURES[1]
  const byFeature = useMemo(() => featureByCombination(analysis, feature), [analysis, feature])
  const ranked = useMemo(() => rankedCombinations(cells, onlyGaps, minCoverage), [cells, onlyGaps, minCoverage])

  const axisOptions = STRATEGY_DIM.map(([name, k]) => (
    <option key={k} value={k}>
      {name}
    </option>
  ))

  return (
    <>
      <div className="headingrow">
        <div>
          <h2>Strategic Portfolio Coverage</h2>
          <p className="hint">
            Explore observed coverage and whitespace in the imported roadmap. This does not measure demand, competitors or commercial attractiveness.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => downloadTextFile(buildCoverageCsv(cells, strategyA, strategyB, minCoverage), 'portfolio_coverage_offline.csv')}
        >
          Save Coverage as CSV
        </button>
      </div>

      <div className="card" style={{ marginBottom: 15 }}>
        <div className="card-body">
          <div className="card-text">
            <div className="dimcontrols">
              <label className="field">
                Rows
                <select value={strategyA} onChange={(e) => handlers.onA(e.target.value as FilterKey)}>
                  {axisOptions}
                </select>
              </label>
              <label className="field">
                Columns
                <select value={strategyB} onChange={(e) => handlers.onB(e.target.value as FilterKey)}>
                  {axisOptions}
                </select>
              </label>
              <label className="field">
                Low coverage: fewer than
                <select value={minCoverage} onChange={(e) => handlers.onMinCoverage(Number(e.target.value))}>
                  {[1, 2, 3, 5, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} games
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Game feature
                <select value={strategyFeature} onChange={(e) => handlers.onFeature(e.target.value)}>
                  {FEATURES.map(([label, i]) => (
                    <option key={i} value={String(i)}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="small">
              <input type="checkbox" checked={onlyGaps} onChange={(e) => handlers.onOnlyGaps(e.target.checked)} /> Show only zero-coverage combinations in
              detailed table
            </label>
          </div>
        </div>
      </div>

      <div className="grid kpis">
        <Kpi
          label={
            <Tooltip label="Observed combinations" desc="Number of unique Row × Column pairs with at least one game in the currently filtered portfolio." />
          }
          num={fmt(cells.length - gaps.length)}
          detail="At least one game"
        />
        <Kpi
          label={
            <Tooltip
              label="No-coverage pairs"
              desc="Pairs formed by the visible Row and Column category labels with ZERO matching games after filtering; absence is not proof of unmet demand."
            />
          }
          num={fmt(gaps.length)}
          detail="Among observed axis labels"
        />
        <Kpi
          label={
            <Tooltip
              label="Low-coverage pairs"
              desc="Pairs that have at least one game but fewer games than the chosen low-coverage threshold. Excludes zero-coverage pairs."
            />
          }
          num={fmt(low.length)}
          detail={`1 to ${minCoverage - 1} games`}
        />
        <Kpi
          label={
            <Tooltip
              label="Coverage ratio"
              desc="Share of all possible pairs that meet or exceed the chosen minimum number of games. Formula: pairs at or above threshold ÷ possible pairs × 100. This is NOT simply the share with any game when threshold exceeds 1."
            />
          }
          num={`${pct(adequate.length, cells.length)}%`}
          detail={`At or above ${minCoverage} games`}
        />
        <Kpi
          label={
            <Tooltip
              label="Possible pairs"
              desc="The number of distinct row values multiplied by distinct column values in the filtered data, excluding blank/unspecified labels. Some pairs may be logically inapplicable."
            />
          }
          num={fmt(cells.length)}
          detail="Cartesian combination of existing labels"
        />
      </div>

      <div className="grid two">
        <Panel
          title="Coverage heatmap"
          hint={`Top ${displayA.length} row labels × ${displayB.length} column labels; hover cells to inspect counts. Zero = no matching games.`}
        >
          <div className="table-wrap">
            <table className="heatmap">
              <thead>
                <tr>
                  <th>
                    {strategyA} ↓ / {strategyB} →
                  </th>
                  {displayB.map((v) => (
                    <th key={v} title={v}>
                      {v}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayA.map((a) => (
                  <tr key={a}>
                    <th title={a}>{a}</th>
                    {displayB.map((b) => {
                      const n = indexed.get(JSON.stringify([a, b])) ?? 0
                      const opacity = n ? (0.16 + (0.73 * n) / cutoff).toFixed(2) : '0'
                      return (
                        <td
                          key={b}
                          title={`${a} × ${b}: ${n} games`}
                          className={`heatcell ${n === 0 ? 'zero' : n < minCoverage ? 'weak' : ''}`}
                          style={{
                            background: n ? `rgba(69,219,202,${opacity})` : '#f6e9ef',
                            color: n ? '#061d26' : '#a24a68',
                          }}
                        >
                          <b>{n}</b>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel
          title="Absent / underrepresented combinations"
          hint={`Showing ${ranked.length} of ${onlyGaps ? gaps.length : gaps.length + low.length} candidate combinations. A gap is descriptive, not a market recommendation.`}
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{strategyA}</th>
                  <th>{strategyB}</th>
                  <th>Games</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((c) => (
                  <tr key={`${c.a}\u0001${c.b}`}>
                    <td>{c.a}</td>
                    <td>{c.b}</td>
                    <td>{c.n}</td>
                    <td>{c.n ? 'Low representation' : 'No matching games'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title={`${feature[0]} adoption in represented combinations`} hint="Rate = Yes / (Yes + No). Missing responses excluded and shown separately.">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{strategyA}</th>
                  <th>{strategyB}</th>
                  <th>Games</th>
                  <th>{feature[0]} Yes / Known</th>
                  <th>Unknown</th>
                </tr>
              </thead>
              <tbody>
                {byFeature.map((c) => (
                  <tr key={`${c.a}\u0001${c.b}`}>
                    <td>{c.a}</td>
                    <td>{c.b}</td>
                    <td>{c.n}</td>
                    <td>{c.feat.known ? `${c.feat.rate}% (${c.feat.y}/${c.feat.known})` : 'n/a'}</td>
                    <td>{c.feat.u}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Interpretation & limitations">
          <p>
            <b>Market ≠ country:</b> “Primary Design target market” is used unaltered. It may contain regional or non-country labels.
          </p>
          <p>
            <b>Zero coverage:</b> a pair of categories is in the observed vocabulary but has no games in this filtered portfolio. It may be intentionally
            excluded.
          </p>
          <p>
            <b>Low coverage:</b> fewer than {minCoverage} records; duplicates, release versions, and portfolio scope may affect counts.
          </p>
          <p>
            <b>Feature adoption:</b> unknown answers are not interpreted as No.
          </p>
          <p>
            <b>Next strategic step:</b> validate interesting gaps against player demand, performance, market regulation, competitor supply, and commercial
            roadmap priorities before treating them as opportunities.
          </p>
          {many ? <p className="small">Heatmap limits labels to 25 × 16 for responsiveness; summary metrics and exported CSV use all labels.</p> : null}
        </Panel>
      </div>
    </>
  )
}

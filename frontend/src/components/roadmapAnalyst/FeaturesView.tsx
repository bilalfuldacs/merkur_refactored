import { featureShortName, featureState, featureStats, fmt, group, pct, value } from './analytics'
import { AVAILABLE_FEATURES, FEATURES, FEATURE_GROUP_OPTIONS } from './schema'
import type { AnalystFilters, FilterKey, Row } from './schema'
import { Bars, Panel, PanelInner } from './ui'

function FeatureSelector({ chosen, onToggle }: { chosen: readonly number[]; onToggle: (i: number, on: boolean) => void }) {
  return (
    <>
      <div className="subtle">Choose any Yes/No fields present in the Excel template (including trademark/roadmap flags):</div>
      <div className="feature-selector">
        {AVAILABLE_FEATURES.map(([name, i]) => (
          <label key={i} className="checkchip">
            <input type="checkbox" checked={chosen.includes(i)} onChange={(e) => onToggle(i, e.target.checked)} />
            {name}
          </label>
        ))}
      </div>
      <div className="small">{chosen.length} selected · Changes apply immediately</div>
    </>
  )
}

function FeatureMatrix({ rows, k, chosen }: { rows: Row[]; k: FilterKey; chosen: readonly number[] }) {
  const gs = group(rows, k).slice(0, 11)
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{k}</th>
            <th>Games</th>
            {chosen.map((i) => (
              <th key={i}>{featureShortName(i)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {gs.map(([v, n]) => {
            const groupRows = rows.filter((r) => value(r, k) === v)
            return (
              <tr key={v}>
                <td>{v}</td>
                <td>{n}</td>
                {chosen.map((i) => {
                  const s = featureStats(groupRows, i)
                  return (
                    <td key={i} title={`${s.y} Yes / ${s.known} known (${s.u} missing)`}>
                      {s.known ? `${s.rate}% (${s.y}/${s.known})` : 'n/a'}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function FeatureCross({ rows, a, b }: { rows: Row[]; a: number; b: number }) {
  const names = ['Yes', 'No', 'Unknown'] as const
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th />
            {names.map((x) => (
              <th key={x}>{x} (2nd feature)</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {names.map((x) => (
            <tr key={x}>
              <td>{x} (1st feature)</td>
              {names.map((y) => (
                <td key={y}>{rows.filter((r) => featureState(r[a]) === x && featureState(r[b]) === y).length}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FeaturesView({
  rows,
  filters,
  featureGroup,
  onFeatureGroupChange,
  chosenFeatures,
  onToggleFeature,
}: {
  rows: Row[]
  filters: AnalystFilters
  featureGroup: FilterKey
  onFeatureGroupChange: (k: FilterKey) => void
  chosenFeatures: readonly number[]
  onToggleFeature: (i: number, on: boolean) => void
}) {
  return (
    <>
      <div className="headingrow">
        <div>
          <h2>Game mechanics &amp; feature penetration</h2>
          <div className="small">
            Green = Yes / feature present; red = No / feature absent; grey = blank, missing or unrecognized. The colored bar divides ALL games; adoption % = Yes
            ÷ (Yes + No), so unknowns are excluded from the rate.
          </div>
        </div>
        <label className="small">
          Compare by{' '}
          <select className="selectsmall" value={featureGroup} onChange={(e) => onFeatureGroupChange(e.target.value as FilterKey)}>
            {FEATURE_GROUP_OPTIONS.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="featuregrid">
        {FEATURES.map(([label, i]) => {
          const s = featureStats(rows, i)
          return (
            <div key={i} className="featurecard">
              <div className="small">{label}</div>
              <div className="big">{s.rate}%</div>
              <div className="small">
                {fmt(s.y)} Yes · {fmt(s.n)} No · {fmt(s.u)} unknown
              </div>
              <div className="meter">
                <span
                  style={{
                    width: `${pct(s.y, rows.length)}%`,
                  }}
                />
                <span
                  style={{
                    width: `${pct(s.n, rows.length)}%`,
                  }}
                />
                <span
                  style={{
                    width: `${pct(s.u, rows.length)}%`,
                  }}
                />
              </div>
              <div className="small">
                {s.known} answered out of {rows.length}
              </div>
            </div>
          )
        })}
      </div>
      <div className="method">
        <b>Color legend:</b> <span style={{ color: 'var(--merkur-green)' }}>● Green: Yes</span> &nbsp;{' '}
        <span style={{ color: 'var(--merkur-red)' }}>● Red: No</span> &nbsp; <span style={{ color: '#a3b0c2' }}>● Grey: unknown</span>. Example: 6 Yes, 2 No, 2
        unknown → 60% green bar / 20% red / 20% grey; adoption = 75% (6 of 8 answered).
      </div>
      <div className="grid two" style={{ marginTop: 15 }}>
        <Panel
          title={`Feature adoption by ${featureGroup}`}
          hint="Select the columns below. Rate = confirmed Yes / (Yes + No). Missing and unrecognized values excluded."
        >
          <FeatureSelector chosen={chosenFeatures} onToggle={onToggleFeature} />
          <FeatureMatrix rows={rows} k={featureGroup} chosen={chosenFeatures} />
        </Panel>
        <Panel title="Persistence & game mechanics" hint="The number of perceived persistence pots is not a Yes/No field">
          <PanelInner title="Perceived Persistence (number of pots)">
            <Bars rows={rows} fieldKey={34} max={12} filters={filters} />
          </PanelInner>
          <PanelInner title="Feature Game USP">
            <Bars rows={rows} fieldKey={31} max={10} filters={filters} />
          </PanelInner>
        </Panel>
        <Panel title="Cash On Reels × Hold & Spin">
          <FeatureCross rows={rows} a={32} b={33} />
        </Panel>
        <Panel title="True Persistence × Feature In Feature">
          <FeatureCross rows={rows} a={35} b={36} />
        </Panel>
      </div>
    </>
  )
}

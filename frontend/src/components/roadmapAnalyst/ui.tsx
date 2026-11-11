import type { ReactNode } from 'react'
import { barItems, fmt, group, pct, pieItems, pieSlices, value } from './analytics'
import { PIE_COLORS, isFilterKey } from './schema'
import type { AnalystFilters, FieldKey, FilterKey, Row } from './schema'

export type PickHandler = (key: FilterKey, value: string) => void

export function Info({ tip }: { tip: string }) {
  return (
    <span className="info" tabIndex={0} role="note" aria-label={tip} data-tip={tip}>
      ?
    </span>
  )
}

export function Tooltip({ label, desc }: { label: string; desc: string }) {
  return (
    <>
      {label} <Info tip={desc} />
    </>
  )
}

export function Kpi({ label, num, detail }: { label: ReactNode; num: ReactNode; detail: ReactNode }) {
  return (
    <div className="card kpi">
      <div className="card-body">
        <div className="card-text">
          <div className="label">{label}</div>
          <div className="num">{num}</div>
          <div className="detail">{detail}</div>
        </div>
      </div>
    </div>
  )
}

export function Panel({ title, hint, children }: { title: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="card">
      <div className="card-body">
        <div className="card-title">
          <h2>{title}</h2>
          {hint ? <p className="hint">{hint}</p> : null}
        </div>
        <div className="card-text">{children}</div>
      </div>
    </div>
  )
}

export function PanelInner({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h3 style={{ marginTop: 18 }}>{title}</h3>
      {children}
    </>
  )
}

export function Empty({ hasData }: { hasData: boolean }) {
  return (
    <div className="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M3 3h18v18H3zM7 15l3-3 3 2 4-5M7 7h4" />
      </svg>
      <b>{hasData ? 'No games match the current filters' : 'No game records loaded yet'}</b>
      {hasData
        ? 'Clear one or more filters to see results.'
        : 'The supplied file is a blank 52-column template. Click “Open Excel/CSV” to load a populated roadmap.'}
    </div>
  )
}

export function Bars({
  rows,
  fieldKey,
  max = 9,
  click = false,
  filters,
  onPick,
}: {
  rows: Row[]
  fieldKey: FieldKey
  max?: number
  click?: boolean
  filters: AnalystFilters
  onPick?: PickHandler
}) {
  const items = barItems(rows, fieldKey, max)
  if (!items.length) return <p className="small">No data for selected filters.</p>
  const total = rows.length
  const pickKey = click && isFilterKey(fieldKey) ? fieldKey : null
  return (
    <>
      {items.map(({ name, count, other }) => {
        const chosen = pickKey !== null && filters[pickKey] === name
        const clickable = pickKey !== null && !other
        return (
          <div
            key={name}
            className={`bar-row${pickKey ? ' clickable' : ''}${chosen ? ' is-chosen' : ''}`}
            title={pickKey ? `Filter on ${name}` : undefined}
            onClick={clickable ? () => onPick?.(pickKey, name) : undefined}
          >
            <div className="bar-label" title={name}>
              {name}
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${pct(count, items[0].count)}%`,
                }}
              />
            </div>
            <div className="bar-num text-nowrap">
              {fmt(count)} <span style={{ fontSize: 10 }}>{pct(count, total)}%</span>
            </div>
          </div>
        )
      })}
    </>
  )
}

export function Pie({ rows, fieldKey, filters, onPick }: { rows: Row[]; fieldKey: FilterKey; filters: AnalystFilters; onPick: PickHandler }) {
  const items = pieItems(rows, fieldKey, PIE_COLORS)
  if (!items.length) return <p className="small">No data for selected filters.</p>
  const slices = pieSlices(items, rows.length)
  const titleOf = (name: string, count: number) => `${name}: ${fmt(count)} (${pct(count, rows.length)}%)`
  return (
    <div className="pie-wrap">
      <svg className="pie-svg" viewBox="0 0 168 168">
        {slices.map(({ item, full, d }) => {
          const common = {
            className: `pie-slice${filters[fieldKey] === item.name ? ' is-chosen' : ''}`,
            fill: item.color,
            onClick: item.other ? undefined : () => onPick(fieldKey, item.name),
          }
          return full ? (
            <circle key={item.name} cx="84" cy="84" r="70" {...common}>
              <title>{titleOf(item.name, item.count)}</title>
            </circle>
          ) : (
            <path key={item.name} d={d} {...common}>
              <title>{titleOf(item.name, item.count)}</title>
            </path>
          )
        })}
      </svg>
      <div className="pie-legend">
        {items.map((item) => (
          <div
            key={item.name}
            className={`pie-legend-row${filters[fieldKey] === item.name ? ' is-chosen' : ''}`}
            onClick={item.other ? undefined : () => onPick(fieldKey, item.name)}
          >
            <i style={{ background: item.color }} />
            <span>{item.name}</span>
            <b>{fmt(item.count)}</b>
            <small>{pct(item.count, rows.length)}%</small>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Count matrix of two dimensions (top 12 × top 8). */
export function CrossTable({ rows, a, b }: { rows: Row[]; a: FilterKey; b: FilterKey }) {
  const groupsA = group(rows, a)
  const A = groupsA.slice(0, 12)
  const B = group(rows, b)
    .slice(0, 8)
    .map((x) => x[0])
  const counts = new Map<string, number>()
  rows.forEach((r) => {
    const k = JSON.stringify([value(r, a), value(r, b)])
    counts.set(k, (counts.get(k) ?? 0) + 1)
  })
  return (
    <table>
      <thead>
        <tr>
          <th>{a}</th>
          {B.map((x) => (
            <th key={x}>{x}</th>
          ))}
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {A.map(([x, total]) => (
          <tr key={x}>
            <td>{x}</td>
            {B.map((y) => (
              <td key={y}>{counts.get(JSON.stringify([x, y])) || '—'}</td>
            ))}
            <td>
              <b>{total}</b>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function FilterChips({
  filters,
  term,
  labels,
  onClear,
}: {
  filters: AnalystFilters
  term: string
  labels: Record<FilterKey, string>
  onClear: (key: FilterKey | 'search') => void
}) {
  const active = (Object.entries(filters) as Array<[FilterKey, string]>).filter(([, v]) => v)
  if (!active.length && !term) return null
  return (
    <div className="filter-chips">
      {term ? (
        <span className="filter-chip">
          Search: <b>{term}</b>{' '}
          <button type="button" aria-label="Remove filter" onClick={() => onClear('search')}>
            ×
          </button>
        </span>
      ) : null}
      {active.map(([k, v]) => (
        <span key={k} className="filter-chip">
          {labels[k] ?? k}: <b>{v}</b>{' '}
          <button type="button" aria-label="Remove filter" onClick={() => onClear(k)}>
            ×
          </button>
        </span>
      ))}
    </div>
  )
}


import { useMemo } from 'react'
import { fmt, normalize } from './analytics'
import { H, RECORD_COLUMNS } from './schema'
import type { Row } from './schema'

const MAX_ROWS = 500

export function RecordsView({
  rows,
  data,
  sortCol,
  sortAsc,
  onSort,
  onOpenGame,
  onExport,
}: {
  rows: Row[]
  data: Row[]
  sortCol: number
  sortAsc: boolean
  onSort: (col: number) => void
  onOpenGame: (index: number) => void
  onExport: () => void
}) {
  const sorted = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const x = normalize(a[sortCol])
        const y = normalize(b[sortCol])
        return (x.localeCompare(y, undefined, { numeric: true }) || 0) * (sortAsc ? 1 : -1)
      }),
    [rows, sortCol, sortAsc],
  )
  const indexOf = useMemo(() => new Map(data.map((r, i) => [r, i])), [data])
  const visible = sorted.slice(0, MAX_ROWS)

  return (
    <>
      <div className="headingrow">
        <div>
          <h2>Game-level explorer</h2>
          <div className="small">
            {fmt(rows.length)} rows · click a game to open its visual profile · click a column to sort · export all filtered rows with every mapped field
          </div>
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={onExport}>
          Save filtered as CSV
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {RECORD_COLUMNS.map((i) => (
                <th key={i} style={{ cursor: 'pointer' }} onClick={() => onSort(i)}>
                  {H[i]}
                  {sortCol === i ? (sortAsc ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const idx = indexOf.get(r) ?? -1
              return (
                <tr
                  key={idx}
                  className="game-row"
                  tabIndex={0}
                  role="button"
                  title="Open complete game profile"
                  onClick={() => onOpenGame(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      onOpenGame(idx)
                    }
                  }}
                >
                  {RECORD_COLUMNS.map((i) => (
                    <td key={i} title={r[i]}>
                      {i === 0 ? (
                        <button type="button" className="linkgame">
                          {r[i] || '(Unnamed)'}
                        </button>
                      ) : (
                        r[i]
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {sorted.length > MAX_ROWS ? <p className="small">Showing first 500 rows for browser performance; CSV includes all filtered records.</p> : null}
    </>
  )
}

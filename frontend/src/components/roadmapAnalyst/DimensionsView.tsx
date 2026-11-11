import { DIM, toFieldKey } from './schema'
import type { AnalystFilters, Row } from './schema'
import { Bars, CrossTable, Panel } from './ui'
import type { PickHandler } from './ui'

export function DimensionsView({
  rows,
  filters,
  selectedDimension,
  onDimensionChange,
  onPick,
}: {
  rows: Row[]
  filters: AnalystFilters
  selectedDimension: string
  onDimensionChange: (key: string) => void
  onPick: PickHandler
}) {
  return (
    <>
      <div className="headingrow">
        <div>
          <h2>Portfolio composition &amp; cross-segmentation</h2>
          <div className="small">Click a bar to filter. The chosen value stays highlighted. Remove it from the chip above.</div>
        </div>
        <label className="small">
          Analyze by{' '}
          <select className="selectsmall" value={selectedDimension} onChange={(e) => onDimensionChange(e.target.value)}>
            {DIM.map(([label, k]) => (
              <option key={String(k)} value={String(k)}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid two">
        <Panel title="Distribution">
          <Bars rows={rows} fieldKey={toFieldKey(selectedDimension)} max={16} click filters={filters} onPick={onPick} />
        </Panel>
        <Panel title="Studio × game type" hint="Counts by studio and game type">
          <div className="table-wrap">
            <CrossTable rows={rows} a="studio" b="type" />
          </div>
        </Panel>
        <Panel title="Market × segment" hint="Counts by market and segment">
          <div className="table-wrap">
            <CrossTable rows={rows} a="country" b="segment" />
          </div>
        </Panel>
      </div>
    </>
  )
}

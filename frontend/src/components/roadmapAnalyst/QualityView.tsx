import { findDuplicateNames, fmt, group, normalize, pct } from './analytics'
import { QUALITY_KEYS } from './schema'
import type { Row } from './schema'
import { Panel } from './ui'

export function QualityView({ data, skipped, unknownHeaders }: { data: Row[]; skipped: number; unknownHeaders: number }) {
  const total = data.length
  const duplicates = findDuplicateNames(data)
  return (
    <div className="grid two">
      <Panel
        title="Field population"
        hint="These percentages show field population, NOT correctness: populated records ÷ all imported named-game records × 100. Example: 80/100 = 80% have a nonblank value. 0% means none; 100% means all. Unknown values can still count as populated."
      >
        {QUALITY_KEYS.map(([label, i]) => {
          const complete = data.filter((r) => normalize(r[i])).length
          return (
            <div key={i} className="quality">
              <span>{label}</span>
              <span>
                {fmt(complete)} / {fmt(total)} ({pct(complete, total)}%)
              </span>
            </div>
          )
        })}
      </Panel>

      <Panel title="Integrity checks">
        <div className="quality">
          <span>Imported game records</span>
          <strong>{fmt(total)}</strong>
        </div>
        <div className="quality">
          <span>Repeated game names</span>
          <strong>{fmt(duplicates.length)}</strong>
        </div>
        <div className="quality">
          <span>Rows without a game name (excluded)</span>
          <strong>{fmt(skipped)}</strong>
        </div>
        <div className="quality">
          <span>Unexpected mapped headers</span>
          <strong>{fmt(unknownHeaders)}</strong>
        </div>
        <div className="quality">
          <span>Market labels</span>
          <strong>{fmt(group(data, 'country').length)}</strong>
        </div>
        <p className="small">Repeated names may be legitimate when a game appears across cabinets or markets. Review before deduplicating.</p>
      </Panel>

      <Panel title="Data interpretation">
        <div className="actions-list">
          <p>
            <b>1. Country / target market:</b> “Primary Design target market” may be a region, rather than a country. <b>Action:</b> add a distinct{' '}
            <i>Country</i> column to the source workbook (ISO code or agreed country names), or create an approved market→country mapping. Until then, treat
            this chart as <i>target market</i>, not geographical country share.
          </p>
          <p>
            <b>2. Theme consistency:</b> “Game Theme” is a classification, while “Base Game USP” is a descriptive field. <b>Action:</b> agree on an approved
            theme vocabulary; harmonize synonyms, casing and spelling in Game Theme. Keep free-text USPs separate.
          </p>
          <p>
            <b>3. Game feature responses:</b> only Y / Yes / True / 1 and N / No / False / 0 are classified. <b>Action:</b> review unknown and blank cells for
            each Yes/No feature; populate genuine Y or N after validation. Do not convert blanks to No automatically. For “Assigned to Roadmapslot?” retain
            Cancelled as a separate status, never treat it as No.
          </p>
          <p>
            <b>4. Duplicate game names:</b> same name may exist for multiple markets, cabinets or game versions. <b>Action:</b> inspect repetitions; define a
            stable composite key (Game Name + Market + Cabinet + Version, when available). Remove duplicates only after confirming they are accidental.
          </p>
          <p>
            <b>5. Missing critical attributes:</b> check the percentages under Field population. <b>Action:</b> prioritize Studio, Market Segment, Game Type, SW
            Foundation and Game Theme; assign data owners to fill blanks in the Excel and reimport.
          </p>
          <p>
            <b>6. Strategic interpretation:</b> counts describe roadmap entries only. <b>Action:</b> join against validated launch, market demand and
            game-performance data before making commercial investment decisions.
          </p>
          <p>
            <b>7. Header mismatch:</b> if “Unexpected mapped headers” is above zero, the imported file has expected columns missing or renamed. <b>Action:</b>{' '}
            restore the template header names exactly, then reimport; blank fields may otherwise reflect missing mapping rather than missing source data.
          </p>
        </div>
      </Panel>

      <Panel title="Duplicate game names">
        {duplicates.length ? (
          duplicates.slice(0, 30).map(([k, n]) => (
            <div key={k} className="quality">
              <span>{k}</span>
              <b>{n}</b>
            </div>
          ))
        ) : (
          <div className="small">No repeated named games detected.</div>
        )}
      </Panel>
    </div>
  )
}

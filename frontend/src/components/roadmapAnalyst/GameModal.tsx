import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { isNo, isYes, normalize } from './analytics'
import { AVAILABLE_FEATURES, H, PROFILE_QUICK_FIELDS } from './schema'
import type { Row } from './schema'

export function GameModal({ row, index, onClose }: { row: Row; index: number; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handle)
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handle)
      previous?.focus?.()
    }
  }, [onClose])

  return createPortal(
    <div className="ra-root">
      <div className="modalback" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modalsurface" role="dialog" aria-modal="true" aria-label="Game profile">
          <div className="modalhead">
            <div>
              <div className="eyebrow">COMPLETE GAME PROFILE · {index + 1}</div>
              <h2>{row[0]}</h2>
              <p className="small">Read-only view of the imported roadmap record; all 52 mapped attributes are shown below.</p>
            </div>
            <button type="button" className="btn" ref={closeRef} onClick={onClose}>
              ✕ Close
            </button>
          </div>
          <h3>Portfolio positioning</h3>
          <div className="detailgrid">
            {PROFILE_QUICK_FIELDS.map(([name, i]) => (
              <div key={name} className="detailtile">
                <label>{name}</label>
                <strong>{row[i] || 'Not specified'}</strong>
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: 22 }}>Game features &amp; flags</h3>
          <div className="detailgrid">
            {AVAILABLE_FEATURES.map(([name, i]) => {
              const v = normalize(row[i])
              const state = isYes(v) ? 'Yes' : isNo(v) ? 'No' : v.toLowerCase() === 'cancelled' ? 'Cancelled' : 'Unknown'
              const cls = state === 'Yes' ? 'styes' : state === 'No' ? 'stno' : 'stunk'
              return (
                <div key={i} className="detailtile">
                  <label>{name}</label>
                  <span className={`featurestatus ${cls}`}>{state}</span>
                  {state === 'Unknown' && v ? <div className="subtle">Raw: {v}</div> : null}
                </div>
              )
            })}
          </div>
          <h3 style={{ marginTop: 22 }}>Every field in the Excel record</h3>
          <div className="allfields">
            {H.map((h, i) => (
              <div key={h} className="fullfield">
                <small>{h}</small>
                <span>{row[i] || <i className="subtle">Not specified</i>}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

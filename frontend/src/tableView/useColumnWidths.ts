import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'

export const COLUMN_MIN_WIDTH = 72
export const COLUMN_DEFAULT_WIDTH = 160
export const COLUMN_MAX_WIDTH = 2400
export const COLUMN_STEP = 16

function measureCellWidth(target: EventTarget | null, key: string, fallback: Record<string, number>): number {
  if (target instanceof Element) {
    const cell = target.closest('th, td')
    const measured = cell?.getBoundingClientRect().width
    if (measured && Number.isFinite(measured) && measured > 0) {
      return measured
    }
  }

  return fallback[key] ?? COLUMN_DEFAULT_WIDTH
}

function storageKey(table: string): string {
  return `merkur.columnWidths.${table}`
}

function clampWidth(width: number): number {
  return Math.min(COLUMN_MAX_WIDTH, Math.max(COLUMN_MIN_WIDTH, Math.round(width)))
}

function readStored(table: string | undefined): Record<string, number> {
  if (!table) {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(storageKey(table))
    if (!raw) {
      return {}
    }

    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    const widths: Record<string, number> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        widths[key] = clampWidth(value)
      }
    }

    return widths
  } catch {
    return {}
  }
}

function persist(table: string | undefined, widths: Record<string, number>): void {
  if (!table) {
    return
  }

  window.localStorage.setItem(storageKey(table), JSON.stringify(widths))
}

export function useColumnWidths(table: string | undefined, keys: string[]) {
  const [boundTable, setBoundTable] = useState(table)
  const [widths, setWidths] = useState<Record<string, number>>(() => readStored(table))
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const dragRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null)
  const widthsRef = useRef(widths)

  if (table !== boundTable) {
    const stored = readStored(table)
    setBoundTable(table)
    setWidths(stored)
  }

  useEffect(() => {
    widthsRef.current = widths
  }, [widths])

  useEffect(() => {
    if (!activeKey) {
      return
    }

    const previousCursor = document.body.style.cursor
    const previousSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    return () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousSelect
    }
  }, [activeKey])

  const widthFor = useCallback(
    (key: string) => widths[key],
    [widths],
  )

  const isExplicit = useCallback((key: string) => key in widths, [widths])

  const tableMinWidth = keys.reduce((sum, key) => sum + (widths[key] ?? COLUMN_MIN_WIDTH), 0)

  const applyWidths = useCallback((next: Record<string, number>) => {
    widthsRef.current = next
    persist(table, next)
    return next
  }, [table])

  const startResize = useCallback((key: string, event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    dragRef.current = {
      key,
      startX: event.clientX,
      startWidth: measureCellWidth(event.currentTarget, key, widthsRef.current),
    }
    setActiveKey(key)
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const moveResize = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag) {
      return
    }

    const next = clampWidth(drag.startWidth + (event.clientX - drag.startX))
    setWidths((current) => {
      if (current[drag.key] === next) {
        return current
      }

      const updated = { ...current, [drag.key]: next }
      widthsRef.current = updated
      return updated
    })
  }, [])

  const endResize = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current) {
      return
    }

    dragRef.current = null
    setActiveKey(null)
    persist(table, widthsRef.current)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [table])

  const resetWidth = useCallback(
    (key: string) => {
      setWidths((current) => {
        if (!(key in current)) {
          return current
        }

        const next = { ...current }
        delete next[key]
        return applyWidths(next)
      })
    },
    [applyWidths],
  )

  const nudgeWidth = useCallback(
    (key: string, delta: number, fromWidth?: number) => {
      setWidths((current) =>
        applyWidths({
          ...current,
          [key]: clampWidth((fromWidth ?? current[key] ?? COLUMN_DEFAULT_WIDTH) + delta),
        }),
      )
    },
    [applyWidths],
  )

  const onResizeKeyDown = useCallback(
    (key: string, event: ReactKeyboardEvent<HTMLElement>) => {
      const currentWidth = measureCellWidth(event.currentTarget, key, widthsRef.current)

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        nudgeWidth(key, -COLUMN_STEP, currentWidth)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        nudgeWidth(key, COLUMN_STEP, currentWidth)
      } else if (event.key === 'Home') {
        event.preventDefault()
        setWidths((current) => applyWidths({ ...current, [key]: COLUMN_MIN_WIDTH }))
      } else if (event.key === 'End') {
        event.preventDefault()
        setWidths((current) => applyWidths({ ...current, [key]: COLUMN_MAX_WIDTH }))
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        resetWidth(key)
      }
    },
    [applyWidths, nudgeWidth, resetWidth],
  )

  return {
    widthFor,
    isExplicit,
    tableMinWidth,
    activeKey,
    startResize,
    moveResize,
    endResize,
    resetWidth,
    onResizeKeyDown,
  }
}

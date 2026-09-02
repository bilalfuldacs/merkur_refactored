import { useCallback, useState } from 'react'
import { cloneViewState, isDefaultView, serverViewKey } from './state'
import type { TableViewSchema, TableViewState } from './types'

export function useTableView(schema: TableViewSchema | null) {
  const table = schema?.table ?? null
  const [boundTable, setBoundTable] = useState<string | null>(table)
  const [draft, setDraft] = useState<TableViewState | null>(() =>
    schema ? cloneViewState(schema.defaults) : null,
  )
  const [applied, setApplied] = useState<TableViewState | null>(() =>
    schema ? cloneViewState(schema.defaults) : null,
  )

  let currentDraft = draft
  let currentApplied = applied

  if (table !== boundTable) {
    currentDraft = schema ? cloneViewState(schema.defaults) : null
    currentApplied = schema ? cloneViewState(schema.defaults) : null
    setBoundTable(table)
    setDraft(currentDraft)
    setApplied(currentApplied)
  }

  const patchDraft = useCallback((patch: Partial<TableViewState>) => {
    setDraft((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        ...patch,
        visibleColumns: patch.visibleColumns ? [...patch.visibleColumns] : current.visibleColumns,
      }
    })
  }, [])

  const apply = useCallback(() => {
    if (!draft) {
      return { serverChanged: false }
    }

    const serverChanged = applied === null || serverViewKey(draft) !== serverViewKey(applied)
    setApplied(cloneViewState(draft))
    return { serverChanged }
  }, [applied, draft])

  const resetToDefault = useCallback(() => {
    if (!schema) {
      return
    }

    const next = cloneViewState(schema.defaults)
    setDraft(next)
    setApplied(cloneViewState(next))
  }, [schema])

  return {
    draft: currentDraft,
    applied: currentApplied,
    patchDraft,
    apply,
    resetToDefault,
    isDefaultDraft: schema && currentDraft ? isDefaultView(currentDraft, schema) : true,
  }
}

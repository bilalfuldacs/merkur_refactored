import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { FindModal } from './FindModal'

type SearchContextValue = {
  openFind: (query?: string) => void
}

const SearchContext = createContext<SearchContextValue | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [seed, setSeed] = useState('')

  const openFind = useCallback((query = '') => {
    setSeed(query)
    setOpen(true)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey)) {
        return
      }
      if (event.key === 'k' || event.key === 'K' || event.key === '#') {
        event.preventDefault()
        setSeed(event.key === '#' ? '#' : '')
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const value = useMemo(() => ({ openFind }), [openFind])

  return (
    <SearchContext.Provider value={value}>
      {children}
      <FindModal open={open} seed={seed} onClose={() => setOpen(false)} />
    </SearchContext.Provider>
  )
}

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider')
  }
  return context
}

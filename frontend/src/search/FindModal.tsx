import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { getGlobalSearch } from '@/api/search'
import type { FindCategory } from '@/api/search'
import { AppButton, AppTextField } from '@/components/ui'
import { tableBrowsePath } from '@/config/tablePages'
import { findPath, useAppPath } from '@/routing'
import { FIND_QUICK_LINKS, matchQuickLink } from './quickLinks'

type ResultRef = { table: string; id: number }

export function FindModal({
  open,
  seed,
  onClose,
}: {
  open: boolean
  seed: string
  onClose: () => void
}) {
  const { navigate } = useAppPath()
  const [query, setQuery] = useState(seed)
  const [categories, setCategories] = useState<FindCategory[]>([])
  const [selected, setSelected] = useState(-1)

  useEffect(() => {
    if (open) {
      setQuery(seed)
      setCategories([])
      setSelected(-1)
    }
  }, [open, seed])

  const quickLink = matchQuickLink(query)
  const listedLinks = FIND_QUICK_LINKS.filter((item) => item.listed)
  const results = useMemo<ResultRef[]>(
    () => categories.flatMap((category) => category.items.map((item) => ({ table: category.table, id: item.id }))),
    [categories],
  )

  useEffect(() => {
    if (!open) {
      return
    }
    const value = query.trim()
    const link = matchQuickLink(value)
    if (value === '' || (link && !/\d/.test(value.slice(link.key.length)))) {
      setCategories([])
      return
    }
    const handle = window.setTimeout(() => {
      void getGlobalSearch(value, 20, true)
        .then((payload) => {
          setCategories(payload.categories)
          setSelected(-1)
        })
        .catch(() => {
          setCategories([])
        })
    }, 700)
    return () => window.clearTimeout(handle)
  }, [open, query])

  function go(path: string) {
    onClose()
    navigate(path)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (selected >= 0 && results[selected]) {
      const item = results[selected]
      go(`${tableBrowsePath(item.table)}?id=${item.id}`)
      return
    }
    if (quickLink) {
      go(quickLink.path)
      return
    }
    go(findPath(query))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelected((current) => (results.length === 0 ? -1 : (current + 1) % results.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelected((current) => (results.length === 0 ? -1 : current <= 0 ? results.length - 1 : current - 1))
    }
  }

  let running = 0

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent sx={{ pt: 2.5, pb: 2 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
            <AppTextField
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Game, Feature, Version, #t, …"
              aria-label="Find"
              startIcon={<SearchIcon fontSize="small" />}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0 },
              }}
            />
            <AppButton
              type="submit"
              color="info"
              startIcon={quickLink ? <BoltOutlinedIcon /> : <SearchIcon />}
              sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, px: 2 }}
            >
              {quickLink ? 'Go' : 'Find'}
            </AppButton>
          </Box>
        </Box>

        {quickLink ? (
          <Typography sx={{ mt: 1.5, fontWeight: 700, color: 'secondary.main' }}>{quickLink.label}</Typography>
        ) : null}

        {categories.length === 0 ? (
          <List dense sx={{ mt: 1.5 }}>
            {listedLinks.map((item) => (
              <ListItemButton key={item.key} onClick={() => go(item.path)}>
                <ListItemText
                  primary={item.label}
                  secondary={item.key}
                  primaryTypographyProps={{ fontWeight: 700 }}
                  secondaryTypographyProps={{ fontWeight: 800, color: 'secondary.main' }}
                />
              </ListItemButton>
            ))}
          </List>
        ) : (
          <Box sx={{ mt: 1.5, maxHeight: 420, overflow: 'auto' }}>
            {categories.map((category) => {
              const start = running
              running += category.items.length
              return (
                <Box key={category.table} sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 800, color: category.color, fontSize: 13, px: 1 }}>
                    {category.title} ({category.count}
                    {category.capped ? '+' : ''})
                  </Typography>
                  {category.items.map((item, index) => {
                    const absolute = start + index
                    return (
                      <ListItemButton
                        key={`${category.table}-${item.id}`}
                        selected={selected === absolute}
                        onClick={() => go(`${tableBrowsePath(category.table)}?id=${item.id}`)}
                      >
                        <ListItemText
                          primary={item.title}
                          secondary={item.subtitle}
                          primaryTypographyProps={{ fontWeight: 700 }}
                        />
                      </ListItemButton>
                    )
                  })}
                </Box>
              )
            })}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}

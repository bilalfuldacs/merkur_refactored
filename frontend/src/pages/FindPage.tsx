import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import { getGlobalSearch } from '@/api/search'
import type { FindPayload } from '@/api/search'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton, AppCard, AppTextField } from '@/components/ui'
import { tableBrowsePath } from '@/config/tablePages'
import { APP_PATHS, findPath, useAppPath } from '@/routing'
import { matchQuickLink } from '@/search'

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

function queryFromSearch(): string {
  return new URLSearchParams(window.location.search).get('q') ?? ''
}

export default function FindPage() {
  const { navigate, search } = useAppPath()
  const urlQuery = useMemo(() => queryFromSearch(), [search])
  const [draft, setDraft] = useState(urlQuery)
  const [payload, setPayload] = useState<FindPayload | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    document.title = 'Find | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    setDraft(urlQuery)
    const quick = matchQuickLink(urlQuery)
    if (quick) {
      navigate(quick.path)
      return
    }
    if (urlQuery.trim() === '') {
      setPayload(null)
      setFailed(false)
      return
    }
    let cancelled = false
    setFailed(false)
    void getGlobalSearch(urlQuery)
      .then((result) => {
        if (!cancelled) {
          setPayload(result)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          setPayload(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [urlQuery, navigate])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const quick = matchQuickLink(draft)
    if (quick) {
      navigate(quick.path)
      return
    }
    navigate(findPath(draft))
  }

  const hasQuery = urlQuery.trim() !== ''
  const empty = hasQuery && payload && payload.categories.length === 0

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4, lg: 6 }, py: { xs: 2, md: 3 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 1.5, fontSize: 14 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">Find</Box>
          </Box>
          <Typography component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 32, md: 40 }, mb: 2 }}>
            <SearchIcon sx={{ color: 'merkur.pink', fontSize: 36 }} />
            Find
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            <Box>
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', mb: 2 }}>
                <AppTextField
                  autoFocus
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Game, Feature, Version, Build, Release, …"
                  sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0 } }}
                />
                <AppButton type="submit" color="info" startIcon={<SearchIcon />} sx={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>
                  Find
                </AppButton>
              </Box>
              {failed ? <Typography color="text.secondary">Search could not be loaded.</Typography> : null}
              {!hasQuery ? (
                <Typography color="text.secondary">Enter a term to find items (almost) anywhere in MERKURflow.</Typography>
              ) : null}
              {empty ? (
                <Typography>
                  We <Box component="strong">could not find “{urlQuery}”</Box> in MERKURflow.
                </Typography>
              ) : null}
              {payload && payload.categories.length > 0 ? (
                <>
                  <Typography sx={{ mb: 1 }}>
                    {payload.total} result{payload.total === 1 ? '' : 's'} ({payload.elapsed} seconds)
                  </Typography>
                  {payload.categories.map((category) => (
                    <Box key={category.table} id={category.table} sx={{ mb: 4 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 22, color: category.color, mb: 1 }}>
                        {category.title} ({category.count}
                        {category.capped ? '+' : ''})
                        <AppButton
                          size="small"
                          variant="outlined"
                          sx={{ ml: 2 }}
                          onClick={() => navigate(`${tableBrowsePath(category.table)}?q=${encodeURIComponent(urlQuery)}`)}
                        >
                          Browse in Detail
                        </AppButton>
                      </Typography>
                      <List>
                        {category.items.map((item) => (
                          <ListItemButton
                            key={item.id}
                            onClick={() => navigate(`${tableBrowsePath(category.table)}?id=${item.id}`)}
                          >
                            <ListItemText
                              primary={item.title}
                              secondary={item.subtitle}
                              primaryTypographyProps={{ fontWeight: 800, fontSize: 18 }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Box>
                  ))}
                </>
              ) : null}
            </Box>
            <Box>
              <AppCard sx={{ p: 2, mb: 2 }}>
                <Typography sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoOutlinedIcon color="info" /> About Find
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Find items (almost) anywhere</strong> in MERKURflow.
                </Typography>
                <Typography color="text.secondary">
                  Results are categorized and ordered from most to least recent. At most 100 items are displayed per
                  category. Use “Browse in Detail” for the full table filter.
                </Typography>
              </AppCard>
              {payload && payload.categories.length > 0 ? (
                <Box>
                  <Typography sx={{ fontWeight: 800, mb: 1 }}>Matching categories</Typography>
                  {payload.categories.map((category) => (
                    <Box
                      key={category.table}
                      component="button"
                      type="button"
                      onClick={() => document.getElementById(category.table)?.scrollIntoView({ behavior: 'smooth' })}
                      sx={{ ...crumbSx, display: 'block', mb: 0.75, color: category.color, fontWeight: 700 }}
                    >
                      {category.title} ({category.count}
                      {category.capped ? '+' : ''})
                    </Box>
                  ))}
                </Box>
              ) : null}
            </Box>
          </Box>
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

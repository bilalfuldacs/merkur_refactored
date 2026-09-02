import { useState } from 'react'
import type { FormEvent } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import { AppButton, AppTextField } from '@/components/ui'
import { findPath, useAppPath } from '@/routing'
import { matchQuickLink } from '@/search'

export function HomeSearch() {
  const { navigate } = useAppPath()
  const [query, setQuery] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const quick = matchQuickLink(query)
    if (quick) {
      navigate(quick.path)
      return
    }
    navigate(findPath(query))
  }

  return (
    <Box
      component="form"
      role="search"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        px: { xs: 1, md: 1.5 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <AppTextField
          autoFocus
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          placeholder="Game, Feature, Version, Market, #t, …"
          aria-label="Search"
          startIcon={<SearchIcon fontSize="small" />}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              height: 44,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderRight: 0,
            },
            '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
              borderRight: 0,
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderRight: 0,
            },
          }}
        />
        <AppButton
          type="submit"
          color="info"
          aria-label="Find"
          startIcon={<SearchIcon />}
          sx={{
            height: 44,
            minWidth: { xs: 48, md: 104 },
            px: { xs: 1.5, md: 2 },
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            boxShadow: 'none',
            '& .MuiButton-startIcon': {
              m: { xs: 0, md: undefined },
              mr: { md: 1 },
            },
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
            Find
          </Box>
        </AppButton>
      </Box>
    </Box>
  )
}

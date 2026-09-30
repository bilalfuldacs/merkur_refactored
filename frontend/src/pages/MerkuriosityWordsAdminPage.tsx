import { useCallback, useEffect, useState } from 'react'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import { createMerkuriosityWord, deleteMerkuriosityWord, getMerkuriosityWords } from '@/api/merkuriosity'
import type { MerkuriosityWord } from '@/api/merkuriosity'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
import { APP_PATHS, useAppPath } from '@/routing'

const crumbSx = {
  border: 0,
  p: 0,
  bgcolor: 'transparent',
  color: 'info.main',
  cursor: 'pointer',
  font: 'inherit',
  '&:hover': { textDecoration: 'underline' },
} as const

export default function MerkuriosityWordsAdminPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const canManage = Boolean(user?.role?.['may_create-update_items'])
  const canDelete = Boolean(user?.role?.may_delete_items)
  const [words, setWords] = useState<MerkuriosityWord[] | null>(null)
  const [draft, setDraft] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const result = await getMerkuriosityWords({ per_page: 200 })
    setWords(result.data)
  }, [])

  useEffect(() => {
    document.title = 'MERKURiosity Words | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    if (!canManage) {
      return
    }
    void load().catch(() => {
      setWords([])
      setError(true)
      setMessage('Could not load words.')
    })
  }, [canManage, load])

  async function addWord() {
    const word = draft.trim().toLowerCase()
    if (word.length !== 5 || !/^[a-z]+$/.test(word) || busy) {
      setError(true)
      setMessage('Word must be exactly 5 letters.')
      return
    }
    setBusy(true)
    setMessage('')
    try {
      await createMerkuriosityWord(word)
      setDraft('')
      setError(false)
      setMessage(`Added “${word}”.`)
      await load()
    } catch (caught) {
      setError(true)
      setMessage(caught instanceof ApiError ? caught.message : 'Could not add word.')
    } finally {
      setBusy(false)
    }
  }

  async function removeWord(item: MerkuriosityWord) {
    if (!canDelete || busy) {
      return
    }
    if (!window.confirm(`Delete “${item.word}”?`)) {
      return
    }
    setBusy(true)
    try {
      await deleteMerkuriosityWord(item.id)
      setError(false)
      setMessage(`Deleted “${item.word}”.`)
      await load()
    } catch (caught) {
      setError(true)
      setMessage(caught instanceof ApiError ? caught.message : 'Could not delete word.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PageBackground>
      <AppHeader />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 4 }, py: 3, maxWidth: 720, mx: 'auto', width: '100%' }}>
        <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', gap: 1, mb: 2, fontSize: 14, flexWrap: 'wrap' }}>
          <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
            Start
          </Box>
          <Box component="span" color="text.secondary">
            /
          </Box>
          <Box component="button" type="button" onClick={() => navigate(APP_PATHS.merkuriosity)} sx={crumbSx}>
            MERKURiosity
          </Box>
          <Box component="span" color="text.secondary">
            /
          </Box>
          <Box component="span">Words</Box>
        </Box>

        <Typography component="h1" sx={{ fontWeight: 800, fontSize: 28, mb: 1, color: 'secondary.main' }}>
          MERKURiosity words
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Manage the 5-letter word pool used for the daily quiz.
        </Typography>

        {!canManage ? (
          <Alert severity="warning">You need permission to create or update items to manage quiz words.</Alert>
        ) : (
          <>
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="5-letter word"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 5))}
                slotProps={{ htmlInput: { maxLength: 5, style: { textTransform: 'lowercase' } } }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void addWord()
                  }
                }}
                sx={{ minWidth: 180 }}
              />
              <AppButton disabled={busy} onClick={() => void addWord()}>
                Add word
              </AppButton>
            </Box>

            {message ? (
              <Alert severity={error ? 'error' : 'success'} sx={{ mb: 2 }}>
                {message}
              </Alert>
            ) : null}

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'common.white' }}>
              {words === null ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>Loading…</Typography>
              ) : words.length === 0 ? (
                <Typography sx={{ p: 2, color: 'text.secondary' }}>No words yet.</Typography>
              ) : (
                words.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      px: 2,
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 0 },
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>{item.word}</Typography>
                    {canDelete ? (
                      <IconButton size="small" aria-label={`Delete ${item.word}`} disabled={busy} onClick={() => void removeWord(item)}>
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </Box>
                ))
              )}
            </Box>
          </>
        )}
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

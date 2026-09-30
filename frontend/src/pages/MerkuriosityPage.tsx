import { useCallback, useEffect, useMemo, useState } from 'react'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { AppButton } from '@/components/ui'
import { apiRequest } from '@/api/client'
import { APP_PATHS, useAppPath } from '@/routing'

type Tile = 'correct' | 'present' | 'absent' | ''
const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']
const MAX_GUESSES = 6
const WORD_LENGTH = 5

const TILE_COLOR: Record<Exclude<Tile, ''>, string> = {
  correct: '#A2C617',
  present: '#FFCC00',
  absent: '#898B8E',
}

export default function MerkuriosityPage() {
  const { navigate } = useAppPath()
  const { user } = useAuth()
  const canManageWords = Boolean(user?.role?.['may_create-update_items'])
  const [guesses, setGuesses] = useState<string[]>(Array(MAX_GUESSES).fill(''))
  const [results, setResults] = useState<Tile[][]>(Array.from({ length: MAX_GUESSES }, () => Array(WORD_LENGTH).fill('')))
  const [row, setRow] = useState(0)
  const [col, setCol] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [over, setOver] = useState(false)
  const [shake, setShake] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    document.title = 'MERKURiosity Daily Quiz | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    void apiRequest<{ length: number }>('/merkuriosity/daily-word')
      .then(() => setReady(true))
      .catch(() => {
        setMessage('No words available.')
        setError(true)
      })
  }, [])

  const keyStatus = useMemo(() => {
    const map: Record<string, Tile> = {}
    results.forEach((line, index) => {
      line.forEach((status, letterIndex) => {
        const letter = guesses[index][letterIndex]
        if (!letter || !status) {
          return
        }
        const current = map[letter]
        if (status === 'correct' || (status === 'present' && current !== 'correct') || (!current && status === 'absent')) {
          map[letter] = status
        }
      })
    })
    return map
  }, [guesses, results])

  const submit = useCallback(async () => {
    if (over || col !== WORD_LENGTH) {
      return
    }
    const guess = guesses[row]
    try {
      const payload = await apiRequest<{ guess: string; result: Tile[] }>('/merkuriosity/guess', {
        method: 'POST',
        body: { guess },
        silent: true,
      })
      const nextResults = results.map((line, index) => (index === row ? payload.result : line))
      setResults(nextResults)
      if (payload.result.every((item) => item === 'correct')) {
        setMessage('Congratulations! You guessed the word!')
        setError(false)
        setOver(true)
      } else if (row === MAX_GUESSES - 1) {
        setMessage('Game over — try again tomorrow.')
        setError(true)
        setOver(true)
      } else {
        setRow(row + 1)
        setCol(0)
      }
    } catch (caught) {
      setShake(true)
      window.setTimeout(() => setShake(false), 500)
      setMessage(caught instanceof Error ? caught.message : 'Not a valid English word.')
      setError(true)
    }
  }, [col, guesses, over, results, row])

  const handleKey = useCallback(
    (key: string) => {
      if (over || !ready) {
        return
      }
      setMessage('')
      setError(false)
      if (key === 'Enter') {
        void submit()
        return
      }
      if (key === 'Backspace') {
        if (col > 0) {
          const next = [...guesses]
          next[row] = next[row].slice(0, col - 1)
          setGuesses(next)
          setCol(col - 1)
        }
        return
      }
      if (/^[a-z]$/i.test(key) && col < WORD_LENGTH) {
        const next = [...guesses]
        next[row] = (next[row] + key.toLowerCase()).slice(0, WORD_LENGTH)
        setGuesses(next)
        setCol(col + 1)
      }
    },
    [col, guesses, over, ready, row, submit],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      if (event.key === 'Enter' || event.key === 'Backspace' || /^[a-z]$/i.test(event.key)) {
        event.preventDefault()
        handleKey(event.key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleKey])

  function reset() {
    setGuesses(Array(MAX_GUESSES).fill(''))
    setResults(Array.from({ length: MAX_GUESSES }, () => Array(WORD_LENGTH).fill('')))
    setRow(0)
    setCol(0)
    setMessage('')
    setError(false)
    setOver(false)
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: 2, py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 28, md: 36 }, mb: 1 }}>
          <EmojiEventsOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 34 }} />
          MERKURiosity
        </Typography>
        {canManageWords ? (
          <AppButton
            size="small"
            variant="outlined"
            color="inherit"
            sx={{ mb: 1.5 }}
            onClick={() => navigate(APP_PATHS.merkuriosityWords)}
          >
            Manage words
          </AppButton>
        ) : null}
        <Accordion sx={{ width: '100%', maxWidth: 500, mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>How to Play</AccordionSummary>
          <AccordionDetails>
            <Typography>Guess the daily 5-letter word in up to 6 tries.</Typography>
            <Typography sx={{ mt: 1 }}>Green = correct letter, correct position.</Typography>
            <Typography>Yellow = correct letter, wrong position.</Typography>
            <Typography>Gray = letter not in the word.</Typography>
          </AccordionDetails>
        </Accordion>
        <Box sx={{ display: 'grid', gap: 0.75, width: 'min(100%, 350px)', mb: 2 }}>
          {guesses.map((word, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 0.75,
                animation: shake && rowIndex === row ? 'merkurShake .5s' : undefined,
                '@keyframes merkurShake': {
                  '20%': { transform: 'translateX(-8px)' },
                  '40%': { transform: 'translateX(8px)' },
                  '60%': { transform: 'translateX(-8px)' },
                  '80%': { transform: 'translateX(8px)' },
                },
              }}
            >
              {Array.from({ length: WORD_LENGTH }, (_, letterIndex) => {
                const status = results[rowIndex][letterIndex]
                return (
                  <Box
                    key={letterIndex}
                    sx={{
                      aspectRatio: '1',
                      border: '2px solid',
                      borderColor: status ? 'transparent' : 'rgba(232, 49, 129, 0.5)',
                      bgcolor: status ? TILE_COLOR[status] : 'transparent',
                      color: status ? '#fff' : 'secondary.main',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 800,
                      fontSize: { xs: 22, md: 28 },
                      textTransform: 'uppercase',
                    }}
                  >
                    {word[letterIndex] ?? ''}
                  </Box>
                )
              })}
            </Box>
          ))}
        </Box>
        <Box sx={{ width: '100%', maxWidth: 520, px: 1 }}>
          {ROWS.map((line, index) => (
            <Box key={line} sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 0.75 }}>
              {index === 2 ? (
                <KeyLabel wide onClick={() => handleKey('Enter')}>
                  Enter
                </KeyLabel>
              ) : null}
              {line.split('').map((letter) => (
                <KeyLabel key={letter} status={keyStatus[letter]} onClick={() => handleKey(letter)}>
                  {letter}
                </KeyLabel>
              ))}
              {index === 2 ? (
                <KeyLabel wide onClick={() => handleKey('Backspace')}>
                  ⌫
                </KeyLabel>
              ) : null}
            </Box>
          ))}
        </Box>
        {message ? (
          <Typography sx={{ mt: 2, fontWeight: 700, color: error ? 'error.main' : 'success.main' }}>{message}</Typography>
        ) : null}
        {over ? (
          <AppButton sx={{ mt: 2 }} onClick={reset}>
            Play again
          </AppButton>
        ) : null}
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

function KeyLabel({
  children,
  onClick,
  status,
  wide,
}: {
  children: string
  onClick: () => void
  status?: Tile
  wide?: boolean
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        flex: wide ? 1.5 : 1,
        minWidth: 0,
        height: { xs: 48, md: 56 },
        border: 0,
        borderRadius: 1,
        fontWeight: 800,
        textTransform: 'uppercase',
        cursor: 'pointer',
        bgcolor: status ? TILE_COLOR[status] : '#EDEDED',
        color: status ? '#fff' : '#022052',
      }}
    >
      {children}
    </Box>
  )
}

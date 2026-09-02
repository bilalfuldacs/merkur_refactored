import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Fade from '@mui/material/Fade'
import Typography from '@mui/material/Typography'
import { subscribeLoading } from '@/api'
import { MerkurSun } from '@/components/brand'

const SHOW_AFTER_MS = 0

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => subscribeLoading(setPending), [])

  useEffect(() => {
    if (pending <= 0) {
      setVisible(false)
      return
    }

    const timer = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [pending])

  return (
    <>
      {children}
      <Fade in={visible} timeout={180} unmountOnExit>
        <Box
          role="status"
          aria-live="polite"
          aria-busy={visible}
          aria-label="Merkur is Coming"
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: { xs: 2.5, md: 3.5 },
            px: 3,
            bgcolor: 'rgba(255, 255, 255, 0.78)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <MerkurSun
            size={140}
            sx={{
              animation: 'merkurSunPulse 1.6s ease-in-out infinite',
              '@keyframes merkurSunPulse': {
                '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
                '50%': { transform: 'scale(1.08) rotate(8deg)' },
              },
            }}
          />
          <Typography
            component="p"
            sx={{
              m: 0,
              color: 'merkur.blue',
              fontWeight: 800,
              fontSize: { xs: '2rem', sm: '2.75rem', md: '3.75rem' },
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              textAlign: 'center',
            }}
          >
            Merkur is Coming
          </Typography>
        </Box>
      </Fade>
    </>
  )
}


import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { getOnlineUsers, type OnlineUser } from '@/api'
import { useAuth } from '@/auth'
import { UserAvatar } from '@/components/user'

function formatHm(value: Date): string {
  return value.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function useLocalClock(): string {
  const [label, setLabel] = useState(() => formatHm(new Date()))

  useEffect(() => {
    const id = window.setInterval(() => setLabel(formatHm(new Date())), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return label
}

export function OnlineNow() {
  const nowLabel = useLocalClock()
  const { user } = useAuth()
  const [users, setUsers] = useState<OnlineUser[]>([])

  useEffect(() => {
    let cancelled = false

    void getOnlineUsers()
      .then((payload) => {
        if (!cancelled) {
          setUsers(payload.users)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUsers([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Box
      component="section"
      aria-label="Online now"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'nowrap',
        overflow: 'hidden',
        maxHeight: '2.4em',
        width: '100%',
        mb: 2,
        color: 'text.secondary',
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          gap: 0.5,
        }}
      >
        <Typography component="span" sx={{ fontSize: 15, color: 'text.secondary', pr: 0.5 }}>
          Online
        </Typography>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 32,
            pl: 0.75,
            pr: 2.5,
            mr: 1,
            borderRadius: '12px 0 0 12px',
            color: 'common.white',
            background:
              'linear-gradient(90deg, #E83181BF 0%, #E831817F 65%, #E831811F 100%)',
          }}
        >
          Now{' '}
          <Box component="span" sx={{ fontWeight: 800, color: 'secondary.main', ml: 0.5 }}>
            {nowLabel}
          </Box>
        </Box>
        {users.map((onlineUser) => (
          <Box
            key={onlineUser.ID}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              pr: 2.5,
              opacity: onlineUser.recent ? 1 : 0.25,
            }}
          >
            <UserAvatar
              user={onlineUser}
              decolorize={Boolean(user?.decolorize_avatars)}
            />
            <Typography component="span" sx={{ fontSize: 14, color: 'text.secondary' }}>
              {formatHm(new Date(onlineUser.last_login_at))}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

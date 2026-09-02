import Box from '@mui/material/Box'

const roleRadius: Record<number, string> = {
  1: '50%',
  2: '50% 0 0 50%',
  3: '0 0 50% 50%',
  4: '50%',
  5: '0',
  6: '0 50% 50% 0',
  7: '50% 0 50% 0',
  8: '50% 0 50% 0',
  9: '0 50% 0 0',
  10: '0 50% 0 0',
}

const boldRoles = new Set([1, 2, 7, 9])

const sizes = {
  sm: { width: 32, height: 32, fontSize: 13 },
  md: { width: 48, height: 48, fontSize: 18 },
  lg: { width: 56, height: 56, fontSize: 20 },
  xl: { width: 96, height: 96, fontSize: 36 },
} as const

export type UserAvatarUser = {
  initials?: string | null
  firstname?: string | null
  lastname?: string | null
  username?: string | null
  name?: string | null
  bcolor?: string | null
  color?: string | null
  role_ID?: number | null
}

export type UserAvatarProps = {
  user: UserAvatarUser | null
  size?: keyof typeof sizes
  decolorize?: boolean
  deputy?: boolean
  selected?: boolean
  onClick?: () => void
}

function initialsFor(user: UserAvatarUser | null): string {
  if (user?.initials) {
    return user.initials
  }

  const source = user?.firstname || user?.username || user?.name || '?'
  return source.slice(0, 2).toUpperCase()
}

export function displayName(user: UserAvatarUser | null): string {
  if (user?.name?.trim()) {
    return user.name.trim()
  }

  const name = [user?.firstname, user?.lastname].filter(Boolean).join(' ')
  return name || user?.username || 'User'
}

export function UserAvatar({
  user,
  size = 'sm',
  decolorize = false,
  deputy = false,
  selected = false,
  onClick,
}: UserAvatarProps) {
  const dimensions = sizes[size]
  const roleId = user?.role_ID ?? 0
  const bcolor = user?.bcolor || '#424242'
  const clickable = Boolean(onClick)

  return (
    <Box
      component={clickable ? 'button' : 'span'}
      type={clickable ? 'button' : undefined}
      title={displayName(user)}
      aria-label={displayName(user)}
      aria-pressed={clickable ? selected : undefined}
      onClick={onClick}
      sx={{
        ...dimensions,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 0,
        p: 0,
        m: 0,
        cursor: clickable ? 'pointer' : 'default',
        borderRadius: roleRadius[roleId] ?? '50%',
        bgcolor: deputy ? 'transparent' : bcolor,
        background: deputy
          ? `repeating-linear-gradient(135deg, ${bcolor}bf, ${bcolor}bf 10px, ${bcolor}7f 10px, ${bcolor}7f 20px)`
          : undefined,
        color: user?.color || '#fff',
        fontWeight: boldRoles.has(roleId) ? 800 : 600,
        fontFamily: 'inherit',
        lineHeight: 1,
        flexShrink: 0,
        appearance: 'none',
        WebkitAppearance: 'none',
        filter: decolorize ? 'saturate(23%)' : undefined,
        boxShadow: selected
          ? (theme) => `0 0 0 3px ${theme.palette.info.main}, 0 0 0 5px #fff`
          : undefined,
        transition: 'transform .2s, box-shadow .2s',
        '&:hover': {
          transform: 'scale(1.14) translateY(-2px)',
          boxShadow: (theme) =>
            selected
              ? `0 0 0 3px ${theme.palette.info.main}, 0 1px 4px rgba(0,0,0,0.88)`
              : `0 1px 4px rgba(0,0,0,0.88), 0 0 0 2px ${theme.palette.merkur.darkGray}`,
        },
      }}
    >
      {initialsFor(user)}
    </Box>
  )
}

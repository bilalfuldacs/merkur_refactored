import { useCallback, useEffect, useMemo, useState } from 'react'
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined'
import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CalendarViewWeekOutlinedIcon from '@mui/icons-material/CalendarViewWeekOutlined'
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { ApiError, getMyProfile, updateMyPreferences } from '@/api'
import type { AuthUser, NotificationPreference, ProfileLogin, ProfileStake } from '@/api'
import { useAuth } from '@/auth'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'
import { ChangePasswordDialog } from '@/components/profile'
import { AppButton, AppTextField } from '@/components/ui'
import { UserAvatar } from '@/components/user'
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

const ENTITLEMENTS: {
  key:
    | 'may_create-update_items'
    | 'may_delete_items'
    | 'may_create-update-delete_system-items'
    | 'may_use_tlp-red'
    | 'may_access_unsubscribed-markets'
  label: string
  tlp?: boolean
}[] = [
  { key: 'may_create-update_items', label: 'Create and update items' },
  { key: 'may_delete_items', label: 'Delete items' },
  { key: 'may_create-update-delete_system-items', label: 'Create, update and delete system items' },
  { key: 'may_use_tlp-red', label: 'Use TLP:RED items', tlp: true },
  { key: 'may_access_unsubscribed-markets', label: 'Access unsubscribed markets' },
]

function toColorInput(value: string | null | undefined, fallback: string): string {
  const raw = (value ?? '').trim() || fallback
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
    return raw
  }
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    return `#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`
  }
  return fallback
}

function notificationValue(user: AuthUser | null): NotificationPreference {
  return user?.notifications === 'daily' || user?.notifications === 'weekly' ? user.notifications : 'off'
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Box>
      <Typography component="label" htmlFor={id} sx={{ display: 'block', fontSize: 13, mb: 0.5 }}>
        {label}
      </Typography>
      <Box
        component="input"
        id={id}
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          width: 56,
          height: 40,
          p: 0,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'transparent',
          cursor: 'pointer',
        }}
      />
    </Box>
  )
}

function StakeChips({
  stakes,
  onOpen,
}: {
  stakes: ProfileStake[]
  onOpen: (id: number) => void
}) {
  if (stakes.length === 0) {
    return (
      <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>none</Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {stakes.map((stake) => (
        <Chip
          key={`${stake.jurisdiction_ID}-${stake.as_deputy ? 'd' : 'p'}`}
          variant="outlined"
          clickable
          onClick={() => onOpen(stake.jurisdiction_ID)}
          label={`${stake.flag ? `${stake.flag} ` : ''}${stake.iso3166 ?? ''} ${stake.segment_name ?? ''}`.trim()}
        />
      ))}
    </Box>
  )
}

export default function ProfilePage() {
  const { navigate } = useAppPath()
  const { user, signOut, applyUser } = useAuth()
  const [profileUser, setProfileUser] = useState<AuthUser | null>(user)
  const [stakes, setStakes] = useState<ProfileStake[]>([])
  const [logins, setLogins] = useState<ProfileLogin[]>([])
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [jobtitle, setJobtitle] = useState(user?.jobtitle ?? '')
  const [savedJobtitle, setSavedJobtitle] = useState(user?.jobtitle ?? '')
  const [bcolor, setBcolor] = useState(toColorInput(user?.bcolor, '#424242'))
  const [color, setColor] = useState(toColorInput(user?.color, '#ffffff'))
  const [savedBcolor, setSavedBcolor] = useState(toColorInput(user?.bcolor, '#424242'))
  const [savedColor, setSavedColor] = useState(toColorInput(user?.color, '#ffffff'))
  const [savingColors, setSavingColors] = useState(false)
  const [savingJob, setSavingJob] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const applyProfileUser = useCallback(
    (next: AuthUser) => {
      setProfileUser(next)
      applyUser(next)
      setJobtitle(next.jobtitle ?? '')
      setSavedJobtitle(next.jobtitle ?? '')
      const nextBg = toColorInput(next.bcolor, '#424242')
      const nextFg = toColorInput(next.color, '#ffffff')
      setBcolor(nextBg)
      setColor(nextFg)
      setSavedBcolor(nextBg)
      setSavedColor(nextFg)
    },
    [applyUser],
  )

  useEffect(() => {
    document.title = 'My Profile | MERKURflow'
    return () => {
      document.title = 'MERKURflow'
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void getMyProfile()
      .then((payload) => {
        if (cancelled) {
          return
        }
        applyProfileUser(payload.user)
        setStakes(payload.stakes)
        setLogins(payload.logins)
        setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          setLoaded(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [applyProfileUser])

  const firstname = profileUser?.firstname?.trim() || 'there'
  const role = profileUser?.role
  const needsSubscriptions = Boolean(role?.needs_subscriptions)
  const canUseTlpRed = Boolean(role?.['may_use_tlp-red'])
  const primaryStakes = useMemo(() => stakes.filter((stake) => !stake.as_deputy), [stakes])
  const deputyStakes = useMemo(() => stakes.filter((stake) => stake.as_deputy), [stakes])
  const colorsDirty = bcolor !== savedBcolor || color !== savedColor
  const jobDirty = jobtitle !== savedJobtitle
  const previewUser = useMemo(
    () => (profileUser ? { ...profileUser, bcolor, color } : null),
    [profileUser, bcolor, color],
  )

  async function saveColors() {
    setSavingColors(true)
    setNotice(null)
    try {
      const result = await updateMyPreferences({ bcolor, color })
      applyProfileUser(result.user)
    } catch (caught) {
      setNotice({
        kind: 'error',
        text: caught instanceof ApiError ? caught.message : 'Your colors could not be saved.',
      })
    } finally {
      setSavingColors(false)
    }
  }

  async function saveJob() {
    setSavingJob(true)
    setNotice(null)
    try {
      const result = await updateMyPreferences({ jobtitle })
      applyProfileUser(result.user)
    } catch (caught) {
      setNotice({
        kind: 'error',
        text: caught instanceof ApiError ? caught.message : 'Your job title could not be saved.',
      })
    } finally {
      setSavingJob(false)
    }
  }

  async function saveNotifications(value: NotificationPreference) {
    setNotice(null)
    try {
      const result = await updateMyPreferences({ notifications: value })
      applyProfileUser(result.user)
    } catch (caught) {
      setNotice({
        kind: 'error',
        text: caught instanceof ApiError ? caught.message : 'Your notification setting could not be saved.',
      })
    }
  }

  async function handleLogout() {
    await signOut()
    navigate(APP_PATHS.home)
  }

  return (
    <PageBackground>
      <AppHeader variant="brand" />
      <Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3, lg: 4 }, py: { xs: 1.5, md: 2 } }}>
        <Box sx={{ maxWidth: 1100, mx: 'auto', width: '100%' }}>
          <Box component="nav" aria-label="Breadcrumb" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3, fontSize: 13 }}>
            <Box component="button" type="button" onClick={() => navigate(APP_PATHS.home)} sx={crumbSx}>
              Start
            </Box>
            <Box component="span" color="text.secondary">
              /
            </Box>
            <Box component="span">My Profile</Box>
          </Box>

          <Typography
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: { xs: 24, md: 30 }, lineHeight: 1.15, mb: 2 }}
          >
            <PersonOutlinedIcon sx={{ color: 'merkur.pink', fontSize: 28 }} />
            My Profile
          </Typography>

          {failed ? (
            <Typography color="text.secondary">Your profile could not be loaded.</Typography>
          ) : !loaded ? null : (
            <>
              <Typography
                component="h2"
                sx={{ textAlign: 'center', fontWeight: 300, fontSize: { xs: 32, md: 48 }, mb: 3 }}
              >
                Hello, {firstname}! 👋
              </Typography>

              {notice ? (
                <Alert severity={notice.kind} sx={{ mb: 2 }} onClose={() => setNotice(null)}>
                  {notice.text}
                </Alert>
              ) : null}

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  py: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    gap: { xs: 2, sm: 4 },
                    flexWrap: 'wrap',
                  }}
                >
                  <ColorField id="avatar-background" label="Background" value={bcolor} onChange={setBcolor} />
                  <UserAvatar user={previewUser} size="xl" decolorize={Boolean(profileUser?.decolorize_avatars)} />
                  <ColorField id="avatar-foreground" label="Foreground" value={color} onChange={setColor} />
                </Box>
                <AppButton
                  size="medium"
                  color="secondary"
                  disabled={!colorsDirty || savingColors}
                  startIcon={<BrushOutlinedIcon />}
                  onClick={() => void saveColors()}
                  sx={{ px: 3, py: 1, fontSize: 15, minWidth: 200, borderRadius: 2 }}
                >
                  {savingColors ? 'Saving…' : 'Set My Colors'}
                </AppButton>
              </Box>
              <Typography sx={{ mt: 3, mb: 3, fontSize: 18 }}>
                This is your MERKURflow Profile.{' '}
                <Box component="span" sx={{ fontWeight: 800 }}>
                  Make it your own!
                </Box>{' '}
                Show Your Colors—your profile information will be visible in all Community features. Also, remember to keep
                your Job Title up-to-date… then everybody will know what you are up to. 🙂
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <AppTextField label="First Name" value={profileUser?.firstname ?? ''} slotProps={{ input: { readOnly: true } }} />
                <AppTextField label="Last Name" value={profileUser?.lastname ?? ''} slotProps={{ input: { readOnly: true } }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <AppTextField
                  label="My Job"
                  value={jobtitle}
                  onChange={(event) => setJobtitle(event.target.value)}
                />
                <AppButton
                  size="small"
                  disabled={!jobDirty || savingJob}
                  startIcon={<WorkOutlineOutlinedIcon />}
                  onClick={() => void saveJob()}
                  sx={{ flexShrink: 0, alignSelf: { sm: 'center' }, mt: { sm: 1 } }}
                >
                  {savingJob ? 'Saving…' : 'Set My Job'}
                </AppButton>
              </Box>
              <AppTextField
                label="E-Mail Address"
                value={profileUser?.username ?? ''}
                startIcon={<AlternateEmailOutlinedIcon />}
                slotProps={{ input: { readOnly: true } }}
                sx={{ mb: 4 }}
              />

              <Typography
                component="h2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: 22, mb: 1 }}
              >
                <SettingsOutlinedIcon sx={{ color: 'info.main' }} />
                Your MERKURflow Settings
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 2 }}>
                <Box>
                  <Typography
                    component="h3"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: 18, mt: 2, mb: 1.5 }}
                  >
                    Access
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <AppButton size="small" startIcon={<LogoutOutlinedIcon />} onClick={() => void handleLogout()}>
                      Log out
                    </AppButton>
                    <AppButton
                      size="small"
                      color="secondary"
                      startIcon={<KeyOutlinedIcon />}
                      onClick={() => setPasswordOpen(true)}
                    >
                      Change Password
                    </AppButton>
                  </Box>
                </Box>
                <Box>
                  <Typography
                    component="h3"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: 18, mt: 2, mb: 1.5 }}
                  >
                    E-Mail Notifications
                  </Typography>
                  <RadioGroup
                    row
                    value={notificationValue(profileUser)}
                    onChange={(_event, value) => void saveNotifications(value as NotificationPreference)}
                    sx={{ mb: 1.5 }}
                  >
                    <FormControlLabel
                      value="off"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                          <EventBusyOutlinedIcon sx={{ fontSize: 18 }} />
                          off
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="daily"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                          <CalendarMonthOutlinedIcon sx={{ fontSize: 18 }} />
                          daily
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="weekly"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 700 }}>
                          <CalendarViewWeekOutlinedIcon sx={{ fontSize: 18 }} />
                          weekly
                        </Box>
                      }
                    />
                  </RadioGroup>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {[
                      'Changes to Watched Items',
                      'New Community Mentions',
                      'Due Tasks',
                    ].map((item) => (
                      <Box
                        key={item}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          px: 1.5,
                          py: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          bgcolor: 'common.white',
                        }}
                      >
                        <CheckCircleOutlinedIcon sx={{ color: 'success.main', fontSize: 18 }} />
                        {item}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <Box>
                  <Typography
                    component="h3"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: 18, mt: 2, mb: 1.5 }}
                  >
                    <VerifiedUserOutlinedIcon sx={{ color: 'info.main' }} />
                    Your Role & Entitlements
                  </Typography>
                  <AppTextField value={role?.name ?? ''} slotProps={{ input: { readOnly: true } }} sx={{ mb: 1 }} />
                  {role?.description ? (
                    <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>{role.description}</Typography>
                  ) : null}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {ENTITLEMENTS.map((item) => {
                      const granted = Boolean(role?.[item.key])
                      return (
                        <Box
                          key={item.key}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.5,
                            py: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            bgcolor: 'common.white',
                            textDecoration: granted ? 'none' : 'line-through',
                            color: granted ? 'text.primary' : 'text.secondary',
                          }}
                        >
                          {granted ? (
                            <CheckCircleOutlinedIcon sx={{ color: 'success.main', fontSize: 18 }} />
                          ) : (
                            <CancelOutlinedIcon sx={{ color: 'error.main', fontSize: 18 }} />
                          )}
                          {item.tlp ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              Use
                              <Chip size="small" color="error" label="TLP:RED" />
                              items
                            </Box>
                          ) : (
                            item.label
                          )}
                        </Box>
                      )
                    })}
                  </Box>
                </Box>
                <Box>
                  <Typography
                    component="h3"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, fontSize: 18, mt: 2, mb: 1.5 }}
                  >
                    <HubOutlinedIcon sx={{ color: 'info.main' }} />
                    Your Stakes
                  </Typography>
                  {needsSubscriptions ? (
                    <>
                      <Typography sx={{ mb: 1 }}>
                        Your <Box component="strong">Jurisdictions</Box>
                      </Typography>
                      <StakeChips
                        stakes={primaryStakes}
                        onOpen={(id) => navigate(`/tables/jurisdictions?id=${id}`)}
                      />
                      {canUseTlpRed ? (
                        <>
                          <Typography sx={{ mt: 2, mb: 1, color: 'error.main' }}>
                            Your <Box component="strong">Jurisdictions</Box> as Deputy
                          </Typography>
                          <StakeChips
                            stakes={deputyStakes}
                            onOpen={(id) => navigate(`/tables/jurisdictions?id=${id}`)}
                          />
                        </>
                      ) : null}
                    </>
                  ) : (
                    <Typography>
                      Subscriptions apply to <Box component="strong">Product Organization</Box> and{' '}
                      <Box component="strong">Sales</Box> only.
                    </Typography>
                  )}
                </Box>
              </Box>

              <Typography
                component="h2"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800, fontSize: 22, mt: 2, mb: 1 }}
              >
                <ShieldOutlinedIcon sx={{ color: 'info.main' }} />
                MERKURflow Security
              </Typography>
              <Typography sx={{ mb: 2 }}>
                Your most recent MERKURflow sessions are shown below (all times UTC). —{' '}
                <Box component="strong">Not you?</Box> Please notify Product Management immediately so we can take
                appropriate steps.
              </Typography>
              <Box sx={{ overflowX: 'auto', mb: 4, bgcolor: 'common.white', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Client IP</TableCell>
                      <TableCell>User Agent</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logins.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <Typography sx={{ color: 'text.secondary', fontStyle: 'italic' }}>No sessions yet.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logins.map((login, index) => (
                        <TableRow key={`${login.when ?? 'unknown'}-${index}`}>
                          <TableCell>{login.when ? `${login.when} UTC` : '—'}</TableCell>
                          <TableCell>{login.IP ?? '—'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontSize: 12 }}>
                              {login.agent || '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}
        </Box>
      </Box>
      <ChangePasswordDialog
        open={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onChanged={() =>
          setNotice({
            kind: 'success',
            text: 'The new password is now active. Please update your password manager if applicable.',
          })
        }
      />
      <AppFooter />
    </PageBackground>
  )
}

import { useCallback, useId, useMemo, useState } from 'react'
import type { MouseEvent } from 'react'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { AuthUser } from '@/api'
import { APP_PATHS, useAppPath } from '@/routing'
import { useSearch } from '@/search'
import type { NavChild, NavItem, NavLabelBreakpoint, NavLinkItem } from '@/config/navigation'
import { getMainNavigation, NAV_BREAKPOINTS } from '@/config/navigation'
import { UserAvatar } from '@/components/user'

type AppNavProps = {
  user: AuthUser | null
  onLogout: () => void | Promise<void>
}

function isDivider(item: NavChild): item is Extract<NavChild, { type: 'divider' }> {
  return item.type === 'divider'
}

function navItemIsActive(item: NavItem, path: string): boolean {
  if (item.path && (path === item.path || (item.path !== '/' && path.startsWith(`${item.path}/`)))) {
    return true
  }

  return Boolean(
    item.children?.some(
      (child) =>
        !isDivider(child) &&
        Boolean(child.path) &&
        (path === child.path || (child.path !== '/' && path.startsWith(`${child.path}/`))),
    ),
  )
}

function labelSx(breakpoint?: NavLabelBreakpoint) {
  if (!breakpoint) {
    return undefined
  }

  const minWidth = NAV_BREAKPOINTS[breakpoint]

  return {
    display: 'none',
    [`@media (min-width:${minWidth}px)`]: { display: 'inline' },
  }
}

function menuIdFor(prefix: string, itemId: string) {
  return `${prefix}-${itemId}`
}

export function AppNav({ user, onLogout }: AppNavProps) {
  const { path, navigate } = useAppPath()
  const { openFind } = useSearch()
  const isDesktop = useMediaQuery(`(min-width:${NAV_BREAKPOINTS.desktop}px)`, {
    noSsr: true,
  })
  const items = useMemo(() => getMainNavigation(user), [user])
  const idPrefix = useId()
  const drawerId = `${idPrefix}-drawer`
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)

  const closeMenu = useCallback(() => {
    setOpenMenuId(null)
    setMenuAnchor(null)
  }, [])

  const toggleMenu = useCallback(
    (id: string, event: MouseEvent<HTMLElement>) => {
      event.preventDefault()
      if (openMenuId === id) {
        setOpenMenuId(null)
        setMenuAnchor(null)
        return
      }

      setOpenMenuId(id)
      setMenuAnchor(event.currentTarget)
    },
    [openMenuId],
  )

  const selectItem = useCallback(
    (item: NavLinkItem) => {
      closeMenu()
      setMobileOpen(false)
      if (item.action === 'logout') {
        void onLogout()
        navigate(APP_PATHS.home)
        return
      }
      if (item.path) {
        navigate(item.path)
      }
    },
    [closeMenu, navigate, onLogout],
  )

  const searchButton = (
    <IconButton
      aria-label="Search"
      color="inherit"
      size="small"
      onClick={() => openFind()}
      sx={{ color: 'common.white' }}
    >
      <SearchIcon />
    </IconButton>
  )

  const avatar = (
    <Box sx={{ ml: 0.5 }}>
      <UserAvatar
        user={user}
        decolorize={Boolean(user?.decolorize_avatars)}
        onClick={() => navigate(APP_PATHS.profile)}
      />
    </Box>
  )

  if (!isDesktop) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
        <IconButton
          aria-label="Open menu"
          aria-controls={mobileOpen ? drawerId : undefined}
          aria-expanded={mobileOpen}
          aria-haspopup="dialog"
          onClick={() => setMobileOpen(true)}
          sx={{ color: 'merkur.yellow', mr: 0.5 }}
        >
          <MenuIcon />
        </IconButton>
        {searchButton}
        {avatar}
        <Drawer
          anchor="right"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          slotProps={{
            paper: {
              id: drawerId,
              'aria-label': 'Main menu',
              sx: {
                pt: 'env(safe-area-inset-top, 0px)',
                pb: 'env(safe-area-inset-bottom, 0px)',
              },
            },
          }}
        >
          <Box sx={{ width: 300, pt: 1 }}>
            <List>
              {items.map((item) => (
                <MobileNavItem
                  key={item.id}
                  item={item}
                  expanded={mobileExpanded === item.id}
                  onToggle={() =>
                    setMobileExpanded((current) => (current === item.id ? null : item.id))
                  }
                  onSelect={selectItem}
                />
              ))}
            </List>
          </Box>
        </Drawer>
      </Box>
    )
  }

  const openItem = items.find((item) => item.id === openMenuId)

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flex: 1,
          ml: 0.5,
          minWidth: 0,
        }}
      >
        <Box
          component="nav"
          aria-label="Main"
          sx={{
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
          }}
        >
          {items.map((item) => {
            const Icon = item.icon
            const hasChildren = Boolean(item.children?.length)
            const isOpen = openMenuId === item.id
            const isActive = navItemIsActive(item, path)
            const controlsId = hasChildren ? menuIdFor(idPrefix, item.id) : undefined

            return (
              <Button
                key={item.id}
                color="inherit"
                aria-label={item.label}
                aria-haspopup={hasChildren ? 'menu' : undefined}
                aria-controls={isOpen ? controlsId : undefined}
                aria-expanded={hasChildren ? isOpen : undefined}
                onClick={
                  hasChildren
                    ? (event) => toggleMenu(item.id, event)
                    : item.path
                      ? () => navigate(item.path as string)
                      : undefined
                }
                startIcon={<Icon fontSize="small" />}
                endIcon={
                  hasChildren ? (
                    <KeyboardArrowDownIcon sx={{ fontSize: 18 }} aria-hidden />
                  ) : undefined
                }
                sx={{
                  color: isActive ? 'secondary.main' : 'merkur.yellow',
                  bgcolor: isActive ? 'rgba(255,255,255,0.92)' : 'transparent',
                  fontWeight: item.emphasize ? 800 : 600,
                  px: 1,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  borderRadius: 0,
                  borderBottom: isActive ? '3px solid' : '3px solid transparent',
                  borderColor: isActive ? 'info.main' : 'transparent',
                  '& .MuiButton-startIcon': { mr: item.labelFrom ? 0.5 : 0.75 },
                  '&:hover': { bgcolor: isActive ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.08)' },
                }}
              >
                <Box component="span" sx={labelSx(item.labelFrom)}>
                  {item.label}
                </Box>
              </Button>
            )
          })}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, pl: 1 }}>
          {searchButton}
          {avatar}
        </Box>
      </Box>

      {openItem?.children ? (
        <Menu
          id={menuIdFor(idPrefix, openItem.id)}
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          slotProps={{
            paper: {
              sx: { minWidth: 240, maxHeight: 440, mt: 0.5 },
            },
            list: {
              'aria-label': openItem.label,
            },
          }}
        >
          {openItem.children.map((child, index) =>
            isDivider(child) ? (
              <Divider key={`${openItem.id}-divider-${index}`} />
            ) : (
              <MenuItem key={child.id} onClick={() => selectItem(child)}>
                {child.icon ? (
                  <ListItemIcon>
                    <child.icon fontSize="small" />
                  </ListItemIcon>
                ) : null}
                <ListItemText
                  primary={child.label}
                  secondary={child.description}
                  slotProps={{
                    primary: {
                      sx: { fontWeight: child.emphasize ? 800 : 500 },
                    },
                  }}
                />
              </MenuItem>
            ),
          )}
        </Menu>
      ) : null}
    </>
  )
}

function MobileNavItem({
  item,
  expanded,
  onToggle,
  onSelect,
}: {
  item: NavItem
  expanded: boolean
  onToggle: () => void
  onSelect: (item: NavLinkItem) => void
}) {
  const Icon = item.icon
  const hasChildren = Boolean(item.children?.length)
  const panelId = `${item.id}-submenu`

  if (!hasChildren) {
    return (
      <ListItemButton onClick={() => onSelect({ id: item.id, label: item.label, path: item.path })}>
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          slotProps={{ primary: { sx: { fontWeight: item.emphasize ? 800 : 500 } } }}
        />
      </ListItemButton>
    )
  }

  return (
    <>
      <ListItemButton
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={panelId}
      >
        <ListItemIcon>
          <Icon />
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          slotProps={{ primary: { sx: { fontWeight: item.emphasize ? 800 : 500 } } }}
        />
        {expanded ? <ExpandLessIcon aria-hidden /> : <ExpandMoreIcon aria-hidden />}
      </ListItemButton>
      <Collapse id={panelId} in={expanded} timeout="auto" unmountOnExit>
        <List disablePadding>
          {item.children?.map((child, index) =>
            isDivider(child) ? (
              <Divider key={`${item.id}-divider-${index}`} />
            ) : (
              <ListItemButton
                key={child.id}
                sx={{ pl: 4 }}
                onClick={() => onSelect(child)}
              >
                {child.icon ? (
                  <ListItemIcon>
                    <child.icon fontSize="small" />
                  </ListItemIcon>
                ) : null}
                <ListItemText
                  primary={child.label}
                  secondary={child.description}
                  slotProps={{
                    primary: {
                      sx: { fontWeight: child.emphasize ? 800 : 500 },
                    },
                  }}
                />
              </ListItemButton>
            ),
          )}
        </List>
      </Collapse>
    </>
  )
}

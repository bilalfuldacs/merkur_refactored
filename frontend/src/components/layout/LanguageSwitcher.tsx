import { useState } from 'react'
import type { MouseEvent } from 'react'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { useI18n } from '@/i18n'

export function LanguageSwitcher({ tone = 'brand' }: { tone?: 'light' | 'brand' }) {
  const { locale, locales, setLocale, t } = useI18n()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const current = locales.find((item) => item.code === locale) ?? locales[0]
  const label = t('language.label', 'Language')

  function openMenu(event: MouseEvent<HTMLButtonElement>) {
    setAnchor(event.currentTarget)
  }

  function choose(code: typeof locale) {
    setLocale(code)
    setAnchor(null)
  }

  return (
    <>
      <Button
        color="inherit"
        size="small"
        aria-label={`${label}: ${current.native}`}
        aria-haspopup="menu"
        aria-expanded={anchor ? true : undefined}
        onClick={openMenu}
        startIcon={<LanguageOutlinedIcon fontSize="small" />}
        sx={{
          color: tone === 'brand' ? 'merkur.yellow' : 'secondary.main',
          fontWeight: 800,
          minWidth: 0,
          px: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {current.code.toUpperCase()}
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{
          list: { 'aria-label': label },
        }}
      >
        {locales.map((item) => (
          <MenuItem
            key={item.code}
            selected={item.code === locale}
            onClick={() => choose(item.code)}
          >
            {item.native}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { AppFooter } from './AppFooter'
import { AppHeader } from './AppHeader'
import type { AppHeaderProps } from './AppHeader'
import { PageBackground } from './PageBackground'

export type AuthShellProps = {
  children: ReactNode
  headerVariant?: AppHeaderProps['variant']
}

export function AuthShell({ children, headerVariant = 'light' }: AuthShellProps) {
  return (
    <PageBackground>
      <AppHeader variant={headerVariant} />
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          py: { xs: 4, md: 6 },
        }}
      >
        {children}
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

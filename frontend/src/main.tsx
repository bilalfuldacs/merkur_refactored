import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './auth'
import { I18nProvider } from './i18n'
import { LoadingProvider } from './loading'
import { router } from './routing/router'
import { theme } from './theme'
import { registerIcePwa } from './pwa'

registerIcePwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <I18nProvider>
        <AuthProvider>
          <LoadingProvider>
            <RouterProvider router={router} />
          </LoadingProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
)

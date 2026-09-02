import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import App from './App.tsx'
import { AuthProvider } from './auth'
import { LoadingProvider } from './loading'
import { AppPathProvider } from './routing'
import { theme } from './theme'
import { registerIcePwa } from './pwa'

registerIcePwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppPathProvider>
        <AuthProvider>
          <LoadingProvider>
            <App />
          </LoadingProvider>
        </AuthProvider>
      </AppPathProvider>
    </ThemeProvider>
  </StrictMode>,
)

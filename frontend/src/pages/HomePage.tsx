import Box from '@mui/material/Box'
import { MerkurLogo } from '@/components/brand'
import { HomeColumns, HomeLaunchpad, HomeSearch, OnlineNow } from '@/components/home'
import { AppFooter, AppHeader, PageBackground } from '@/components/layout'

export default function HomePage() {
  return (
    <PageBackground sx={{ height: '100vh', overflow: 'hidden' }}>
      <AppHeader variant="brand" />
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: { xs: 'auto', lg: 'hidden' },
          px: { xs: 3, md: 8, lg: 12 },
        }}
      >
        <Box sx={{ flexShrink: 0, pt: { xs: 2, md: 3 } }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <MerkurLogo
              variant="positive"
              alt="MERKURflow"
              sx={{
                height: 'auto',
                width: { xs: '92%', sm: '80%', md: '60%' },
                maxWidth: 920,
                mx: 'auto',
              }}
            />
          </Box>
          <OnlineNow />
        </Box>
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            px: { xs: 2, md: 5, lg: 7 },
          }}
        >
          <Box sx={{ flexShrink: 0 }}>
            <HomeSearch />
            <HomeLaunchpad />
          </Box>
          <HomeColumns />
        </Box>
      </Box>
      <AppFooter />
    </PageBackground>
  )
}

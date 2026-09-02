import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export function ReportsAboutCard() {
  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        bgcolor: 'background.paper',
        p: 2.5,
        position: { md: 'sticky' },
        top: { md: 80 },
      }}
    >
      <Typography
        component="h2"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 800,
          fontSize: 18,
          mb: 1.5,
        }}
      >
        <InfoOutlinedIcon sx={{ color: 'info.main' }} />
        About Reports
      </Typography>
      <Typography>
        This page contains <Box component="strong">information synthesized</Box> in various ways.
      </Typography>
    </Box>
  )
}

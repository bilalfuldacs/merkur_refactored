import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import Box from '@mui/material/Box'
import InputBase from '@mui/material/InputBase'
import Typography from '@mui/material/Typography'

export function HelpSearch({
  value,
  resultCount,
  onChange,
}: {
  value: string
  resultCount: number
  onChange: (value: string) => void
}) {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', mb: 5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2.5,
          height: 56,
          borderRadius: 999,
          bgcolor: 'rgba(255,255,255,0.92)',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 10px 30px rgba(2, 32, 82, 0.06)',
        }}
      >
        <SearchOutlinedIcon sx={{ color: 'text.secondary' }} />
        <InputBase
          fullWidth
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Try “version status”, “roles” or “NULL”"
          inputProps={{ 'aria-label': 'Search help' }}
          sx={{ fontSize: 16 }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 1, px: 1 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Showing the most useful answers first</Typography>
        <Typography sx={{ color: 'info.main', fontSize: 13, fontWeight: 700 }}>
          {resultCount} answer{resultCount === 1 ? '' : 's'}
        </Typography>
      </Box>
    </Box>
  )
}

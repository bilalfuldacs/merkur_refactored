import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export function EmptyCell({ value }: { value: string | null | undefined }) {
  const trimmed = value?.trim() ?? ''

  if (trimmed === '') {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          px: 1,
          py: 0.15,
          borderRadius: 8,
          bgcolor: 'grey.200',
          color: 'text.secondary',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {value == null ? 'NULL' : 'EMPTY'}
      </Box>
    )
  }

  return <Typography component="span">{trimmed}</Typography>
}

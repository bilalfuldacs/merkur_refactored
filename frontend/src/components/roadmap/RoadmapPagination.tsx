import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'
import { AppTextField } from '@/components/ui'

export const ROADMAP_PAGE_SIZES = [10, 25, 50, 100]

export function RoadmapPagination({
  page,
  pageSize,
  total,
  itemLabel,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  itemLabel: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        py: 1.5,
      }}
    >
      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
        {total === 0
          ? `No ${itemLabel}s`
          : `Showing ${from}–${to} of ${total} ${itemLabel}${total === 1 ? '' : 's'}`}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
        <AppTextField
          select
          size="small"
          label="Per page"
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          fullWidth={false}
          sx={{ minWidth: 120, width: 120 }}
        >
          {ROADMAP_PAGE_SIZES.map((size) => (
            <MenuItem key={size} value={String(size)}>
              {size}
            </MenuItem>
          ))}
        </AppTextField>
        {lastPage > 1 ? (
          <Pagination
            page={page}
            count={lastPage}
            onChange={(_event, next) => onPageChange(next)}
            color="primary"
            shape="rounded"
            size="small"
            showFirstButton
            showLastButton
          />
        ) : null}
      </Box>
    </Box>
  )
}

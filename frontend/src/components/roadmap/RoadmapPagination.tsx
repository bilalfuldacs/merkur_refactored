import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'
import { AppTextField } from '@/components/ui'
import { useI18n } from '@/i18n'

export const ROADMAP_PAGE_SIZES = [10, 25, 50, 100]

export function RoadmapPagination({
  page,
  pageSize,
  total,
  kind,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  kind: 'game' | 'version'
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}) {
  const { t } = useI18n()
  const lastPage = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const items =
    kind === 'game'
      ? total === 1
        ? t('roadmap.game', 'game')
        : t('roadmap.manyGames', '{count} games', { count: '' }).trim()
      : total === 1
        ? t('roadmap.version', 'version')
        : t('roadmap.manyVersions', '{count} versions', { count: '' }).trim()

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
          ? kind === 'game'
            ? t('roadmap.noGamesPage', 'No games')
            : t('roadmap.noVersionsPage', 'No versions')
          : t('roadmap.showing', 'Showing {from}–{to} of {total} {items}', { from, to, total, items })}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
        <AppTextField
          select
          size="small"
          label={t('roadmap.perPage', 'Per page')}
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

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ProductVersion } from '@/api'
import { DirectoryList } from '@/components/peopleMarkets/DirectoryList'
import { versionMeta, versionTitle } from './format'
import { StatusBadge } from './StatusBadge'

export function VersionList({
  title,
  total,
  versions,
  selectedId,
  onSelect,
}: {
  title: string
  total: number
  versions: ProductVersion[]
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  return (
    <DirectoryList title={title} totalLabel={`${total} total`} shown={versions.length}>
      {versions.length === 0 ? (
        <Typography sx={{ px: 2, py: 2, color: 'text.secondary' }}>No versions match these filters.</Typography>
      ) : (
        versions.map((version) => (
          <VersionListItem
            key={version.ID}
            version={version}
            selected={selectedId === version.ID}
            onClick={() => onSelect(version.ID)}
          />
        ))
      )}
    </DirectoryList>
  )
}

function VersionListItem({
  version,
  selected,
  onClick,
}: {
  version: ProductVersion
  selected: boolean
  onClick: () => void
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        border: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
        px: 2,
        py: 1.35,
        cursor: 'pointer',
        bgcolor: selected ? 'secondary.main' : 'transparent',
        color: selected ? 'common.white' : 'text.primary',
        font: 'inherit',
        '&:hover': {
          bgcolor: selected ? 'secondary.main' : 'rgba(2, 32, 82, 0.04)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography
          sx={{
            fontWeight: version.feat_in_products_pano ? 800 : 700,
            fontSize: 15,
            color: 'inherit',
            lineHeight: 1.3,
            minWidth: 0,
          }}
        >
          {versionTitle(version)}
        </Typography>
        {version.status ? <StatusBadge status={version.status} /> : null}
      </Box>
      <Typography sx={{ fontSize: 13, color: selected ? 'rgba(255,255,255,0.78)' : 'text.secondary', mt: 0.35 }}>
        {versionMeta(version)}
      </Typography>
    </Box>
  )
}

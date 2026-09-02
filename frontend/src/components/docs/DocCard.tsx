import { useState } from 'react'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import type { StaticDoc } from '@/api'
import { openStaticDocPdf, staticDocThumbnailPath } from '@/api'
import { AppButton } from '@/components/ui'
import { completenessLabel, creatorName, formatDocDate, formatDocSize, useAuthFileUrl } from './format'

export function DocCard({
  doc,
  onEdit,
  onDelete,
}: {
  doc: StaticDoc
  onEdit: () => void
  onDelete: () => void
}) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [opening, setOpening] = useState(false)
  const thumbSrc = useAuthFileUrl(doc.has_thumbnail ? staticDocThumbnailPath(doc.id) : null)
  const label = completenessLabel(doc.is_complete)
  const size = formatDocSize(doc.file_size)
  const kind = label ? `${label} · ` : ''

  async function openPdf() {
    if (!doc.has_pdf || opening) {
      return
    }
    setOpening(true)
    try {
      await openStaticDocPdf(doc.id)
    } finally {
      setOpening(false)
    }
  }

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 3,
        bgcolor: 'common.white',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 8px 24px rgba(2, 32, 82, 0.08)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 16px 32px rgba(2, 32, 82, 0.14)',
        },
      }}
    >
      <Box sx={{ position: 'relative', height: 180, bgcolor: 'secondary.main', overflow: 'hidden' }}>
        {thumbSrc ? (
          <Box
            component="img"
            src={thumbSrc}
            alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', color: 'common.white' }}>
            <MenuBookOutlinedIcon sx={{ fontSize: 48, opacity: 0.7 }} />
          </Box>
        )}
        {label ? (
          <Chip
            size="small"
            icon={label === 'Complete' ? <CheckCircleOutlinedIcon /> : <ContentCutOutlinedIcon />}
            label={label}
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontWeight: 700,
              bgcolor: label === 'Complete' ? 'success.main' : 'info.main',
              color: 'common.white',
              '& .MuiChip-icon': { color: 'common.white' },
            }}
          />
        ) : null}
      </Box>

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'secondary.main', lineHeight: 1.3, mb: 0.75 }}>
          {doc.title}
        </Typography>
        {doc.description ? (
          <Typography sx={{ color: 'text.secondary', fontSize: 13, flex: 1 }}>{doc.description}</Typography>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1.5 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>
            {kind}
            {size}
          </Typography>
          <AppButton
            size="small"
            disabled={!doc.has_pdf || opening}
            onClick={() => void openPdf()}
            startIcon={<VisibilityOutlinedIcon />}
          >
            {opening ? 'Opening…' : 'PDF'}
          </AppButton>
        </Box>
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1,
          borderTop: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography sx={{ color: 'text.secondary', fontSize: 12, flex: 1 }}>
          Updated {formatDocDate(doc.upload_date)}
          {creatorName(doc.creator) ? ` · ${creatorName(doc.creator)}` : ''}
        </Typography>
        {doc.can_edit || doc.can_delete ? (
          <>
            <IconButton size="small" aria-label="Document actions" onClick={(event) => setMenuAnchor(event.currentTarget)}>
              <MoreHorizOutlinedIcon fontSize="small" />
            </IconButton>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
              {doc.can_edit ? (
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null)
                    onEdit()
                  }}
                >
                  <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                  Edit
                </MenuItem>
              ) : null}
              {doc.can_delete ? (
                <MenuItem
                  onClick={() => {
                    setMenuAnchor(null)
                    onDelete()
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete
                </MenuItem>
              ) : null}
            </Menu>
          </>
        ) : null}
      </Box>
    </Box>
  )
}

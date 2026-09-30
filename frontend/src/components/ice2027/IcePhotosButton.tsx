import { useState } from 'react'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import type { IceProgressPhoto } from '@/api/ice2027'
import { useAuthFileUrl } from '@/components/docs/format'

function AuthPhoto({ path, name, kind }: { path: string; name: string; kind?: string }) {
  const src = useAuthFileUrl(path)
  const isVideo = kind === 'video' || /\.(mp4|mov|m4v|webm)($|\?)/i.test(`${name}${path}`)
  if (!src) {
    return (
      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
        {name}
      </Typography>
    )
  }
  return (
    <Box component="a" href={src} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', textDecoration: 'none' }}>
      {isVideo ? (
        <Box
          component="video"
          src={src}
          controls
          sx={{ width: '100%', height: 192, objectFit: 'cover', borderRadius: 1, bgcolor: 'common.black' }}
        />
      ) : (
        <Box
          component="img"
          src={src}
          alt={name}
          sx={{ width: '100%', height: 192, objectFit: 'cover', borderRadius: 1, bgcolor: 'action.hover' }}
        />
      )}
      <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 0.5 }}>{name}</Typography>
    </Box>
  )
}

export function IcePhotosButton({ photos, title }: { photos?: IceProgressPhoto[]; title: string }) {
  const list = (photos ?? []).filter((photo) => photo.url)
  const [open, setOpen] = useState(false)
  if (list.length === 0) {
    return (
      <Typography component="span" sx={{ color: 'text.secondary' }}>
        —
      </Typography>
    )
  }
  const videos = list.filter((photo) => photo.kind === 'video' || /\.(mp4|mov|m4v|webm)($|\?)/i.test(`${photo.name}${photo.id}`)).length
  const pictures = list.length - videos
  const label =
    videos > 0 && pictures > 0
      ? `View media (${list.length})`
      : videos > 0
        ? list.length === 1
          ? 'View video'
          : `View videos (${list.length})`
        : list.length === 1
          ? 'View picture'
          : `View pictures (${list.length})`
  return (
    <>
      <Button size="small" variant="outlined" startIcon={<ImageOutlinedIcon />} onClick={() => setOpen(true)} sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}>
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
            {list.map((photo) => (
              <AuthPhoto key={photo.id} path={photo.url} name={photo.name} kind={photo.kind} />
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

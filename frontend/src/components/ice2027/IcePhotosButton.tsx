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

function AuthPhoto({ path, name }: { path: string; name: string }) {
  const src = useAuthFileUrl(path)
  if (!src) {
    return (
      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
        {name}
      </Typography>
    )
  }
  return (
    <Box component="a" href={src} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', textDecoration: 'none' }}>
      <Box
        component="img"
        src={src}
        alt={name}
        sx={{ width: '100%', height: 192, objectFit: 'cover', borderRadius: 1, bgcolor: 'action.hover' }}
      />
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
  const label = list.length === 1 ? 'View picture' : `View pictures (${list.length})`
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
              <AuthPhoto key={photo.id} path={photo.url} name={photo.name} />
            ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import type { StaticDoc, StaticDocInput } from '@/api'
import { AppButton, AppTextField } from '@/components/ui'
import { useI18n } from '@/i18n'
import { completenessLabel } from './format'

export function DocFormDialog({
  open,
  doc,
  sections,
  saving,
  onClose,
  onSave,
}: {
  open: boolean
  doc: StaticDoc | null
  sections: string[]
  saving: boolean
  onClose: () => void
  onSave: (input: StaticDocInput) => Promise<void>
}) {
  const creating = doc === null
  const [title, setTitle] = useState('')
  const [subfolder, setSubfolder] = useState('Uploads')
  const [description, setDescription] = useState('')
  const [complete, setComplete] = useState<'complete' | 'excerpt' | 'none'>('none')
  const [pdf, setPdf] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const { t } = useI18n()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    setTitle(doc?.title ?? '')
    setSubfolder(doc?.subfolder ?? 'Uploads')
    setDescription(doc?.description ?? '')
    const label = completenessLabel(doc?.is_complete)
    setComplete(label === 'Complete' ? 'complete' : label === 'Excerpt' ? 'excerpt' : 'none')
    setPdf(null)
    setThumbnail(null)
    setError(null)
  }, [open, doc])

  async function submit() {
    const nextTitle = title.trim()
    if (!nextTitle) {
      setError(t('docs.titleRequired', 'Title is required.'))
      return
    }
    if (creating && !pdf) {
      setError(t('docs.pdfRequired', 'Please attach a PDF.'))
      return
    }
    setError(null)
    try {
      await onSave({
        title: nextTitle,
        subfolder: subfolder.trim() || 'Uploads',
        description: description.trim(),
        is_complete: complete === 'none' ? null : complete === 'complete',
        pdf,
        thumbnail,
      })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : t('docs.couldNotSave', 'The document could not be saved.'))
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800, color: 'secondary.main' }}>
        {creating ? t('docs.uploadDocument', 'Upload document') : t('docs.editDocument', 'Edit document')}
      </DialogTitle>
      <DialogContent dividers>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <AppTextField label={t('fields.title', 'Title')} value={title} onChange={(event) => setTitle(event.target.value)} sx={{ mb: 2 }} />
        <AppTextField
          label={t('docs.section', 'Section')}
          value={subfolder}
          onChange={(event) => setSubfolder(event.target.value)}
          helperText={t('docs.sectionHelp', 'Documents are grouped by section, like “The BOOK 2026”.')}
          sx={{ mb: 1 }}
        />
        {sections.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {sections.map((section) => (
              <Chip
                key={section}
                size="small"
                label={section}
                clickable
                onClick={() => setSubfolder(section)}
                sx={{ fontWeight: 700 }}
                color={section === subfolder ? 'secondary' : 'default'}
              />
            ))}
          </Box>
        ) : null}
        <AppTextField
          label={t('fields.description', 'Description')}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          multiline
          minRows={3}
          sx={{ mb: 2 }}
        />
        <AppTextField
          select
          label={t('docs.kind', 'Kind')}
          value={complete}
          onChange={(event) => setComplete(event.target.value as typeof complete)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="none">{t('docs.unspecified', 'Unspecified')}</MenuItem>
          <MenuItem value="complete">{t('docs.completeFull', 'Complete / full manual')}</MenuItem>
          <MenuItem value="excerpt">{t('docs.excerpt', 'Excerpt')}</MenuItem>
        </AppTextField>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.75 }}>
            {creating ? 'PDF' : t('docs.pdfOptional', 'PDF (optional replacement)')}
          </Typography>
          <AppButton variant="outlined" color="secondary" component="label" size="small">
            {pdf ? pdf.name : creating ? t('docs.choosePdf', 'Choose PDF') : t('docs.replacePdf', 'Replace PDF')}
            <input
              hidden
              type="file"
              accept="application/pdf"
              onChange={(event) => setPdf(event.target.files?.[0] ?? null)}
            />
          </AppButton>
          <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.75 }}>
            {t('docs.pdfHint', 'PDF up to 50 MB. A cover is generated if you do not attach an image.')}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.75 }}>Cover image (optional)</Typography>
          <AppButton variant="outlined" color="secondary" component="label" size="small">
            {thumbnail ? thumbnail.name : t('docs.chooseImage', 'Choose PNG or JPG')}
            <input
              hidden
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setThumbnail(event.target.files?.[0] ?? null)}
            />
          </AppButton>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <AppButton variant="text" color="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </AppButton>
        <AppButton onClick={() => void submit()} disabled={saving}>
          {saving ? t('common.saving', 'Saving…') : creating ? t('common.upload', 'Upload') : t('common.save', 'Save')}
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}

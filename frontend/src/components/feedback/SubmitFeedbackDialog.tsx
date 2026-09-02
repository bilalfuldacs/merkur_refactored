import { useEffect, useMemo, useState } from 'react'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Typography from '@mui/material/Typography'
import { ApiError } from '@/api'
import type { FeedbackInput, FeedbackType } from '@/api'
import { AppButton, AppTextField } from '@/components/ui'
import { DESCRIPTION_MAX, FEEDBACK_AREAS, FEEDBACK_TYPES, typeLabel } from './constants'

const STEPS = ['Feedback type', 'Details', 'Review'] as const

type Draft = {
  type: FeedbackType
  subject: string
  area: string
  description: string
  screenshot: File | null
}

const emptyDraft: Draft = {
  type: 'improvement',
  subject: '',
  area: 'General',
  description: '',
  screenshot: null,
}

export function SubmitFeedbackDialog({
  open,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean
  saving: boolean
  onClose: () => void
  onSubmit: (input: FeedbackInput) => Promise<void>
}) {
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{ subject?: string; description?: string }>({})

  useEffect(() => {
    if (!open) {
      return
    }
    setStep(0)
    setDraft(emptyDraft)
    setError(null)
    setFieldErrors({})
  }, [open])

  const titleCopy = useMemo(() => {
    if (draft.type === 'problem') {
      return {
        heading: 'Tell us what went wrong',
        hint: 'Describe what you were doing and what you expected instead.',
      }
    }
    if (draft.type === 'idea') {
      return {
        heading: 'Tell us what you would add',
        hint: 'Describe the outcome you need. You do not need to propose a technical solution.',
      }
    }
    return {
      heading: 'Tell us what would improve',
      hint: 'Describe the outcome you need. You do not need to propose a technical solution.',
    }
  }, [draft.type])

  function validateDetails(): boolean {
    const next: { subject?: string; description?: string } = {}
    if (!draft.subject.trim()) {
      next.subject = 'Add a short title that summarizes the need.'
    }
    if (!draft.description.trim()) {
      next.description = 'Describe what you are trying to achieve.'
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  function goNext() {
    setError(null)
    if (step === 1 && !validateDetails()) {
      return
    }
    setStep((current) => Math.min(current + 1, STEPS.length - 1))
  }

  async function submit() {
    setError(null)
    try {
      await onSubmit({
        type: draft.type,
        subject: draft.subject.trim(),
        description: draft.description.trim(),
        related_area: draft.area,
        screenshot: draft.screenshot,
      })
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Your feedback could not be submitted.')
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <Box sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 22, color: 'secondary.main' }}>Submit feedback</Typography>
          <AppButton
            variant="text"
            color="inherit"
            size="small"
            startIcon={<CloseOutlinedIcon />}
            onClick={onClose}
            disabled={saving}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </AppButton>
        </Box>

        <Typography sx={{ color: 'text.secondary', fontSize: 13, fontWeight: 700, mb: 1.25 }}>
          Step {step + 1} of {STEPS.length}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          {STEPS.map((label, index) => {
            const active = index <= step
            return (
              <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: index < STEPS.length - 1 ? 1 : 'none' }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 13,
                    fontWeight: 800,
                    bgcolor: active ? 'info.main' : 'grey.200',
                    color: active ? 'common.white' : 'text.secondary',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: active ? 800 : 600,
                    color: active ? 'secondary.main' : 'text.secondary',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </Typography>
                {index < STEPS.length - 1 ? (
                  <Box sx={{ flex: 1, height: 2, bgcolor: index < step ? 'info.main' : 'grey.200', mx: 0.5, minWidth: 16 }} />
                ) : null}
              </Box>
            )
          })}
        </Box>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {step === 0 ? (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 20, color: 'secondary.main', mb: 0.5 }}>
              What would you like to share?
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, mb: 2 }}>
              Choosing a type helps the right team review it faster.
            </Typography>
            <RadioGroup
              value={draft.type}
              onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as FeedbackType }))}
            >
              {FEEDBACK_TYPES.map((option) => {
                const selected = draft.type === option.id
                return (
                  <Box
                    key={option.id}
                    sx={{
                      display: 'block',
                      mb: 1,
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: selected ? 'info.main' : 'divider',
                      bgcolor: selected ? 'rgba(0, 159, 227, 0.06)' : 'common.white',
                      cursor: 'pointer',
                    }}
                  >
                    <FormControlLabel
                      value={option.id}
                      control={<Radio />}
                      label={
                        <Box sx={{ py: 0.5 }}>
                          <Typography sx={{ fontWeight: 800, color: 'secondary.main' }}>{option.label}</Typography>
                          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{option.detail}</Typography>
                        </Box>
                      }
                      sx={{ m: 0, width: '100%', alignItems: 'flex-start' }}
                    />
                  </Box>
                )
              })}
            </RadioGroup>
          </Box>
        ) : null}

        {step === 1 ? (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 20, color: 'secondary.main', mb: 0.5 }}>{titleCopy.heading}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, mb: 2.5 }}>{titleCopy.hint}</Typography>
            <AppTextField
              label="Short title"
              value={draft.subject}
              onChange={(event) => setDraft((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Example: Make roadmap filters easier to reuse"
              helperText={fieldErrors.subject ?? 'Summarize the need in one sentence.'}
              error={Boolean(fieldErrors.subject)}
              slotProps={{ htmlInput: { maxLength: 200 } }}
              sx={{ mb: 2 }}
            />
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                mb: 2,
              }}
            >
              <AppTextField
                select
                label="Area"
                value={draft.area}
                onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))}
              >
                {FEEDBACK_AREAS.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </AppTextField>
              <Box>
                <Typography component="label" htmlFor="feedback-screenshot" sx={{ display: 'block', fontSize: 12, fontWeight: 700, mb: 0.75 }}>
                  Screenshot (optional)
                </Typography>
                <Box
                  component="input"
                  id="feedback-screenshot"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, screenshot: event.currentTarget.files?.[0] ?? null }))
                  }
                  sx={{
                    width: '100%',
                    font: 'inherit',
                    fontSize: 13,
                    py: 1.25,
                  }}
                />
                <Typography sx={{ color: 'text.secondary', fontSize: 12, mt: 0.5 }}>PNG or JPG, up to 2 MB.</Typography>
              </Box>
            </Box>
            <AppTextField
              label="What are you trying to achieve?"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value.slice(0, DESCRIPTION_MAX) }))
              }
              placeholder="Explain what you were doing, what made it difficult, and what outcome would help you."
              helperText={fieldErrors.description ?? `${draft.description.length} / ${DESCRIPTION_MAX} characters`}
              error={Boolean(fieldErrors.description)}
              multiline
              minRows={5}
            />
          </Box>
        ) : null}

        {step === 2 ? (
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 20, color: 'secondary.main', mb: 0.5 }}>Review your feedback</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, mb: 2.5 }}>
              Check the details before submitting. You can return to the previous step to make changes.
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <ReviewRow label="Type" value={typeLabel(draft.type)} />
              <ReviewRow label="Title" value={draft.subject.trim()} />
              <ReviewRow label="Area" value={draft.area} />
              <ReviewRow label="Description" value={draft.description.trim()} />
              {draft.screenshot ? <ReviewRow label="Screenshot" value={draft.screenshot.name} /> : null}
            </Box>
          </Box>
        ) : null}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, gap: 1 }}>
          {step > 0 ? (
            <AppButton variant="text" color="inherit" startIcon={<ArrowBackOutlinedIcon />} onClick={() => setStep((current) => current - 1)} disabled={saving}>
              Back
            </AppButton>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <AppButton color="secondary" endIcon={<ArrowForwardOutlinedIcon />} onClick={goNext}>
              Continue
            </AppButton>
          ) : (
            <AppButton color="secondary" startIcon={<SendOutlinedIcon />} onClick={() => void submit()} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit feedback'}
            </AppButton>
          )}
        </Box>
      </Box>
    </Dialog>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ pb: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 700, mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ color: 'secondary.main', fontSize: 15, whiteSpace: 'pre-wrap' }}>{value}</Typography>
    </Box>
  )
}

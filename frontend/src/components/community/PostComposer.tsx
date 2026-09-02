import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined'
import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import type { AuthUser, MentionablePerson } from '@/api'
import { AppButton } from '@/components/ui'
import { UserAvatar } from '@/components/user'
import type { ComposerKind } from './format'
import { MentionField } from './MentionField'
import type { MentionFieldHandle } from './MentionField'

const placeholders: Record<ComposerKind, string> = {
  update: 'Share an update with the team… Type @ to mention someone.',
  question: 'What do you want to ask, and who can help? Type @ to mention them.',
  idea: 'Explain your idea, the problem it solves, and whose feedback you need… Type @ to mention someone.',
}

const pillGroupSx = {
  gap: 1,
  flexWrap: 'wrap',
  '& .MuiToggleButtonGroup-grouped': {
    borderRadius: '999px !important',
    border: '1px solid !important',
    mx: 0,
  },
} as const

const pillSx = {
  px: 1.25,
  py: 0.6,
  borderRadius: 999,
  textTransform: 'none' as const,
  fontWeight: 700,
  fontSize: 13,
  bgcolor: 'common.white',
  color: 'secondary.main',
  borderColor: 'divider',
  '&.Mui-selected': {
    bgcolor: 'secondary.main',
    color: 'common.white',
    borderColor: 'secondary.main',
    '&:hover': { bgcolor: 'secondary.main' },
  },
}

export function PostComposer({
  user,
  people,
  decolorize,
  posting,
  onPost,
}: {
  user: AuthUser | null
  people: MentionablePerson[]
  decolorize: boolean
  posting: boolean
  onPost: (note: string, imagePreview?: string | null) => Promise<void>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const mentionRef = useRef<MentionFieldHandle>(null)
  const [kind, setKind] = useState<ComposerKind>('idea')
  const [note, setNote] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const remaining = 280 - note.length

  function clearFile() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setFileName(null)
    setImagePreview(null)
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) {
      return
    }
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setFileName(file.name)
    setImagePreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null)
  }

  async function submit() {
    const text = note.trim()
    if (!text || posting) {
      return
    }
    await onPost(text, imagePreview)
    setNote('')
    setFileName(null)
    setImagePreview(null)
  }

  return (
    <Box
      sx={{
        mb: 2,
        p: { xs: 1.5, md: 2 },
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'common.white',
      }}
    >
      <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'secondary.main', mb: 1.25 }}>
        Start a conversation
      </Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={kind}
        onChange={(_event, value: ComposerKind | null) => {
          if (value) {
            setKind(value)
          }
        }}
        aria-label="Post type"
        sx={{ ...pillGroupSx, mb: 1.5 }}
      >
        <ToggleButton value="update" sx={pillSx}>
          <CampaignOutlinedIcon sx={{ fontSize: 16, mr: 0.75 }} />
          Share update
        </ToggleButton>
        <ToggleButton value="question" sx={pillSx}>
          <HelpOutlineOutlinedIcon sx={{ fontSize: 16, mr: 0.75 }} />
          Ask question
        </ToggleButton>
        <ToggleButton value="idea" sx={pillSx}>
          <LightbulbOutlinedIcon sx={{ fontSize: 16, mr: 0.75 }} />
          Suggest idea
        </ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
        <UserAvatar user={user} size="md" decolorize={decolorize} />
        <MentionField
          ref={mentionRef}
          people={people}
          decolorize={decolorize}
          value={note}
          onChange={(value) => setNote(value.slice(0, 280))}
          maxLength={280}
          placeholder={placeholders[kind]}
          minRows={3}
        />
      </Box>

      {fileName ? (
        <Chip
          size="small"
          label={fileName}
          onDelete={() => clearFile()}
          deleteIcon={<CloseOutlinedIcon />}
          sx={{ mt: 1.25, fontWeight: 600 }}
        />
      ) : null}
      {imagePreview ? (
        <Box
          component="img"
          src={imagePreview}
          alt=""
          sx={{ mt: 1.25, width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 2 }}
        />
      ) : null}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 1.5 }}>
        <Box>
          <input ref={fileRef} type="file" hidden onChange={handleFile} />
          <IconButton size="small" aria-label="Add file" onClick={() => fileRef.current?.click()}>
            <AttachFileOutlinedIcon />
          </IconButton>
          <IconButton
            size="small"
            aria-label="Mention someone"
            onClick={() => mentionRef.current?.startMention()}
          >
            <AlternateEmailOutlinedIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: 12, color: remaining < 20 ? 'error.main' : 'text.secondary' }}>{remaining}</Typography>
          <AppButton size="small" disabled={!note.trim() || posting} onClick={() => void submit()}>
            {posting ? 'Posting…' : 'Post'}
          </AppButton>
        </Box>
      </Box>
    </Box>
  )
}

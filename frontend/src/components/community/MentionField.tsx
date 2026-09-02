import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { MentionablePerson } from '@/api'
import { AppTextField } from '@/components/ui'
import { UserAvatar } from '@/components/user'
import { personName } from './format'

export type MentionFieldHandle = {
  startMention: () => void
}

export function mentionQueryAt(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret)
  const match = before.match(/(^|[\s])@([A-Za-z0-9._-]*)$/)
  if (!match) {
    return null
  }
  return { start: caret - match[2].length - 1, query: match[2] }
}

export function insertMention(text: string, start: number, caret: number, initials: string, maxLength: number): string {
  const next = `${text.slice(0, start)}@${initials} ${text.slice(caret)}`
  return next.slice(0, maxLength)
}

export function filterMentionables(people: MentionablePerson[], query: string): MentionablePerson[] {
  const needle = query.trim().toLowerCase()
  return people
    .filter((person) => person.initials)
    .filter((person) => {
      if (!needle) {
        return true
      }
      return [person.initials, person.firstname, person.lastname, person.name, person.jobtitle].some((value) =>
        (value ?? '').toLowerCase().includes(needle),
      )
    })
    .slice(0, 8)
}

export function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@[A-Za-z0-9._-]{1,12})/g)
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('@') && part.length > 1 ? (
          <Box key={`${part}-${index}`} component="span" sx={{ color: 'info.main', fontWeight: 700 }}>
            {part}
          </Box>
        ) : (
          <Box key={`${part}-${index}`} component="span">
            {part}
          </Box>
        ),
      )}
    </>
  )
}

export const MentionField = forwardRef<MentionFieldHandle, {
  people: MentionablePerson[]
  decolorize: boolean
  value: string
  onChange: (value: string) => void
  maxLength?: number
  placeholder?: string
  minRows?: number
  size?: 'small' | 'medium'
  onSubmit?: () => void
}>(function MentionField(
  { people, decolorize, value, onChange, maxLength, placeholder, minRows, size, onSubmit },
  ref,
) {
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [mentionStart, setMentionStart] = useState(0)
  const [active, setActive] = useState(0)
  const matches = useMemo(() => filterMentionables(people, query), [people, query])
  const limit = maxLength ?? 280

  function syncMention(next: string, caret: number) {
    const mention = mentionQueryAt(next, caret)
    if (!mention) {
      setOpen(false)
      return
    }
    setMentionStart(mention.start)
    setQuery(mention.query)
    setActive(0)
    setOpen(true)
  }

  function choose(person: MentionablePerson) {
    const caret = inputRef.current?.selectionStart ?? value.length
    const next = insertMention(value, mentionStart, caret, person.initials, limit)
    onChange(next)
    setOpen(false)
    requestAnimationFrame(() => {
      const field = inputRef.current
      if (!field) {
        return
      }
      const position = Math.min(limit, mentionStart + person.initials.length + 2)
      field.focus()
      field.setSelectionRange(position, position)
    })
  }

  function startMention() {
    const caret = inputRef.current?.selectionStart ?? value.length
    const prefix = caret === 0 || value[caret - 1] === ' ' || value[caret - 1] === '\n' ? '@' : ' @'
    const next = `${value.slice(0, caret)}${prefix}${value.slice(caret)}`.slice(0, limit)
    onChange(next)
    const nextCaret = Math.min(limit, caret + prefix.length)
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(nextCaret, nextCaret)
      syncMention(next, nextCaret)
    })
  }

  useImperativeHandle(ref, () => ({ startMention }))

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (open && matches.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((current) => (current + 1) % matches.length)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((current) => (current - 1 + matches.length) % matches.length)
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        choose(matches[active] ?? matches[0])
        return
      }
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }
    }
    if (event.key === 'Enter' && !event.shiftKey && onSubmit && !(open && matches.length > 0)) {
      event.preventDefault()
      onSubmit()
    }
  }

  return (
    <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <AppTextField
        value={value}
        size={size}
        placeholder={placeholder}
        multiline={minRows != null}
        minRows={minRows}
        inputRef={inputRef}
        onKeyDown={onKeyDown}
        onBlur={() => {
          requestAnimationFrame(() => setOpen(false))
        }}
        onChange={(event) => {
          const next = event.target.value.slice(0, limit)
          onChange(next)
          syncMention(next, event.target.selectionStart ?? next.length)
        }}
        slotProps={{
          htmlInput: { maxLength: limit },
        }}
      />
      {open && matches.length > 0 ? (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            zIndex: 8,
            mt: 0.5,
            maxHeight: 280,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: 'common.white',
            boxShadow: '0 12px 28px rgba(2, 32, 82, 0.12)',
          }}
        >
          {matches.map((person, index) => (
            <Box
              key={person.ID}
              component="button"
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
                choose(person)
              }}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                width: '100%',
                border: 0,
                px: 1.25,
                py: 1,
                bgcolor: index === active ? 'rgba(0, 159, 227, 0.12)' : 'transparent',
                cursor: 'pointer',
                font: 'inherit',
                textAlign: 'left',
                '&:hover': { bgcolor: 'rgba(0, 159, 227, 0.12)' },
              }}
            >
              <UserAvatar user={person} decolorize={decolorize} />
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
                  @{person.initials} · {personName(person)}
                </Typography>
                {person.jobtitle ? (
                  <Typography sx={{ color: 'text.secondary', fontSize: 12 }}>{person.jobtitle}</Typography>
                ) : null}
              </Box>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  )
})

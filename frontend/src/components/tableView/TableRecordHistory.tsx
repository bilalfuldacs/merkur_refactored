import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import type { TableHistoryRevision } from '@/api'
import { UserAvatar, displayName } from '@/components/user'

const ACTION_CHIPS: Record<string, { label: string; color: 'success' | 'info' | 'error' | 'default' }> = {
  insert: { label: 'created', color: 'success' },
  update: { label: 'updated', color: 'info' },
  delete: { label: 'deleted', color: 'error' },
}

export function TableRecordHistory({
  revisions,
  decolorize = false,
}: {
  revisions: TableHistoryRevision[]
  decolorize?: boolean
}) {
  if (revisions.length === 0) {
    return (
      <Box sx={{ p: 2, bgcolor: 'info.light', color: 'info.dark', borderRadius: 1 }}>
        There is no history for this item yet.
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      {revisions.map((revision) => {
        const action = ACTION_CHIPS[revision.action] ?? { label: revision.action, color: 'default' as const }

        return (
          <Box
            key={`${revision.revision}-${revision.modified_at ?? ''}`}
            sx={{
              px: 2,
              py: 1.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: revision.changes.length ? 1 : 0 }}>
              <UserAvatar user={revision.editor} decolorize={decolorize} />
              <Typography component="span" sx={{ fontWeight: 700 }}>
                {displayName(revision.editor)}
              </Typography>
              <Chip size="small" color={action.color} label={action.label} sx={{ fontWeight: 800 }} />
              <Typography component="span" color="text.secondary">
                this item on <Box component="strong">{formatHistoryDate(revision.modified_at)}</Box>
                {' • Revision '}
                <Box component="strong">{revision.revision}</Box>
              </Typography>
            </Box>
            {revision.changes.map((change) => (
              <Box
                key={change.key}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'minmax(120px, 28%) minmax(0, 1fr)' },
                  gap: { xs: 0.25, md: 2 },
                  py: 0.35,
                }}
              >
                <Typography color="text.secondary">{change.label}</Typography>
                <Typography component="div" sx={{ wordBreak: 'break-word' }}>
                  {change.previous === null ? (
                    <HistoryValue value={change.current} />
                  ) : (
                    <>
                      <Box component="span" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                        <HistoryValue value={change.previous} />
                      </Box>
                      {' → '}
                      <HistoryValue value={change.current} />
                    </>
                  )}
                </Typography>
              </Box>
            ))}
          </Box>
        )
      })}
    </Box>
  )
}

function HistoryValue({ value }: { value: string | null }) {
  if (value === null || value === '') {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          px: 0.75,
          py: 0.1,
          borderRadius: 999,
          bgcolor: 'action.hover',
          color: 'text.secondary',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        NULL
      </Box>
    )
  }

  return <>{value}</>
}

function formatHistoryDate(value: string | null): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

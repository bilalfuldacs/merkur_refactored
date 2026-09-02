import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { PeopleMarketsPerson } from '@/api'
import { UserAvatar } from '@/components/user'

export function AvatarStrip({
  label,
  people,
  selectedPersonId,
  decolorize,
  onSelectPerson,
}: {
  label: string
  people: PeopleMarketsPerson[]
  selectedPersonId: number | null
  decolorize: boolean
  onSelectPerson: (personId: number) => void
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="h2"
        sx={{
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          fontSize: 11,
          fontWeight: 700,
          mb: 0.5,
        }}
      >
        {label}
        <Box component="span" sx={{ ml: 0.75, fontWeight: 600, color: 'merkur.gray' }}>
          {people.length}
        </Box>
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 0.5, rowGap: 0.5 }}>
        {people.length === 0 ? (
          <Typography color="text.secondary" sx={{ fontSize: 13, py: 0.5 }}>
            No people in this group.
          </Typography>
        ) : (
          people.map((person) => (
            <UserAvatar
              key={person.ID}
              user={person}
              size="sm"
              decolorize={decolorize}
              selected={selectedPersonId === person.ID}
              onClick={() => onSelectPerson(person.ID)}
            />
          ))
        )}
      </Box>
    </Box>
  )
}

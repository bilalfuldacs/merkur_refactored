import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { PeopleMarketsGroups, PeopleMarketsPerson } from '@/api'
import { UserAvatar } from '@/components/user'
import { personMatches } from './filter'
import { marketCountLabel, personLabel } from './format'
import { PanoramaPane } from './PanoramaPane'

export type OrgView = 'product-sales' | 'leadership'

export type OrgGroupKey = keyof PeopleMarketsGroups

export const ORG_GROUP_LABELS: Record<OrgGroupKey, string> = {
  product_organization: 'Product Organization',
  sales: 'Sales',
  c_level: 'C-Level',
  global_game_design: 'Global Game Design',
  game_design: 'Game Design',
  development: 'Development',
  other: 'Other',
}

export const ORG_VIEW_GROUPS: Record<OrgView, OrgGroupKey[]> = {
  'product-sales': ['product_organization', 'sales'],
  leadership: ['c_level', 'global_game_design', 'game_design', 'development', 'other'],
}

export const ORG_VIEW_LABELS: Record<OrgView, string> = {
  'product-sales': 'Product & Sales',
  leadership: 'Leadership & Teams',
}

export function OrgGroupsView({
  view,
  groups,
  query,
  currentUserId,
  marketCounts,
  decolorize,
  onSelectPerson,
}: {
  view: OrgView
  groups: PeopleMarketsGroups
  query: string
  currentUserId: number | null
  /** Number of assigned markets per person ID (from people_to_markets). */
  marketCounts: Map<number, number>
  decolorize: boolean
  onSelectPerson: (personId: number) => void
}) {
  const keys = ORG_VIEW_GROUPS[view]
  const q = query.trim()

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(2, minmax(0, 1fr))',
          xl: keys.length === 2 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
        },
        gap: 2.5,
        mb: 4,
      }}
    >
      {keys.map((key) => {
        const all = groups[key] ?? []
        const people = q ? all.filter((person) => personMatches(person, q)) : all

        return (
          <PanoramaPane
            key={key}
            title={ORG_GROUP_LABELS[key]}
            hint={q && people.length !== all.length ? `${people.length} of ${all.length} match your search` : 'Select a person to see their markets'}
            count={people.length}
            sx={{ height: 'auto', minHeight: 160, maxHeight: { xs: 'min(62vh, 560px)', lg: 'min(68vh, 760px)' } }}
          >
            {people.length === 0 ? (
              <Typography sx={{ px: 2, py: 2, color: 'text.secondary' }}>
                {all.length === 0 ? 'No people in this group.' : 'No people match this view.'}
              </Typography>
            ) : (
              people.map((person) => (
                <OrgPersonRow
                  key={person.ID}
                  person={person}
                  mine={person.ID === currentUserId}
                  marketCount={marketCounts.get(person.ID)}
                  decolorize={decolorize}
                  onSelect={marketCounts.has(person.ID) ? () => onSelectPerson(person.ID) : undefined}
                />
              ))
            )}
          </PanoramaPane>
        )
      })}
    </Box>
  )
}

function OrgPersonRow({
  person,
  mine,
  marketCount,
  decolorize,
  onSelect,
}: {
  person: PeopleMarketsPerson
  mine: boolean
  marketCount: number | undefined
  decolorize: boolean
  onSelect?: () => void
}) {
  const roleLine = [person.role, person.jobtitle && person.jobtitle !== person.role ? person.jobtitle : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <Box
      id={`org-person-${person.ID}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.5,
        py: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: mine ? 'rgba(162, 198, 23, 0.16)' : 'transparent',
        '&:hover': { bgcolor: mine ? 'rgba(162, 198, 23, 0.24)' : 'rgba(2, 32, 82, 0.03)' },
      }}
    >
      <UserAvatar user={person} size="md" decolorize={decolorize} onClick={onSelect} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.25 }}>{personLabel(person)}</Typography>
        {roleLine ? <Typography sx={{ color: 'text.secondary', fontSize: 12, lineHeight: 1.3 }}>{roleLine}</Typography> : null}
      </Box>
      {marketCount != null ? (
        <Box
          component={onSelect ? 'button' : 'span'}
          {...(onSelect ? { type: 'button', onClick: onSelect } : {})}
          sx={{
            flexShrink: 0,
            border: 0,
            p: 0,
            bgcolor: 'transparent',
            font: 'inherit',
            fontSize: 12,
            color: 'info.main',
            fontWeight: 600,
            cursor: onSelect ? 'pointer' : 'default',
            '&:hover': onSelect ? { textDecoration: 'underline' } : undefined,
          }}
        >
          {marketCountLabel(marketCount)}
        </Box>
      ) : null}
    </Box>
  )
}

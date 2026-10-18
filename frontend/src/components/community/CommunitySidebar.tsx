import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined'
import BookmarkBorderOutlinedIcon from '@mui/icons-material/BookmarkBorderOutlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import type { CommunityFeedView } from '@/api'
import { useI18n } from '@/i18n'
import type { FeedTab } from './format'

const COMMUNITY_TOPICS: { id: FeedTab | 'all'; labelKey: string; label: string }[] = [
  { id: 'all', labelKey: 'community.topicAnnouncements', label: '#Announcements' },
  { id: 'update', labelKey: 'community.topicWins', label: '#Team wins' },
  { id: 'question', labelKey: 'community.topicHelp', label: '#Help & advice' },
  { id: 'idea', labelKey: 'community.topicIdeas', label: '#Ideas' },
]

const sideLinkSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  p: 2,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 3,
  bgcolor: 'common.white',
  cursor: 'pointer',
  font: 'inherit',
  textAlign: 'left' as const,
  '&:hover': { bgcolor: 'grey.50' },
}

export function CommunitySidebar({
  tab,
  view,
  initials,
  onSelectTab,
  onShowBookmarks,
  onShowMentions,
}: {
  tab: FeedTab
  view: CommunityFeedView
  initials: string | null | undefined
  onSelectTab: (tab: FeedTab) => void
  onShowBookmarks: () => void
  onShowMentions: () => void
}) {
  const { t } = useI18n()
  const initialsLabel = initials || t('community.initials', 'initials')
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'common.white' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'secondary.main', mb: 1.25 }}>{t('community.discover', 'Discover topics')}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {COMMUNITY_TOPICS.map((topic) => (
            <Chip
              key={topic.labelKey}
              clickable
              label={t(topic.labelKey, topic.label)}
              onClick={() => onSelectTab(topic.id === 'all' ? 'all' : topic.id)}
              sx={{
                fontWeight: 700,
                bgcolor: tab === topic.id || (topic.id === 'all' && tab === 'all') ? 'secondary.main' : 'grey.100',
                color: tab === topic.id || (topic.id === 'all' && tab === 'all') ? 'common.white' : 'secondary.main',
              }}
            />
          ))}
        </Box>
      </Box>

      <Box
        component="button"
        type="button"
        onClick={onShowBookmarks}
        sx={{
          ...sideLinkSx,
          borderColor: view === 'bookmarks' ? 'info.main' : 'divider',
        }}
      >
        <BookmarkBorderOutlinedIcon color="info" />
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{t('community.bookmarks', 'My bookmarks')}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>{t('community.bookmarksHint', 'Saved conversations to come back to later.')}</Typography>
        </Box>
      </Box>

      <Box
        component="button"
        type="button"
        onClick={onShowMentions}
        sx={{
          ...sideLinkSx,
          borderColor: view === 'mentions' ? 'info.main' : 'divider',
        }}
      >
        <AlternateEmailOutlinedIcon color="info" />
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>
            {t('community.mentions', 'My mentions')}{initials ? ` @${initials}` : ''}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
            {t('community.mentionsHint', 'Posts where someone tagged you with @{name}.', { name: initialsLabel })}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'rgba(0, 159, 227, 0.08)' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 15, mb: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 18, color: 'merkur.pink' }} />
          {t('community.useful', 'Posts that get useful replies')}
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1 }}>
          {t('community.usefulHint', 'Say what you need, who it is for, and the next step you want.')}
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'info.main', fontWeight: 700 }}>{t('community.flow', '1 Share → 2 Discuss → 3 Decide')}</Typography>
      </Box>

      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 3, bgcolor: 'common.white' }}>
        <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'secondary.main', mb: 1 }}>{t('community.about', 'About Community')}</Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1 }}>
          {t('community.aboutBody', 'Discuss thoughts and ideas with coworkers here. Generic topics belong on this page.')}
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          If it is about a specific game, version, or cabinet, post on that item — it still appears in this feed.
        </Typography>
      </Box>
    </Box>
  )
}

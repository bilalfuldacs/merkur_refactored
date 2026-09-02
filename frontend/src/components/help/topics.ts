import type { SvgIconComponent } from '@mui/icons-material'
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import type { FaqArticle } from '@/api'

export type HelpTopicId =
  | 'getting-started'
  | 'products-roadmap'
  | 'data-tables'
  | 'access-roles'
  | 'troubleshooting'

export type HelpTopic = {
  id: HelpTopicId
  label: string
  icon: SvgIconComponent
  match: (haystack: string) => boolean
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'getting-started',
    label: 'Getting started',
    icon: RocketLaunchOutlinedIcon,
    match: (haystack) =>
      /what does merkurflow|evolve|home screen|overview|started|nutshell/.test(haystack),
  },
  {
    id: 'products-roadmap',
    label: 'Products & roadmap',
    icon: MapOutlinedIcon,
    match: (haystack) => /version|build|roadmap|product|status/.test(haystack),
  },
  {
    id: 'data-tables',
    label: 'Data & tables',
    icon: TableChartOutlinedIcon,
    match: (haystack) => /table|null|empty|catalog/.test(haystack),
  },
  {
    id: 'access-roles',
    label: 'Access & roles',
    icon: ShieldOutlinedIcon,
    match: (haystack) => /tlp|role|entitlement|permission/.test(haystack),
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    icon: ConstructionOutlinedIcon,
    match: (haystack) => /tip|trick|phone|error|problem|fix/.test(haystack),
  },
]

export function displayFaqTitle(title: string): string {
  return title
    .replace(/^dummy:\s*/i, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function topicForFaq(faq: FaqArticle): HelpTopic {
  const haystack = `${faq.title} ${faq.article}`.toLowerCase()
  return HELP_TOPICS.find((topic) => topic.match(haystack)) ?? HELP_TOPICS[0]
}

export function readingMinutes(article: string): number {
  const words = article.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 180))
}

export function searchFaqs(faqs: FaqArticle[], query: string): FaqArticle[] {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return faqs
  }
  return faqs
    .map((faq) => {
      const title = displayFaqTitle(faq.title).toLowerCase()
      const article = faq.article.toLowerCase()
      let score = 0
      if (title.includes(needle)) {
        score += title.startsWith(needle) ? 4 : 3
      }
      if (article.includes(needle)) {
        score += 1
      }
      return { faq, score }
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || (left.faq.order ?? 0) - (right.faq.order ?? 0))
    .map((item) => item.faq)
}

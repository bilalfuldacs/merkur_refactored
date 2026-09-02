import { useAuth } from '@/auth'
import { tableFromBrowsePath } from '@/config/tablePages'
import { APP_PATHS, useAppPath } from '@/routing'
import CommunityPage from '@/pages/CommunityPage'
import DocsPage from '@/pages/DocsPage'
import FeedbackPage from '@/pages/FeedbackPage'
import FindPage from '@/pages/FindPage'
import FocusGroupsReportPage from '@/pages/FocusGroupsReportPage'
import HelpPage from '@/pages/HelpPage'
import HomePage from '@/pages/HomePage'
import Ice2027AdminPage from '@/pages/Ice2027AdminPage'
import Ice2027EvaluationPage from '@/pages/Ice2027EvaluationPage'
import Ice2027Page from '@/pages/Ice2027Page'
import InstallationsReportPage from '@/pages/InstallationsReportPage'
import IssuesReportPage from '@/pages/IssuesReportPage'
import LatestChangesPage from '@/pages/LatestChangesPage'
import LoginPage from '@/pages/LoginPage'
import MarketReportPage from '@/pages/MarketReportPage'
import MerkuriosityPage from '@/pages/MerkuriosityPage'
import PeopleMarketsPage from '@/pages/PeopleMarketsPage'
import ProductGamesListPage from '@/pages/ProductGamesListPage'
import ProductsPage from '@/pages/ProductsPage'
import ProfilePage from '@/pages/ProfilePage'
import ReportsPage from '@/pages/ReportsPage'
import RoadmapDocsPage from '@/pages/RoadmapDocsPage'
import RoadmapPage from '@/pages/RoadmapPage'
import { TableBrowsePage } from '@/pages/TableBrowsePage'
import TablesPage from '@/pages/TablesPage'
import TasksPage from '@/pages/TasksPage'
import { SearchProvider } from '@/search'

export default function App() {
  const { isAuthenticated } = useAuth()
  const { path } = useAppPath()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <SearchProvider>{renderPage(path)}</SearchProvider>
}

function renderPage(path: string) {
  const table = tableFromBrowsePath(path)
  if (table) {
    return <TableBrowsePage key={table} table={table} />
  }

  if (path === APP_PATHS.tables) {
    return <TablesPage />
  }

  if (path === APP_PATHS.marketReport) {
    return <MarketReportPage />
  }

  if (path === APP_PATHS.peopleMarkets) {
    return <PeopleMarketsPage />
  }

  if (path === APP_PATHS.productGamesList) {
    return <ProductGamesListPage />
  }

  if (path === APP_PATHS.products) {
    return <ProductsPage />
  }

  if (path === APP_PATHS.roadmapDocs) {
    return <RoadmapDocsPage />
  }

  if (path === APP_PATHS.roadmap || path === APP_PATHS.roadmapGames) {
    return <RoadmapPage />
  }

  if (path === APP_PATHS.community) {
    return <CommunityPage />
  }

  if (path === APP_PATHS.docs) {
    return <DocsPage />
  }

  if (path === APP_PATHS.help) {
    return <HelpPage />
  }

  if (path === APP_PATHS.feedback) {
    return <FeedbackPage />
  }

  if (path === APP_PATHS.profile) {
    return <ProfilePage />
  }

  if (path === APP_PATHS.latestChanges) {
    return <LatestChangesPage />
  }

  if (path === APP_PATHS.installationsReport) {
    return <InstallationsReportPage />
  }

  if (path === APP_PATHS.focusGroupsReport) {
    return <FocusGroupsReportPage />
  }

  if (path === APP_PATHS.issuesReport) {
    return <IssuesReportPage />
  }

  if (path === APP_PATHS.reports) {
    return <ReportsPage />
  }

  if (path === APP_PATHS.tasks) {
    return <TasksPage />
  }

  if (path === APP_PATHS.find) {
    return <FindPage />
  }

  if (path === APP_PATHS.ice2027Evaluation) {
    return <Ice2027EvaluationPage />
  }

  if (path === APP_PATHS.ice2027Admin) {
    return <Ice2027AdminPage />
  }

  if (path === APP_PATHS.ice2027) {
    return <Ice2027Page />
  }

  if (path === APP_PATHS.merkuriosity) {
    return <MerkuriosityPage />
  }

  return <HomePage />
}


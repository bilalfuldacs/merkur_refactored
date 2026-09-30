import { useAuth } from '@/auth'
import { tableFromBrowsePath } from '@/config/tablePages'
import { APP_PATHS, useAppPath } from '@/routing'
import AdminAttachmentsTrashPage from '@/pages/AdminAttachmentsTrashPage'
import AdminPage from '@/pages/AdminPage'
import AdminTableHistoryPage from '@/pages/AdminTableHistoryPage'
import AdminUserActivityPage from '@/pages/AdminUserActivityPage'
import CommunityPage from '@/pages/CommunityPage'
import DocsPage from '@/pages/DocsPage'
import FeedbackAdminPage from '@/pages/FeedbackAdminPage'
import FeedbackPage from '@/pages/FeedbackPage'
import FindPage from '@/pages/FindPage'
import FocusGroupsReportPage from '@/pages/FocusGroupsReportPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import HelpPage from '@/pages/HelpPage'
import HomePage from '@/pages/HomePage'
import Ice2027AdminPage from '@/pages/Ice2027AdminPage'
import Ice2027DashboardGamePage from '@/pages/Ice2027DashboardGamePage'
import Ice2027DashboardPage from '@/pages/Ice2027DashboardPage'
import Ice2027EvaluationPage from '@/pages/Ice2027EvaluationPage'
import Ice2027Page from '@/pages/Ice2027Page'
import Ice2027ProgressPage from '@/pages/Ice2027ProgressPage'
import InstallationsReportPage from '@/pages/InstallationsReportPage'
import IssuesReportPage from '@/pages/IssuesReportPage'
import LatestChangesPage from '@/pages/LatestChangesPage'
import LoginPage from '@/pages/LoginPage'
import MarketReportPage from '@/pages/MarketReportPage'
import MerkuriosityPage from '@/pages/MerkuriosityPage'
import MerkuriosityWordsAdminPage from '@/pages/MerkuriosityWordsAdminPage'
import PeopleMarketsPage from '@/pages/PeopleMarketsPage'
import ProductGamesDocsPackagePage from '@/pages/ProductGamesDocsPackagePage'
import ProductGamesListPage from '@/pages/ProductGamesListPage'
import ProductsPage from '@/pages/ProductsPage'
import ProfilePage from '@/pages/ProfilePage'
import ReleaseInformationSheetPage from '@/pages/ReleaseInformationSheetPage'
import ReportsPage from '@/pages/ReportsPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import RoadmapDocsPage from '@/pages/RoadmapDocsPage'
import RoadmapPage from '@/pages/RoadmapPage'
import RolesAdminPage from '@/pages/RolesAdminPage'
import ScoutEventsPage from '@/pages/ScoutEventsPage'
import { TableBrowsePage } from '@/pages/TableBrowsePage'
import TablesPage from '@/pages/TablesPage'
import TasksPage from '@/pages/TasksPage'
import UsersAdminPage from '@/pages/UsersAdminPage'
import { SearchProvider } from '@/search'

export default function App() {
  const { isAuthenticated } = useAuth()
  const { path } = useAppPath()

  if (!isAuthenticated) {
    if (path === APP_PATHS.forgotPassword) {
      return <ForgotPasswordPage />
    }
    if (path === APP_PATHS.resetPassword) {
      return <ResetPasswordPage />
    }
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

  if (path === APP_PATHS.productGamesDocsPackage) {
    return <ProductGamesDocsPackagePage />
  }

  if (path === APP_PATHS.productGamesList) {
    return <ProductGamesListPage />
  }

  if (path === APP_PATHS.releaseInformationSheet) {
    return <ReleaseInformationSheetPage />
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

  if (path === APP_PATHS.feedbackAdmin) {
    return <FeedbackAdminPage />
  }

  if (path === APP_PATHS.adminAttachmentsTrash) {
    return <AdminAttachmentsTrashPage />
  }

  if (path === APP_PATHS.adminUserActivity) {
    return <AdminUserActivityPage />
  }

  if (path === APP_PATHS.adminTableHistory) {
    return <AdminTableHistoryPage />
  }

  if (path === APP_PATHS.adminUsers) {
    return <UsersAdminPage />
  }

  if (path === APP_PATHS.adminRoles) {
    return <RolesAdminPage />
  }

  if (path === APP_PATHS.admin) {
    return <AdminPage />
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

  if (path === APP_PATHS.scoutEvents) {
    return <ScoutEventsPage />
  }

  if (path === APP_PATHS.ice2027DashboardGame) {
    return <Ice2027DashboardGamePage />
  }

  if (path === APP_PATHS.ice2027Dashboard) {
    return <Ice2027DashboardPage />
  }

  if (path === APP_PATHS.ice2027Progress) {
    return <Ice2027ProgressPage />
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

  if (path === APP_PATHS.merkuriosityWords) {
    return <MerkuriosityWordsAdminPage />
  }

  if (path === APP_PATHS.merkuriosity) {
    return <MerkuriosityPage />
  }

  return <HomePage />
}


import { lazy } from 'react'
import { tableFromBrowsePath } from '@/config/tablePages'
import { Navigate, createBrowserRouter, useParams } from 'react-router-dom'
import { PublicOnlyLayout, ProtectedLayout } from './layouts'
import { APP_PATHS } from './paths'
import { RouteError } from './RouteError'

const LoginPage = lazy(() => import('@/pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'))
const HomePage = lazy(() => import('@/pages/HomePage'))
const TablesPage = lazy(() => import('@/pages/TablesPage'))
const TableBrowsePage = lazy(() =>
  import('@/pages/TableBrowsePage').then((module) => ({ default: module.TableBrowsePage })),
)
const PeopleMarketsPage = lazy(() => import('@/pages/PeopleMarketsPage'))
const MarketReportPage = lazy(() => import('@/pages/MarketReportPage'))
const ProductsPage = lazy(() => import('@/pages/ProductsPage'))
const ProductGamesListPage = lazy(() => import('@/pages/ProductGamesListPage'))
const ProductGamesDocsPackagePage = lazy(() => import('@/pages/ProductGamesDocsPackagePage'))
const ReleaseInformationSheetPage = lazy(() => import('@/pages/ReleaseInformationSheetPage'))
const CommunityPage = lazy(() => import('@/pages/CommunityPage'))
const DocsPage = lazy(() => import('@/pages/DocsPage'))
const HelpPage = lazy(() => import('@/pages/HelpPage'))
const FeedbackPage = lazy(() => import('@/pages/FeedbackPage'))
const FeedbackAdminPage = lazy(() => import('@/pages/FeedbackAdminPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const UsersAdminPage = lazy(() => import('@/pages/UsersAdminPage'))
const RolesAdminPage = lazy(() => import('@/pages/RolesAdminPage'))
const AdminAttachmentsTrashPage = lazy(() => import('@/pages/AdminAttachmentsTrashPage'))
const AdminUserActivityPage = lazy(() => import('@/pages/AdminUserActivityPage'))
const AdminTableHistoryPage = lazy(() => import('@/pages/AdminTableHistoryPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const LatestChangesPage = lazy(() => import('@/pages/LatestChangesPage'))
const InstallationsReportPage = lazy(() => import('@/pages/InstallationsReportPage'))
const FocusGroupsReportPage = lazy(() => import('@/pages/FocusGroupsReportPage'))
const IssuesReportPage = lazy(() => import('@/pages/IssuesReportPage'))
const FieldTrialsPage = lazy(() => import('@/pages/FieldTrialsPage'))
const RoadmapPage = lazy(() => import('@/pages/RoadmapPage'))
const RoadmapDocsPage = lazy(() => import('@/pages/RoadmapDocsPage'))
const TasksPage = lazy(() => import('@/pages/TasksPage'))
const FindPage = lazy(() => import('@/pages/FindPage'))
const ScoutEventsPage = lazy(() => import('@/pages/ScoutEventsPage'))
const Ice2027Page = lazy(() => import('@/pages/Ice2027Page'))
const Ice2027EvaluationPage = lazy(() => import('@/pages/Ice2027EvaluationPage'))
const Ice2027AdminPage = lazy(() => import('@/pages/Ice2027AdminPage'))
const Ice2027DashboardPage = lazy(() => import('@/pages/Ice2027DashboardPage'))
const Ice2027DashboardGamePage = lazy(() => import('@/pages/Ice2027DashboardGamePage'))
const Ice2027ProgressPage = lazy(() => import('@/pages/Ice2027ProgressPage'))
const MerkuriosityPage = lazy(() => import('@/pages/MerkuriosityPage'))
const MerkuriosityWordsAdminPage = lazy(() => import('@/pages/MerkuriosityWordsAdminPage'))

function TableBrowseRoute() {
  const { table } = useParams()
  const name = tableFromBrowsePath(`/tables/${table ?? ''}`)
  if (!name) {
    return <Navigate to={APP_PATHS.home} replace />
  }
  return <TableBrowsePage key={name} table={name} />
}

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

export const router = createBrowserRouter(
  [
    {
      element: <PublicOnlyLayout />,
      errorElement: <RouteError />,
      children: [
        { path: 'login', element: <LoginPage /> },
        { path: 'forgot-password', element: <ForgotPasswordPage /> },
        { path: 'reset-password', element: <ResetPasswordPage /> },
      ],
    },
    {
      element: <ProtectedLayout />,
      errorElement: <RouteError />,
      children: [
        { index: true, element: <HomePage /> },
        {
          path: 'tables',
          children: [
            { index: true, element: <TablesPage /> },
            { path: ':table', element: <TableBrowseRoute /> },
          ],
        },
        {
          path: 'people-markets',
          children: [
            { index: true, element: <PeopleMarketsPage /> },
            { path: 'report', element: <MarketReportPage /> },
          ],
        },
        {
          path: 'products',
          children: [
            { index: true, element: <ProductsPage /> },
            { path: 'games-list', element: <ProductGamesListPage /> },
            { path: 'games-list/docs-package', element: <ProductGamesDocsPackagePage /> },
            { path: 'release-sheet', element: <ReleaseInformationSheetPage /> },
          ],
        },
        { path: 'community', element: <CommunityPage /> },
        { path: 'docs', element: <DocsPage /> },
        { path: 'help', element: <HelpPage /> },
        {
          path: 'feedback',
          children: [
            { index: true, element: <FeedbackPage /> },
            { path: 'admin', element: <FeedbackAdminPage /> },
          ],
        },
        {
          path: 'admin',
          children: [
            { index: true, element: <AdminPage /> },
            { path: 'users', element: <UsersAdminPage /> },
            { path: 'roles', element: <RolesAdminPage /> },
            { path: 'attachments-trash', element: <AdminAttachmentsTrashPage /> },
            { path: 'user-activity', element: <AdminUserActivityPage /> },
            { path: 'table-history', element: <AdminTableHistoryPage /> },
          ],
        },
        { path: 'profile', element: <ProfilePage /> },
        {
          path: 'reports',
          children: [
            { index: true, element: <ReportsPage /> },
            { path: 'latest-changes', element: <LatestChangesPage /> },
            { path: 'installations', element: <InstallationsReportPage /> },
            { path: 'focus-groups', element: <FocusGroupsReportPage /> },
            { path: 'issues', element: <IssuesReportPage /> },
          ],
        },
        {
          path: 'roadmap',
          children: [
            { index: true, element: <RoadmapPage /> },
            { path: 'games', element: <RoadmapPage /> },
            { path: 'docs', element: <RoadmapDocsPage /> },
          ],
        },
        { path: 'field-trials', element: <FieldTrialsPage /> },
        { path: 'tasks', element: <TasksPage /> },
        { path: 'find', element: <FindPage /> },
        { path: 'scout/events', element: <ScoutEventsPage /> },
        {
          path: 'ice2027',
          children: [
            { index: true, element: <Ice2027Page /> },
            { path: 'evaluation', element: <Ice2027EvaluationPage /> },
            { path: 'admin', element: <Ice2027AdminPage /> },
            { path: 'dashboard', element: <Ice2027DashboardPage /> },
            { path: 'dashboard/game', element: <Ice2027DashboardGamePage /> },
            { path: 'progress', element: <Ice2027ProgressPage /> },
          ],
        },
        {
          path: 'merkuriosity',
          children: [
            { index: true, element: <MerkuriosityPage /> },
            { path: 'words', element: <MerkuriosityWordsAdminPage /> },
          ],
        },
        { path: '*', element: <Navigate to={APP_PATHS.home} replace /> },
      ],
    },
  ],
  { basename },
)

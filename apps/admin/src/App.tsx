import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAuthenticated, removeAuth } from './utils/auth'
import LoginPage from './pages/AuthenticationPages/LoginPage'
import ResetPasswordRequestPage from './pages/AuthenticationPages/ResetPasswordRequestPage'
import ResetPasswordPage from './pages/AuthenticationPages/ResetPasswordPage'
import WelcomePage from './pages/AuthenticationPages/WelcomePage'
import OverviewPage from './pages/Dashboard/OverviewPage'
import DocumentsPage from './pages/Dashboard/DocumentsPage'
import CharterPage from './pages/Dashboard/CharterPage'
import ContractsPage from './pages/Dashboard/ContractsPage'
import SubcategoriesPage from './pages/Dashboard/SubcategoriesPage'
import PartnersPage from './pages/Dashboard/PartnersPage'
import HomeSliderPage from './pages/Dashboard/HomeSliderPage'
import LibraryPage from './pages/Dashboard/LibraryPage'
import AwardsPage from './pages/Dashboard/AwardsPage'
import EmployeesPage from './pages/Dashboard/EmployeesPage'
import EducationPage from './pages/Dashboard/EducationPage'
import EventsPage from './pages/Dashboard/EventsPage'
import NotFoundPage from './pages/NotFound/NotFoundPage'
import ProjectsPage from './pages/Dashboard/ProjectPage'
import ServicesPage from './pages/Dashboard/ServicePage'
import MonitoringZakonPage from './pages/Dashboard/MonitoringZakonPage'
import CommentsPage from './pages/Dashboard/CommentsPage'
import RarMembersPage from './pages/Dashboard/RarMembersPage'
import NewsPage from './pages/Dashboard/NewsPage'
import SubscriptionsPage from './pages/Dashboard/SubscriptionsPage'
import TemplatePreviewPage from './pages/Dashboard/TemplatePreviewPage'
import ForJournalistPage from './pages/Dashboard/ForJournalistPage'
import MenusPage from './pages/Dashboard/MenusPage'

interface ProtectedRouteProps {
  element: React.ReactElement
}

function ProtectedRoute({ element }: ProtectedRouteProps) {

  if (!isAuthenticated()) {
    removeAuth()
    return <Navigate to="/login" replace />
  }
  
  return element
}

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordRequestPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          {/* Защищённые маршруты */}
          <Route path="/" element={<ProtectedRoute element={<OverviewPage />} />} />
          <Route path="/documents" element={<ProtectedRoute element={<DocumentsPage />} />} />
          <Route path="/documents/:categoryId" element={<ProtectedRoute element={<SubcategoriesPage />} />} />
          <Route path="/charter" element={<ProtectedRoute element={<CharterPage />} />} />
          <Route path="/contracts" element={<ProtectedRoute element={<ContractsPage />} />} />
          <Route path="/partners" element={<ProtectedRoute element={<PartnersPage />} />} />
          <Route path="/home-slider" element={<ProtectedRoute element={<HomeSliderPage />} />} />
          <Route path="/awards" element={<ProtectedRoute element={<AwardsPage />} />} />
          <Route path="/employees" element={<ProtectedRoute element={<EmployeesPage />} />} />
          <Route path="/education" element={<ProtectedRoute element={<EducationPage />} />} />
          <Route path="/library" element={<ProtectedRoute element={<LibraryPage />} />} />
          <Route path="/events" element={<ProtectedRoute element={<EventsPage />} />} />

        <Route path="/projects" element={<ProtectedRoute element={<ProjectsPage />} />} />
        <Route path="/services" element={<ProtectedRoute element={<ServicesPage />} />} />
        <Route path="/monitoring-zakon" element={<ProtectedRoute element={<MonitoringZakonPage />} />} />
        <Route path="/comments" element={<ProtectedRoute element={<CommentsPage />} />} />
        <Route path="/menus" element={<ProtectedRoute element={<MenusPage />} />} />
        <Route path="/rar-members" element={<ProtectedRoute element={<RarMembersPage />} />} />
        <Route path="/news" element={<ProtectedRoute element={<NewsPage />} />} />
        <Route path="/subscriptions" element={<ProtectedRoute element={<SubscriptionsPage />} />} />
        <Route path="/for-journalist" element={<ProtectedRoute element={<ForJournalistPage />} />} />
        <Route path="/template-preview" element={<ProtectedRoute element={<TemplatePreviewPage />} />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
  )
}

export default App

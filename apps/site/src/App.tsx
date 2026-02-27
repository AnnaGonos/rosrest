import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/about/AboutPage'
import HeadSpeechPage from './pages/about/HeadSpeechPage'
import PartnersPage from './pages/about/PartnersPage'
import AwardsPage from './pages/about/AwardsPage'
import CharterPage from './pages/about/CharterPage'
import ContractsPage from './pages/about/ContractsPage'
import LibraryPage from './pages/LibraryPage'
import DocumentsIndexPage from './pages/DocumentsIndexPage'
import DocumentCategoryPage from './pages/DocumentCategoryPage'
import ContactsPage from './pages/about/ContactsPage'
import NotFoundPage from './pages/NotFoundPage'
import Layout from './layouts/Layout'
import EducationPage from './pages/education/EducationPage'
import SecondaryEducationPage from './pages/education/SecondaryEducationPage'
import HigherEducationPage from './pages/education/HigherEducationPage'
import EventsPage from './pages/events/EventsPage'
import EventDetailPage from './pages/events/EventDetailPage'
import PressCenterPage from './pages/press-center/PressСenterPage'
import ProjectPage from './pages/project/ProjectPage'
import ProjectDetailsPage from './pages/project/ProjectDetailsPage'
import ServicesPage from './pages/services/ServicesPage'
import ServiceDetailPage from './pages/services/ServiceDetailPage'
import MonitoringZakonPage from './pages/monitoring-zakon/MonitoringZakonPage'
import MonitoringZakonDetailPage from './pages/monitoring-zakon/MonitoringZakonDetailPage'
import LibraryArticlePage from './pages/LibraryArticlePage'
import RarMembersPage from './pages/rar/RarMembersPage'
import RarSectionPage from './pages/rar/RarSectionPage'
import RarMemberPortfolioPage from './pages/rar/RarMemberPortfolioPage'
import NewsPage from './pages/news/NewsPage'
import NewsDetailPage from './pages/news/NewsDetailPage'
import ForJournalistPage from './pages/for-journalist/ForJournalistPage'
import ScrollToTop from './ScrollToTop'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="about/head-speech" element={<HeadSpeechPage />} />
          <Route path="about/partners" element={<PartnersPage />} />
          <Route path="about/awards" element={<AwardsPage />} />
          <Route path="charter" element={<CharterPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="documents" element={<DocumentsIndexPage />} />
          <Route path="documents/:slug" element={<DocumentCategoryPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="library/:slug" element={<LibraryPage />} />
          <Route path="articles/:slug" element={<LibraryArticlePage />} />
          <Route path="education" element={<EducationPage />} />
          <Route path="education/srednee-professionalnoe-obrazovanie" element={<SecondaryEducationPage />} />
          <Route path="education/vysshee-professionalnoe-obrazovanie" element={<HigherEducationPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />
          <Route path="press-center" element={<PressCenterPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:slug" element={<NewsDetailPage />} />

          <Route path="projects" element={<ProjectPage />} />
          <Route path="projects/:slug" element={<ProjectDetailsPage />} />

          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:slug" element={<ServiceDetailPage />} />

          <Route path="monitoring-zakon" element={<MonitoringZakonPage />} />
          <Route path="monitoring-zakon/:slug" element={<MonitoringZakonDetailPage />} />

          <Route path="members" element={<RarMembersPage />} />
          <Route path="members/:slug" element={<RarSectionPage />} />
          <Route path="portfolio/:slug" element={<RarMemberPortfolioPage />} />

          <Route path="for-journalist" element={<ForJournalistPage />} />
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

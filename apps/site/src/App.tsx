import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AboutPage from './pages/about/AboutPage'
import HeadSpeechPage from './pages/about/HeadSpeechPage'
import PartnersPage from './pages/about/PartnersPage'
import AwardsPage from './pages/about/AwardsPage'
import CharterPage from './pages/about/CharterPage'
import ContractsPage from './pages/about/ContractsPage'
import LibraryPage from './pages/library/LibraryPage'
import DocumentsPage from './pages/document/DocumentsPage'
import DocumentCategoryPage from './pages/document/DocumentCategoryPage'
import ContactsPage from './pages/about/ContactsPage'
import NotFoundPage from './pages/not-found/NotFoundPage'
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
import LibraryArticlePage from './pages/library/LibraryArticlePage'
import RarMembersPage from './pages/rar/RarMembersPage'
import RarSectionPage from './pages/rar/RarSectionPage'
import RarMemberPortfolioPage from './pages/rar/RarMemberPortfolioPage'
import NewsPage from './pages/news/NewsPage'
import NewsDetailPage from './pages/news/NewsDetailPage'
import ForJournalistPage from './pages/for-journalist/ForJournalistPage'
import SubscribePage from './pages/subscribe/SubscribePage'
import UnsubscribePage from './pages/unsubscribe/UnsubscribePage'
import PrivacyPage from './pages/privacy/PrivacyPage'
import SearchPage from './pages/search/SearchPage'
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
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="members" element={<RarMembersPage />} />
          <Route path="members/:slug" element={<RarSectionPage />} />
          <Route path="portfolio/:slug" element={<RarMemberPortfolioPage />} />

          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:slug" element={<DocumentCategoryPage />} />

          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:slug" element={<ServiceDetailPage />} />

          <Route path="press-center" element={<PressCenterPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="news/:slug" element={<NewsDetailPage />} />
          <Route path="for-journalist" element={<ForJournalistPage />} />

          <Route path="projects" element={<ProjectPage />} />
          <Route path="projects/:slug" element={<ProjectDetailsPage />} />

          <Route path="events" element={<EventsPage />} />
          <Route path="events/:id" element={<EventDetailPage />} />

          <Route path="education" element={<EducationPage />} />
          <Route path="education/srednee-professionalnoe-obrazovanie" element={<SecondaryEducationPage />} />
          <Route path="education/vysshee-professionalnoe-obrazovanie" element={<HigherEducationPage />} />

          <Route path="library" element={<LibraryPage />} />
          <Route path="library/:slug" element={<LibraryPage />} />
          <Route path="articles/:slug" element={<LibraryArticlePage />} />

          <Route path="monitoring-zakon" element={<MonitoringZakonPage />} />
          <Route path="monitoring-zakon/:slug" element={<MonitoringZakonDetailPage />} />

          <Route path="subscribe" element={<SubscribePage />} />
          <Route path="unsubscribe" element={<UnsubscribePage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="search" element={<SearchPage />} />

          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

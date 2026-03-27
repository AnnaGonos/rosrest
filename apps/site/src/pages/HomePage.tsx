import Slider from '../components/Slider'
import AboutSection from '../components/AboutSection/AboutSection'
import EventSection from '../components/Event/EventSection'
import Partners from '../components/Partners'
import ServicesSection from '../components/Services/ServicesSection'
import MonitoringZakonSection from '../components/MonitoringZakonSection/MonitoringZakonSection'
import HomeNewsSection from '../components/News/HomeNewsSection'
import '../components/News/HomeNewsSection.css'
import Seo from '../components/Seo/Seo'

export default function HomePage() {
  return (
    <div>
      <Seo
        title={`Российская ассоциация реставраторов — восстановление и сохранение наследия`}
        description={`Новости, мероприятия и ресурсы Российской ассоциации реставраторов.`}
        canonical={window.location.origin + '/'}
        url={window.location.origin + '/'}
      />
      
      <Slider />
      <AboutSection />
      <HomeNewsSection />
      <MonitoringZakonSection />
      <section className='info-section'>
        <ServicesSection  />
        <EventSection
          title="[ Календарь мероприятий ]"
          filter="upcoming"
          sortOrder="ASC"
          limit={2}
          columns={2}
          linkText="все мероприятия"
        />
      </section>

      <Partners />
    </div>
  )
}

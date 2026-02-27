import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Layout.css'

interface Service {
    id: string
    page: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft: boolean
    }
}

export default function Footer() {
    const [services, setServices] = useState<Service[]>([])

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'
            const response = await fetch(`${API_BASE}/services?isDraft=false`)
            if (!response.ok) return
            const data = await response.json()

            const sorted = data.sort((a: Service, b: Service) => {
                const dateA = new Date(a.page.publishedAt || 0).getTime()
                const dateB = new Date(b.page.publishedAt || 0).getTime()
                return dateA - dateB
            })
            setServices(sorted)
        } catch (err) {
            console.error('Error fetching services:', err)
        }
    }

    return (
        <footer className="footer">
            <div className="footer-top">
                <Link to="/" className="footer-top__logo">
                    <div className="footer-top__brand">
                        <img
                            src="/icon-footer.png"
                            alt="RosRest Logo"
                        />
                        <div className="footer-top__brand-text">
                            <span className="footer-top__brand-line">НЕКОММЕРЧЕСКОЕ ПАРТНЕРСТВО</span>
                            <span className="footer-top__brand-line">«РОССИЙСКАЯ АССОЦИАЦИЯ РЕСТАВРАТОРОВ»</span>
                        </div>
                    </div>
                </Link>
                <div className="footer-top__contact">
                    <a className="footer-top__contact-line" href="tel:+78123148398">+7 (812) 314-83-98</a>
                    <a className="footer-top__contact-line" href="mailto:info.rosrest@mail.ru">info.rosrest@mail.ru</a>
                </div>
                <div className="footer-top__socials-container">
                    <a href="https://vk.com/rosrest" className="footer-top__social-link" aria-label="VK" target="_blank" rel="noopener noreferrer">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="footer-top__vk-icon"><path fill="currentColor" d="m23.456 5.784c-.27.849-.634 1.588-1.09 2.259l.019-.03q-.672 1.12-1.605 2.588-.8 1.159-.847 1.2c-.138.173-.234.385-.267.618l-.001.007c.027.212.125.397.268.535l.4.446q3.21 3.299 3.611 4.548c.035.092.055.198.055.309 0 .194-.062.373-.167.52l.002-.003c-.176.181-.422.293-.694.293-.03 0-.061-.001-.09-.004h.004-2.631c-.001 0-.003 0-.005 0-.337 0-.647-.118-.89-.314l.003.002c-.354-.291-.669-.606-.951-.948l-.009-.012q-.691-.781-1.226-1.315-1.782-1.694-2.63-1.694c-.021-.002-.045-.003-.07-.003-.165 0-.319.051-.446.138l.003-.002c-.104.13-.167.298-.167.479 0 .036.002.07.007.105v-.004c-.027.314-.043.679-.043 1.048 0 .119.002.237.005.355v-.017 1.159c.01.047.016.101.016.156 0 .242-.11.458-.282.601l-.001.001c-.387.177-.839.281-1.316.281-.102 0-.202-.005-.301-.014l.013.001c-1.574-.03-3.034-.491-4.275-1.268l.035.02c-1.511-.918-2.763-2.113-3.717-3.525l-.027-.042c-.906-1.202-1.751-2.56-2.471-3.992l-.07-.154c-.421-.802-.857-1.788-1.233-2.802l-.06-.185c-.153-.456-.264-.986-.31-1.535l-.002-.025q0-.758.892-.758h2.63c.024-.002.052-.003.081-.003.248 0 .477.085.658.228l-.002-.002c.2.219.348.488.421.788l.003.012c.484 1.367.997 2.515 1.587 3.615l-.067-.137c.482.97 1.015 1.805 1.623 2.576l-.023-.031q.8.982 1.248.982c.009.001.02.001.032.001.148 0 .277-.08.347-.2l.001-.002c.074-.19.117-.411.117-.641 0-.049-.002-.098-.006-.146v.006-3.879c-.021-.457-.133-.884-.32-1.267l.008.019c-.124-.264-.273-.492-.45-.695l.003.004c-.164-.164-.276-.379-.311-.619l-.001-.006c0-.17.078-.323.2-.423l.001-.001c.121-.111.283-.178.46-.178h.008 4.146c.022-.003.047-.004.073-.004.195 0 .37.088.486.226l.001.001c.103.188.164.413.164.651 0 .038-.002.075-.005.112v-.005 5.173c-.002.024-.003.052-.003.08 0 .184.051.357.139.504l-.002-.004c.073.108.195.178.333.178h.001c.176-.012.336-.07.471-.162l-.003.002c.272-.187.506-.4.709-.641l.004-.005c.607-.686 1.167-1.444 1.655-2.25l.039-.07c.344-.57.716-1.272 1.053-1.993l.062-.147.446-.892c.155-.446.571-.76 1.06-.76.019 0 .038 0 .057.001h-.003 2.631q1.066 0 .8.981z" /></svg>
                    </a>
                    <a href="https://t.me/RussiaRestorationCommunity" className="footer-top__social-link" aria-label="Facebook">
                        <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M29.919 6.163l-4.225 19.925c-0.319 1.406-1.15 1.756-2.331 1.094l-6.438-4.744-3.106 2.988c-0.344 0.344-0.631 0.631-1.294 0.631l0.463-6.556 11.931-10.781c0.519-0.462-0.113-0.719-0.806-0.256l-14.75 9.288-6.35-1.988c-1.381-0.431-1.406-1.381 0.288-2.044l24.837-9.569c1.15-0.431 2.156 0.256 1.781 2.013z" /></svg>
                    </a>
                    <a href="https://www.youtube.com/channel/UCJ4P8EI0jlASbsMPsrFmYpw"
                        className="footer-top__social-link" aria-label="YouTube"
                        target="_blank" rel="noopener noreferrer" >
                        <i className="bi bi-youtube icon icon--f"></i>
                    </a>
                </div>
            </div>

            <nav className="footer-middle footer-nav">
                <div className="footer-nav__section">
                    <Link to="/about" className="footer-nav__title">Ассоциация</Link>
                    <Link to="/about" className="footer-nav__link">Об Ассоциации</Link>
                    <Link to="/contacts" className="footer-nav__link">Аппарат Ассоциации и Контакты</Link>
                    <Link to="/partners" className="footer-nav__link">Партнеры</Link>
                    <Link to="/awards" className="footer-nav__link">Награды, дипломы</Link>
                </div>
                <div className="footer-nav__section">
                    <Link to="/press-center" className="footer-nav__title">Пресс-центр</Link>
                    <Link to="/news" className="footer-nav__link">Новости РАР</Link>
                    <Link to="/for-journalist" className="footer-nav__link">Журналистам</Link>
                </div>
                <div className="footer-nav__section">
                    <Link to="/events" className="footer-nav__title" style={{ marginBottom: '10px' }}>Календарь мероприятий</Link>
                    <Link to="/services" className="footer-nav__title">Услуги</Link>
                    {services.map(service => (
                        <Link
                            key={service.id}
                            to={`/services/${service.page.slug.replace(/^services\//, '')}`}
                            className="footer-nav__link"
                        >
                            {service.page.title}
                        </Link>
                    ))}
                </div>
                <div className="footer-nav__section">
                    <Link to="/documents/istoricheskie-poselenija" className="footer-nav__title">Исторические поселения</Link>
                    <Link to="/monitoring-zakon" className="footer-nav__title">Мониторинг законодательства</Link>
                    <Link to="https://www.culture.ru/" target="_blank" rel="noopener noreferrer" className="footer-nav__title">КУЛЬТУРА.РФ</Link>
                    <Link to="/services/join" className="footer-nav__title">Вступить в РАР</Link>
                </div>
            </nav>

            <div className="footer-bottom">
                <small className='footer-bottom__quoting'>© {new Date().getFullYear()} «Российская Ассоциация Реставраторов». При цитировании и ином использовании материалов портала ссылка на www.rosrest.com обязательна в формате гиперссылки.</small>
                {/* <small className='footer-bottom__privacy'><Link to="/privacy">Политика обработки персональных данных</Link></small> */}
                <small className='footer-bottom__development'><Link to="https://t.me/gonosanna" target="_blank" rel="noopener noreferrer">Разработка сайта</Link></small>
            </div>
        </footer>
    )
}

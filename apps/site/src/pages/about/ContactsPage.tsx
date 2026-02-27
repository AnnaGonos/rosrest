import { useEffect, useState } from 'react'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import EmployeeCard from '../../components/EmployeeCard/EmployeeCard'
import './AboutPage.css'
import { BackToSectionButton } from '../../components/LinkButtons'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

type Employee = {
  id: string
  fullName: string
  position?: string | null
  photoUrl?: string | null
  email?: string | null
  phone?: string | null
  profileUrl?: string | null
  orderIndex?: number
  createdAt?: string
}

export default function ContactsPage() {
  const [items, setItems] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(`${API_BASE}/employees`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: Employee[]) => { if (mounted) setItems(data || []) })
      .catch((err) => { if (mounted) setError(String(err)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const resolveImage = (raw?: string | null) => {
    if (!raw) return undefined
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return raw.startsWith('/') ? `${API_BASE}${raw}` : raw
  }

  const sorted = items.slice().sort((a, b) => {
    const ta = a.orderIndex ?? 0
    const tb = b.orderIndex ?? 0
    return ta - tb
  })

  return (
    <div className="page-main about-page contacts-page">
      <div className="page__header">
        <Breadcrumbs items={[{ label: 'Главная', to: '/' },
        { label: 'Об Ассоциации', to: '/about' }, { label: 'Аппарат Ассоциации и Контакты', isCurrent: true }]} />
      </div>

      <div className="page__container about-page__container">
        <div className='page__header-title'>
          <BackToSectionButton to="/about" label="К разделу Об Ассоциации" />
          <h1 className="page-title">Аппарат Ассоциации и Контакты</h1>
        </div>

        <ContentSection columns={1}>
          <div className="contacts__container">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p className="body-text article-text">
                190031, г. Санкт-Петербург, а/я 363
              </p>
              <a className="footer-top__contact-line" href="tel:+78123148398">+7 (812) 314-83-98</a>
              <a className="footer-top__contact-line" href="mailto:info.rosrest@mail.ru">
                info.rosrest@mail.ru
                <i className={`bi bi-arrow-up-right icon icon--sm`} style={{ marginLeft: '10px' }}></i>
              </a>
            </div>

            <div className="contacts__socials-container">
              <a href="https://vk.com/rosrest" className="footer-top__social-link" aria-label="VK" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="footer-top__vk-icon"><path fill="currentColor" d="m23.456 5.784c-.27.849-.634 1.588-1.09 2.259l.019-.03q-.672 1.12-1.605 2.588-.8 1.159-.847 1.2c-.138.173-.234.385-.267.618l-.001.007c.027.212.125.397.268.535l.4.446q3.21 3.299 3.611 4.548c.035.092.055.198.055.309 0 .194-.062.373-.167.52l.002-.003c-.176.181-.422.293-.694.293-.03 0-.061-.001-.09-.004h.004-2.631c-.001 0-.003 0-.005 0-.337 0-.647-.118-.89-.314l.003.002c-.354-.291-.669-.606-.951-.948l-.009-.012q-.691-.781-1.226-1.315-1.782-1.694-2.63-1.694c-.021-.002-.045-.003-.07-.003-.165 0-.319.051-.446.138l.003-.002c-.104.13-.167.298-.167.479 0 .036.002.07.007.105v-.004c-.027.314-.043.679-.043 1.048 0 .119.002.237.005.355v-.017 1.159c.01.047.016.101.016.156 0 .242-.11.458-.282.601l-.001.001c-.387.177-.839.281-1.316.281-.102 0-.202-.005-.301-.014l.013.001c-1.574-.03-3.034-.491-4.275-1.268l.035.02c-1.511-.918-2.763-2.113-3.717-3.525l-.027-.042c-.906-1.202-1.751-2.56-2.471-3.992l-.07-.154c-.421-.802-.857-1.788-1.233-2.802l-.06-.185c-.153-.456-.264-.986-.31-1.535l-.002-.025q0-.758.892-.758h2.63c.024-.002.052-.003.081-.003.248 0 .477.085.658.228l-.002-.002c.2.219.348.488.421.788l.003.012c.484 1.367.997 2.515 1.587 3.615l-.067-.137c.482.97 1.015 1.805 1.623 2.576l-.023-.031q.8.982 1.248.982c.009.001.02.001.032.001.148 0 .277-.08.347-.2l.001-.002c.074-.19.117-.411.117-.641 0-.049-.002-.098-.006-.146v.006-3.879c-.021-.457-.133-.884-.32-1.267l.008.019c-.124-.264-.273-.492-.45-.695l.003.004c-.164-.164-.276-.379-.311-.619l-.001-.006c0-.17.078-.323.2-.423l.001-.001c.121-.111.283-.178.46-.178h.008 4.146c.022-.003.047-.004.073-.004.195 0 .37.088.486.226l.001.001c.103.188.164.413.164.651 0 .038-.002.075-.005.112v-.005 5.173c-.002.024-.003.052-.003.08 0 .184.051.357.139.504l-.002-.004c.073.108.195.178.333.178h.001c.176-.012.336-.07.471-.162l-.003.002c.272-.187.506-.4.709-.641l.004-.005c.607-.686 1.167-1.444 1.655-2.25l.039-.07c.344-.57.716-1.272 1.053-1.993l.062-.147.446-.892c.155-.446.571-.76 1.06-.76.019 0 .038 0 .057.001h-.003 2.631q1.066 0 .8.981z" /></svg>
              </a>
              <a href="https://t.me/RussiaRestorationCommunity" className="footer-top__social-link" aria-label="Facebook">
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M29.919 6.163l-4.225 19.925c-0.319 1.406-1.15 1.756-2.331 1.094l-6.438-4.744-3.106 2.988c-0.344 0.344-0.631 0.631-1.294 0.631l0.463-6.556 11.931-10.781c0.519-0.462-0.113-0.719-0.806-0.256l-14.75 9.288-6.35-1.988c-1.381-0.431-1.406-1.381 0.288-2.044l24.837-9.569c1.15-0.431 2.156 0.256 1.781 2.013z" /></svg>
              </a>
              <a href="https://www.youtube.com/channel/UCJ4P8EI0jlASbsMPsrFmYpw" style={{ height: 'fit-content' }}
                className="footer-top__social-link" aria-label="YouTube"
                target="_blank" rel="noopener noreferrer">
                <svg enable-background="new 0 0 512 512" id="Layer_1" version="1.1" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" ><g><path fill="currentColor" d="M260.4,449c-57.1-1.8-111.4-3.2-165.7-5.3c-11.7-0.5-23.6-2.3-35-5c-21.4-5-36.2-17.9-43.8-39c-6.1-17-8.3-34.5-9.9-52.3   C2.5,305.6,2.5,263.8,4.2,222c1-23.6,1.6-47.4,7.9-70.3c3.8-13.7,8.4-27.1,19.5-37c11.7-10.5,25.4-16.8,41-17.5   c42.8-2.1,85.5-4.7,128.3-5.1c57.6-0.6,115.3,0.2,172.9,1.3c24.9,0.5,50,1.8,74.7,5c22.6,3,39.5,15.6,48.5,37.6   c6.9,16.9,9.5,34.6,11,52.6c3.9,45.1,4,90.2,1.8,135.3c-1.1,22.9-2.2,45.9-8.7,68.2c-7.4,25.6-23.1,42.5-49.3,48.3   c-10.2,2.2-20.8,3-31.2,3.4C366.2,445.7,311.9,447.4,260.4,449z M205.1,335.3c45.6-23.6,90.7-47,136.7-70.9   c-45.9-24-91-47.5-136.7-71.4C205.1,240.7,205.1,287.6,205.1,335.3z"/></g></svg>
              </a>
            </div>
          </div>

        </ContentSection>

        <ContentSection columns={1}>
          {loading && <div>Загрузка...</div>}
          {error && <div className="body-text">Ошибка: {error}</div>}

          {!loading && !error && (
            <div className="team-grid columns-4">
              {sorted.map((e) => (
                <EmployeeCard key={e.id} employee={e} resolveImage={resolveImage} type="square" />
              ))}
            </div>
          )}
        </ContentSection>
      </div>
    </div>
  )
}

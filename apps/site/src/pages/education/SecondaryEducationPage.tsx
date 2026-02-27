import { useEffect, useState } from 'react'
import EducationCard from '../../components/EducationCard'
import './EducationPage.css'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import { BackToSectionButton } from '../../components/LinkButtons'
import ContentSection from '../../components/ContentSection/ContentSection'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

type EducationInstitution = {
  id: number
  name: string
  websiteUrl: string
  imageUrl?: string | null
  specialties?: string[] | null
}

export default function SecondaryEducationPage() {
  const [items, setItems] = useState<EducationInstitution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${API_BASE}/education?type=secondary`)
        if (!res.ok) throw new Error('Не удалось загрузить данные')
        const data = await res.json()
        if (active) setItems(Array.isArray(data) ? data : [])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  return (
    <div className="page-main">
      <div className="page__header">
        <Breadcrumbs
          items={[
            { label: 'Главная', to: '/' },
            { label: 'Образование', to: '/education' },
            { label: 'Среднее профессиональное образование', isCurrent: true },
          ]}
        />
      </div>

      <div className="page__container">
        <div className="page__subheader">
          <BackToSectionButton to="/education" label="К разделу Образование" />
          <h1 className="page-title">Среднее профессиональное образование</h1>
        </div>
      </div>

      <div className="page__container page__container--27" style={{ marginTop: '100px' }}>
        <ContentSection columns={1}>
          {loading ? (
            <div className="education-page__loading">Загрузка...</div>
          ) : error ? (
            <div className="education-page__error">{error}</div>
          ) : items.length === 0 ? (
            <div className="education-page__empty">Нет записей</div>
          ) : (
            <div className="education-grid">
              {items.map((it) => (
                <EducationCard key={it.id} item={it} />
              ))}
            </div>
          )}
        </ContentSection>
      </div>
    </div>
  )
}

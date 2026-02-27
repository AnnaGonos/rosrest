import { useEffect, useState } from 'react'
import LinkCardList from '../components/LinkCardList/LinkCardList'
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../components/ContentSection/ContentSection'
import 'bootstrap-icons/font/bootstrap-icons.css'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

type Category = {
  id: number
  name: string
  slug?: string | null
  icon?: string | null
  createdAt?: string
  children?: Category[]
}

export default function DocumentsIndexPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetch(`${API_BASE}/document-categories/tree`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data: Category[]) => {
        if (mounted) {
          const sorted = (data || []).sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime()
            const dateB = new Date(b.createdAt || 0).getTime()
            return dateA - dateB
          })
          setCategories(sorted)
        }
      })
      .catch((err) => { if (mounted) setError(String(err)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const items = categories.map(c => ({
    title: c.name,
    href: `/documents/${c.slug || c.id}`,
    icon: c.icon && !c.icon.startsWith('http') && !c.icon.startsWith('/') ? c.icon : undefined,
    image: c.icon && (c.icon.startsWith('http') || c.icon.startsWith('/')) ? c.icon : undefined,
  }))

  return (
    <div className="page-main documents-page">
      <div className="page__header">
        <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Документы', isCurrent: true }]} />
      </div>

      <div className="page__container">
        <div style={{ display: 'flex', alignItems: 'start', gap: '20px', marginBottom: '80px', marginTop: '-30px' }}>
          <h1 className="page-title">Документы</h1>
        </div>

        <ContentSection columns={1}>
          {loading && <div>Загрузка...</div>}
          {error && <div className="body-text">Ошибка: {error}</div>}
          {!loading && !error && (
            <LinkCardList items={items} columns={4} variant="categories" />
          )}
        </ContentSection>
      </div>
    </div>
  )
}

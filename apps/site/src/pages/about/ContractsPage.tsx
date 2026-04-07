import { useEffect, useState } from 'react'
import { getFileUrl } from '../../utils/getFileUrl'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import DocumentList from '../../components/DocumentList/DocumentList'
import Seo from '../../components/Seo/Seo'
import RequestState from '../../components/RequestState/RequestState'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

type DocItem = {
  id: string
  title: string
  pdfUrl?: string | null
  createdAt?: string
}

export default function ContractsPage() {
  const [items, setItems] = useState<DocItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    fetch(`${API_BASE}/documents?type=contracts&isPublished=true&noCache=1`)
      .then((r) => {
        if (r.status === 404) {
          return []
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data: DocItem[]) => { if (mounted) setItems(data || []) })
      .catch((err) => { if (mounted) setError(String(err)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])



  return (
    <div className="page-main about-page contracts-page">
      <Seo
        title="Соглашения Российской ассоциации реставраторов"
        description="Соглашения Российской ассоциации реставраторов: документы и материалы о партнерском взаимодействии."
        canonical="https://rosrest.com/contracts"
        url="https://rosrest.com/contracts"
      />

      <div className="page__header">
        <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Об Ассоциации', to: '/about' }, { label: 'Соглашения РАР', isCurrent: true }]} />
      </div>

      <div className="page__container page__container--27">
        <div className='page__header-title'>
          <BackToSectionButton to="/about" label="К разделу Об Ассоциации" />
          <h1 className="page-title">Соглашения РАР</h1>
        </div>

        <ContentSection columns={1}>
          <RequestState
            loading={loading}
            error={error}
            loadingText="Загрузка документов..."
            variant="inline"
            className="about-status"
          />

          {!loading && !error && (
            <DocumentList items={items.map(item => ({
              ...item,
              pdfUrl: item.pdfUrl ? getFileUrl(item.pdfUrl) : undefined
            }))} loading={false} error={null} emptyMessage="Пока нет документов" emptyClassName="documents-empty body-text" />
          )}
        </ContentSection>
      </div>
    </div>
  )
}

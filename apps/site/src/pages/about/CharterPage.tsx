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

export default function CharterPage() {
    const [items, setItems] = useState<DocItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true)
        setError(null)
        fetch(`${API_BASE}/documents?type=charter&isPublished=true`)
            .then((r) => {
                if (r.status === 404) {
                    return []
                }
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
            .then((data: DocItem[]) => {
                if (mounted) {
                    setItems(data || [])
                }
            })
            .catch((err) => {
                if (mounted) {
                    setError(String(err))
                }
            })
            .finally(() => {
                if (mounted) {
                    setLoading(false)
                }
            })
        return () => { mounted = false }
    }, [])



    return (
        <div className="page-main">
            <Seo
                title="Устав и ежегодные отчеты Российской ассоциации реставраторов"
                description="Устав и ежегодные отчеты Российской ассоциации реставраторов: официальные документы и материалы."
                canonical="https://rosrest.com/charter"
                url="https://rosrest.com/charter"
            />

            <div className="page__header">
                <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Об Ассоциации', to: '/about' }, { label: 'Устав и отчёты', isCurrent: true }]} />
            </div>

            <div className="page__container page__container--27">
                <div className='page__header-title'>
                    <BackToSectionButton to="/about" label="К разделу Об Ассоциации" />
                    <h1 className="page-title">Устав и ежегодные отчеты</h1>
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

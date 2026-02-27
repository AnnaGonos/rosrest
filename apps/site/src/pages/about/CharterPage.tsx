import { useEffect, useState } from 'react'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import DocumentList from '../../components/DocumentList/DocumentList'

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
        fetch(`${API_BASE}/documents?type=charter&isPublished=true`)
            .then((r) => {
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
            <div className="page__header">
                <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: 'Об Ассоциации', to: '/about' }, { label: 'Устав и отчёты', isCurrent: true }]} />
            </div>

            <div className="page__container page__container--27">
                <div className='page__header-title'>
                    <BackToSectionButton to="/about" label="К разделу Об Ассоциации" />
                    <h1 className="page-title">Устав и ежегодные отчеты</h1>
                </div>

                <ContentSection columns={1}>
                    <DocumentList items={items} loading={loading} error={error} />
                </ContentSection>
            </div>
        </div>
    )
}

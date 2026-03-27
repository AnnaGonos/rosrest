import { useEffect, useState } from 'react'
import { getFileUrl } from '../../utils/getFileUrl'
import LinkCardList from '../../components/LinkCardList/LinkCardList'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import './AboutPage.css'
import { BackToSectionButton } from '../../components/LinkButtons'
import Seo from '../../components/Seo/Seo'
import RequestState from '../../components/RequestState/RequestState'

type Partner = {
    id: string
    name: string
    imageUrl?: string | null
    link?: string | null
}

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

export default function PartnersPage() {
    const [items, setItems] = useState<Partner[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true)
        setError(null)
        fetch(`${API_BASE}/partners`)
            .then((r) => {
                if (r.status === 404) return []
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
            .then((data: Partner[]) => {
                if (mounted) setItems(data)
            })
            .catch((err) => {
                if (mounted) setError(String(err))
            })
            .finally(() => {
                if (mounted) setLoading(false)
            })
        return () => {
            mounted = false
        }
    }, [])

    return (
        <div className="page-main">
            <Seo
                title="Партнеры Российской ассоциации реставраторов"
                description="Партнеры Российской ассоциации реставраторов: профильные организации и компании, сотрудничающие с Ассоциацией."
                canonical="https://rosrest.com/about/partners"
                url="https://rosrest.com/about/partners"
            />

            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Об Ассоциации', to: '/about' },
                        { label: 'Партнёры', isCurrent: true }]}
                />
            </div>

            <div className="page__container">
                <div className='page__header-title'>
                    <BackToSectionButton to="/about" label="К разделу Об Ассоциации" />
                    <h1 className="page-title">Партнеры</h1>
                </div>

                <ContentSection columns={1}>
                    <RequestState
                        loading={loading}
                        error={error}
                        loadingText="Загрузка партнеров..."
                        variant="inline"
                        className="about-status"
                    />

                    {!loading && !error && items.length === 0 && (
                        <div className="about-empty body-text">Пока нет партнеров</div>
                    )}

                    {!loading && !error && items.length > 0 && (
                        <LinkCardList
                            columns={4}
                            variant="featured"
                            items={items.map((p) => {
                                const raw = p.imageUrl || ''
                                const image = getFileUrl(raw)
                                return {
                                    title: p.name,
                                    href: p.link || '#',
                                    image: image ?? undefined,
                                    target: p.link ? '_blank' : '_self',
                                }
                            })}
                        />
                    )}
                </ContentSection>
            </div>
        </div>
    )
}

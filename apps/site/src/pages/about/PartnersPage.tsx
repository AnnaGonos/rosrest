import { useEffect, useState } from 'react'
import LinkCardList from '../../components/LinkCardList/LinkCardList'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import './AboutPage.css'
import { BackToSectionButton } from '../../components/LinkButtons'

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
        fetch(`${API_BASE}/partners`)
            .then((r) => {
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
                    {loading && <div>Загрузка...</div>}
                    {error && <div className="body-text">Ошибка: {error}</div>}
                    {!loading && !error && (
                        <LinkCardList
                            columns={4}
                            variant="featured"
                            items={items.map((p) => {
                                const raw = p.imageUrl || ''
                                const image = raw.startsWith('/') ? `${API_BASE}${raw}` : raw || undefined
                                return {
                                    title: p.name,
                                    href: p.link || '#',
                                    image,
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

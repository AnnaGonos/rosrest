import { useEffect, useState } from 'react'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BlocksRenderer } from '../../components/BlocksRenderer'
import { BackToSectionButton } from '../../components/LinkButtons'
import './ForJournalistPage.css'
import Seo from '../../components/Seo/Seo'

interface Block {
    id: string
    type: string
    content: Record<string, any>
    order: number
    parentBlockId?: string
    children?: Block[]
}

interface Page {
    id: string
    title: string
    slug: string
    isDraft: boolean
    publishedAt: string | null
    blocks: Block[]
}

interface ForJournalist {
    id: string
    page: Page
}

export default function ForJournalistPage() {
    const [forJournalist, setForJournalist] = useState<ForJournalist | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    useEffect(() => {
        fetchForJournalist()
    }, [])

    const fetchForJournalist = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${API_BASE}/for-journalist`)
            if (!response.ok) {
                if (response.status === 404) {
                    setError('Страница для журналистов еще не создана')
                    return
                }
                throw new Error('Ошибка загрузки страницы')
            }
            const data = await response.json()
            
            if (data && data.page && data.page.isDraft) {
                setError('Страница находится в режиме черновика')
                return
            }
            
            setForJournalist(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="page-main">
                <Seo
                    title="Для журналистов - Российская ассоциация реставраторов"
                    description="Материалы и контакты для журналистов — Российская ассоциация реставраторов."
                    canonical="https://rosrest.com/press-center/for-journalist"
                    url="https://rosrest.com/press-center/for-journalist"
                />
                <div className="page__container">
                    <div className="text-center py-5">Загрузка...</div>
                </div>
            </div>
        )
    }

    if (error || !forJournalist) {
        return (
            <div className="page-main">
                <div className="page__header">
                    <Breadcrumbs
                        items={[
                            { label: 'Главная', to: '/' },
                            { label: 'Для журналистов', isCurrent: true },
                        ]}
                    />
                </div>
                <div className="page__container">
                    <Seo
                        title="Для журналистов - Российская ассоциация реставраторов"
                        description="Материалы и контакты для журналистов — Российская ассоциация реставраторов."
                        canonical="https://rosrest.com/press-center/for-journalist"
                        url="https://rosrest.com/press-center/for-journalist"
                    />
                    <h1 className="page-title">Для журналистов</h1>
                    <div className="alert alert-warning">
                        {error || 'Страница не найдена'}
                    </div>
                    <BackToSectionButton to="/" label="На главную" />
                </div>
            </div>
        )
    }

    return (
        <div className="page-main for-journalist-page">
            <Seo
                title={`${forJournalist.page.title} - Российская ассоциация реставраторов`}
                description={`${forJournalist.page.title} — материалы для журналистов.`}
                canonical={`https://rosrest.com/press-center/${forJournalist.page.slug}`}
                url={`https://rosrest.com/press-center/${forJournalist.page.slug}`}
            />
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Пресс-центр', to: '/press-center' },
                        { label: forJournalist.page.title, isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container page__container--27">
                <div className="page__header-title">
                    <BackToSectionButton to="/" label="На главную" />
                    <h1 className="page-title">{forJournalist.page.title}</h1>
                </div>

                <ContentSection columns={1}>
                    {forJournalist.page.blocks && forJournalist.page.blocks.length > 0 ? (
                        <BlocksRenderer blocks={forJournalist.page.blocks} />
                    ) : (
                        <p>Контент отсутствует</p>
                    )}
                </ContentSection>
            </div>
        </div>
    )
}

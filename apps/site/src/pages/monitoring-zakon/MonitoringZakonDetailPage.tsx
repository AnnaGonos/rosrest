import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import { BlocksRenderer } from '../../components/BlocksRenderer'
import MonitoringZakonCard from '../../components/MonitoringZakonCard/MonitoringZakonCard'
import ShareModal from '../../components/ShareModal'
import CommentsSection from '../../components/Comments/CommentsSection'

interface Block {
    id: string
    type: string
    content: Record<string, any>
    order: number
    children?: Block[]
}

interface MonitoringItem {
    id: string
    page: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft: boolean
        blocks: Block[]
    }
}

export default function MonitoringZakonDetailPage() {
    const { slug } = useParams<{ slug: string }>()
    const [item, setItem] = useState<MonitoringItem | null>(null)
    const [recommendations, setRecommendations] = useState<MonitoringItem[]>([])
    const [loading, setLoading] = useState(true)
    const [recsLoading, setRecsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [shouldLoadRecs, setShouldLoadRecs] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [commentsCount, setCommentsCount] = useState(0)
    const commentsRef = useRef<HTMLDivElement>(null)
    const recsTriggerRef = useRef<HTMLDivElement | null>(null)
    const recsObserverRef = useRef<IntersectionObserver | null>(null)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    const formatDate = (value?: string) => {
        if (!value) return 'Дата не указана'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'Дата не указана'
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
    }

    const scrollToComments = () => {
        if (commentsRef.current) {
            commentsRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }

    useEffect(() => {
        if (!item || !shouldLoadRecs) return

        const fetchRecommendations = async () => {
            setRecsLoading(true)
            try {
                const response = await fetch(`${API_BASE}/monitoring-zakon/${item.id}/recommendations`)
                if (!response.ok) throw new Error('Ошибка загрузки рекомендаций')
                const data = await response.json()
                setRecommendations(data)
            } catch (err) {
                console.error('Recommendations load error:', err)
                setRecommendations([])
            } finally {
                setRecsLoading(false)
            }
        }

        fetchRecommendations()
    }, [item, API_BASE, shouldLoadRecs])

    const setRecsTrigger = useCallback((node: HTMLDivElement | null) => {
        recsTriggerRef.current = node

        if (recsObserverRef.current) {
            recsObserverRef.current.disconnect()
            recsObserverRef.current = null
        }

        if (!node || shouldLoadRecs) return

        recsObserverRef.current = new IntersectionObserver(
            (entries) => {
                const e = entries[0]
                if (e && e.isIntersecting) {
                    setShouldLoadRecs(true)
                    if (recsObserverRef.current) {
                        recsObserverRef.current.disconnect()
                        recsObserverRef.current = null
                    }
                }
            },
            { root: null, rootMargin: '100px', threshold: 0.1 },
        )

        recsObserverRef.current.observe(node)
    }, [shouldLoadRecs])

    useEffect(() => {
        const fetchItem = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(`${API_BASE}/monitoring-zakon/slug/${slug}`)
                if (!response.ok) throw new Error('Ошибка загрузки страницы')
                const data = await response.json()
                setItem(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            } finally {
                setLoading(false)
            }
        }

        if (slug) {
            fetchItem()
        }
    }, [API_BASE, slug])

    if (loading) return <div className="page-main"><div className="page__container">Загрузка...</div></div>
    if (error) return <div className="page-main"><div className="page__container">Ошибка: {error}</div></div>
    if (!item) return null

    return (
        <div className="page-main">
            <div className="page__header">
                <BackToSectionButton to="/monitoring-zakon?page=1" label="К разделу Мониторинг" title="Назад" />
            </div>



            <div className="page__container page__container--27">

                <div className='page__header-title page__header-title--center'>
                    <h1 className="page-title page-title--transform-none">{item.page.title}</h1>
                    <p className="body-text block-label-md" style={{ marginBottom: '24px' }}>
                        {formatDate(item.page.publishedAt)}
                    </p>
                </div>

                <ContentSection columns={1}>
                    <BlocksRenderer blocks={item.page.blocks} />
                </ContentSection>

                <div className="share__content-buttons">
                    <button
                        className="share__button-link"
                        onClick={() => setIsShareModalOpen(true)}
                        title="Поделиться"
                    >
                        Поделиться
                    </button>

                    <div
                        className="comments-section__counter"
                        onClick={scrollToComments}
                        title="Перейти к комментариям"
                    >
                        <i className="bi bi-chat-text"></i>
                        <span>{commentsCount}</span>
                    </div>
                </div>

                <div ref={setRecsTrigger} style={{ minHeight: 120 }} aria-hidden="true" />

                {!recsLoading && recommendations.length > 0 && (
                    <div className="section-recommendations">
                        <div className="section-recommendations__title">
                            <p className="section-title--sm">Читайте также</p>
                        </div>

                        <ContentSection columns={4}>
                            {recommendations.map(rec => (
                                <MonitoringZakonCard
                                    key={rec.id}
                                    item={{
                                        id: rec.id,
                                        slug: rec.page.slug,
                                        title: rec.page.title,
                                        publishedAt: rec.page.publishedAt,
                                    }}
                                    type="recommendation"
                                />
                            ))}
                        </ContentSection>
                    </div>
                )}

                <div ref={commentsRef}>
                    <CommentsSection
                        commentableType="monitoring-zakon"
                        commentableId={item.id}
                        onCommentCountChange={setCommentsCount}
                    />
                </div>
            </div>

            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} url={window.location.origin + '/monitoring-zakon/' + item?.page.id} title={item?.page.title} />
        </div>
    )
}

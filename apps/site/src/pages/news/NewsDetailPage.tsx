import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import { BlocksRenderer } from '../../components/BlocksRenderer'
import NewsCard, { NewsCardItem } from '../../components/News/NewsCard'
import ScrollToTopButton from '../../components/ScrollToTop/ScrollToTopButton'
import ShareModal from '../../components/ShareModal'
import CommentsSection from '../../components/Comments/CommentsSection'
import './NewsDetailPage.css'

interface Block {
    id: string
    type: string
    content: Record<string, any>
    order: number
    children?: Block[]
}

interface NewsTag {
    id: number
    name: string
    slug: string
}

interface NewsItem {
    id: string
    previewImage: string
    page: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft: boolean
        blocks: Block[]
    }
    tags: NewsTag[]
}

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
]

export default function NewsDetailPage() {
    const { slug } = useParams<{ slug: string }>()
    const [item, setItem] = useState<NewsItem | null>(null)
    const [recommendations, setRecommendations] = useState<NewsCardItem[]>([])
    const [_, setAllTags] = useState<NewsTag[]>([])
    const [recsLoading, setRecsLoading] = useState(false)
    const [commentsCount, setCommentsCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const commentsRef = useRef<HTMLDivElement>(null)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    const scrollToComments = () => {
        if (commentsRef.current) {
            commentsRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const formatDate = (value?: string) => {
        if (!value) return 'Дата не указана'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'Дата не указана'
        const day = date.getDate()
        const month = MONTH_NAMES[date.getMonth()]
        const year = date.getFullYear()
        return `${day} ${month} ${year}`
    }

    const resolveImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        if (url.startsWith('//')) return `${window.location.protocol}${url}`
        const base = API_BASE.replace(/\/$/, '')
        const path = url.replace(/^\//, '')
        return `${base}/${path}`
    }

    useEffect(() => {
        if (!item) return

        const fetchRecommendations = async () => {
            setRecsLoading(true)
            try {
                const response = await fetch(`${API_BASE}/news/${item.id}/recommendations`)
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
    }, [item, API_BASE])

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await fetch(`${API_BASE}/news-tags`)
                if (response.ok) {
                    const tags = await response.json()
                    setAllTags(Array.isArray(tags) ? tags : [])
                }
            } catch (err) {
                console.error('Error fetching tags:', err)
            }
        }

        fetchTags()
    }, [API_BASE])

    useEffect(() => {
        const fetchBySlug = async (value: string) => {
            const encoded = encodeURIComponent(value)
            const response = await fetch(`${API_BASE}/news/slug/${encoded}`)
            if (!response.ok) return null
            return response.json()
        }

        const fetchItem = async () => {
            setLoading(true)
            setError(null)
            try {
                const rawSlug = slug || ''
                const candidates = rawSlug.startsWith('news/')
                    ? [rawSlug, rawSlug.replace(/^news\//, '')]
                    : [`news/${rawSlug}`, rawSlug]

                let data = null
                for (const candidate of candidates) {
                    data = await fetchBySlug(candidate)
                    if (data) break
                }

                if (!data) throw new Error('Ошибка загрузки новости')
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
        <div className="page-main news-detail-page">
            <div className="page__header">
                <BackToSectionButton to="/news?page=1" label="К разделу Новости" title="Назад" />
            </div>

            <div className="page__container">
                <div className='page__header-news'>
                    <div className='page__header-title news-detail__meta'>
                        {item.tags && item.tags.length > 0 && (
                            <div className="news-detail__tags">
                                {item.tags.map(tag => (
                                    <span key={tag.id} className="news-detail__tag body-text--sm">
                                        {tag.name}
                                    </span>
                                ))}
                            </div>
                        )}
                        <h1 className="page-title page-title--transform-none">{item.page.title}</h1>

                        <p className="body-text block-label-md">
                            {formatDate(item.page.publishedAt)}
                        </p>
                    </div>

                    {item.previewImage && (
                        <div className="news-detail__preview-image">
                            <img
                                src={resolveImageUrl(item.previewImage)}
                                alt={item.page.title}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="page__container page__container--27">
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
                        className="news-detail__comments-counter"
                        onClick={scrollToComments}
                        title="Перейти к комментариям"
                    >
                        <i className="bi bi-chat-text"></i>
                        <span>{commentsCount}</span>
                    </div>
                </div>

                {item.tags && item.tags.length > 0 && (
                    <div className="news-detail__content-tags">
                        <span className="news-detail__content-tags-label">ТЕГИ: </span>
                        {item.tags.map((tag, index) => (
                            <span key={tag.id}>
                                <a
                                    href={`/news?page=1&tag=${tag.slug}`}
                                    className="news-detail__content-tag-link"
                                >
                                    {tag.name}
                                </a>
                                {index < item.tags.length - 1 && <span>,  </span>}
                            </span>
                        ))}
                    </div>
                )}

                {!recsLoading && recommendations.length > 0 && (
                    <div className="section-recommendations">
                        <div className="section-recommendations__title">
                            <p className="section-title--sm">Читайте также</p>
                        </div>

                        <ContentSection columns={3}>
                            {recommendations.map(rec => (
                                <NewsCard key={rec.id} news={rec} />
                            ))}
                        </ContentSection>
                    </div>
                )}

                <div ref={commentsRef}>
                    <CommentsSection 
                        commentableType="news"
                        commentableId={item.id}
                        onCommentCountChange={setCommentsCount}
                    />
                </div>
            </div>

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                url={window.location.href}
                title={item.page.title}
            />

            <ScrollToTopButton />
        </div>
    )
}

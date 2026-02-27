import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../components/LinkButtons'
import { BlocksRenderer, type Block } from '../components/BlocksRenderer'
import './LibraryPage.css'
import ScrollToTopButton from '../components/ScrollToTop/ScrollToTopButton'
import ShareModal from '../components/ShareModal'

interface PageData {
    id: string
    slug: string
    title: string
    publishedAt?: string
    isDraft: boolean
    blocks: Block[]
}

interface LibraryItem {
    id: number
    type: string
    title: string
    previewImage?: string
    description?: string
    isPublished: boolean
    page?: PageData
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
]

const formatPublicationDate = (dateString?: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return ''
    const day = date.getDate()
    const month = MONTH_NAMES[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
}

export default function LibraryArticlePage() {
    const { slug } = useParams<{ slug: string }>()
    const [page, setPage] = useState<PageData | null>(null)
    const [previewImage, setPreviewImage] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)

    const resolveImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        if (url.startsWith('//')) return `${window.location.protocol}${url}`
        const base = API_BASE_URL.replace(/\/$/, '')
        const path = url.replace(/^\//, '')
        return `${base}/${path}`
    }

    useEffect(() => {
        fetchArticlePage()
    }, [slug])

    const fetchArticlePage = async () => {
        if (!slug) return
        setLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE_URL}/library?type=article&limit=1000`)
            if (!response.ok) throw new Error('Статья не найдена')
            const items: LibraryItem[] = await response.json()
            const targetSlug = `library/${slug}`
            const item = items.find((entry) => entry.page?.slug === targetSlug)

            if (!item?.page) {
                throw new Error('Статья не найдена')
            }

            setPage(item.page)
            setPreviewImage(item.previewImage || null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="page-main">
                <div className="page__container">Загрузка...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="page-main">
                <div className="page__container">Ошибка: {error}</div>
            </div>
        )
    }

    if (!page) return null

    return (
        <div className="page-main">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Библиотека', to: '/library' },
                        { label: '', isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container page__container--27">
                <div className="page__header-title page__header-title--column-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <BackToSectionButton to="/library" label="К разделу Библиотека" />
                        <h1 className="page-title">{page.title}</h1>
                        {page.publishedAt && (
                            <div>
                                <p className='block-label-md'>{formatPublicationDate(page.publishedAt)}</p>
                            </div>
                        )}
                    </div>
                    {previewImage && (
                        <div className="content-section__image-wrapper">
                            <img src={resolveImageUrl(previewImage)} alt={page.title} />
                        </div>
                    )}
                </div>



                <ContentSection columns={1}>
                    <BlocksRenderer blocks={page.blocks} />
                    <div style={{ marginTop: '150px', alignContent: 'center', display: 'flex', justifyContent: 'center' }}>
                        <button className="share__button-link"
                            onClick={() => setIsShareModalOpen(true)}
                            title="Поделиться статьей"
                        >
                            Поделиться статьей
                        </button>
                    </div>
                </ContentSection>
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    url={window.location.origin + '/articles/' + slug}
                    title={page.title}
                />
                <ScrollToTopButton />
            </div>
        </div>
    )
}

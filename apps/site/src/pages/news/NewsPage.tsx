import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import Pagination from '../../components/Pagination/Pagination'
import NewsCard, { NewsCardItem } from '../../components/News/NewsCard'
import ScrollToTopButton from '../../components/ScrollToTop/ScrollToTopButton'
import './NewsPage.css'
import { BackToSectionButton } from '../../components/LinkButtons'

const PAGE_SIZE = 21

export default function NewsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [items, setItems] = useState<NewsCardItem[]>([])
    const [allTags, setAllTags] = useState<Array<{ id: number; name: string; slug: string }>>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalPages, setTotalPages] = useState(1)

    const currentPage = useMemo(() => {
        const raw = Number(searchParams.get('page') || '1')
        return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
    }, [searchParams])

    const selectedTag = useMemo(() => {
        return searchParams.get('tag') || null
    }, [searchParams])

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

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
        const fetchItems = async () => {
            setLoading(true)
            setError(null)

            try {
                let url = `${API_BASE}/news?isDraft=false&page=${currentPage}&pageSize=${PAGE_SIZE}`
                
                if (selectedTag && allTags.length > 0) {
                    const tag = allTags.find(t => t.slug === selectedTag)
                    if (tag) {
                        url += `&tagId=${tag.id}`
                    }
                }
                
                const response = await fetch(url)
                if (!response.ok) throw new Error('Ошибка загрузки данных')
                const data = await response.json()
                const list = Array.isArray(data) ? data : (data?.items || [])
                setItems(list)
                const pages = typeof data?.totalPages === 'number' ? data.totalPages : 1
                setTotalPages(pages > 0 ? pages : 1)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            } finally {
                setLoading(false)
            }
        }

        fetchItems()
    }, [API_BASE, currentPage, selectedTag, allTags])

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [currentPage])

    const handlePageChange = (page: number) => {
        const newParams: Record<string, string> = { page: String(page) }
        if (selectedTag) {
            newParams.tag = selectedTag
        }
        setSearchParams(newParams)
    }

    const handleTagClick = (tagSlug: string | null) => {
        const newParams: Record<string, string> = { page: '1' }
        if (tagSlug) {
            newParams.tag = tagSlug
        }
        setSearchParams(newParams)
    }

    if (loading) return <div className="page-main"><div className="page__container">Загрузка...</div></div>
    if (error) return <div className="page-main"><div className="page__container">Ошибка: {error}</div></div>

    return (
        <div className="page-main news-page">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Пресс-центр', to: '/press-center' },
                        { label: 'Новости', isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container">
                <div className='page__header-title'>
                    <BackToSectionButton to="/press-center" label="К разделу Пресс-центр" />
                    <h1 className="page-title">Новости</h1>
                </div>

                {allTags.length > 0 && (
                    <div className="news-page__tags-filter">
                        <button
                            className={`news-page__tag ${!selectedTag ? 'news-page__tag--active' : ''}`}
                            onClick={() => handleTagClick(null)}
                        >
                            Все
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag.id}
                                className={`news-page__tag ${selectedTag === tag.slug ? 'news-page__tag--active' : ''}`}
                                onClick={() => handleTagClick(tag.slug)}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                )}

                <ContentSection
                    columns={3}
                    items={items}
                    renderItem={(item) => <NewsCard news={item} />}
                />

                {/* <div style={{ margin: '60px 0 40px 0' }}>
                    <NewsSubscribeForm />
                </div> */}

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>

            <ScrollToTopButton />
        </div>
    )
}

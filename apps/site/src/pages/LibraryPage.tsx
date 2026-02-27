import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../components/ContentSection/ContentSection'
import { BackToSectionButton, PrimaryButtonLink, OutlineButtonLink } from '../components/LinkButtons'
import LibraryItemModal from '../components/LibraryItemModal'
import { BlocksRenderer, type Block } from '../components/BlocksRenderer'
import './LibraryPage.css'

interface LibraryItem {
    id: number
    type: string
    title: string
    contentUrl: string
    previewImage?: string
    description: string
    categoryId: number
    isPublished: boolean
    createdAt: string
    category: {
        id: number
        name: string
        createdAt: string
    }
    page?: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft?: boolean
    }
}

interface ArticlePage {
    id: string
    slug: string
    title: string
    publishedAt?: string
    isDraft: boolean
    blocks: Block[]
}

interface GroupedLibraryItems {
    categoryName: string
    categoryId: number
    categoryCreatedAt: string
    items: LibraryItem[]
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

export default function LibraryPage() {
    const [groupedItems, setGroupedItems] = useState<GroupedLibraryItems[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [articlePage, setArticlePage] = useState<ArticlePage | null>(null)
    const [articleLoading, setArticleLoading] = useState(false)
    const [articleError, setArticleError] = useState<string | null>(null)
    const params = useParams()
    const navigate = useNavigate()
    const [columns, setColumns] = useState<number>(5)
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())

    const toggleCategoryExpanded = (categoryId: number) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedCategories(newExpanded)
    }

    useEffect(() => {
        fetchLibraryItems()
    }, [])

   
    useEffect(() => {
        const slugParam = params.slug as string | undefined

        if (!slugParam) {
            setIsModalOpen(false)
            setSelectedItem(null)
            setArticlePage(null)
            setArticleError(null)
            return
        }

        const isNumericId = /^\d+$/.test(slugParam)
        if (isNumericId) {
            const id = parseInt(slugParam, 10)
            setArticlePage(null)
            setArticleError(null)

            const found = groupedItems.flatMap(g => g.items).find(i => i.id === id)
            if (found) {
                setSelectedItem(found)
                setIsModalOpen(true)
                return
            }

            ; (async () => {
                try {
                    setLoading(true)
                    const res = await fetch(`${API_BASE_URL}/library/${id}`)
                    if (res.ok) {
                        const data: LibraryItem = await res.json()
                        setSelectedItem(data)
                        setIsModalOpen(true)

                        fetchLibraryItems()
                    } else if (res.status === 404) {
                        navigate('/library')
                    } else {
                        console.error('Ошибка при получении элемента', res.status)
                        navigate('/library')
                    }
                } catch (err) {
                    console.error('Ошибка при получении элемента', err)
                    navigate('/library')
                } finally {
                    setLoading(false)
                }
            })()
            return
        }

        setIsModalOpen(false)
        setSelectedItem(null)

        ; (async () => {
            try {
                setArticleLoading(true)
                setArticleError(null)
                const response = await fetch(`${API_BASE_URL}/library?type=article&limit=1000`)
                if (!response.ok) throw new Error('Статья не найдена')
                const items: LibraryItem[] = await response.json()
                const targetSlug = `library/${slugParam}`
                const item = items.find((entry) => entry.page?.slug === targetSlug)

                if (!item?.page) {
                    throw new Error('Статья не найдена')
                }

                setArticlePage({
                    id: item.page.id,
                    slug: item.page.slug,
                    title: item.page.title,
                    publishedAt: item.page.publishedAt,
                    isDraft: item.page.isDraft ?? false,
                    blocks: (item as any).page.blocks || [],
                })
            } catch (err) {
                setArticleError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            } finally {
                setArticleLoading(false)
            }
        })()
    }, [params.slug, groupedItems])

    useEffect(() => {
        const updateColumns = () => {
            const w = window.innerWidth
            if (w < 480) setColumns(2)
            else if (w < 700) setColumns(2)
            else if (w < 900) setColumns(3)
            else if (w < 1200) setColumns(4)
            else setColumns(5)
        }

        updateColumns()
        window.addEventListener('resize', updateColumns)
        return () => window.removeEventListener('resize', updateColumns)
    }, [])

    const fetchLibraryItems = async () => {
        try {
            setLoading(true)

            const [booksResponse, articlesResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/library?type=book&limit=9`),
                fetch(`${API_BASE_URL}/library?type=article&limit=9`)
            ])

            const books: LibraryItem[] = await booksResponse.json()
            const articles: LibraryItem[] = await articlesResponse.json()

            const allItems = [...books, ...articles]

            const grouped = allItems.reduce((acc, item) => {
                const existingCategory = acc.find(g => g.categoryId === item.categoryId)
                if (existingCategory) {
                    existingCategory.items.push(item)
                } else {
                    acc.push({
                        categoryName: item.category.name,
                        categoryId: item.categoryId,
                        categoryCreatedAt: item.category.createdAt,
                        items: [item]
                    })
                }
                return acc
            }, [] as GroupedLibraryItems[])

            const sortedGrouped = grouped.sort((a, b) => {
                const aDate = Date.parse(a.categoryCreatedAt || '') || 0
                const bDate = Date.parse(b.categoryCreatedAt || '') || 0

                if (aDate !== bDate) return bDate - aDate

                const aHasBooks = a.items.some(item => item.type === 'book')
                const bHasBooks = b.items.some(item => item.type === 'book')
                if (aHasBooks && !bHasBooks) return -1
                if (!aHasBooks && bHasBooks) return 1
                return 0
            })

            setGroupedItems(sortedGrouped)
        } catch (error) {
            console.error('Ошибка загрузки библиотеки:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="library-page">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Библиотека', isCurrent: true },
                    ]}
                />
            </div>
            <div className="library-page__header">
                <h1 className="library-page__title page-title">Библиотека</h1>
                <p className="library-page__description body-text">
                    В библиотеке размещаются журналы, книги, научные работы, посвященные реставрации, архитектуре, сохранению культурного наследия. Материалы доступны либо бесплатно для скачивания, либо со ссылками на возможность приобретения онлайн- или бумажной версии издания. Если вы хотите разместить ваши материалы на нашем сайте, присылайте их на почту пресс-службы <a href="mailto:press.rosrest@mail.ru" className="library-page__email-link">press.rosrest@mail.ru</a>.
                </p>
            </div>

            <div className="library-page__content">
                {params.slug && !/^\d+$/.test(params.slug) ? (
                    articleLoading ? (
                        <div className="library-page__loading">
                            <p>Загрузка...</p>
                        </div>
                    ) : articleError ? (
                        <div className="library-page__empty">
                            <p className="library-page__empty-text">Ошибка: {articleError}</p>
                        </div>
                    ) : articlePage ? (
                        <div className="page__container page__container--27">
                            <div className="page__header-title">
                                <BackToSectionButton to="/library" label="К разделу Библиотека" />
                                <h1 className="page-title">{articlePage.title}</h1>
                            </div>

                            <ContentSection columns={1}>
                                <BlocksRenderer blocks={articlePage.blocks} />
                            </ContentSection>
                        </div>
                    ) : null
                ) : loading ? (
                    <div className="library-page__loading">
                        <p>Загрузка...</p>
                    </div>
                ) : groupedItems.length > 0 ? (
                    <>
                        {groupedItems.map((group) => {
                            const isExpanded = expandedCategories.has(group.categoryId)
                            const visibleCount = columns
                            const displayItems = isExpanded ? group.items : group.items.slice(0, visibleCount)
                            const hasMoreItems = group.items.length > visibleCount

                            return (
                                <div key={group.categoryId} className="library-page__category-section">
                                    <h2 className="section-title--sm">{group.categoryName}</h2>
                                    <div className="library-page__grid">
                                        {displayItems.map((item) => (
                                            <article
                                                key={item.id}
                                                className="library-card library-card--clickable"
                                                onClick={() => {
                                                    if (item.type === 'article' && item.page?.slug) {
                                                        const slug = item.page.slug.replace(/^library\//, '')
                                                        navigate(`/articles/${slug}`)
                                                        return
                                                    }

                                                    // books open in modal
                                                    navigate(`/library/${item.id}`)
                                                }}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                {item.previewImage && (
                                                    <img
                                                        src={`${API_BASE_URL}${item.previewImage}`}
                                                        alt={item.title}
                                                        className="library-card__preview"
                                                    />
                                                )}
                                                <div className="library-card__content">
                                                    <h3 className="library-card__title">{item.title}</h3>
                                                </div>
                                            </article>
                                        ))}
                                    </div>

                                    {hasMoreItems && (
                                        <div className="library-page__expand-button-wrapper">
                                            {isExpanded ? (
                                                <PrimaryButtonLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        toggleCategoryExpanded(group.categoryId)
                                                    }}
                                                >
                                                    Свернуть книги
                                                </PrimaryButtonLink>
                                            ) : (
                                                <OutlineButtonLink
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        toggleCategoryExpanded(group.categoryId)
                                                    }}
                                                >
                                                    Больше книг
                                                </OutlineButtonLink>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </>
                ) : (
                    <div className="library-page__empty">
                        <i className="bi bi-inbox library-page__empty-icon" />
                        <p className="library-page__empty-text">Библиотека пуста</p>
                    </div>
                )}
            </div>

            <LibraryItemModal
                item={selectedItem}
                isOpen={isModalOpen}
                onClose={() => {
                    navigate('/library')
                    setIsModalOpen(false)
                    setSelectedItem(null)
                }}
            />
        </div>
    )
}

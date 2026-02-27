import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS, API_BASE_URL } from '../../config/api'
import { PageBlocksEditor } from '../../components/PageBlocksEditor'
import ImageUploadInput, { ImageUploadValue } from '../../components/ImageUploadInput'

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
    slug: string
    title: string
    publishedAt?: string
    isDraft: boolean
    blocks: Block[]
    createdAt: string
    updatedAt: string
}

interface NewsTag {
    id: number
    name: string
    slug: string
}

interface News {
    id: string
    previewImage: string
    page: Page
    tags: NewsTag[]
    createdAt: string
    updatedAt: string
}

export default function NewsPage() {
    const [news, setNews] = useState<News[]>([])
    const [commentsCountMap, setCommentsCountMap] = useState<Record<string, number>>({})
    const [tags, setTags] = useState<NewsTag[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [addNewsModalOpened, setAddNewsModalOpened] = useState(false)
    const [editingNewsId, setEditingNewsId] = useState<string | null>(null)
    const [savingNews, setSavingNews] = useState(false)
    const [newsFormError, setNewsFormError] = useState<string | null>(null)

    // Tag management state
    const [addTagModalOpened, setAddTagModalOpened] = useState(false)
    const [editingTagId, setEditingTagId] = useState<number | null>(null)
    const [tagName, setTagName] = useState('')
    const [savingTag, setSavingTag] = useState(false)
    const [tagFormError, setTagFormError] = useState<string | null>(null)
    const [confirmDeleteTagModal, setConfirmDeleteTagModal] = useState(false)
    const [tagToDelete, setTagToDelete] = useState<number | null>(null)

    const [newsTitle, setNewsTitle] = useState('')
    const [newsSlug, setNewsSlug] = useState('')
    const [newsPublishedAt, setNewsPublishedAt] = useState<Date | null>(() => new Date())
    const [newsIsDraft, setNewsIsDraft] = useState(true)
    const [newsPreviewImage, setNewsPreviewImage] = useState<ImageUploadValue>({ mode: 'file', file: null, url: '' })
    const [newsBlocks, setNewsBlocks] = useState<Block[]>([])
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([])

    const [unsavedChanges, setUnsavedChanges] = useState(false)
    const [confirmCloseModal, setConfirmCloseModal] = useState(false)
    const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
    const [newsToDelete, setNewsToDelete] = useState<string | null>(null)

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState('')
    const [filterByTag, setFilterByTag] = useState<number | null>(null)
    const [filterByDateFrom, setFilterByDateFrom] = useState<Date | null>(null)
    const [filterByDateTo, setFilterByDateTo] = useState<Date | null>(null)

    // Pagination state
    const PAGE_SIZE = 21
    const [currentPage, setCurrentPage] = useState(1)

    const filesBaseUrl = (import.meta as any).env.VITE_FILES_BASE_URL || window.location.origin

    const resolveImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        if (url.startsWith('//')) return `${window.location.protocol}${url}`
        const base = filesBaseUrl.replace(/\/$/, '')
        const path = url.replace(/^\//, '')
        return `${base}/${path}`
    }

    const transliterate = (text: string): string => {
        const map: { [key: string]: string } = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
            'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
            'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
            'ч': 'ch', 'ш': 'sh', 'щ': 'shh', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'ju', 'я': 'ja',
            'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh',
            'З': 'Z', 'И': 'I', 'Й': 'J', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
            'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C',
            'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shh', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Ju', 'Я': 'Ja'
        }
        return text.split('').map(char => map[char] || char).join('')
    }

    const generateSlug = (title: string): string => {
        return transliterate(title)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    const handleGenerateSlug = () => {
        if (newsTitle.trim()) {
            setNewsSlug(generateSlug(newsTitle))
            setUnsavedChanges(true)
        }
    }

    const formatDate = (dateString: string | undefined): string => {
        if (!dateString) return 'Дата не указана'
        const date = new Date(dateString)
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    useEffect(() => {
        loadNews()
        loadTags()
    }, [])

    const loadNews = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.NEWS.list(), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!response.ok) throw new Error('Не удалось загрузить новости')
            const data = await response.json()
            const list = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])
            setNews(list)
            fetchCommentsCounts(list)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const countAllComments = (comments: any[]): number => {
        if (!Array.isArray(comments)) return 0
        let total = 0
        const traverse = (items: any[]) => {
            for (const c of items) {
                total += 1
                if (Array.isArray(c.replies) && c.replies.length > 0) traverse(c.replies)
            }
        }
        traverse(comments)
        return total
    }

    const fetchCommentsCounts = async (list: News[]) => {
        try {
            const token = localStorage.getItem('admin_token')
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const entries = await Promise.all(list.map(async (n) => {
                try {
                    const res = await fetch(`${API_BASE_URL}/comments/news/${n.id}`, { headers })
                    if (!res.ok) return [n.id, 0] as const
                    const data = await res.json()
                    const cnt = countAllComments(data)
                    return [n.id, cnt] as const
                } catch (e) {
                    return [n.id, 0] as const
                }
            }))
            const map: Record<string, number> = {}
            for (const [id, cnt] of entries) map[id] = cnt
            setCommentsCountMap(map)
        } catch (e) {
        }
    }

    const loadTags = async () => {
        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.NEWS_TAGS, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setTags(data)
            }
        } catch (err) {
            console.error('Failed to load tags:', err)
        }
    }

    const handleOpenCreateModal = () => {
        setEditingNewsId(null)
        setNewsTitle('')
        setNewsSlug('')
        const now = new Date()
        setNewsPublishedAt(now)
        setNewsIsDraft(true)
        setNewsPreviewImage({ mode: 'file', file: null, url: '' })
        setNewsBlocks([])
        setSelectedTagIds([])
        setNewsFormError(null)
        setUnsavedChanges(false)
        setAddNewsModalOpened(true)
    }

    const handleOpenEditModal = async (newsItem: News) => {
        setEditingNewsId(newsItem.id)
        setNewsTitle(newsItem.page.title)
        const slug = newsItem.page.slug && newsItem.page.slug.startsWith('news/') ? newsItem.page.slug.slice('news/'.length) : (newsItem.page.slug || '')
        setNewsSlug(slug)
        let publishedAt: Date | null = null
        if (newsItem.page.publishedAt) {
            const d = new Date(newsItem.page.publishedAt)
            publishedAt = isNaN(d.getTime()) ? null : d
        } else {
            publishedAt = null
        }
        setNewsPublishedAt(publishedAt)
        setNewsIsDraft(newsItem.page.isDraft)
        if (newsItem.previewImage) {
            setNewsPreviewImage({ mode: 'url', file: null, url: newsItem.previewImage })
        } else {
            setNewsPreviewImage({ mode: 'file', file: null, url: '' })
        }
        setNewsBlocks((newsItem.page.blocks || []).map(b => ({ ...b })))
        const tagIds = newsItem.tags.map(t => t.id)
        setSelectedTagIds(tagIds)
        setNewsFormError(null)
        setUnsavedChanges(false)
        setAddNewsModalOpened(true)
    }

    const closeNewsModal = () => {
        setAddNewsModalOpened(false)
        setEditingNewsId(null)
        setNewsFormError(null)
        setUnsavedChanges(false)
    }

    const handleRequestCloseModal = () => {
        if (unsavedChanges) {
            setConfirmCloseModal(true)
        } else {
            closeNewsModal()
        }
    }

    const handleConfirmClose = () => {
        setConfirmCloseModal(false)
        closeNewsModal()
    }

    const handleCancelClose = () => {
        setConfirmCloseModal(false)
    }

    const handleSaveNews = async () => {
        const title = newsTitle.trim()
        const slug = newsSlug.trim()

        if (!title) {
            setNewsFormError('Укажите название новости')
            return
        }
        if (!slug) {
            setNewsFormError('Укажите адрес новости')
            return
        }
        if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
            setNewsFormError('Адрес должен содержать только латинские буквы, цифры и дефисы')
            return
        }
        if (!editingNewsId && !newsPreviewImage.file && !newsPreviewImage.url) {
            setNewsFormError('Загрузите превью-изображение или укажите URL')
            return
        }

        try {
            setSavingNews(true)
            setNewsFormError(null)

            const token = localStorage.getItem('admin_token')
            const formData = new FormData()

            formData.append('title', title)
            formData.append('slug', slug)
            formData.set('isDraft', JSON.stringify(newsIsDraft))
            formData.append('publishedAt', newsPublishedAt?.toISOString() || new Date().toISOString())
            formData.append('blocks', JSON.stringify(Array.isArray(newsBlocks) ? newsBlocks : []))
            formData.append('tagIds', selectedTagIds.join(','))

            if (newsPreviewImage.mode === 'file' && newsPreviewImage.file) {
                formData.append('previewImage', newsPreviewImage.file)
            } else if (newsPreviewImage.mode === 'url' && newsPreviewImage.url) {
                formData.append('previewImageUrl', newsPreviewImage.url)
            }

            let response
            if (editingNewsId) {
                response = await fetch(API_ENDPOINTS.NEWS.update(editingNewsId), {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                })
            } else {
                response = await fetch(API_ENDPOINTS.NEWS.create(), {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Не удалось сохранить новость')
            }

            await loadNews()
            closeNewsModal()
        } catch (err: any) {
            setNewsFormError(err.message)
        } finally {
            setSavingNews(false)
        }
    }

    const handleDeleteClick = (newsId: string) => {
        setNewsToDelete(newsId)
        setConfirmDeleteModal(true)
    }

    const handleDeleteConfirm = async () => {
        if (!newsToDelete) return

        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.NEWS.delete(newsToDelete), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Не удалось удалить новость')

            await loadNews()
            setConfirmDeleteModal(false)
            setNewsToDelete(null)
        } catch (err: any) {
            setError(err.message)
            setConfirmDeleteModal(false)
            setNewsToDelete(null)
        }
    }

    const handleCancelDelete = () => {
        setConfirmDeleteModal(false)
        setNewsToDelete(null)
    }

    const handleToggleTag = (tagId: number) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        )
        setUnsavedChanges(true)
    }

    const handleOpenCreateTagModal = () => {
        setEditingTagId(null)
        setTagName('')
        setTagFormError(null)
        setAddTagModalOpened(true)
    }

    const handleOpenEditTagModal = (tag: NewsTag) => {
        setEditingTagId(tag.id)
        setTagName(tag.name)
        setTagFormError(null)
        setAddTagModalOpened(true)
    }

    const handleSaveTag = async () => {
        const name = tagName.trim()

        if (!name) {
            setTagFormError('Укажите название тега')
            return
        }

        try {
            setSavingTag(true)
            setTagFormError(null)

            const token = localStorage.getItem('admin_token')
            let response

            if (editingTagId) {
                response = await fetch(API_ENDPOINTS.NEWS_TAGS_UPDATE(editingTagId), {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name })
                })
            } else {
                response = await fetch(API_ENDPOINTS.NEWS_TAGS_CREATE, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name })
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Не удалось сохранить тег')
            }

            await loadTags()
            setAddTagModalOpened(false)
        } catch (err: any) {
            setTagFormError(err.message)
        } finally {
            setSavingTag(false)
        }
    }

    const handleDeleteTagClick = (tagId: number) => {
        setTagToDelete(tagId)
        setConfirmDeleteTagModal(true)
    }

    const handleDeleteTagConfirm = async () => {
        if (!tagToDelete) return

        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.NEWS_TAGS_DELETE(tagToDelete), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Не удалось удалить тег')

            await loadTags()
            setConfirmDeleteTagModal(false)
            setTagToDelete(null)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const filteredNews = news.filter((newsItem) => {
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            if (!newsItem.page.title.toLowerCase().includes(query)) {
                return false
            }
        }

        if (filterByTag !== null) {
            if (!newsItem.tags.some(tag => tag.id === filterByTag)) {
                return false
            }
        }

        if (filterByDateFrom || filterByDateTo) {
            if (newsItem.page.publishedAt) {
                const newsDate = new Date(newsItem.page.publishedAt)

                if (filterByDateFrom) {
                    const fromDate = new Date(filterByDateFrom)
                    fromDate.setHours(0, 0, 0, 0)
                    if (newsDate < fromDate) {
                        return false
                    }
                }

                if (filterByDateTo) {
                    const toDate = new Date(filterByDateTo)
                    toDate.setHours(23, 59, 59, 999)
                    if (newsDate > toDate) {
                        return false
                    }
                }
            } else {
                return false
            }
        }

        return true
    })

    const handleClearFilters = () => {
        setSearchQuery('')
        setFilterByTag(null)
        setFilterByDateFrom(null)
        setFilterByDateTo(null)
        setCurrentPage(1)
    }

    const hasActiveFilters = searchQuery.trim() !== '' || filterByTag !== null || filterByDateFrom !== null || filterByDateTo !== null

    const totalItems = filteredNews.length
    const totalPages = Math.ceil(totalItems / PAGE_SIZE)
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    const paginatedNews = filteredNews.slice(startIndex, endIndex)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, filterByTag, filterByDateFrom, filterByDateTo])

    return (
        <DashboardLayout title="Новости">
            <Container>
                <div className="mb-4">
                    <h1 className="mb-2">Новости</h1>
                    <p className="text-muted">Управление новостями и тегами</p>
                    <a href="https://disk.yandex.ru/d/D6-aOxePBPQsDw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-dark  d-flex align-items-center"
                        style={{ width: 'fit-content', margin: '20px 0' }}
                    >
                        <i className="bi bi-info-lg me-2"></i>
                        Советы по публикации
                    </a>
                </div>

                <div className="d-flex gap-2 mb-4">
                    <Button variant="primary" onClick={handleOpenCreateModal}>
                        <i className="bi bi-plus-lg me-2"></i>Добавить новость
                    </Button>
                </div>

                <Row className="mb-4">
                    <Col>
                        <Card>
                            <Card.Header>
                                <div className="d-flex justify-content-between align-items-center">
                                    <h4 className="mb-0">Теги новостей</h4>
                                    <Button variant="outline-primary" size="sm" onClick={handleOpenCreateTagModal}>
                                        <i className="bi bi-plus-lg me-2"></i>
                                        Добавить тег
                                    </Button>
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {tags.length === 0 ? (
                                    <p className="text-muted mb-0">Нет тегов. Создайте первый тег.</p>
                                ) : (
                                    <div className="d-flex flex-wrap gap-2">
                                        {tags.map(tag => (
                                            <Badge key={tag.id} bg="light" text="dark" className="d-flex align-items-center" style={{ fontSize: '0.9rem', padding: '0.5rem 0.75rem' }}>
                                                <span className="me-2">{tag.name}</span>
                                                <small className="text-muted me-3">({tag.slug})</small>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="p-0 me-2"
                                                    onClick={() => handleOpenEditTagModal(tag)}
                                                    style={{ fontSize: '0.8rem' }}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="p-0 text-danger"
                                                    onClick={() => handleDeleteTagClick(tag.id)}
                                                    style={{ fontSize: '0.8rem' }}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="mb-4">
                    <Card.Body>
                        <Row className="g-3">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Поиск по названию</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Введите название новости..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Фильтр по тегу</Form.Label>
                                    <Form.Select
                                        value={filterByTag || ''}
                                        onChange={(e) => setFilterByTag(e.target.value ? parseInt(e.target.value) : null)}
                                    >
                                        <option value="">Все теги</option>
                                        {tags.map(tag => (
                                            <option key={tag.id} value={tag.id}>{tag.name}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>От даты</Form.Label>
                                    <DatePicker
                                        selected={filterByDateFrom}
                                        onChange={(date: Date | null) => setFilterByDateFrom(date)}
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="От..."
                                        className="form-control"
                                        isClearable
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2}>
                                <Form.Group>
                                    <Form.Label>До даты</Form.Label>
                                    <DatePicker
                                        selected={filterByDateTo}
                                        onChange={(date: Date | null) => setFilterByDateTo(date)}
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="До..."
                                        className="form-control"
                                        isClearable
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <Button
                                    variant="outline-secondary"
                                    onClick={handleClearFilters}
                                    disabled={!hasActiveFilters}
                                    className="w-100"
                                >
                                    <i className="bi bi-x-lg me-2"></i>
                                    Сбросить
                                </Button>
                            </Col>
                        </Row>
                        {hasActiveFilters && (
                            <div className="mt-3">
                                <small className="text-muted">
                                    Найдено новостей: <strong>{filteredNews.length}</strong> из <strong>{news.length}</strong>
                                </small>
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)}>
                        <i className="bi bi-exclamation-circle me-2"></i>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" />
                    </div>
                ) : filteredNews.length === 0 ? (
                    <Card>
                        <Card.Body className="text-center py-5">
                            {hasActiveFilters ? (
                                <p className="text-muted">По заданным фильтрам ничего не найдено. Попробуйте изменить критерии поиска.</p>
                            ) : (
                                <p className="text-muted">Нет новостей. Создайте первую новость.</p>
                            )}
                        </Card.Body>
                    </Card>
                ) : (
                    <>
                        <Row xs={1} sm={2} md={3} lg={3} className="g-4">
                            {paginatedNews.map((newsItem) => (
                                <Col key={newsItem.id}>
                                    <Card className="h-100">
                                        {newsItem.previewImage && (
                                            <Card.Img
                                                variant="top"
                                                src={resolveImageUrl(newsItem.previewImage)}
                                                alt={newsItem.page.title}
                                                style={{ height: '250px', objectFit: 'cover', marginBottom: '20px' }}
                                            />
                                        )}

                                        <Card.Body>
                                            <Card.Title className="fw-bold" style={{ minHeight: '48px' }}>
                                                {newsItem.page.title}
                                            </Card.Title>

                                            <div className="mb-3">
                                                <small className="text-muted d-block mb-1">
                                                    <strong>Дата:</strong> {formatDate(newsItem.page.publishedAt)}
                                                </small>
                                                <small className="text-muted">
                                                    /{newsItem.page.slug}
                                                </small>
                                            </div>

                                            {newsItem.tags.length > 0 && (
                                                <div className="mb-2">
                                                    {newsItem.tags.map(tag => (
                                                        <div key={tag.id} className="me-1" style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', border: '1px solid #000', fontSize: '12px' }}>
                                                            {tag.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <Badge bg={newsItem.page.isDraft ? 'secondary' : 'success'}>
                                                        {newsItem.page.isDraft ? 'Черновик' : 'Опубликовано'}
                                                    </Badge>
                                                    {commentsCountMap[newsItem.id] > 0 && (
                                                        <span className="badge bg-info text-dark d-flex align-items-center" style={{ gap: '6px' }}>
                                                            <i className="bi bi-chat-left-text"></i>
                                                            {commentsCountMap[newsItem.id]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="btn-group">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => handleOpenEditModal(newsItem)}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(newsItem.id)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {totalPages > 1 && (
                            <div className="d-flex justify-content-center mt-5">
                                <nav aria-label="Page navigation">
                                    <ul className="pagination">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(1)}
                                                disabled={currentPage === 1}
                                            >
                                                <i className="bi bi-chevron-double-left"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                            >
                                                <i className="bi bi-chevron-left"></i>
                                            </button>
                                        </li>

                                        {/* Page numbers */}
                                        {Array.from({ length: totalPages }, (_, i) => {
                                            const page = i + 1
                                            const isActive = page === currentPage
                                            const isVisible =
                                                page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 1 && page <= currentPage + 1)

                                            if (!isVisible && page !== 2 && page !== totalPages - 1) return null

                                            return (
                                                <li key={page} className={`page-item ${isActive ? 'active' : ''}`}>
                                                    <button
                                                        className="page-link"
                                                        onClick={() => setCurrentPage(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                </li>
                                            )
                                        })}

                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                            >
                                                <i className="bi bi-chevron-right"></i>
                                            </button>
                                        </li>
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(totalPages)}
                                                disabled={currentPage === totalPages}
                                            >
                                                <i className="bi bi-chevron-double-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}

                        {/* Page info */}
                        {totalPages > 1 && (
                            <div className="text-center mt-3 mb-4">
                                <small className="text-muted">
                                    Страница <strong>{currentPage}</strong> из <strong>{totalPages}</strong>
                                    ({startIndex + 1}-{Math.min(endIndex, totalItems)} из {totalItems} новостей)
                                </small>
                            </div>
                        )}
                    </>
                )}
            </Container>

            <Modal
                show={addNewsModalOpened}
                onHide={handleRequestCloseModal}
                fullscreen={true}
                backdrop="static"
                dialogClassName="modal-fullscreen"
                contentClassName="border-0"
            >
                <div className="d-flex flex-column h-100">
                    <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
                        <div className="row g-4">
                            <div className="col-md-4" style={{ background: '#F7FAFF', padding: '20px 40px 40px 60px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '710px' }}>
                                <div className="mb-4">
                                    <span className="text-danger fs-5 me-2">*</span>
                                    <span className="text-danger">— обязательное поле для заполнения</span>
                                </div>

                                {newsFormError && (
                                    <Alert variant="danger" className="mb-4">
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        {newsFormError}
                                    </Alert>
                                )}

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Название новости <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Введите название новости"
                                        value={newsTitle}
                                        onChange={(e) => {
                                            setNewsTitle(e.target.value)
                                            if (!editingNewsId) {
                                                setNewsSlug(generateSlug(e.target.value))
                                            }
                                            setUnsavedChanges(true)
                                        }}
                                    />
                                </Form.Group>

                                <ImageUploadInput
                                    id="newsPreviewImage"
                                    label={<>Превью изображения</>}
                                    value={newsPreviewImage}
                                    onChange={(value) => {
                                        setNewsPreviewImage(value)
                                        setUnsavedChanges(true)
                                    }}
                                    required={!editingNewsId}
                                    helpText={editingNewsId ? 'Оставьте пустым, чтобы сохранить текущее изображение' : undefined}
                                />

                                <Form.Group className="mb-4 mt-4">
                                    <Form.Label>
                                        Адрес новости <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="например: forum-ekonomika-nasledija"
                                            value={newsSlug}
                                            onChange={(e) => {
                                                setNewsSlug(e.target.value)
                                                setUnsavedChanges(true)
                                            }}
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={handleGenerateSlug}
                                            disabled={!newsTitle.trim() || savingNews}
                                            title="Сгенерировать из названия"
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            <i className="bi bi-magic me-1"></i>
                                            Авто
                                        </Button>
                                    </div>
                                    <Form.Text className="text-muted">
                                        Используйте только латинские буквы, цифры и дефисы
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label style={{ width: '100%' }}>
                                        Дата и время публикации <span className="text-danger">*</span>
                                    </Form.Label>
                                    <DatePicker
                                        selected={newsPublishedAt || undefined}
                                        onChange={(date: Date | null) => {
                                            setNewsPublishedAt(date)
                                            setUnsavedChanges(true)
                                        }}
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={5}
                                        dateFormat="dd.MM.yyyy HH:mm"
                                        timeCaption="Время"
                                        className="form-control"
                                        placeholderText="Выберите дату и время"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Статус <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="d-flex flex-row gap-4">
                                        <Form.Check
                                            type="radio"
                                            id="status-published"
                                            name="news-status"
                                            label="Опубликовано"
                                            checked={newsIsDraft === false}
                                            onChange={() => {
                                                setNewsIsDraft(false)
                                                setUnsavedChanges(true)
                                            }}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="status-draft"
                                            name="news-status"
                                            label="Черновик"
                                            checked={newsIsDraft === true}
                                            onChange={() => {
                                                setNewsIsDraft(true)
                                                setUnsavedChanges(true)
                                            }}
                                        />
                                    </div>
                                </Form.Group>

                                {tags.length > 0 && (
                                    <Form.Group className="mb-4">
                                        <Form.Label>Теги</Form.Label>
                                        <div>
                                            {tags.map(tag => (
                                                <Button
                                                    key={tag.id}
                                                    variant={selectedTagIds.includes(tag.id) ? 'primary' : 'outline-primary'}
                                                    size="sm"
                                                    className="me-2 mb-2"
                                                    onClick={() => handleToggleTag(tag.id)}
                                                >
                                                    {tag.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </Form.Group>
                                )}
                            </div>

                            <div className="col-md-8" style={{ padding: '10px 40px' }}>
                                <PageBlocksEditor
                                    blocks={newsBlocks}
                                    setBlocks={(blocks: Block[]) => {
                                        setNewsBlocks(blocks)
                                        setUnsavedChanges(true)
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer border-top d-flex justify-content-end gap-2">
                        <Button
                            variant="outline-primary"
                            onClick={handleSaveNews}
                            disabled={savingNews}
                        >
                            <i className="bi bi-floppy me-2"></i>
                            Сохранить
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleRequestCloseModal}
                            disabled={savingNews}
                            style={{
                                height: '38px',
                                width: '38px',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '6px',
                            }}
                            aria-label="Закрыть"
                        >
                            <i className="bi bi-x-lg"></i>
                        </Button>
                    </div>
                </div>

                <Modal
                    show={confirmCloseModal}
                    onHide={handleCancelClose}
                    centered
                >
                    <Modal.Body className="text-center py-4">
                        <p>Последние изменения не сохранены.<br />Закрыть панель?</p>
                    </Modal.Body>
                    <Modal.Footer className="d-flex justify-content-end gap-2">
                        <Button variant="secondary" onClick={handleCancelClose}>
                            Отмена
                        </Button>
                        <Button variant="danger" onClick={handleConfirmClose}>
                            ОК
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Modal>

            <Modal
                show={confirmDeleteModal}
                onHide={handleCancelDelete}
                centered
            >
                <Modal.Body className="text-center py-4">
                    <p>Вы уверены, что хотите удалить новость?</p>
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={handleCancelDelete}>
                        Отмена
                    </Button>
                    <Button variant="danger" onClick={handleDeleteConfirm}>
                        Удалить
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={addTagModalOpened} onHide={() => setAddTagModalOpened(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingTagId ? 'Редактировать тег' : 'Добавить тег'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {tagFormError && (
                        <Alert variant="danger" dismissible onClose={() => setTagFormError(null)}>
                            {tagFormError}
                        </Alert>
                    )}

                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Название тега *</Form.Label>
                            <Form.Control
                                type="text"
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                            />
                            <Form.Text className="text-muted">
                                URL-адрес (slug) будет сгенерирован автоматически
                            </Form.Text>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setAddTagModalOpened(false)} disabled={savingTag}>
                        Отмена
                    </Button>
                    <Button variant="primary" onClick={handleSaveTag} disabled={savingTag}>
                        {savingTag ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Сохранение...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-floppy me-2"></i>
                                Сохранить
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={confirmDeleteTagModal} onHide={() => setConfirmDeleteTagModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Подтверждение удаления тега</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите удалить этот тег? Тег будет удален из всех новостей.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setConfirmDeleteTagModal(false)}>
                        Отмена
                    </Button>
                    <Button variant="danger" onClick={handleDeleteTagConfirm}>
                        Удалить
                    </Button>
                </Modal.Footer>
            </Modal>
        </DashboardLayout>
    )
}

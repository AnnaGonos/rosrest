import { useMemo, useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS, API_BASE_URL } from '../../config/api'
import { PageBlocksEditor } from '../../components/PageBlocksEditor'
import { buildMonitoringZakonMocks } from '../../mock/monitoringZakonMock'

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

interface MonitoringItem {
    id: string
    page: Page
}

const PAGE_SIZE = 21

export default function MonitoringZakonPage() {
    const mockEnabled = false
    const mockItems = useMemo(() => buildMonitoringZakonMocks(350), [])
    const [items, setItems] = useState<MonitoringItem[]>([])
    const [commentsCountMap, setCommentsCountMap] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [addModalOpened, setAddModalOpened] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [savingItem, setSavingItem] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('')
    const [publishedAt, setPublishedAt] = useState<Date | null>(() => new Date())
    const [isDraft, setIsDraft] = useState(true)
    const [blocks, setBlocks] = useState<Block[]>([])

    const [unsavedChanges, setUnsavedChanges] = useState(false)
    const [initialState, setInitialState] = useState<{
        title: string
        slug: string
        publishedAt: Date | null
        isDraft: boolean
        blocks: Block[]
    } | null>(null)
    const [confirmCloseModal, setConfirmCloseModal] = useState(false)

    const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<string | null>(null)

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

    const generateSlug = (text: string): string => {
        return transliterate(text)
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    const handleGenerateSlug = () => {
        if (title.trim()) {
            setSlug(generateSlug(title))
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
        loadItems(1, true)
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            if (loadingMore || !hasMore) return

            const scrollTop = window.scrollY
            const windowHeight = window.innerHeight
            const documentHeight = document.documentElement.scrollHeight

            if (scrollTop + windowHeight >= documentHeight - 200) {
                loadItems(currentPage + 1, false)
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [currentPage, loadingMore, hasMore])

    const loadItems = async (page: number, isInitial: boolean) => {
        if (isInitial) {
            setLoading(true)
            setCurrentPage(1)
            setHasMore(true)
        } else {
            setLoadingMore(true)
        }
        setError(null)

        if (mockEnabled) {
            const start = (page - 1) * PAGE_SIZE
            const end = start + PAGE_SIZE
            const newItems = mockItems.slice(start, end)

            if (isInitial) {
                setItems(newItems)
            } else {
                setItems(prev => [...prev, ...newItems])
            }

            setHasMore(end < mockItems.length)
            setCurrentPage(page)
            setLoading(false)
            setLoadingMore(false)
            return
        }

        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(
                `${API_ENDPOINTS.MONITORING_ZAKON.list}?page=${page}&pageSize=${PAGE_SIZE}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data = await response.json()
            const itemsList: MonitoringItem[] = Array.isArray(data) ? data : (data?.items || [])

            if (isInitial) {
                setItems(itemsList)
                fetchCommentsCounts(itemsList)
            } else {
                setItems(prev => [...prev, ...itemsList])
                fetchCommentsCounts(itemsList)
            }

            const totalPages = data?.totalPages || 1
            setHasMore(page < totalPages)
            setCurrentPage(page)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
            setLoadingMore(false)
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

    const fetchCommentsCounts = async (list: MonitoringItem[]) => {
        try {
            const token = localStorage.getItem('admin_token')
            const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
            const entries = await Promise.all(list.map(async (n) => {
                try {
                    const res = await fetch(`${API_BASE_URL}/comments/monitoring-zakon/${n.id}`, { headers })
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
            setCommentsCountMap(prev => ({ ...prev, ...map }))
        } catch (e) {
        }
    }

    const openAddModal = () => {
        setFormError(null)
        setEditingId(null)
        setTitle('')
        setSlug('')
        const now = new Date()
        setPublishedAt(now)
        setIsDraft(true)
        setBlocks([])
        setInitialState({
            title: '',
            slug: '',
            publishedAt: now,
            isDraft: true,
            blocks: [],
        })
        setUnsavedChanges(false)
        setAddModalOpened(true)
    }

    const openEditModal = (item: MonitoringItem) => {
        setFormError(null)
        setEditingId(item.id)
        setTitle(item.page.title)
        const normalizedSlug = item.page.slug && item.page.slug.startsWith('monitoring-zakon/')
            ? item.page.slug.slice('monitoring-zakon/'.length)
            : (item.page.slug || '')
        setSlug(normalizedSlug)
        let published: Date | null = null
        if (item.page.publishedAt) {
            const d = new Date(item.page.publishedAt)
            published = isNaN(d.getTime()) ? null : d
        }
        setPublishedAt(published)
        setIsDraft(item.page.isDraft)
        setBlocks((item.page.blocks || []).map(b => ({ ...b })))
        setInitialState({
            title: item.page.title,
            slug: normalizedSlug,
            publishedAt: published,
            isDraft: item.page.isDraft,
            blocks: (item.page.blocks || []).map(b => ({ ...b })),
        })
        setUnsavedChanges(false)
        setAddModalOpened(true)
    }

    const closeModal = () => {
        setAddModalOpened(false)
        setEditingId(null)
        setFormError(null)
        setUnsavedChanges(false)
    }

    const handleRequestCloseModal = () => {
        if (unsavedChanges) {
            setConfirmCloseModal(true)
        } else {
            closeModal()
        }
    }

    const handleConfirmClose = () => {
        setConfirmCloseModal(false)
        closeModal()
    }

    const handleCancelClose = () => {
        setConfirmCloseModal(false)
    }

    const handleSave = async () => {
        const trimmedTitle = title.trim()
        const trimmedSlug = slug.trim()
        if (!trimmedTitle) {
            setFormError('Укажите название')
            return
        }
        if (!trimmedSlug) {
            setFormError('Укажите адрес (слаг)')
            return
        }
        if (!/^[a-zA-Z0-9-]+$/.test(trimmedSlug)) {
            setFormError('Слаг должен содержать только латинские буквы, цифры и дефисы, без "/"')
            return
        }

        try {
            setSavingItem(true)
            setFormError(null)

            if (mockEnabled) {
                const nowIso = new Date().toISOString()
                const pageSlug = `monitoring-zakon/${trimmedSlug}`
                if (editingId) {
                    setItems(prev => prev.map(item => {
                        if (item.id !== editingId) return item
                        return {
                            ...item,
                            page: {
                                ...item.page,
                                title: trimmedTitle,
                                slug: pageSlug,
                                publishedAt: publishedAt?.toISOString() || nowIso,
                                isDraft,
                                blocks: Array.isArray(blocks) ? blocks : [],
                                updatedAt: nowIso,
                            }
                        }
                    }))
                } else {
                    const id = `mock-${Date.now()}`
                    setItems(prev => [
                        {
                            id,
                            page: {
                                id: `page-${id}`,
                                slug: pageSlug,
                                title: trimmedTitle,
                                publishedAt: publishedAt?.toISOString() || nowIso,
                                isDraft,
                                blocks: Array.isArray(blocks) ? blocks : [],
                                createdAt: nowIso,
                                updatedAt: nowIso,
                            },
                        },
                        ...prev,
                    ])
                }
                closeModal()
                return
            }

            const token = localStorage.getItem('admin_token')
            const formData = new FormData()
            formData.append('title', trimmedTitle)
            formData.append('slug', trimmedSlug)
            formData.set('isDraft', JSON.stringify(isDraft))
            formData.append('publishedAt', publishedAt?.toISOString() || new Date().toISOString())
            formData.append('blocks', JSON.stringify(Array.isArray(blocks) ? blocks : []))

            let response
            if (editingId) {
                response = await fetch(API_ENDPOINTS.MONITORING_ZAKON.update(editingId), {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                })
            } else {
                response = await fetch(API_ENDPOINTS.MONITORING_ZAKON.create, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Не удалось сохранить запись')
            }

            await loadItems(1, true)
            closeModal()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setSavingItem(false)
        }
    }

    useEffect(() => {
        if (!addModalOpened || !initialState) return
        const publishedAtChanged =
            (publishedAt && initialState.publishedAt)
                ? publishedAt.getTime() !== initialState.publishedAt.getTime()
                : publishedAt !== initialState.publishedAt
        const changed =
            title !== initialState.title ||
            slug !== initialState.slug ||
            isDraft !== initialState.isDraft ||
            publishedAtChanged ||
            JSON.stringify(blocks) !== JSON.stringify(initialState.blocks)
        setUnsavedChanges(changed)
    }, [title, slug, publishedAt, isDraft, blocks, addModalOpened, initialState])

    const handleDelete = (id: string) => {
        setItemToDelete(id)
        setConfirmDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return

        try {
            if (mockEnabled) {
                setItems(prev => prev.filter(item => item.id !== itemToDelete))
                setConfirmDeleteModal(false)
                setItemToDelete(null)
                return
            }
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.MONITORING_ZAKON.delete(itemToDelete), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Не удалось удалить запись')
            }

            await loadItems(1, true)
            setConfirmDeleteModal(false)
            setItemToDelete(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            setConfirmDeleteModal(false)
            setItemToDelete(null)
        }
    }

    const handleCancelDelete = () => {
        setConfirmDeleteModal(false)
        setItemToDelete(null)
    }

    if (loading) {
        return (
            <DashboardLayout title="Мониторинг законодательства">
                <Container>
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                        <Spinner animation="border" role="status" variant="primary">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                </Container>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout title="Мониторинг законодательства">
                <Container>
                    <Alert variant="danger">
                        <Alert.Heading>Ошибка</Alert.Heading>
                        <p>{error}</p>
                    </Alert>
                </Container>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="Мониторинг законодательства">
            <Container>
                <div className="mb-4">
                    <h1 className="mb-2">Мониторинг законодательства</h1>
                    <p className="text-muted">Управление материалами мониторинга законодательства</p>
                    <a href="https://disk.yandex.ru/d/JQhkFMGnbTVcMQ"
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
                    <Button variant="primary" onClick={openAddModal}>
                        <i className="bi bi-plus me-2"></i> Добавить запись
                    </Button>
                </div>

                {items.length === 0 ? (
                    <Card className="p-5 text-center">
                        <p className="text-muted">Записи не найдены. Добавьте первую запись.</p>
                    </Card>
                ) : (
                    <>
                        <Row xs={1} sm={2} md={3} lg={3} className="g-4">
                            {items.map((item) => (
                                <Col key={item.id}>
                                    <Card className="h-100">
                                        <Card.Body>
                                            <Card.Title className="fw-bold" style={{ minHeight: '48px' }}>
                                                {item.page.title}
                                            </Card.Title>

                                            <div className="mb-3">
                                                <small className="text-muted d-block mb-1">
                                                    <strong>Дата:</strong> {formatDate(item.page.publishedAt)}
                                                </small>
                                                <small className="text-muted">
                                                    /{item.page.slug}
                                                </small>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="d-flex align-items-center gap-2">
                                                    <Badge bg={item.page.isDraft ? 'secondary' : 'success'}>
                                                        {item.page.isDraft ? 'Черновик' : 'Опубликовано'}
                                                    </Badge>
                                                    {commentsCountMap[item.id] > 0 && (
                                                        <span className="badge bg-info text-dark d-flex align-items-center" style={{ gap: '6px' }}>
                                                            <i className="bi bi-chat-left-text"></i>
                                                            {commentsCountMap[item.id]}
                                                        </span>
                                                    )}
                                                    <div className="btn-group">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => openEditModal(item)}
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {loadingMore && (
                            <div className="d-flex justify-content-center align-items-center my-5">
                                <Spinner animation="border" role="status" variant="primary">
                                    <span className="visually-hidden">Загрузка...</span>
                                </Spinner>
                            </div>
                        )}

                        {!hasMore && items.length > 0 && (
                            <div className="text-center text-muted my-5">
                                <p>Все записи загружены</p>
                            </div>
                        )}
                    </>
                )}
            </Container>

            <Modal
                show={addModalOpened}
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

                                {formError && (
                                    <Alert variant="danger" className="mb-4">
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        {formError}
                                    </Alert>
                                )}

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Название <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Введите название"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Адрес (slug) <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="например: monitoring-news"
                                            value={slug}
                                            onChange={(e) => setSlug(e.target.value)}
                                        />
                                        <Button variant="outline-secondary" onClick={handleGenerateSlug}>
                                            Авто
                                        </Button>
                                    </div>
                                    <Form.Text className="text-muted">
                                        Только латиница, цифры и дефисы. Без "/".
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label style={{ width: '100%' }}>
                                        Дата и время публикации <span className="text-danger">*</span>
                                    </Form.Label>
                                    <DatePicker
                                        selected={publishedAt || undefined}
                                        onChange={(date: Date | null) => setPublishedAt(date)}
                                        showTimeSelect
                                        timeFormat="HH:mm"
                                        timeIntervals={5}
                                        dateFormat="dd.MM.yyyy HH:mm"
                                        timeCaption="Время"
                                        className="form-control"
                                        placeholderText="Выберите дату и время"
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Статус <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="d-flex flex-row gap-4">
                                        <Form.Check
                                            type="radio"
                                            id="monitoring-status-published"
                                            name="monitoring-status"
                                            label="Опубликовано"
                                            checked={isDraft === false}
                                            onChange={() => setIsDraft(false)}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="monitoring-status-draft"
                                            name="monitoring-status"
                                            label="Черновик"
                                            checked={isDraft === true}
                                            onChange={() => setIsDraft(true)}
                                        />
                                    </div>
                                </Form.Group>

                            </div>

                            <div className="col-md-8" style={{ padding: '20px 40px 40px 60px' }}>

                                <PageBlocksEditor
                                    blocks={blocks}
                                    setBlocks={setBlocks}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer border-top d-flex justify-content-end gap-2">
                        <Button
                            variant="outline-primary"
                            onClick={handleSave}
                            disabled={savingItem}
                        >
                            <i className="bi bi-floppy me-2"></i>
                            Сохранить
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleRequestCloseModal}
                            disabled={savingItem}
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
            </Modal>

            <Modal show={confirmCloseModal} onHide={handleCancelClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Есть несохраненные изменения</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Вы уверены, что хотите закрыть окно? Все несохраненные изменения будут потеряны.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCancelClose}>Нет</Button>
                    <Button variant="danger" onClick={handleConfirmClose}>Да, закрыть</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={confirmDeleteModal} onHide={handleCancelDelete} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Подтвердите удаление</Modal.Title>
                </Modal.Header>
                <Modal.Body>Вы уверены, что хотите удалить эту запись?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCancelDelete}>Отмена</Button>
                    <Button variant="danger" onClick={handleConfirmDelete}>Удалить</Button>
                </Modal.Footer>
            </Modal>
        </DashboardLayout>
    )
}

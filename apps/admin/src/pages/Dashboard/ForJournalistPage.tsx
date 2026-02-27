import { useState, useEffect } from 'react'
import { Container, Card, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap'
import { IconEdit, IconDeviceFloppy, IconX, IconInfoSquareRounded, IconAlertCircle } from '@tabler/icons-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import { PageBlocksEditor } from '../../components/PageBlocksEditor'

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
    const [editModalOpened, setEditModalOpened] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const [title, setTitle] = useState('')
    const [slug, setSlug] = useState('for-journalist')
    const [publishedAt, setPublishedAt] = useState<Date | null>(new Date())
    const [isDraft, setIsDraft] = useState(false)
    const [blocks, setBlocks] = useState<Block[]>([])

    const [unsavedChanges, setUnsavedChanges] = useState(false)
    const [initialState, setInitialState] = useState<{
        title: string;
        slug: string;
        publishedAt: Date | null;
        isDraft: boolean;
        blocks: Block[];
    } | null>(null)
    const [confirmCloseModal, setConfirmCloseModal] = useState(false)

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

    const generateSlug = (titleText: string): string => {
        return transliterate(titleText)
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

    useEffect(() => {
        if (initialState) {
            const changed =
                title !== initialState.title ||
                slug !== initialState.slug ||
                publishedAt?.getTime() !== initialState.publishedAt?.getTime() ||
                isDraft !== initialState.isDraft ||
                JSON.stringify(blocks) !== JSON.stringify(initialState.blocks)
            setUnsavedChanges(changed)
        }
    }, [title, slug, publishedAt, isDraft, blocks, initialState])

    useEffect(() => {
        loadForJournalist()
    }, [])

    const loadForJournalist = async () => {
        setLoading(true)
        setError(null)

        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.FOR_JOURNALIST.get, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.status === 404) {
                setForJournalist(null)
                setLoading(false)
                return
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data: ForJournalist = await response.json()
            setForJournalist(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    const openEditModal = () => {
        setFormError(null)
        if (forJournalist) {
            setTitle(forJournalist.page.title)
            setSlug(forJournalist.page.slug)
            const pubDate = forJournalist.page.publishedAt ? new Date(forJournalist.page.publishedAt) : new Date()
            setPublishedAt(pubDate)
            setIsDraft(forJournalist.page.isDraft)
            setBlocks((forJournalist.page.blocks || []).map(b => ({ ...b })))
            setInitialState({
                title: forJournalist.page.title,
                slug: forJournalist.page.slug,
                publishedAt: pubDate,
                isDraft: forJournalist.page.isDraft,
                blocks: (forJournalist.page.blocks || []).map(b => ({ ...b })),
            })
        } else {
            setTitle('Информация для журналистов')
            setSlug('for-journalist')
            const now = new Date()
            setPublishedAt(now)
            setIsDraft(false)
            setBlocks([])
            setInitialState({
                title: 'Информация для журналистов',
                slug: 'for-journalist',
                publishedAt: now,
                isDraft: false,
                blocks: [],
            })
        }
        setUnsavedChanges(false)
        setEditModalOpened(true)
    }

    const closeEditModal = () => {
        setEditModalOpened(false)
        setFormError(null)
        setUnsavedChanges(false)
    }

    const handleRequestCloseModal = () => {
        if (unsavedChanges) {
            setConfirmCloseModal(true)
        } else {
            closeEditModal()
        }
    }

    const handleConfirmClose = () => {
        setConfirmCloseModal(false)
        closeEditModal()
    }

    const handleCancelClose = () => {
        setConfirmCloseModal(false)
    }

    const handleSave = async () => {
        const titleTrimmed = title.trim()
        const slugTrimmed = slug.trim()

        if (!titleTrimmed) {
            setFormError('Укажите заголовок страницы')
            return
        }
        if (!slugTrimmed) {
            setFormError('Укажите адрес страницы (слаг)')
            return
        }
        if (!/^[a-zA-Z0-9-]+$/.test(slugTrimmed)) {
            setFormError('Слаг должен содержать только латинские буквы, цифры и дефисы, без "/"')
            return
        }

        setSaving(true)
        setFormError(null)

        try {
            const token = localStorage.getItem('admin_token')
            const formData = new FormData()

            formData.append('title', titleTrimmed)
            formData.append('slug', slugTrimmed)
            formData.append('isDraft', isDraft ? 'true' : 'false')

            if (publishedAt) {
                formData.append('publishedAt', publishedAt.toISOString())
            }

            const blocksToSend = blocks.map(({ id, ...block }) => block)
            formData.append('blocks', JSON.stringify(blocksToSend))

            let response
            if (forJournalist) {
                response = await fetch(API_ENDPOINTS.FOR_JOURNALIST.update(forJournalist.id), {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                })
            } else {
                response = await fetch(API_ENDPOINTS.FOR_JOURNALIST.create, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Не удалось сохранить страницу')
            }

            await loadForJournalist()
            closeEditModal()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setSaving(false)
        }
    }

    const formatDate = (dateString: string | undefined | null): string => {
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

    if (loading) {
        return (
            <DashboardLayout title="Для журналистов">
                <Container className="text-center mt-5">
                    <Spinner animation="border" />
                </Container>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout title="Для журналистов">
                <Container>
                    <Alert variant="danger">
                        <IconInfoSquareRounded size={20} className="me-2" />
                        {error}
                    </Alert>
                </Container>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout title="Для журналистов">
            <Container>
                <div className="mb-4">
                    <h1 className="mb-2">Для журналистов</h1>
                    <p className="text-muted">Управление страницей для журналистов</p>
                    <a href="https://disk.yandex.ru/d/3guC9ITuNxSnIA"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-dark  d-flex align-items-center"
                        style={{ width: 'fit-content', margin: '20px 0' }}
                    >
                        <i className="bi bi-info-lg me-2"></i>
                        Советы по редактированию страницы
                    </a>
                </div>

                {!forJournalist ? (
                    <Card className="p-5 text-center">
                        <p className="text-muted mb-3">Страница для журналистов еще не создана</p>
                        <Button variant="primary" onClick={openEditModal}>
                            Создать страницу
                        </Button>
                    </Card>
                ) : (
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title className="fw-bold mb-3">
                                {forJournalist.page.title}
                                {forJournalist.page.isDraft && (
                                    <Badge bg="warning" text="dark" className="ms-2">Черновик</Badge>
                                )}
                            </Card.Title>

                            <div className="mb-3">
                                <small className="text-muted d-block mb-1">
                                    <strong>Дата публикации:</strong> {formatDate(forJournalist.page.publishedAt)}
                                </small>
                                <small className="text-muted">
                                    <strong>URL:</strong> /{forJournalist.page.slug}
                                </small>
                            </div>

                            <Button variant="primary" size="sm" onClick={openEditModal}>
                                <IconEdit size={16} className="me-1" /> Редактировать
                            </Button>
                        </Card.Body>
                    </Card>
                )}

                <Modal
                    show={editModalOpened}
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
                                            <IconAlertCircle size={16} className="me-2" />
                                            {formError}
                                        </Alert>
                                    )}

                                    <Form.Group className="mb-4">
                                        <Form.Label>
                                            Заголовок страницы <span className="text-danger">*</span>
                                        </Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Введите заголовок"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label>
                                            Адрес страницы <span className="text-danger">*</span>
                                        </Form.Label>
                                        <div className="d-flex gap-2">
                                            <Form.Control
                                                type="text"
                                                placeholder="например: for-journalist"
                                                value={slug}
                                                onChange={(e) => setSlug(e.target.value)}
                                                required
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                onClick={handleGenerateSlug}
                                                disabled={!title.trim() || saving}
                                                title="Сгенерировать из заголовка"
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
                                                id="status-published"
                                                name="status"
                                                label="Опубликовано"
                                                checked={isDraft === false}
                                                onChange={() => setIsDraft(false)}
                                            />
                                            <Form.Check
                                                type="radio"
                                                id="status-draft"
                                                name="status"
                                                label="Черновик"
                                                checked={isDraft === true}
                                                onChange={() => setIsDraft(true)}
                                            />
                                        </div>
                                    </Form.Group>
                                </div>

                                <div className="col-md-8" style={{ padding: '10px 40px' }}>
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
                                disabled={saving}
                            >
                                <IconDeviceFloppy size={16} className="me-2" />
                                Сохранить
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handleRequestCloseModal}
                                disabled={saving}
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
                                <IconX size={22} />
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
            </Container>
        </DashboardLayout>
    )
}

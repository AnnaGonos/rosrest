import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap'
import { IconPlus, IconAlertCircle, IconEdit, IconTrash, IconDeviceFloppy, IconX, IconInfoSquareRounded } from '@tabler/icons-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import { PageBlocksEditor } from '../../components/PageBlocksEditor'
import { ImagePreviewInput, ImagePreviewInputValue } from '../../components/ImagePreviewInput'

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

interface Project {
    id: string
    previewImage: string
    page: Page
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [addProjectModalOpened, setAddProjectModalOpened] = useState(false)
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
    const [savingProject, setSavingProject] = useState(false)
    const [projectFormError, setProjectFormError] = useState<string | null>(null)

    const [projectTitle, setProjectTitle] = useState('')
    const [projectSlug, setProjectSlug] = useState('')
    const [projectPublishedAt, setProjectPublishedAt] = useState<Date | null>(() => {
        const now = new Date();
        return now;
    });
    const [projectIsDraft, setProjectIsDraft] = useState(true)
    const [projectPreviewImage, setProjectPreviewImage] = useState<ImagePreviewInputValue>({ file: null, width: undefined, height: undefined })
    const [projectBlocks, setProjectBlocks] = useState<Block[]>([])

    const [unsavedChanges, setUnsavedChanges] = useState(false)
    const [initialProjectState, setInitialProjectState] = useState<{
        title: string;
        slug: string;
        publishedAt: Date | null;
        isDraft: boolean;
        previewImage: ImagePreviewInputValue;
        blocks: Block[];
    } | null>(null);
    const [confirmCloseModal, setConfirmCloseModal] = useState(false)

    const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null)

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
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    const handleGenerateSlug = () => {
        if (projectTitle.trim()) {
            setProjectSlug(generateSlug(projectTitle))
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
        loadProjects()
    }, [])

    const loadProjects = async () => {
        setLoading(true)
        setError(null)

        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.PROJECTS.list, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data: Project[] = await response.json()
            setProjects(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    const openAddProjectModal = () => {
        setProjectFormError(null)
        setEditingProjectId(null)
        setProjectTitle('')
        setProjectSlug('')
        const now = new Date();
        setProjectPublishedAt(now)
        setProjectIsDraft(true)
        setProjectPreviewImage({ file: null, width: undefined, height: undefined })
        setProjectBlocks([])
        setInitialProjectState({
            title: '',
            slug: '',
            publishedAt: now,
            isDraft: true,
            previewImage: { file: null, width: undefined, height: undefined },
            blocks: [],
        });
        setUnsavedChanges(false)
        setAddProjectModalOpened(true)
    }

    const openEditProjectModal = (project: Project) => {
        setProjectFormError(null)
        setEditingProjectId(project.id)
        setProjectTitle(project.page.title)
        const slug = project.page.slug && project.page.slug.startsWith('projects/') ? project.page.slug.slice('projects/'.length) : (project.page.slug || '');
        setProjectSlug(slug)
        let publishedAt: Date | null = null;
        if (project.page.publishedAt) {
            const d = new Date(project.page.publishedAt);
            publishedAt = isNaN(d.getTime()) ? null : d;
        } else {
            publishedAt = null;
        }
        setProjectPublishedAt(publishedAt)
        setProjectIsDraft(project.page.isDraft)
        setProjectPreviewImage({ file: null, width: undefined, height: undefined })
        setProjectBlocks((project.page.blocks || []).map(b => ({ ...b })))
        setInitialProjectState({
            title: project.page.title,
            slug,
            publishedAt,
            isDraft: project.page.isDraft,
            previewImage: { file: null, width: undefined, height: undefined },
            blocks: (project.page.blocks || []).map(b => ({ ...b })),
        });
        setUnsavedChanges(false)
        setAddProjectModalOpened(true)
    }

    const closeProjectModal = () => {
        setAddProjectModalOpened(false)
        setEditingProjectId(null)
        setProjectFormError(null)
        setUnsavedChanges(false)
    }

    const handleRequestCloseModal = () => {
        if (unsavedChanges) {
            setConfirmCloseModal(true)
        } else {
            closeProjectModal()
        }
    }

    const handleConfirmClose = () => {
        setConfirmCloseModal(false)
        closeProjectModal()
    }

    const handleCancelClose = () => {
        setConfirmCloseModal(false)
    }

    const handleSaveProject = async () => {
        const title = projectTitle.trim()
        const slug = projectSlug.trim()
        
        if (!title) {
            setProjectFormError('Укажите название проекта')
            return
        }
        if (!slug) {
            setProjectFormError('Укажите адрес проекта (слаг)')
            return
        }
        if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
            setProjectFormError('Слаг должен содержать только латинские буквы, цифры и дефисы, без "/"')
            return
        }
        if (!projectPreviewImage.file && !editingProjectId) {
            setProjectFormError('Загрузите превью-изображение')
            return
        }

        try {
            setSavingProject(true)
            setProjectFormError(null)

            const token = localStorage.getItem('admin_token')
            const formData = new FormData()

            formData.append('title', title)
            formData.append('slug', slug)
            formData.set('isDraft', JSON.stringify(projectIsDraft));
            formData.append('publishedAt', projectPublishedAt?.toISOString() || new Date().toISOString())

            
            const blocksToSend = projectBlocks.map(({ id, ...block }: any) => block)
            formData.append('blocks', JSON.stringify(Array.isArray(blocksToSend) ? blocksToSend : []))

        

            if (projectPreviewImage.file) {
                formData.append('previewImage', projectPreviewImage.file)
            }

            console.log('Отправляемые данные:', {
                title,
                slug,
                isDraft: projectIsDraft,
                publishedAt: projectPublishedAt?.toISOString(),
                hasBlocks: projectBlocks.length > 0,
                hasImage: !!projectPreviewImage.file
            })

            let response
            if (editingProjectId) {
                response = await fetch(API_ENDPOINTS.PROJECTS.update(editingProjectId), {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                })
            } else {
                response = await fetch(API_ENDPOINTS.PROJECTS.create, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Не удалось сохранить проект')
            }

            await loadProjects()
            closeProjectModal()
        } catch (err) {
            setProjectFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setSavingProject(false)
        }
    }

    useEffect(() => {
        if (!addProjectModalOpened || !initialProjectState) return;
        const publishedAtChanged =
            (projectPublishedAt && initialProjectState.publishedAt)
                ? projectPublishedAt.getTime() !== initialProjectState.publishedAt.getTime()
                : projectPublishedAt !== initialProjectState.publishedAt;
        const changed =
            projectTitle !== initialProjectState.title ||
            projectSlug !== initialProjectState.slug ||
            projectIsDraft !== initialProjectState.isDraft ||
            projectPreviewImage.file !== initialProjectState.previewImage.file ||
            publishedAtChanged ||
            JSON.stringify(projectBlocks) !== JSON.stringify(initialProjectState.blocks);
        setUnsavedChanges(changed);
    }, [projectTitle, projectSlug, projectPublishedAt, projectIsDraft, projectPreviewImage, projectBlocks, addProjectModalOpened, initialProjectState]);

    const handleDeleteProject = (id: string) => {
        setProjectToDelete(id)
        setConfirmDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return

        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.PROJECTS.delete(projectToDelete), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Не удалось удалить проект')
            }

            await loadProjects()
            setConfirmDeleteModal(false)
            setProjectToDelete(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            setConfirmDeleteModal(false)
            setProjectToDelete(null)
        }
    }

    const handleCancelDelete = () => {
        setConfirmDeleteModal(false)
        setProjectToDelete(null)
    }


    if (loading) {
        return (
            <DashboardLayout title="Проекты">
                <Container>
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                        <Spinner animation="border" role="status" variant="primary">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                </Container>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout title="Проекты">
                <Container>
                    <Alert variant="danger">
                        <Alert.Heading><IconAlertCircle size={16} /> Ошибка</Alert.Heading>
                        <p>{error}</p>
                    </Alert>
                </Container>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Проекты">
            <Container>
                <div className="mb-4">
                    <h1 className="mb-2">Проекты</h1>
                    <p className="text-muted">Управление проектами организации</p>
                    <a href="https://disk.yandex.ru/d/6FzDg2-pa__2Ig"
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
                    <Button variant="primary" onClick={openAddProjectModal}>
                        <IconPlus size={18} className="me-2" /> Добавить проект
                    </Button>
                </div>

                {projects.length === 0 ? (
                    <Card className="p-5 text-center">
                        <p className="text-muted">Проекты не найдены. Добавьте первый проект.</p>
                    </Card>
                ) : (
                    <Row xs={1} sm={2} md={3} lg={3} className="g-4">
                        {projects.map((project) => (
                            <Col key={project.id}>
                                <Card className="h-100">
                                    {project.previewImage && (
                                        <Card.Img
                                            variant="top"
                                            src={resolveImageUrl(project.previewImage)}
                                            alt={project.page.title}
                                            style={{ height: '250px', objectFit: 'cover', marginBottom: '20px' }}
                                        />
                                    )}

                                    <Card.Body>
                                        <Card.Title className="fw-bold" style={{ minHeight: '48px' }}>
                                            {project.page.title}
                                        </Card.Title>

                                        <div className="mb-3">
                                            <small className="text-muted d-block mb-1">
                                                <strong>Дата:</strong> {formatDate(project.page.publishedAt)}
                                            </small>
                                            <small className="text-muted">
                                                /{project.page.slug}
                                            </small>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center">
                                            <Badge bg={project.page.isDraft ? 'secondary' : 'success'}>
                                                {project.page.isDraft ? 'Черновик' : 'Опубликовано'}
                                            </Badge>
                                            <div className="btn-group">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => openEditProjectModal(project)}
                                                >
                                                    <IconEdit size={16} />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteProject(project.id)}
                                                >
                                                    <IconTrash size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>

            <Modal
                show={addProjectModalOpened}
                onHide={handleRequestCloseModal}
                fullscreen={true}
                backdrop="static"
                dialogClassName="modal-fullscreen"
                contentClassName="border-0"
            >
                <div className="d-flex flex-column h-100">
                    <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
                        <div className="row g-4" >
                            <div className="col-md-4" style={{ background: '#F7FAFF', padding: '20px 40px 40px 60px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '710px' }}>
                                <div className="mb-4">
                                    <span className="text-danger fs-5 me-2">*</span>
                                    <span className="text-danger">— обязательное поле для заполнения</span>
                                </div>

                                {projectFormError && (
                                    <Alert variant="danger" className="mb-4">
                                        <IconAlertCircle size={16} className="me-2" />
                                        {projectFormError}
                                    </Alert>
                                )}

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Название проекта <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Введите название проекта"
                                        value={projectTitle}
                                        onChange={(e) => setProjectTitle(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Превью изображения {!editingProjectId && <span className="text-danger">*</span>}
                                    </Form.Label>
                                    <ImagePreviewInput
                                        placeholder="Выберите файл"
                                        value={projectPreviewImage}
                                        onChange={setProjectPreviewImage}
                                        required={!editingProjectId}
                                        description={editingProjectId ? 'Оставьте пустым, чтобы сохранить текущее изображение' : ''}
                                        currentImageUrl={editingProjectId && projects.find(p => p.id === editingProjectId)?.previewImage ? resolveImageUrl(projects.find(p => p.id === editingProjectId)!.previewImage) : undefined}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Адрес поста <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="например: restauration-kreml"
                                            value={projectSlug}
                                            onChange={(e) => setProjectSlug(e.target.value)}
                                            required
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={handleGenerateSlug}
                                            disabled={!projectTitle.trim() || savingProject}
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
                                        selected={projectPublishedAt || undefined}
                                        onChange={(date: Date | null) => setProjectPublishedAt(date)}
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
                                            name="project-status"
                                            label="Опубликовано"
                                            checked={projectIsDraft === false}
                                            onChange={() => setProjectIsDraft(false)}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="status-draft"
                                            name="project-status"
                                            label="Черновик"
                                            checked={projectIsDraft === true}
                                            onChange={() => setProjectIsDraft(true)}
                                        />
                                    </div>
                                </Form.Group>
                            </div>

                            <div className="col-md-8" style={{ padding: '10px 40px' }}>
                                <PageBlocksEditor
                                    blocks={projectBlocks}
                                    setBlocks={setProjectBlocks}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer border-top d-flex justify-content-end gap-2">
                        <a href="https://disk.yandex.ru/client/disk/РАР-документация%20к%20сайту/Проекты"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-secondary d-flex align-items-center"
                            style={{ marginRight: 'auto' }}
                        >
                            <IconInfoSquareRounded size={18} className="me-2" />
                            Советы по публикации
                        </a>
                        <Button
                            variant="outline-primary"
                            onClick={handleSaveProject}
                            disabled={savingProject}
                        >
                            <IconDeviceFloppy size={16} className="me-2" />
                            Сохранить
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleRequestCloseModal}
                            disabled={savingProject}
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

            <Modal
                show={confirmDeleteModal}
                onHide={handleCancelDelete}
                centered
            >
                <Modal.Body className="text-center py-4">
                    <p>Вы уверены, что хотите удалить проект?</p>
                </Modal.Body>
                <Modal.Footer className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={handleCancelDelete}>
                        Отмена
                    </Button>
                    <Button variant="danger" onClick={handleConfirmDelete}>
                        Удалить
                    </Button>
                </Modal.Footer>
            </Modal>
        </DashboardLayout>
    )
}


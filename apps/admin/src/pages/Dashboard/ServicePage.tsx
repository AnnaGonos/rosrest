import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import { PageBlocksEditor } from '../../components/PageBlocksEditor'
import { ServiceContactsEditor, ServiceContactData } from '../../components/ServiceContactsEditor'

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

interface ServiceContact {
    id: string
    fullName: string
    photo: string
    position?: string
    email?: string
    phone?: string
    order: number
}

interface Service {
    id: string
    page: Page
    contacts: ServiceContact[]
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [addServiceModalOpened, setAddServiceModalOpened] = useState(false)
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
    const [savingService, setSavingService] = useState(false)
    const [serviceFormError, setServiceFormError] = useState<string | null>(null)

    const [serviceTitle, setServiceTitle] = useState('')
    const [serviceSlug, setServiceSlug] = useState('')
    const [servicePublishedAt, setServicePublishedAt] = useState<Date | null>(() => {
        const now = new Date();
        return now;
    });
    const [serviceIsDraft, setServiceIsDraft] = useState(true)
    const [serviceBlocks, setServiceBlocks] = useState<Block[]>([])
    const [serviceContacts, setServiceContacts] = useState<ServiceContactData[]>([])

    const [unsavedChanges, setUnsavedChanges] = useState(false)
    const [initialServiceState, setInitialServiceState] = useState<{
        title: string;
        slug: string;
        publishedAt: Date | null;
        isDraft: boolean;
        blocks: Block[];
        contacts: ServiceContactData[];
    } | null>(null);
    const [confirmCloseModal, setConfirmCloseModal] = useState(false)

    const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
    const [serviceToDelete, setServiceToDelete] = useState<string | null>(null)

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
        if (serviceTitle.trim()) {
            setServiceSlug(generateSlug(serviceTitle))
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
        loadServices()
    }, [])

    const loadServices = async () => {
        setLoading(true)
        setError(null)

        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.SERVICES.list, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const data: Service[] = await response.json()
            setServices(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    const openAddServiceModal = () => {
        setServiceFormError(null)
        setEditingServiceId(null)
        setServiceTitle('')
        setServiceSlug('')
        const now = new Date();
        setServicePublishedAt(now)
        setServiceIsDraft(true)
        setServiceBlocks([])
        setServiceContacts([])
        setInitialServiceState({
            title: '',
            slug: '',
            publishedAt: now,
            isDraft: true,
            blocks: [],
            contacts: [],
        });
        setUnsavedChanges(false)
        setAddServiceModalOpened(true)
    }

    const openEditServiceModal = (service: Service) => {
        setServiceFormError(null)
        setEditingServiceId(service.id)
        setServiceTitle(service.page.title)
        const slug = service.page.slug && service.page.slug.startsWith('services/') ? service.page.slug.slice('services/'.length) : (service.page.slug || '');
        setServiceSlug(slug)
        let publishedAt: Date | null = null;
        if (service.page.publishedAt) {
            const d = new Date(service.page.publishedAt);
            publishedAt = isNaN(d.getTime()) ? null : d;
        } else {
            publishedAt = null;
        }
        setServicePublishedAt(publishedAt)
        setServiceIsDraft(service.page.isDraft)
        setServiceBlocks((service.page.blocks || []).map(b => ({ ...b })))

        const contacts: ServiceContactData[] = (service.contacts || []).map(c => {
            const isExternalUrl = c.photo && (c.photo.startsWith('http://') || c.photo.startsWith('https://') || c.photo.startsWith('//'))
            const isLocalFile = c.photo && c.photo.startsWith('/uploads/')

            return {
                id: c.id,
                fullName: c.fullName,
                photoMode: (isExternalUrl || isLocalFile) ? 'url' : 'file',
                photo: c.photo,
                photoFile: null,
                position: c.position,
                email: c.email,
                phone: c.phone,
                order: c.order
            }
        })
        setServiceContacts(contacts)

        setInitialServiceState({
            title: service.page.title,
            slug,
            publishedAt,
            isDraft: service.page.isDraft,
            blocks: (service.page.blocks || []).map(b => ({ ...b })),
            contacts: contacts.map(c => ({ ...c })),
        });
        setUnsavedChanges(false)
        setAddServiceModalOpened(true)
    }

    const closeServiceModal = () => {
        setAddServiceModalOpened(false)
        setEditingServiceId(null)
        setServiceFormError(null)
        setUnsavedChanges(false)
    }

    const handleRequestCloseModal = () => {
        if (unsavedChanges) {
            setConfirmCloseModal(true)
        } else {
            closeServiceModal()
        }
    }

    const handleConfirmClose = () => {
        setConfirmCloseModal(false)
        closeServiceModal()
    }

    const handleCancelClose = () => {
        setConfirmCloseModal(false)
    }

    const handleSaveService = async () => {
        const title = serviceTitle.trim()
        const slug = serviceSlug.trim()
        if (!title) {
            setServiceFormError('Укажите название услуги')
            return
        }
        if (!slug) {
            setServiceFormError('Укажите адрес услуги (слаг)')
            return
        }
        if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
            setServiceFormError('Слаг должен содержать только латинские буквы, цифры и дефисы, без "/"')
            return
        }

        for (let i = 0; i < serviceContacts.length; i++) {
            const contact = serviceContacts[i]
            if (!contact.fullName || !contact.fullName.trim()) {
                setServiceFormError(`Контакт #${i + 1}: укажите ФИО`)
                return
            }
            
            if (contact.photoMode === 'url') {
                if (!contact.photo || !contact.photo.trim()) {
                    setServiceFormError(`Контакт #${i + 1}: укажите URL фото`)
                    return
                }
            } else {
                if (!contact.photo && !contact.photoFile) {
                    setServiceFormError(`Контакт #${i + 1}: загрузите файл фото`)
                    return
                }
            }
        }

        try {
            setSavingService(true)
            setServiceFormError(null)

            const token = localStorage.getItem('admin_token')
            const formData = new FormData()

            formData.append('title', title)
            formData.append('slug', slug)
            formData.append('isDraft', JSON.stringify(serviceIsDraft))
            formData.append('publishedAt', servicePublishedAt?.toISOString() || new Date().toISOString())
            formData.append('blocks', JSON.stringify(Array.isArray(serviceBlocks) ? serviceBlocks : []))

            const contactsData = serviceContacts.map((contact, idx) => ({
                id: contact.id,
                fullName: contact.fullName,
                photo: contact.photoMode === 'url' ? contact.photo : '',
                position: contact.position || '',
                email: contact.email || '',
                phone: contact.phone || '',
                order: idx
            }))

            formData.append('contacts', JSON.stringify(contactsData))

            serviceContacts.forEach((contact) => {
                if (contact.photoMode === 'file' && contact.photoFile) {
                    formData.append(`contactPhotos`, contact.photoFile)
                }
            })


            let response
            if (editingServiceId) {
                response = await fetch(API_ENDPOINTS.SERVICES.update(editingServiceId), {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                })
            } else {
                response = await fetch(API_ENDPOINTS.SERVICES.create, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                })
            }

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Не удалось сохранить услугу')
            }

            await loadServices()
            closeServiceModal()
        } catch (err) {
            setServiceFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setSavingService(false)
        }
    }

    useEffect(() => {
        if (!addServiceModalOpened || !initialServiceState) return;
        const publishedAtChanged =
            (servicePublishedAt && initialServiceState.publishedAt)
                ? servicePublishedAt.getTime() !== initialServiceState.publishedAt.getTime()
                : servicePublishedAt !== initialServiceState.publishedAt;
        const changed =
            serviceTitle !== initialServiceState.title ||
            serviceSlug !== initialServiceState.slug ||
            serviceIsDraft !== initialServiceState.isDraft ||
            publishedAtChanged ||
            JSON.stringify(serviceBlocks) !== JSON.stringify(initialServiceState.blocks) ||
            JSON.stringify(serviceContacts) !== JSON.stringify(initialServiceState.contacts);
        setUnsavedChanges(changed);
    }, [serviceTitle, serviceSlug, servicePublishedAt, serviceIsDraft, serviceBlocks, serviceContacts, addServiceModalOpened, initialServiceState]);

    const handleDeleteService = (id: string) => {
        setServiceToDelete(id)
        setConfirmDeleteModal(true)
    }

    const handleConfirmDelete = async () => {
        if (!serviceToDelete) return

        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.SERVICES.delete(serviceToDelete), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Не удалось удалить услугу')
            }

            await loadServices()
            setConfirmDeleteModal(false)
            setServiceToDelete(null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            setConfirmDeleteModal(false)
            setServiceToDelete(null)
        }
    }

    const handleCancelDelete = () => {
        setConfirmDeleteModal(false)
        setServiceToDelete(null)
    }


    if (loading) {
        return (
            <DashboardLayout title="Услуги">
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
            <DashboardLayout title="Услуги">
                <Container>
                    <Alert variant="danger">
                        <Alert.Heading><i className="bi bi-exclamation-circle me-2"></i>Ошибка</Alert.Heading>
                        <p>{error}</p>
                    </Alert>
                </Container>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Услуги">
            <Container>
                <div className="mb-4">
                    <h1 className="mb-2">Услуги</h1>
                    <p className="text-muted">Управление услугами организации</p>
                    <a href="https://disk.yandex.ru/d/9gKD0HEtpGYwTA"
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
                    <Button variant="primary" onClick={openAddServiceModal}>
                        <i className="bi bi-plus me-2"></i>Добавить услугу
                    </Button>
                </div>

                {services.length === 0 ? (
                    <Card className="p-5 text-center">
                        <p className="text-muted">Услуги не найдены. Добавьте первую услугу.</p>
                    </Card>
                ) : (
                    <Row xs={1} sm={2} md={3} lg={3} className="g-4">
                        {services.map((service) => (
                            <Col key={service.id}>
                                <Card className="h-100">
                                    <Card.Body>
                                        <Card.Title className="fw-bold" style={{ minHeight: '48px' }}>
                                            {service.page.title}
                                        </Card.Title>

                                        <div className="mb-3">
                                            <small className="text-muted d-block mb-1">
                                                <strong>Дата:</strong> {formatDate(service.page.publishedAt)}
                                            </small>
                                            <small className="text-muted">
                                                /{service.page.slug}
                                            </small>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center">
                                            <Badge bg={service.page.isDraft ? 'secondary' : 'success'}>
                                                {service.page.isDraft ? 'Черновик' : 'Опубликовано'}
                                            </Badge>
                                            <div className="btn-group">
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => openEditServiceModal(service)}
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteService(service.id)}
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
                )}
            </Container>

            <Modal
                show={addServiceModalOpened}
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

                                {serviceFormError && (
                                    <Alert variant="danger" className="mb-4">
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        {serviceFormError}
                                    </Alert>
                                )}

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Название услуги <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Введите название услуги"
                                        value={serviceTitle}
                                        onChange={(e) => setServiceTitle(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Адрес услуги <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="например: furniture-restoration"
                                            value={serviceSlug}
                                            onChange={(e) => setServiceSlug(e.target.value)}
                                            required
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={handleGenerateSlug}
                                            disabled={!serviceTitle.trim() || savingService}
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
                                        selected={servicePublishedAt || undefined}
                                        onChange={(date: Date | null) => setServicePublishedAt(date)}
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
                                            name="service-status"
                                            label="Опубликовано"
                                            checked={serviceIsDraft === false}
                                            onChange={() => setServiceIsDraft(false)}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="status-draft"
                                            name="service-status"
                                            label="Черновик"
                                            checked={serviceIsDraft === true}
                                            onChange={() => setServiceIsDraft(true)}
                                        />
                                    </div>
                                </Form.Group>

                                <ServiceContactsEditor
                                    contacts={serviceContacts}
                                    setContacts={setServiceContacts}
                                />
                            </div>

                            <div className="col-md-8" style={{ padding: '10px 40px' }}>
                                <PageBlocksEditor
                                    blocks={serviceBlocks}
                                    setBlocks={setServiceBlocks}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer border-top d-flex justify-content-end gap-2">
                        <Button
                            variant="outline-primary"
                            onClick={handleSaveService}
                            disabled={savingService}
                        >
                            <i className="bi bi-floppy me-2"></i>
                            Сохранить
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleRequestCloseModal}
                            disabled={savingService}
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
                            <i className="bi bi-x" style={{ fontSize: '22px' }}></i>
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
                    <p>Вы уверены, что хотите удалить услугу?</p>
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

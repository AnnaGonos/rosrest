import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS, API_BASE_URL } from '../../config/api'
import { PageBlocksEditor } from '../../components/PageBlocksEditor'
import { DeleteMemberModal } from '../../components/DeleteMemberModal'

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
}

interface RarSection {
    id: string
    title: string
    slug: string
    icon?: string | null
}

interface RarMember {
    id: string
    page: Page
    sections: RarSection[]
}

export default function RarMembersPage() {
    const [members, setMembers] = useState<RarMember[]>([])
    const [commentsCountMap, setCommentsCountMap] = useState<Record<string, number>>({})
    const [sections, setSections] = useState<RarSection[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [memberModalOpened, setMemberModalOpened] = useState(false)
    const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
    const [savingMember, setSavingMember] = useState(false)
    const [memberFormError, setMemberFormError] = useState<string | null>(null)

    const [memberTitle, setMemberTitle] = useState('')
    const [memberSlug, setMemberSlug] = useState('')
    const [memberPublishedAt, setMemberPublishedAt] = useState<Date | null>(new Date())
    const [memberIsDraft, setMemberIsDraft] = useState(true)
    const [memberBlocks, setMemberBlocks] = useState<Block[]>([])
    const [memberSectionIds, setMemberSectionIds] = useState<string[]>([])

    const [memberToDelete, setMemberToDelete] = useState<RarMember | null>(null)
    const [deletingMember, setDeletingMember] = useState(false)
    const [memberSearchQuery, setMemberSearchQuery] = useState('')
    const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('')

    const [sectionModalOpened, setSectionModalOpened] = useState(false)
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
    const [sectionTitle, setSectionTitle] = useState('')
    const [sectionSlug, setSectionSlug] = useState('')
    const [sectionIcon, setSectionIcon] = useState('')
    const [sectionFormError, setSectionFormError] = useState<string | null>(null)
    const [savingSection, setSavingSection] = useState(false)
    const [confirmDeleteSectionModal, setConfirmDeleteSectionModal] = useState(false)
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null)

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

    const handleGenerateSlug = (setter: (value: string) => void, source: string) => {
        if (source.trim()) {
            setter(generateSlug(source))
        }
    }

    useEffect(() => {
        loadMembers()
        loadSections()
    }, [])

    const loadMembers = async () => {
        setLoading(true)
        setError(null)

        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.RAR_MEMBERS.list, {
                headers: { 'Authorization': `Bearer ${token}` },
            })

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

            const data: RarMember[] = await response.json()
            setMembers(data)
            fetchCommentsCounts(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
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

    const fetchCommentsCounts = async (list: RarMember[]) => {
        try {
            const token = localStorage.getItem('admin_token')
            const headers = token ? { Authorization: `Bearer ${token}` } : {}
            const entries = await Promise.all(list.map(async (m) => {
                try {
                    const res = await fetch(`${API_BASE_URL}/comments/rar-member/${m.id}`, { headers })
                    if (!res.ok) return [m.id, 0] as const
                    const data = await res.json()
                    const cnt = countAllComments(data)
                    return [m.id, cnt] as const
                } catch (e) {
                    return [m.id, 0] as const
                }
            }))
            const map: Record<string, number> = {}
            for (const [id, cnt] of entries) map[id] = cnt
            setCommentsCountMap(prev => ({ ...prev, ...map }))
        } catch (e) {
        }
    }

    const loadSections = async () => {
        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.RAR_SECTIONS.list, {
                headers: { 'Authorization': `Bearer ${token}` },
            })

            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)

            const data: RarSection[] = await response.json()
            setSections(data)
        } catch (err) {
            console.error('Sections load error:', err)
        }
    }

    const openAddMemberModal = () => {
        setMemberFormError(null)
        setEditingMemberId(null)
        setMemberTitle('')
        setMemberSlug('')
        setMemberPublishedAt(new Date())
        setMemberIsDraft(true)
        setMemberBlocks([])
        setMemberSectionIds([])
        setMemberModalOpened(true)
    }

    const openEditMemberModal = (member: RarMember) => {
        setMemberFormError(null)
        setEditingMemberId(member.id)
        setMemberTitle(member.page.title)
        const slug = member.page.slug && member.page.slug.startsWith('portfolio/')
            ? member.page.slug.slice('portfolio/'.length)
            : (member.page.slug || '')
        setMemberSlug(slug)
        let publishedAt: Date | null = null
        if (member.page.publishedAt) {
            const d = new Date(member.page.publishedAt)
            publishedAt = isNaN(d.getTime()) ? null : d
        }
        setMemberPublishedAt(publishedAt)
        setMemberIsDraft(member.page.isDraft)
        setMemberBlocks((member.page.blocks || []).map(b => ({ ...b })))
        setMemberSectionIds((member.sections || []).map(s => s.id))
        setMemberModalOpened(true)
    }

    const closeMemberModal = () => {
        setMemberModalOpened(false)
        setEditingMemberId(null)
        setMemberFormError(null)
    }

    const handleToggleSection = (id: string) => {
        setMemberSectionIds((prev) =>
            prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
        )
    }

    const handleSaveMember = async () => {
        const title = memberTitle.trim()
        const slug = memberSlug.trim()

        if (!title) {
            setMemberFormError('Укажите название члена РАР')
            return
        }
        if (!slug) {
            setMemberFormError('Укажите адрес портфолио (слаг)')
            return
        }
        if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
            setMemberFormError('Слаг должен содержать только латинские буквы, цифры и дефисы, без "/"')
            return
        }

        try {
            setSavingMember(true)
            setMemberFormError(null)

            const token = localStorage.getItem('admin_token')
            const formData = new FormData()

            formData.append('title', title)
            formData.append('slug', slug)
            formData.set('isDraft', JSON.stringify(memberIsDraft))
            formData.append('publishedAt', memberPublishedAt?.toISOString() || new Date().toISOString())
            formData.append('blocks', JSON.stringify(memberBlocks))
            formData.append('sectionIds', JSON.stringify(memberSectionIds))

            const isEditing = !!editingMemberId
            const url = isEditing
                ? API_ENDPOINTS.RAR_MEMBERS.update(editingMemberId as string)
                : API_ENDPOINTS.RAR_MEMBERS.create

            const response = await fetch(url, {
                method: isEditing ? 'PATCH' : 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            })

            if (!response.ok) {
                const text = await response.text()
                throw new Error(text || `HTTP ${response.status}`)
            }

            await loadMembers()
            closeMemberModal()
        } catch (err) {
            setMemberFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setSavingMember(false)
        }
    }

    const confirmDeleteMember = (member: RarMember) => {
        setMemberToDelete(member)
    }

    const openAddSectionModal = () => {
        setSectionFormError(null)
        setEditingSectionId(null)
        setSectionTitle('')
        setSectionSlug('')
        setSectionIcon('')
        setSectionModalOpened(true)
    }

    const openEditSectionModal = (section: RarSection) => {
        setSectionFormError(null)
        setEditingSectionId(section.id)
        setSectionTitle(section.title)
        setSectionSlug(section.slug)
        setSectionIcon(section.icon || '')
        setSectionModalOpened(true)
    }

    const closeSectionModal = () => {
        setSectionModalOpened(false)
        setEditingSectionId(null)
        setSectionFormError(null)
    }

    const handleSaveSection = async () => {
        const title = sectionTitle.trim()
        const slug = sectionSlug.trim()

        if (!title) {
            setSectionFormError('Укажите название секции')
            return
        }
        if (!slug) {
            setSectionFormError('Укажите слаг секции')
            return
        }

        try {
            setSavingSection(true)
            setSectionFormError(null)
            const token = localStorage.getItem('admin_token')
            const isEditing = !!editingSectionId
            const url = isEditing
                ? API_ENDPOINTS.RAR_SECTIONS.update(editingSectionId as string)
                : API_ENDPOINTS.RAR_SECTIONS.create

            const response = await fetch(url, {
                method: isEditing ? 'PATCH' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, slug, icon: sectionIcon.trim() || null }),
            })

            if (!response.ok) {
                const text = await response.text()
                throw new Error(text || `HTTP ${response.status}`)
            }

            await loadSections()
            closeSectionModal()
        } catch (err) {
            setSectionFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setSavingSection(false)
        }
    }

    const confirmDeleteSection = (id: string) => {
        setSectionToDelete(id)
        setConfirmDeleteSectionModal(true)
    }

    const handleDeleteSection = async () => {
        if (!sectionToDelete) return

        try {
            const token = localStorage.getItem('admin_token')
            const response = await fetch(API_ENDPOINTS.RAR_SECTIONS.delete(sectionToDelete), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            await loadSections()
        } catch (err) {
            setSectionFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setConfirmDeleteSectionModal(false)
            setSectionToDelete(null)
        }
    }

    const filteredMembers = members.filter((member) => {
        const query = memberSearchQuery.toLowerCase()
        const title = member.page?.title?.toLowerCase() || ''
        const matchesSearch = title.includes(query)

        const matchesSection = !selectedSectionFilter ||
            member.sections?.some(section => section.id === selectedSectionFilter)

        return matchesSearch && matchesSection
    })

    return (
        <DashboardLayout title="Члены РАР">
            <Container fluid>
                <a href="https://disk.yandex.ru/d/GbXMSFQza8tZOA"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-dark  d-flex align-items-center"
                    style={{ width: 'fit-content', margin: '20px 0' }}
                >
                    <i className="bi bi-info-lg me-2"></i>
                    Советы по публикации
                </a>
                <Row className="mb-4">

                    <Col>
                        <h2>Секции РАР</h2>
                    </Col>
                    <Col className="text-end">
                        <Button variant="outline-primary" onClick={openAddSectionModal}>
                            <i className="bi bi-plus-lg me-2"></i>
                            Добавить секцию
                        </Button>
                    </Col>
                </Row>

                {error && <Alert variant="danger">{error}</Alert>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '40px' }}>
                    {sections.map((section) => (
                        <div key={section.id}>
                            <Card
                                className="h-100"
                                style={{
                                    cursor: 'pointer',
                                    border: selectedSectionFilter === section.id ? '2px solid #0d6efd' : undefined,
                                    backgroundColor: selectedSectionFilter === section.id ? '#f8f9fa' : undefined
                                }}
                                onClick={() => setSelectedSectionFilter(selectedSectionFilter === section.id ? '' : section.id)}
                            >
                                <Card.Body>
                                    <div className="d-flex gap-3 h-100">
                                        {section.icon && (
                                            <div className="flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 80, height: 60, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                                                <div style={{ fontSize: 48 }}>
                                                    <i className={`bi ${section.icon}`}></i>
                                                </div>
                                            </div>
                                        )}
                                        {!section.icon && (
                                            <div className="flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: 80, height: 80, backgroundColor: '#f0f0f0', borderRadius: 8 }}>
                                                <i className="bi bi-square" style={{ fontSize: 32, color: '#ccc' }}></i>
                                            </div>
                                        )}

                                        <div className="flex-grow-1 d-flex justify-content-between">
                                            <div className="d-flex flex-column justify-content-between mb-3">
                                                <div className="mb-1" style={{ fontSize: '18px', fontWeight: 500 }}>
                                                    {section.title}
                                                </div>
                                                <div className="text-muted">/{section.slug}</div>
                                            </div>
                                            <div className="d-flex gap-2" style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                <Button size="sm" variant="outline-primary" onClick={(e) => { e.stopPropagation(); openEditSectionModal(section); }} title="Редактировать">
                                                    <i className="bi bi-pencil"></i>
                                                </Button>
                                                <Button size="sm" variant="outline-danger" onClick={(e) => { e.stopPropagation(); confirmDeleteSection(section.id); }} title="Удалить">
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </div>
                    ))}
                </div>

                <Row className="mb-4">
                    <Col>
                        <h2>Члены РАР</h2>
                    </Col>
                    <Col className="text-end">
                        <Button variant="primary" onClick={openAddMemberModal}>
                            <i className="bi bi-plus-lg me-2"></i>
                            Добавить участника
                        </Button>
                    </Col>
                </Row>

                <Row className="mb-3">
                    <Col md={7}>
                        <Form.Group>
                            <Form.Control
                                type="text"
                                placeholder="Поиск по имени и фамилии..."
                                value={memberSearchQuery}
                                onChange={(e) => setMemberSearchQuery(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={4}>
                        <Form.Group>
                            <Form.Select
                                value={selectedSectionFilter}
                                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                            >
                                <option value="">Все секции</option>
                                {sections.map((section) => (
                                    <option key={section.id} value={section.id}>
                                        {section.title}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                </Row>

                {loading ? (
                    <div className="text-center my-5">
                        <Spinner animation="border" variant="primary" />
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '40px' }}>
                        {filteredMembers.map((member) => (
                            <Card key={member.id}>
                                <Card.Body>
                                    <div className="d-flex gap-3 mb-3">
                                        <div className="flex-grow-1">
                                            <h5 className="mb-2">{member.page?.title}</h5>
                                            <div className="mb-2">
                                                {member.sections?.length ? member.sections.map((section) => (
                                                    <div className="me-1" key={section.id} style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', border: '1px solid #000', fontSize: '12px' }}>
                                                        {section.title}
                                                    </div>
                                                )) : (
                                                    <div style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a5a5a5', color: '#a5a5a5', fontSize: '12px' }}>Без секции</div>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center" style={{ gap: '8px' }}>
                                                <div className={member.page?.isDraft ? 'badge bg-warning text-dark' : 'badge bg-success'}>
                                                    {member.page?.isDraft ? 'Черновик' : 'Опубликовано'}
                                                </div>
                                                {commentsCountMap[member.id] > 0 && (
                                                    <span className="badge bg-info text-dark d-flex align-items-center" style={{ gap: '6px' }}>
                                                        <i className="bi bi-chat-left-text"></i>
                                                        {commentsCountMap[member.id]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <Button size="sm" variant="outline-primary" onClick={() => openEditMemberModal(member)}>
                                                <i className="bi bi-pencil"></i>
                                            </Button>
                                            <Button size="sm" variant="outline-danger" onClick={() => confirmDeleteMember(member)}>
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                )}
            </Container>

            <Modal
                show={memberModalOpened}
                onHide={closeMemberModal}
                fullscreen={true}
                backdrop="static"
                dialogClassName="modal-fullscreen"
                contentClassName="border-0"
            >
                <div className="d-flex flex-column h-100">
                    <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
                        <div className="row g-4">
                            <div
                                className="col-md-4"
                                style={{ background: '#F7FAFF', padding: '20px 40px 40px 60px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '710px' }}
                            >
                                <div className="mb-4">
                                    <span className="text-danger fs-5 me-2">*</span>
                                    <span className="text-danger">— обязательное поле для заполнения</span>
                                </div>

                                {memberFormError && (
                                    <Alert variant="danger" className="mb-4">
                                        <i className="bi bi-exclamation-circle me-2"></i>
                                        {memberFormError}
                                    </Alert>
                                )}

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Название <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Введите название"
                                        value={memberTitle}
                                        onChange={(e) => setMemberTitle(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>
                                        Адрес портфолио <span className="text-danger">*</span>
                                    </Form.Label>
                                    <div className="d-flex gap-2">
                                        <Form.Control
                                            type="text"
                                            placeholder="например: portfolio-organization"
                                            value={memberSlug}
                                            onChange={(e) => setMemberSlug(e.target.value)}
                                            required
                                        />
                                        <Button
                                            variant="outline-secondary"
                                            onClick={() => handleGenerateSlug(setMemberSlug, memberTitle)}
                                            disabled={!memberTitle.trim() || savingMember}
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
                                        selected={memberPublishedAt || undefined}
                                        onChange={(date: Date | null) => setMemberPublishedAt(date)}
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
                                            id="member-status-published"
                                            name="member-status"
                                            label="Опубликовано"
                                            checked={memberIsDraft === false}
                                            onChange={() => setMemberIsDraft(false)}
                                        />
                                        <Form.Check
                                            type="radio"
                                            id="member-status-draft"
                                            name="member-status"
                                            label="Черновик"
                                            checked={memberIsDraft === true}
                                            onChange={() => setMemberIsDraft(true)}
                                        />
                                    </div>
                                </Form.Group>

                                <Form.Group className="mb-4">
                                    <Form.Label>Секции</Form.Label>
                                    <div className="d-flex flex-wrap gap-3">
                                        {sections.length === 0 ? (
                                            <div className="text-muted">Секции не найдены</div>
                                        ) : (
                                            sections.map((section) => (
                                                <Form.Check
                                                    key={section.id}
                                                    type="checkbox"
                                                    id={`section-${section.id}`}
                                                    label={section.title}
                                                    checked={memberSectionIds.includes(section.id)}
                                                    onChange={() => handleToggleSection(section.id)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </Form.Group>
                            </div>

                            <div className="col-md-8" style={{ padding: '10px 40px' }}>
                                <Form.Group className="mb-3">
                                    <PageBlocksEditor
                                        blocks={memberBlocks}
                                        setBlocks={setMemberBlocks}
                                    />
                                </Form.Group>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer border-top d-flex justify-content-end gap-2">
                        <Button
                            variant="outline-primary"
                            onClick={handleSaveMember}
                            disabled={savingMember}
                        >
                            <i className="bi bi-check-lg me-2"></i>
                            {savingMember ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={closeMemberModal}
                            disabled={savingMember}
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

            <DeleteMemberModal
                show={!!memberToDelete}
                onHide={() => setMemberToDelete(null)}
                onConfirm={async () => {
                    if (!memberToDelete) return
                    try {
                        setDeletingMember(true)
                        const token = localStorage.getItem('admin_token')
                        const response = await fetch(API_ENDPOINTS.RAR_MEMBERS.delete(memberToDelete.id), {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` },
                        })
                        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
                        await loadMembers()
                        setMemberToDelete(null)
                    } catch (err) {
                        setError(err instanceof Error ? err.message : 'Ошибка при удалении')
                        throw err
                    } finally {
                        setDeletingMember(false)
                    }
                }}
                memberTitle={memberToDelete?.page.title || ''}
                isLoading={deletingMember}
            />

            <Modal show={sectionModalOpened} onHide={closeSectionModal} backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>{editingSectionId ? 'Редактировать секцию' : 'Добавить секцию'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {sectionFormError && <Alert variant="danger">{sectionFormError}</Alert>}

                    <Form.Group className="mb-3">
                        <Form.Label>Название</Form.Label>
                        <Form.Control value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Слаг</Form.Label>
                        <div className="d-flex gap-2">
                            <Form.Control value={sectionSlug} onChange={(e) => setSectionSlug(e.target.value)} />
                            <Button variant="outline-secondary" onClick={() => handleGenerateSlug(setSectionSlug, sectionTitle)} title="Сгенерировать слаг">
                                Авто
                            </Button>
                        </div>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Иконка (опционально)</Form.Label>
                        <Form.Control value={sectionIcon} onChange={(e) => setSectionIcon(e.target.value)} placeholder="bi bi-newspaper" />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeSectionModal}>
                        <i className="bi bi-x-lg me-1"></i>
                        Отмена
                    </Button>
                    <Button variant="primary" onClick={handleSaveSection} disabled={savingSection}>
                        <i className="bi bi-check-lg me-1"></i>
                        {savingSection ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={confirmDeleteSectionModal} onHide={() => setConfirmDeleteSectionModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Удалить секцию</Modal.Title>
                </Modal.Header>
                <Modal.Body>Вы уверены, что хотите удалить секцию?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setConfirmDeleteSectionModal(false)}>Отмена</Button>
                    <Button variant="danger" onClick={handleDeleteSection}>Удалить</Button>
                </Modal.Footer>
            </Modal>
        </DashboardLayout>
    )
}

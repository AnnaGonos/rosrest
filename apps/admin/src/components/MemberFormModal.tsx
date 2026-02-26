import { useState, useEffect } from 'react'
import { Modal, Button, Form, Alert } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { PageBlocksEditor } from './PageBlocksEditor'

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
    previewImage: string
    page: Page
    sections: any[]
}

interface MemberFormModalProps {
    show: boolean
    onHide: () => void
    onSave: (data: MemberFormData) => Promise<void>
    member?: RarMember | null
    isLoading?: boolean
    error?: string | null
    sections?: RarSection[]
    selectedSectionIds?: string[]
    onSectionChange?: (sectionIds: string[]) => void
}

export interface MemberFormData {
    title: string
    slug: string
    publishedAt: Date | null
    isDraft: boolean
    blocks: Block[]
    sectionIds?: string[]
}

export function MemberFormModal({
    show,
    onHide,
    onSave,
    member,
    isLoading = false,
    error = null,
    sections = [],
    selectedSectionIds = [],
    onSectionChange,
}: MemberFormModalProps) {
    const [memberTitle, setMemberTitle] = useState('')
    const [memberSlug, setMemberSlug] = useState('')
    const [memberPublishedAt, setMemberPublishedAt] = useState<Date | null>(new Date())
    const [memberIsDraft, setMemberIsDraft] = useState(true)
    const [memberBlocks, setMemberBlocks] = useState<Block[]>([])
    const [sectionIds, setSectionIds] = useState<string[]>([])
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        if (show) {
            if (member) {
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
                setSectionIds(member.sections.map(s => s.id))
            } else {
                setMemberTitle('')
                setMemberSlug('')
                setMemberPublishedAt(new Date())
                setMemberIsDraft(true)
                setMemberBlocks([])
                setSectionIds(selectedSectionIds)
            }
            setFormError(null)
        }
    }, [show, member])

    const handleSubmit = async () => {
        if (!memberTitle.trim()) {
            setFormError('Введите название портфолио')
            return
        }

        try {
            setFormError(null)
            await onSave({
                title: memberTitle,
                slug: memberSlug,
                publishedAt: memberPublishedAt,
                isDraft: memberIsDraft,
                blocks: memberBlocks,
                sectionIds: sectionIds,
            })
            onHide()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Ошибка при сохранении')
        }
    }

    const handleToggleSection = (id: string) => {
        const newSectionIds = sectionIds.includes(id)
            ? sectionIds.filter(sid => sid !== id)
            : [...sectionIds, id]
        setSectionIds(newSectionIds)
        if (onSectionChange) {
            onSectionChange(newSectionIds)
        }
    }

    const isEditing = !!member
    const showSectionSelector = sections.length > 0

    return (
        <Modal show={show} onHide={onHide} size="xl" fullscreen="md">
            <Modal.Header closeButton>
                <Modal.Title>
                    {isEditing ? 'Редактировать портфолио' : 'Создать портфолио'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                <div className="container-fluid h-100">
                    {formError && <Alert variant="danger" className="m-3">{formError}</Alert>}
                    {error && <Alert variant="danger" className="m-3">{error}</Alert>}
                    <div className="row g-0 h-100">
                        <div className="col-md-4" style={{ padding: '20px', borderRight: '1px solid #dee2e6', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
                            <Form>
                                <Form.Group className="mb-3">
                                    <Form.Label>Название портфолио <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={memberTitle}
                                        onChange={(e) => setMemberTitle(e.target.value)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>URL (slug)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={memberSlug}
                                        onChange={(e) => setMemberSlug(e.target.value)}
                                        placeholder="portfolio/name"
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Check
                                        type="checkbox"
                                        label="Черновик"
                                        checked={memberIsDraft}
                                        onChange={(e) => setMemberIsDraft(e.target.checked)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Дата публикации</Form.Label>
                                    <DatePicker
                                        selected={memberPublishedAt}
                                        onChange={(date: Date | null) => setMemberPublishedAt(date)}
                                        dateFormat="dd/MM/yyyy"
                                        className="form-control"
                                    />
                                </Form.Group>
                                {showSectionSelector && (
                                    <Form.Group className="mb-3">
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
                                                        checked={sectionIds.includes(section.id)}
                                                        onChange={() => handleToggleSection(section.id)}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </Form.Group>
                                )}
                            </Form>
                        </div>

                        <div className="col-md-8" style={{ padding: '20px 40px', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
                            <Form.Group className="mb-3">
                                <PageBlocksEditor
                                    blocks={memberBlocks}
                                    setBlocks={setMemberBlocks}
                                />
                            </Form.Group>
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="border-top d-flex justify-content-end gap-2">
                <Button
                    variant="outline-primary"
                    onClick={handleSubmit}
                    disabled={isLoading}
                >
                    <i className="bi bi-check-lg me-2"></i>
                    {isLoading ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button
                    variant="secondary"
                    onClick={onHide}
                    disabled={isLoading}
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
            </Modal.Footer>
        </Modal>
    )
}

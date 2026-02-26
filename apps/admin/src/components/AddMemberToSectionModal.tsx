import { useState, useEffect } from 'react'
import { Modal, Button, Form, Alert } from 'react-bootstrap'

interface RarMember {
    id: string
    previewImage: string
    page: {
        title: string
        slug: string
        [key: string]: any
    }
    sections: any[]
}

interface AddMemberToSectionModalProps {
    show: boolean
    onHide: () => void
    onAdd: (memberId: string) => Promise<void>
    availableMembers: RarMember[]
    isLoading?: boolean
    error?: string | null
}

export function AddMemberToSectionModal({
    show,
    onHide,
    onAdd,
    availableMembers,
    isLoading = false,
    error = null,
}: AddMemberToSectionModalProps) {
    const [selectedMemberId, setSelectedMemberId] = useState<string>('')
    const [formError, setFormError] = useState<string | null>(null)

    useEffect(() => {
        if (show) {
            setSelectedMemberId('')
            setFormError(null)
        }
    }, [show])

    const handleSubmit = async () => {
        if (!selectedMemberId) {
            setFormError('Выберите портфолио')
            return
        }

        try {
            setFormError(null)
            await onAdd(selectedMemberId)
            setSelectedMemberId('')
            onHide()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Ошибка при добавлении портфолио')
        }
    }

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Добавить портфолио в секцию</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {formError && <Alert variant="danger">{formError}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}
                {availableMembers.length === 0 ? (
                    <Alert variant="info">Нет портфолио для добавления</Alert>
                ) : (
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Выберите портфолио</Form.Label>
                            <Form.Select
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                            >
                                <option value="">-- Выберите портфолио --</option>
                                {availableMembers.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.page?.title}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                    Отмена
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleSubmit} 
                    disabled={isLoading || !selectedMemberId || availableMembers.length === 0}
                >
                    {isLoading ? 'Добавление...' : 'Добавить'}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

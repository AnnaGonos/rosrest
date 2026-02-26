import { Modal, Button } from 'react-bootstrap'

interface DeleteMemberModalProps {
    show: boolean
    onHide: () => void
    onConfirm: () => Promise<void>
    memberTitle: string
    isLoading?: boolean
}

export function DeleteMemberModal({
    show,
    onHide,
    onConfirm,
    memberTitle,
    isLoading = false,
}: DeleteMemberModalProps) {
    const handleConfirm = async () => {
        try {
            await onConfirm()
            onHide()
        } catch (err) {
        }
    }

    return (
        <Modal show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>Удалить портфолио</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                Вы уверены, что хотите удалить портфолио "{memberTitle}"? Это действие нельзя отменить.
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isLoading}>
                    Отмена
                </Button>
                <Button variant="danger" onClick={handleConfirm} disabled={isLoading}>
                    {isLoading ? 'Удаление...' : 'Удалить'}
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

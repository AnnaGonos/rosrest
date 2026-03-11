import { Modal, Button } from 'react-bootstrap';

interface ConfirmModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  body?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function ConfirmModal({
  show,
  onHide,
  onConfirm,
  title = 'Подтвердите действие',
  body = 'Вы уверены, что хотите продолжить?',
  confirmText = 'Да',
  cancelText = 'Отмена',
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Удаление...' : confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

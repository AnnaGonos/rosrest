import { Modal, Button } from 'react-bootstrap';

interface EditModalProps {
  show: boolean;
  onHide: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function EditModal({ show, onHide, children, title }: EditModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      {title && <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>}
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-success" onClick={onHide}>ОК</Button>
      </Modal.Footer>
    </Modal>
  );
}

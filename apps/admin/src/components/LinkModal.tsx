import { useState, useEffect } from 'react';
import PdfUploadField from './PdfUploadField';
import DocUploadField from './DocUploadField';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import { IconLink, IconX, IconExternalLink, IconHash } from '@tabler/icons-react';

interface LinkModalProps {
  show: boolean;
  onHide: () => void;
  onSetLink: (url: string, openInNewTab: boolean) => void;
  existingUrl?: string;
}

export default function LinkModal({ show, onHide, onSetLink, existingUrl = '' }: LinkModalProps) {
  let initialType: 'external' | 'pdf' | 'doc' = 'external';
  if (existingUrl && existingUrl.endsWith('.pdf')) initialType = 'pdf';
  if (existingUrl && (existingUrl.endsWith('.doc') || existingUrl.endsWith('.docx'))) initialType = 'doc';
  const [linkType, setLinkType] = useState<'external' | 'pdf' | 'doc'>(initialType);
  const [url, setUrl] = useState(initialType === 'external' ? existingUrl : '');
  const [pdfUrl, setPdfUrl] = useState(initialType === 'pdf' ? existingUrl : '');
  const [docUrl, setDocUrl] = useState(initialType === 'doc' ? existingUrl : '');
  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      let type: 'external' | 'pdf' | 'doc' = 'external';
      if (existingUrl && existingUrl.endsWith('.pdf')) type = 'pdf';
      if (existingUrl && (existingUrl.endsWith('.doc') || existingUrl.endsWith('.docx'))) type = 'doc';
      setLinkType(type);
      setUrl(type === 'external' ? existingUrl || '' : '');
      setPdfUrl(type === 'pdf' ? existingUrl : '');
      setDocUrl(type === 'doc' ? existingUrl : '');
      setOpenInNewTab(false);
      setError(null);
    }
  }, [show, existingUrl]);

  const handleSubmit = () => {
    if (linkType === 'external') {
      if (!url.trim()) {
        setError('Пожалуйста, введите адрес ссылки');
        return;
      }
      if (!url.startsWith('http')) {
        setError('Внешняя ссылка должна начинаться с http:// или https://');
        return;
      }
      onSetLink(url.trim(), openInNewTab);
      handleClose();
    } else if (linkType === 'pdf') {
      if (!pdfUrl) {
        setError('Пожалуйста, загрузите PDF файл или вставьте ссылку');
        return;
      }
      onSetLink(pdfUrl, openInNewTab);
      handleClose();
    } else if (linkType === 'doc') {
      if (!docUrl) {
        setError('Пожалуйста, загрузите DOC/DOCX файл или вставьте ссылку');
        return;
      }
      onSetLink(docUrl, openInNewTab);
      handleClose();
    }
  };

  const handleClose = () => {
    setError(null);
    setUrl('');
    setPdfUrl('');
    setOpenInNewTab(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2">
          <IconLink size={20} />
          Вставить/изменить ссылку
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            <IconX size={16} className="me-2" />
            {error}
          </Alert>
        )}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">
              <IconHash size={16} className="me-2" />
              Тип ссылки
            </Form.Label>
            <div className="d-flex gap-3">
              <Form.Check
                type="radio"
                id="link-type-external"
                label="Внешняя (на другую страницу)"
                checked={linkType === 'external'}
                onChange={() => {
                  setLinkType('external');
                  setPdfUrl('');
                  setDocUrl('');
                  setError(null);
                }}
              />
              <Form.Check
                type="radio"
                id="link-type-pdf"
                label="PDF файл (загрузить или вставить ссылку)"
                checked={linkType === 'pdf'}
                onChange={() => {
                  setLinkType('pdf');
                  setUrl('');
                  setDocUrl('');
                  setError(null);
                }}
              />
              <Form.Check
                type="radio"
                id="link-type-doc"
                label="DOC/DOCX файл (загрузить или вставить ссылку)"
                checked={linkType === 'doc'}
                onChange={() => {
                  setLinkType('doc');
                  setUrl('');
                  setPdfUrl('');
                  setError(null);
                }}
              />
            </div>
          </Form.Group>

          {linkType === 'external' && (
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                <IconExternalLink size={16} className="me-2" />
                Ссылка (URL)
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Например: https://example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setError(null);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  }
                }}
                autoFocus
              />
              <Form.Text className="text-muted">
                Обязательно указывайте протокол (http:// или https://)
              </Form.Text>
            </Form.Group>
          )}
          {linkType === 'pdf' && (
            <Form.Group className="mb-3">
              <PdfUploadField
                value={pdfUrl}
                onChange={val => {
                  setPdfUrl(val);
                  setError(null);
                }}
              />
            </Form.Group>
          )}
          {linkType === 'doc' && (
            <Form.Group className="mb-3">
              <DocUploadField
                value={docUrl}
                onChange={val => {
                  setDocUrl(val);
                  setError(null);
                }}
              />
            </Form.Group>
          )}

          {(linkType === 'external' || linkType === 'pdf') && (
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="open-in-new-tab"
                label="Открывать в новой вкладке"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
              />
            </Form.Group>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="secondary" onClick={handleClose}>
          <IconX size={16} className="me-2" />
          Отмена
        </Button>
        <Button variant="primary" onClick={handleSubmit}>
          <IconLink size={16} className="me-2" />
          Сохранить ссылку
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

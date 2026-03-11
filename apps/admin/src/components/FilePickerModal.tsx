import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';

interface FileItem {
  id: string;
  url: string;
  originalName: string;
  mimetype: string;
  size: number;
  createdAt: string;
}

interface FilePickerModalProps {
  show: boolean;
  onHide: () => void;
  onSelect: (file: FileItem) => void;
  fileType?: string;
  folder?: string;
}

export default function FilePickerModal({ show, onHide, onSelect, fileType, folder }: FilePickerModalProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (show) loadFiles();
  }, [show, fileType, folder]);

  const loadFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      let url = `/api/files?folder=${folder || ''}`;
      if (fileType) url += `&type=${fileType}`;
      const resp = await fetch(url, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error('Ошибка загрузки файлов');
      const data = await resp.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(f =>
    (!search || f.originalName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Выбрать файл</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Control
          type="text"
          placeholder="Поиск по имени..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-3"
        />
        {loading ? (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" />
          </div>
        ) : error ? (
          <div className="text-danger">{error}</div>
        ) : (
          <div className="d-flex flex-wrap gap-3">
            {filteredFiles.map(file => (
              <div key={file.id} className="border rounded p-2" style={{ width: 180 }}>
                {file.mimetype.startsWith('image/') ? (
                  <img src={file.url} alt={file.originalName} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                ) : (
                  <div className="bg-light text-center" style={{ height: 120, lineHeight: '120px' }}>
                    <span>{file.originalName}</span>
                  </div>
                )}
                <div className="mt-2 small text-muted">{file.originalName}</div>
                <Button variant="outline-primary" size="sm" className="mt-2 w-100" onClick={() => onSelect(file)}>
                  Выбрать
                </Button>
              </div>
            ))}
            {filteredFiles.length === 0 && <div className="text-muted">Нет файлов</div>}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Отмена</Button>
      </Modal.Footer>
    </Modal>
  );
}

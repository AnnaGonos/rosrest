import { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { getFileUrl } from '../utils/getFileUrl';

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
                {file.mimetype && file.mimetype.startsWith('image/') ? (
                  <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                    <img src={getFileUrl(file.url)} alt={file.originalName} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  </a>
                ) : file.mimetype && file.mimetype === 'application/pdf' ? (
                  <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                    <embed src={getFileUrl(file.url)} type="application/pdf" style={{ width: '100%', height: 120, background: '#f8f9fa', borderRadius: 4 }} />
                  </a>
                ) : file.mimetype && (file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ? (
                  <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                    <iframe
                      src={`https://docs.google.com/gview?url=${encodeURIComponent(getFileUrl(file.url))}&embedded=true`}
                      style={{ width: '100%', height: 120, border: 'none', background: '#f8f9fa', borderRadius: 4 }}
                      title={file.originalName}
                    />
                  </a>
                ) : (
                  <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div className="d-flex flex-column align-items-center justify-content-center bg-light" style={{ height: 120 }}>
                      <i className="bi bi-file-earmark" style={{ fontSize: 48, color: '#888' }}></i>
                      <span className="small mt-1">{file.originalName ? (file.originalName.split('.').pop()?.toUpperCase() || 'FILE') : 'FILE'}</span>
                    </div>
                  </a>
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

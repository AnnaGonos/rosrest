import { useEffect, useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { getFileUrl } from '../utils/getFileUrl';

interface FileItem {
    id: string;
    url: string;
    originalName: string;
    filename?: string;
    mimetype: string;
    size: number;
    createdAt: string;
}

interface FilePickerModalProps {
    show: boolean;
    onHide: () => void;
    onSelect: (file: FileItem) => void;
}

export default function FilePickerModal({ show, onHide, onSelect }: FilePickerModalProps) {
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (show) loadFiles();
    }, [show]);

    const loadFiles = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('admin_token');
            const url = `/api/files`;
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
        (!search || (f.originalName ?? f.filename ?? '').toLowerCase().includes(search.toLowerCase()))
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
                        {filteredFiles.map((file, idx) => {
                          // Определяем расширение и тип файла
                          const ext = (file.originalName ?? file.filename ?? '').split('.').pop()?.toLowerCase() || '';
                          const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
                          const isImage = imageExts.includes(ext);
                          const isPdf = ext === 'pdf';
                          const isDoc = ['doc', 'docx'].includes(ext);
                          const displayName = file.originalName ?? file.filename ?? '';
                          return (
                            <div key={file.id || file.url || idx} className="border rounded p-2" style={{ width: 180 }}>
                              <div className="small fw-bold text-center mb-1" style={{ minHeight: 32, wordBreak: 'break-all' }}>{displayName}</div>
                              {isImage ? (
                                <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                                  <img src={getFileUrl(file.url)} alt={displayName} style={{ width: 150, height: 100, objectFit: 'contain', display: 'block', margin: '0 auto', background: '#f8f9fa', borderRadius: 4 }} />
                                </a>
                              ) : isPdf ? (
                                <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                                  <embed src={getFileUrl(file.url)} type="application/pdf" style={{ width: 150, height: 100, background: '#f8f9fa', borderRadius: 4, display: 'block', margin: '0 auto' }} />
                                </a>
                              ) : isDoc ? (
                                <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                                  <iframe
                                    src={`https://docs.google.com/gview?url=${encodeURIComponent(getFileUrl(file.url))}&embedded=true`}
                                    style={{ width: 150, height: 100, border: 'none', background: '#f8f9fa', borderRadius: 4, display: 'block', margin: '0 auto' }}
                                    title={displayName}
                                  />
                                </a>
                              ) : (
                                <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                  <div className="d-flex flex-column align-items-center justify-content-center bg-light" style={{ height: 100 }}>
                                    <i className="bi bi-file-earmark" style={{ fontSize: 48, color: '#888' }}></i>
                                    <span className="small mt-1">{ext.toUpperCase() || 'FILE'}</span>
                                  </div>
                                </a>
                              )}
                              <Button variant="outline-primary" size="sm" className="mt-2 w-100" onClick={() => onSelect(file)}>
                                Выбрать
                              </Button>
                            </div>
                          );
                        })}
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

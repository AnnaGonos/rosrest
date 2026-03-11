import { useEffect, useState, useRef, useCallback } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { getFileUrl } from '../utils/getFileUrl';

interface FileItem {
  id?: string;
  url: string;
  originalName?: string;
  filename: string;
  mimetype?: string;
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
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState(0);
    const limit = 50;


    useEffect(() => {
      if (show) {
        setFiles([]);
        setPage(1);
        setHasMore(true);
        setTotal(0);
      }
    }, [show]);

    useEffect(() => {
      if (show) {
        loadFiles(page, search);
      }
    }, [page, show]);

    useEffect(() => {
      if (show) {
        setFiles([]);
        setPage(1);
        setHasMore(true);
        setTotal(0);
        loadFiles(1, search, true);
      }
    }, [search]);

    const loadFiles = async (pageToLoad: number, searchValue: string, replace = false) => {
      if (loading) return;
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('admin_token');
        const params = new URLSearchParams({ page: String(pageToLoad), limit: String(limit) });
        const url = `/api/files?${params.toString()}`;
        const resp = await fetch(url, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (!resp.ok) throw new Error('Ошибка загрузки файлов');
        const data = await resp.json();
        let items: FileItem[] = [];
        let totalCount = 0;
        if (Array.isArray(data)) {
          // API returns array directly (no pagination info)
          items = data.map((f: any) => ({
            ...f,
            originalName: f.originalName || undefined,
            filename: f.filename || f.originalName || '',
          }));
          // Emulate pagination client-side (fallback)
          items = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          totalCount = items.length;
          items = items.slice((pageToLoad - 1) * limit, pageToLoad * limit);
        } else if (Array.isArray(data.items)) {
          // API returns {items, total, ...}
          items = data.items.map((f: any) => ({
            ...f,
            originalName: f.originalName || undefined,
            filename: f.filename || f.originalName || '',
          }));
          totalCount = data.total || items.length;
        }
        if (searchValue) {
          items = items.filter((f: FileItem): boolean => (f.originalName ?? f.filename ?? '').toLowerCase().includes(searchValue.toLowerCase()));
        }
        setFiles(prev => replace ? items : [...prev, ...items]);
        setTotal(totalCount);
        setHasMore(pageToLoad * limit < totalCount);
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    const observer = useRef<IntersectionObserver | null>(null);
    const lastFileRef = useCallback((node: HTMLDivElement | null): void => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver(entries => {
        if (entries[0].isIntersecting && hasMore) {
          setPage(prev => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    }, [loading, hasMore]);


    const filteredFiles = files; 

    return (
      <Modal show={show} onHide={onHide} centered size="xl" dialogClassName="file-picker-modal-xl">
        <Modal.Header closeButton>
          <Modal.Title>Выбрать файл</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ minHeight: 300 }}>
          <Form.Control
            type="text"
            placeholder="Поиск по имени..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-3"
          />
          <div className="row g-3 justify-content-center">
            {filteredFiles.map((file, idx) => {
              const ext = (file.originalName ?? file.filename ?? '').split('.').pop()?.toLowerCase() || '';
              const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
              const isImage = imageExts.includes(ext);
              const isPdf = ext === 'pdf';
              const isDoc = ['doc', 'docx'].includes(ext);
              const displayName = file.originalName ?? file.filename ?? '';
              const colClass = 'col-6 col-sm-4 col-md-3 col-lg-2 col-xl-2'; // 6+ per row on xl
              if (filteredFiles.length === idx + 1) {
                return (
                  <div ref={lastFileRef} key={file.id || file.url || idx} className={`border rounded p-2 bg-white shadow-sm ${colClass}`} style={{ minWidth: 200, maxWidth: 220 }}>
                    <div className="small fw-bold text-center mb-1" style={{ minHeight: 32, wordBreak: 'break-all' }}>{displayName}</div>
                    {isImage ? (
                      <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                        <img src={getFileUrl(file.url)} alt={displayName} style={{ width: 150, height: 200, objectFit: 'cover', display: 'block', margin: '0 auto', background: '#f8f9fa', borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
                      </a>
                    ) : isPdf ? (
                      <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                        <embed src={getFileUrl(file.url)} type="application/pdf" style={{ width: 150, height: 200, background: '#f8f9fa', borderRadius: 8, display: 'block', margin: '0 auto', boxShadow: '0 2px 8px #0001' }} />
                      </a>
                    ) : isDoc ? (
                      <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                        <iframe
                          src={`https://docs.google.com/gview?url=${encodeURIComponent(getFileUrl(file.url))}&embedded=true`}
                          style={{ width: 150, height: 200, border: 'none', background: '#f8f9fa', borderRadius: 8, display: 'block', margin: '0 auto', boxShadow: '0 2px 8px #0001' }}
                          title={displayName}
                        />
                      </a>
                    ) : (
                      <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <div className="d-flex flex-column align-items-center justify-content-center bg-light" style={{ height: 200, width: 150, borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
                          <i className="bi bi-file-earmark" style={{ fontSize: 64, color: '#888' }}></i>
                          <span className="small mt-1">{ext.toUpperCase() || 'FILE'}</span>
                        </div>
                      </a>
                    )}
                    <Button variant="outline-primary" size="sm" className="mt-2 w-100" onClick={() => onSelect(file)}>
                      Выбрать
                    </Button>
                  </div>
                );
              } else {
                return (
                  <div key={file.id || file.url || idx} className={`border rounded p-2 bg-white shadow-sm ${colClass}`} style={{ minWidth: 200, maxWidth: 220 }}>
                    <div className="small fw-bold text-center mb-1" style={{ minHeight: 32, wordBreak: 'break-all' }}>{displayName}</div>
                    {isImage ? (
                      <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                        <img src={getFileUrl(file.url)} alt={displayName} style={{ width: 150, height: 200, objectFit: 'cover', display: 'block', margin: '0 auto', background: '#f8f9fa', borderRadius: 8, boxShadow: '0 2px 8px #0001' }} />
                      </a>
                    ) : isPdf ? (
                      <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                        <embed src={getFileUrl(file.url)} type="application/pdf" style={{ width: 150, height: 200, background: '#f8f9fa', borderRadius: 8, display: 'block', margin: '0 auto', boxShadow: '0 2px 8px #0001' }} />
                      </a>
                    ) : isDoc ? (
                      <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer">
                        <iframe
                          src={`https://docs.google.com/gview?url=${encodeURIComponent(getFileUrl(file.url))}&embedded=true`}
                          style={{ width: 150, height: 200, border: 'none', background: '#f8f9fa', borderRadius: 8, display: 'block', margin: '0 auto', boxShadow: '0 2px 8px #0001' }}
                          title={displayName}
                        />
                      </a>
                    ) : (
                      <a href={getFileUrl(file.url)} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <div className="d-flex flex-column align-items-center justify-content-center bg-light" style={{ height: 200, width: 150, borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
                          <i className="bi bi-file-earmark" style={{ fontSize: 64, color: '#888' }}></i>
                          <span className="small mt-1">{ext.toUpperCase() || 'FILE'}</span>
                        </div>
                      </a>
                    )}
                    <Button variant="outline-primary" size="sm" className="mt-2 w-100" onClick={() => onSelect(file)}>
                      Выбрать
                    </Button>
                  </div>
                );
              }
            })}
            {filteredFiles.length === 0 && !loading && <div className="text-muted">Нет файлов</div>}
          </div>
          {error && <div className="text-danger mt-2">{error}</div>}
          {loading && (
            <div className="d-flex justify-content-center py-4">
              <Spinner animation="border" />
            </div>
          )}
          {!loading && hasMore && (
            <div className="text-center mt-3">
              <Button variant="outline-secondary" onClick={() => setPage(prev => prev + 1)}>
                Загрузить ещё
              </Button>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="me-auto text-muted small">Показано {files.length} из {total}</div>
          <Button variant="secondary" onClick={onHide}>Отмена</Button>
        </Modal.Footer>
      </Modal>
    );
}

import React, { useState } from 'react';
import { buildApiUrl } from '../config/api';

interface PdfUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function PdfUploadField({ value, onChange, label = 'PDF файл' }: PdfUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      setError('Можно загружать только PDF файлы');
      setSuccess(false);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'pdf');
    formData.append('folder', 'documents');

    try {
      const token = localStorage.getItem('admin_token');
      const resp = await fetch(buildApiUrl('files/upload'), {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка ${resp.status}`);
      }

      const data = await resp.json();

      onChange(data.url);
      setSuccess(true);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="form-label fw-bold">{label}</label>

      <div className="btn-group w-100 mb-3" role="group">
        <input
          type="radio"
          className="btn-check"
          name="pdf-upload-tab"
          id="pdf-tab-file"
          checked={tab === 'file'}
          onChange={() => setTab('file')}
        />
        <label className="btn btn-outline-secondary" htmlFor="pdf-tab-file">Загрузить файл</label>

        <input
          type="radio"
          className="btn-check"
          name="pdf-upload-tab"
          id="pdf-tab-url"
          checked={tab === 'url'}
          onChange={() => setTab('url')}
        />
        <label className="btn btn-outline-secondary" htmlFor="pdf-tab-url">Вставить ссылку</label>
      </div>

      {tab === 'file' ? (
        <div className="mb-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="form-control"
          />
          {uploading && <div className="text-primary small mt-2"><i className="bi bi-hourglass-split"></i> Загрузка...</div>}
          {success && <div className="text-success small mt-2"><i className="bi bi-check-circle"></i> Файл успешно загружен!</div>}
          {error && <div className="text-danger small mt-2"><i className="bi bi-exclamation-circle"></i> {error}</div>}
        </div>
      ) : (
        <div className="mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="Вставьте ссылку на PDF файл"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      )}

      {value && (
        <div className="alert alert-info small" style={{ padding: '8px 12px' }}>
          <strong>Текущий файл:</strong> {value}
          <br />
          <a href={value} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary mt-2">
            <i className="bi bi-file-pdf"></i> Открыть PDF
          </a>
        </div>
      )}
    </div>
  );
}

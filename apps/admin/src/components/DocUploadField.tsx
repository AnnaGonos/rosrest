import React, { useState } from 'react';
import { buildApiUrl } from '../config/api';

interface DocUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function DocUploadField({ value, onChange, label = 'DOC/DOCX файл' }: DocUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setError('Можно загружать только DOC или DOCX файлы');
      setSuccess(false);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'doc');
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
      <label>{label}</label>
      <div style={{ marginBottom: 8 }}>
        <button
          type="button"
          className={tab === 'file' ? 'btn btn-primary btn-sm me-2' : 'btn btn-outline-primary btn-sm me-2'}
          onClick={() => setTab('file')}
        >
          Загрузить файл
        </button>
        <button
          type="button"
          className={tab === 'url' ? 'btn btn-primary btn-sm' : 'btn btn-outline-primary btn-sm'}
          onClick={() => setTab('url')}
        >
          Ввести ссылку
        </button>
      </div>
      {tab === 'file' && (
        <div>
          <input
            type="file"
            accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={uploading}
          />
          {uploading && <span className="ms-2 text-muted">Загрузка...</span>}
        </div>
      )}
      {tab === 'url' && (
        <div>
          <input
            type="text"
            className="form-control"
            placeholder="Вставьте ссылку на DOC/DOCX файл"
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={uploading}
          />
        </div>
      )}
      {error && <div className="text-danger mt-2">{error}</div>}
      {success && <div className="text-success mt-2">Файл успешно загружен</div>}
      {value && !error && (
        <div className="mt-2">
          <a href={value} target="_blank" rel="noopener noreferrer">Скачать файл</a>
        </div>
      )}
    </div>
  );
}

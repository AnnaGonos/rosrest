import React, { useState, useRef } from 'react';
import { Button } from 'react-bootstrap';
import { buildApiUrl } from '../config/api';

interface ImageUploadFieldProps {
  value: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    alignH?: 'left' | 'center' | 'right';
    alignV?: 'top' | 'center' | 'bottom';
    variant?: string;
  };
  onChange: (val: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    alignH?: 'left' | 'center' | 'right';
    alignV?: 'top' | 'center' | 'bottom';
    variant?: string;
  }) => void;
  hideAdvancedFields?: boolean;
}

export default function ImageUploadField({ value, onChange, hideAdvancedFields }: ImageUploadFieldProps) {
  const src = value?.src || '';
  const alt = value?.alt || '';
  const width = value?.width;
  const height = value?.height;
  const variant = value?.variant || 'IM01';
  const alignH: 'left' | 'center' | 'right' = value?.alignH && ['left','center','right'].includes(value.alignH) ? value.alignH : 'center';
  const alignV: 'top' | 'center' | 'bottom' = value?.alignV && ['top','center','bottom'].includes(value.alignV) ? value.alignV : 'center';
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'file' | 'url'>('file');
  const [keepAspect, setKeepAspect] = useState(true);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'image');
    formData.append('folder', 'blocks');
    try {
      const token = localStorage.getItem('admin_token');
      const resp = await fetch(buildApiUrl('files/upload'), {
        method: 'POST',
        body: formData,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error('Ошибка загрузки');
      const data = await resp.json();
      onChange({ ...value, src: data.url });
    } catch (err: any) {
      setError('Ошибка загрузки файла');
    } finally {
      setUploading(false);
    }
  };

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ ...value, width: undefined });
      return;
    }
    let newWidth = Math.min(Number(val), 1200);
    if (newWidth < 0) newWidth = 0;
    if (keepAspect && naturalSize && naturalSize.width) {
      const ratio = naturalSize.height / naturalSize.width;
      const newHeight = Math.round(newWidth * ratio);
      onChange({ ...value, width: newWidth, height: newHeight });
    } else {
      onChange({ ...value, width: newWidth });
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange({ ...value, height: undefined });
      return;
    }
    let newHeight = Math.min(Number(val), 1200);
    if (newHeight < 0) newHeight = 0;
    if (keepAspect && naturalSize && naturalSize.height) {
      const ratio = naturalSize.width / naturalSize.height;
      const newWidth = Math.round(newHeight * ratio);
      onChange({ ...value, width: newWidth, height: newHeight });
    } else {
      onChange({ ...value, height: newHeight });
    }
  };

  const handleKeepAspectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setKeepAspect(checked);
    if (checked && naturalSize) {
      if (width) {
        const newHeight = Math.round(Number(width) * (naturalSize.height / naturalSize.width));
        onChange({ ...value, height: newHeight });
      } else if (height) {
        const newWidth = Math.round(Number(height) * (naturalSize.width / naturalSize.height));
        onChange({ ...value, width: newWidth });
      }
    }
  };

  let previewUrl = src;
  if (previewUrl && previewUrl.startsWith('/uploads')) {
    previewUrl = `http://localhost:3002${previewUrl}`;
  }

  const justifyMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const alignMap = { top: 'flex-start', center: 'center', bottom: 'flex-end' };
  const objectPosition = `${alignH === 'left' ? 'left' : alignH === 'right' ? 'right' : 'center'} ${alignV === 'top' ? 'top' : alignV === 'bottom' ? 'bottom' : 'center'}`;

  return (
    <div>
      <div
        className="preview-site-style mb-3"
        style={{ display: 'flex', justifyContent: justifyMap[alignH], alignItems: alignMap[alignV], minHeight: 120 }}
      >
        {src ? (
          <img
            ref={imgRef}
            src={previewUrl}
            alt={alt}
            onLoad={handleImgLoad}
            style={{
              maxWidth: '100%',
              maxHeight: 180,
              objectFit: 'contain',
              objectPosition,
              ...(width ? { width: `${width}px!important` } : {}),
              ...(height ? { height: `${height}px!important` } : {}),
            }}
          />
        ) : (
          <div style={{ width: '100%', height: 120, background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
            <i className="bi bi-image" style={{ fontSize: 32, color: '#bbb' }}></i>
          </div>
        )}
      </div>
      <div className="mb-3 d-flex gap-2">
        <Button variant={tab === 'file' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setTab('file')}>Загрузить файл</Button>
        <Button variant={tab === 'url' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setTab('url')}>Загрузка по ссылке</Button>
      </div>
      {tab === 'file' && (
        <div className="mb-3">
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
          {uploading && <span className="ms-2 text-info">Загрузка...</span>}
          {error && <span className="ms-2 text-danger">{error}</span>}
        </div>
      )}
      {tab === 'url' && (
        <div className="mb-3">
          <input type="text" className="form-control" placeholder="Вставьте ссылку на изображение" value={src} onChange={e => onChange({ ...value, src: e.target.value })} />
        </div>
      )}
      <div className="mb-3">
        <label className="form-label">SEO: Альт-текст для изображения</label>
        <input type="text" className="form-control" value={alt} onChange={e => onChange({ ...value, alt: e.target.value })} />
      </div>
      {!hideAdvancedFields && (
        <>
          <div className="mb-3 d-flex gap-2">
            {(variant === 'IM01' || variant === 'IM02') && (
              <div style={{ flex: 1 }}>
                <label className="form-label">Горизонтальное выравнивание</label>
                <select
                  className="form-select"
                  value={alignH}
                  onChange={e => onChange({ ...value, alignH: e.target.value as 'left' | 'center' | 'right', alignV })}
                >
                  <option value="left">Слева</option>
                  <option value="center">По центру</option>
                  <option value="right">Справа</option>
                </select>
              </div>
            )}
            {(variant === 'IM01' || variant === 'IM03') && (
              <div style={{ flex: 1 }}>
                <label className="form-label">Вертикальное выравнивание</label>
                <select
                  className="form-select"
                  value={alignV}
                  onChange={e => onChange({ ...value, alignV: e.target.value as 'top' | 'center' | 'bottom', alignH })}
                >
                  <option value="top">Сверху</option>
                  <option value="center">По центру</option>
                  <option value="bottom">Снизу</option>
                </select>
              </div>
            )}
          </div>
          <div className="mb-3 ">
            <div style={{ flex: 1 }}>
              <p>Изменить размер</p>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="keep-aspect"
                  checked={keepAspect}
                  onChange={handleKeepAspectChange}
                />
                <label className="form-check-label" htmlFor="keep-aspect">
                  Сохранить пропорции
                </label>
              </div>
            </div>
            <div className="d-flex gap-2">
              <div style={{ flex: 1 }}>
                <label className="form-label">Ширина (px)</label>
                <input
                  type="number"
                  className="form-control"
                  min={0}
                  max={1200}
                  placeholder="auto"
                  value={width !== undefined ? width : ''}
                  onChange={handleWidthChange}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Высота (px)</label>
                <input
                  type="number"
                  className="form-control"
                  min={0}
                  max={1200}
                  placeholder="auto"
                  value={height !== undefined ? height : ''}
                  onChange={handleHeightChange}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { FileInput, FileInputProps } from '@mantine/core';
import { IconUpload } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

export interface ImagePreviewInputValue {
  file: File | null;
  width?: number;
  height?: number;
}

interface ImagePreviewInputProps extends Omit<FileInputProps, 'value' | 'onChange'> {
  value: ImagePreviewInputValue;
  onChange: (val: ImagePreviewInputValue) => void;
  currentImageUrl?: string;
  previewHeight?: number;
}

export function ImagePreviewInput({
  value,
  onChange,
  currentImageUrl,
  previewHeight = 180,
  ...props
}: ImagePreviewInputProps) {
  const safeValue = value || { file: null, width: undefined, height: undefined };
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (safeValue.file) {
      const url = URL.createObjectURL(safeValue.file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreview(null);
    }
  }, [safeValue.file]);


  let imageUrl = preview || currentImageUrl || '';
  if (imageUrl.startsWith('/uploads')) {
    imageUrl = `http://localhost:3002${imageUrl}`;
  }

  return (
    <div>
      <FileInput
        {...props}
        value={safeValue.file}
        onChange={file => onChange({ ...safeValue, file })}
        accept="image/*"
        leftSection={<IconUpload size={16} />}
      />

      {imageUrl && (
        <div style={{ marginTop: 12 }}>
          <img
            src={imageUrl}
            alt="Превью"
            style={{
              maxWidth: '100%',
              maxHeight: previewHeight,
              borderRadius: 8,
              border: '1px solid #eee',
              objectFit: 'contain',
            }}
          />
        </div>
      )}
    </div>
  );
}

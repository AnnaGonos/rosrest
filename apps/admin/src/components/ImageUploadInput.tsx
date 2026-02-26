import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react'
import { Button, Form, Tabs, Tab } from 'react-bootstrap'

export type ImageSourceMode = 'file' | 'url'

export interface ImageUploadValue {
    mode: ImageSourceMode
    file: File | null
    url: string
}

interface ImageUploadInputProps {
    id: string
    label: ReactNode
    required?: boolean
    helpText?: ReactNode
    value: ImageUploadValue
    onChange: (value: ImageUploadValue) => void
    disabled?: boolean
    accept?: string
}

export default function ImageUploadInput({
    id,
    label,
    required = false,
    helpText,
    value,
    onChange,
    disabled = false,
    accept = 'image/jpeg,image/png,image/webp,image/svg+xml,image/gif',
}: ImageUploadInputProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const filesBaseUrl = (import.meta as any).env.VITE_FILES_BASE_URL || window.location.origin

    const resolveImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        if (url.startsWith('//')) return `${window.location.protocol}${url}`
        const base = filesBaseUrl.replace(/\/$/, '')
        const path = url.replace(/^\//, '')
        return `${base}/${path}`
    }

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files && event.target.files[0] ? event.target.files[0] : null
        onChange({
            ...value,
            mode: 'file',
            file,
            url: file ? '' : value.url,
        })
    }

    const handleRemoveFile = () => {
        onChange({
            ...value,
            file: null,
        })
    }

    const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange({
            ...value,
            mode: 'url',
            url: event.target.value,
            file: event.target.value ? null : value.file,
        })
    }

    useEffect(() => {
        if (value.mode === 'file' && value.file) {
            const objectUrl = URL.createObjectURL(value.file)
            setPreviewUrl(objectUrl)
            return () => {
                URL.revokeObjectURL(objectUrl)
            }
        }

        if (value.mode === 'url' && value.url) {
            setPreviewUrl(resolveImageUrl(value.url))
            return
        }

        setPreviewUrl(null)
    }, [value.mode, value.file, value.url])

    return (
        <Form.Group controlId={id}>
            <Form.Label className="d-flex align-items-center gap-1" style={{ padding: 0 }}>
                <span>{label}</span>
                {required && <span className="text-danger">*</span>}
            </Form.Label>

            {helpText && (
                <Form.Text className="text-muted mt-0 mb-2">{helpText}</Form.Text>
            )}

            <Tabs
                activeKey={value.mode}
                onSelect={(key) => key && onChange({ ...value, mode: key as ImageSourceMode })}
                className="mb-2 mt-4"
            >
                <Tab eventKey="file" title="Загрузить файл">
                    <div className="d-flex flex-column gap-2 border rounded p-3 mt-2">
                        <div className="d-flex align-items-center gap-3">
                            <i className="bi bi-upload"></i>
                            <Form.Control
                                type="file"
                                accept={accept}
                                disabled={disabled}
                                onChange={handleFileChange}
                            />
                        </div>

                        {previewUrl && value.mode === 'file' && (
                            <div className="mt-3">
                                <img
                                    src={previewUrl}
                                    alt="Предпросмотр изображения"
                                    style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4, objectFit: 'contain' }}
                                />
                            </div>
                        )}
                        {value.file && (
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger p-0 d-flex align-items-center"
                                    onClick={handleRemoveFile}
                                    disabled={disabled}
                                >
                                    <i className="bi bi-x me-1"></i> Убрать файл
                                </Button>
                            </div>
                        )}
                    </div>
                </Tab>

                <Tab eventKey="url" title="Вставить ссылку">
                    <div className="border rounded p-3 mt-2">
                        <div className="d-flex align-items-center gap-3">
                            <i className="bi bi-link-45deg"></i>
                            <Form.Control
                                type="url"
                                placeholder="Вставьте URL изображения"
                                value={value.url}
                                disabled={disabled}
                                onChange={handleUrlChange}
                            />
                        </div>

                        {previewUrl && value.mode === 'url' && (
                            <div className="mt-3">
                                <img src={previewUrl} alt="Предпросмотр изображения"
                                    style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4, objectFit: 'contain' }}
                                />
                            </div>
                        )}
                    </div>
                </Tab>
            </Tabs>
        </Form.Group>
    )
}

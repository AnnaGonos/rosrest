import { useEffect, useState } from 'react'
import {
  Alert,
  Badge,
  Button,
  Container,
  Form,
  Modal,
  Spinner,
  Table,
} from 'react-bootstrap'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import ImageUploadInput, { type ImageUploadValue } from '../../components/ImageUploadInput'

type CharterDocument = {
  id: string
  title: string
  pdfUrl?: string
  isPublished: boolean
  createdAt?: string
}

export default function CharterPage() {
  const [documents, setDocuments] = useState<CharterDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addModalOpened, setAddModalOpened] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [uploadSource, setUploadSource] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  })
  const [isPublished, setIsPublished] = useState(true)
  const [formError, setFormError] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [deletingItem, setDeletingItem] = useState<CharterDocument | null>(null)

  const [editModalOpened, setEditModalOpened] = useState(false)
  const [editingItem, setEditingItem] = useState<CharterDocument | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editPdfUrl, setEditPdfUrl] = useState('')
  const [editIsPublished, setEditIsPublished] = useState(true)
  const [editFormError, setEditFormError] = useState('')
  const [editUploading, setEditUploading] = useState(false)

  const filesBaseUrl = (import.meta as any).env.VITE_FILES_BASE_URL || window.location.origin

  const resolveDocumentUrl = (url: string): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('//')) return `${window.location.protocol}${url}`
    const base = filesBaseUrl.replace(/\/$/, '')
    const path = url.replace(/^\//, '')
    return `${base}/${path}`
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_ENDPOINTS.DOCUMENTS_LIST_BY_TYPE('charter'), {
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Ошибка загрузки документов')
      const data = await res.json()
      const sorted = (data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateB - dateA
      })
      setDocuments(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setTitle('')
    setUploadSource({ mode: 'file', file: null, url: '' })
    setIsPublished(true)
    setFormError('')
    setAddModalOpened(true)
  }

  const handleUpload = async () => {
    if (!title.trim()) {
      setFormError('Укажите название документа')
      return
    }

    if (uploadSource.mode === 'file' && !uploadSource.file) {
      setFormError('Выберите PDF файл')
      return
    }

    if (uploadSource.mode === 'url' && !uploadSource.url.trim()) {
      setFormError('Укажите URL на PDF файл')
      return
    }

    try {
      setUploading(true)
      setFormError('')
      const token = localStorage.getItem('admin_token')
      const fd = new FormData()
      fd.append('title', title)
      fd.append('type', 'charter')
      fd.append('isPublished', String(isPublished))

      if (uploadSource.mode === 'file' && uploadSource.file) {
        fd.append('pdfFile', uploadSource.file)
      } else if (uploadSource.mode === 'url') {
        fd.append('pdfUrl', uploadSource.url)
      }

      const res = await fetch(API_ENDPOINTS.DOCUMENTS_CREATE, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: fd,
      })

      if (!res.ok) throw new Error('Не удалось загрузить документ')

      setAddModalOpened(false)
      setUploadSource({ mode: 'file', file: null, url: '' })
      await loadDocuments()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setUploading(false)
    }
  }

  const openDeleteModal = (doc: CharterDocument) => {
    setDeletingItem(doc)
    setDeleteModalOpened(true)
  }

  const openEditModal = (doc: CharterDocument) => {
    setEditingItem(doc)
    setEditTitle(doc.title)
    setEditPdfUrl(doc.pdfUrl || '')
    setEditIsPublished(doc.isPublished)
    setEditFormError('')
    setEditModalOpened(true)
  }

  const handleUpdate = async () => {
    if (!editTitle.trim()) {
      setEditFormError('Укажите название документа')
      return
    }

    if (!editingItem) return

    try {
      setEditUploading(true)
      setEditFormError('')
      const token = localStorage.getItem('admin_token')
      const body: any = {
        title: editTitle.trim(),
        isPublished: editIsPublished,
      }
      if (editPdfUrl.trim()) {
        body.pdfUrl = editPdfUrl.trim()
      }

      const res = await fetch(API_ENDPOINTS.DOCUMENTS_UPDATE(String(editingItem.id)), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Не удалось обновить документ')

      setEditModalOpened(false)
      setEditingItem(null)
      await loadDocuments()
    } catch (err) {
      setEditFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setEditUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      setDeletingId(deletingItem.id)
      const token = localStorage.getItem('admin_token')
      const res = await fetch(API_ENDPOINTS.DOCUMENTS_DELETE(String(deletingItem.id)), {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      if (!res.ok) throw new Error('Не удалось удалить')
      setDeleteModalOpened(false)
      setDeletingItem(null)
      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Устав и ежегодные отчеты">
        <Container className="py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
            <Spinner animation="border" role="status" />
          </div>
        </Container>
      </DashboardLayout>
    )
  }

  if (error && documents.length === 0) {
    return (
      <DashboardLayout title="Устав и ежегодные отчеты">
        <Container className="py-4">
          <Alert variant="danger" className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{error}</span>
          </Alert>
          <Button className="mt-3" variant="outline-primary" onClick={loadDocuments}>
            <i className="bi bi-arrow-repeat me-2"></i>
            Повторить
          </Button>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Устав и ежегодные отчеты">
      <Container className="py-4">
        <div className="d-flex flex-column gap-4">
          <div className="mb-4">
            <h1>Устав и ежегодные отчеты</h1>
            <p className="text-muted">Для того, чтобы опубликовать документ, достаточно указать название документа и загрузить основной PDF файл.</p>
            <a href="https://disk.yandex.ru/d/FcxUqjwhXeHsog"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-dark  d-flex align-items-center"
              style={{ width: 'fit-content', margin: '20px 0' }}
            >
              <i className="bi bi-info-lg me-2"></i>
              Советы по публикации
            </a>
          </div>

          <Button variant="primary" onClick={openAddModal} style={{ width: 'fit-content' }}>
            <i className="bi bi-plus-lg me-2"></i>
            Загрузить документ
          </Button>

          {error && (
            <Alert variant="danger" className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{error}</span>
              </div>
            </Alert>
          )}

          <div className="bg-white border rounded p-3">
            {documents.length > 0 ? (
              <Table striped hover responsive size="sm" className="mb-0">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Статус</th>
                    <th>Дата загрузки</th>
                    <th style={{ width: '160px' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <span className="small">{doc.title}</span>
                      </td>
                      <td>
                        <Badge bg={doc.isPublished ? 'success' : 'secondary'}>
                          {doc.isPublished ? 'Опубликовано' : 'Черновик'}
                        </Badge>
                      </td>
                      <td>
                        <span className="small">
                          {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ru-RU') : '—'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end">
                          {doc.pdfUrl && (
                            <Button
                              as="a"
                              href={resolveDocumentUrl(doc.pdfUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="sm"
                              variant="outline-primary"
                            >
                              <i className="bi bi-box-arrow-up-right"></i>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            onClick={() => openEditModal(doc)}
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => openDeleteModal(doc)}
                            disabled={deletingId === doc.id}
                          >
                            {deletingId === doc.id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <i className="bi bi-trash"></i>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <div className="py-5 text-center text-muted">Документы не загружены</div>
            )}
          </div>
        </div>
      </Container>

      {/* Add Modal */}
      <Modal
        show={addModalOpened}
        onHide={() => setAddModalOpened(false)}
        centered
        dialogClassName="modal-content-md"
      >
        <Modal.Header closeButton>
          <Modal.Title>Загрузить документ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">
            {formError && (
              <Alert variant="danger" className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{formError}</span>
              </Alert>
            )}

            <Form.Group controlId="charterTitle">
              <Form.Label>Название документа <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Введите название"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                required
              />
            </Form.Group>

            <ImageUploadInput
              id="charterUpload"
              label="Файл документа"
              required
              helpText="Выберите PDF файл или укажите ссылку."
              value={uploadSource}
              disabled={uploading}
              accept="application/pdf"
              onChange={setUploadSource}
            />

            <Form.Group>

              <Form.Label className="mb-2 mt-0">Статус публикации (Опубликовать / Черновик) <span className="text-danger">*</span></Form.Label>
              <Form.Check
                type="checkbox"
                label="Опубликовать документ"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.currentTarget.checked)}
              />
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAddModalOpened(false)} disabled={uploading}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={uploading}>
            {uploading && <Spinner animation="border" size="sm" className="me-2" />}
            Загрузить
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal
        show={deleteModalOpened}
        onHide={() => setDeleteModalOpened(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Удалить документ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">
            Вы действительно хотите удалить документ <strong>{deletingItem?.title}</strong>?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteModalOpened(false)}
            disabled={deletingId !== null}
          >
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deletingId !== null}>
            {deletingId !== null && <Spinner animation="border" size="sm" className="me-2" />}
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal
        show={editModalOpened}
        onHide={() => setEditModalOpened(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Редактировать документ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">
            {editFormError && (
              <Alert variant="danger" className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{editFormError}</span>
              </Alert>
            )}

            <Form.Group controlId="editCharterTitle">
              <Form.Label>Название документа</Form.Label>
              <Form.Control
                type="text"
                placeholder="Введите название"
                value={editTitle}
                onChange={(e) => setEditTitle(e.currentTarget.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="editCharterUrl">
              <Form.Label>URL на PDF файл</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://example.com/document.pdf"
                value={editPdfUrl}
                onChange={(e) => setEditPdfUrl(e.currentTarget.value)}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label className="mb-2 mt-0">Статус публикации (Опубликовать / Черновик) </Form.Label>
              <Form.Check
                type="checkbox"
                label="Опубликовать документ"
                checked={editIsPublished}
                onChange={(e) => setEditIsPublished(e.currentTarget.checked)}
              />
            </Form.Group>

          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setEditModalOpened(false)}
            disabled={editUploading}
          >
            Отмена
          </Button>
          <Button variant="primary" onClick={handleUpdate} disabled={editUploading}>
            {editUploading && <Spinner animation="border" size="sm" className="me-2" />}
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}

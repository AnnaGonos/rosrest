import { useEffect, useState } from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Modal,
  Badge,
  Form,
} from 'react-bootstrap'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import ImageUploadInput, { type ImageUploadValue } from '../../components/ImageUploadInput'

type Award = {
  id: string
  imageUrl: string
  caption?: string | null
  createdAt?: string
}

export default function AwardsPage() {
  const [items, setItems] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addModalOpened, setAddModalOpened] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadSource, setUploadSource] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  })
  const [caption, setCaption] = useState('')
  const [formError, setFormError] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [deletingItem, setDeletingItem] = useState<Award | null>(null)

  const filesBaseUrl = (import.meta as any).env.VITE_FILES_BASE_URL || window.location.origin

  const resolveImageUrl = (url: string): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('//')) return `${window.location.protocol}${url}`
    const base = filesBaseUrl.replace(/\/$/, '')
    const path = url.replace(/^\//, '')
    return `${base}/${path}`
  }

  useEffect(() => {
    loadAwards()
  }, [])

  const loadAwards = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_ENDPOINTS.AWARDS_LIST, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error('Ошибка загрузки наград')
      const data = await res.json()
      setItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setUploadSource({ mode: 'file', file: null, url: '' })
    setCaption('')
    setFormError('')
    setAddModalOpened(true)
  }

  const handleUpload = async () => {
    const hasFile = !!uploadSource.file
    const trimmedUrl = uploadSource.url.trim()
    const hasUrl = !!trimmedUrl

    if (!hasFile && !hasUrl) {
      setFormError('Выберите изображение или укажите URL-ссылку')
      return
    }

    try {
      setUploading(true)
      setFormError('')
      const token = localStorage.getItem('admin_token')
      const fd = new FormData()
      if (uploadSource.file) {
        fd.append('image', uploadSource.file)
      } else if (trimmedUrl) {
        fd.append('imageUrl', trimmedUrl)
      }
      if (caption) fd.append('caption', caption)

      const res = await fetch(API_ENDPOINTS.AWARDS_CREATE, {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: fd,
      })

      if (!res.ok) throw new Error('Не удалось загрузить награду')

      setAddModalOpened(false)
			setUploadSource({ mode: 'file', file: null, url: '' })
      await loadAwards()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setUploading(false)
    }
  }

  const openDeleteModal = (it: Award) => { setDeletingItem(it); setDeleteModalOpened(true) }

  const handleDelete = async () => {
    if (!deletingItem) return
    try {
      setDeletingId(deletingItem.id)
      const token = localStorage.getItem('admin_token')
      const res = await fetch(API_ENDPOINTS.AWARDS_DELETE(String(deletingItem.id)), {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      if (!res.ok) throw new Error('Не удалось удалить')
      setDeleteModalOpened(false)
      setDeletingItem(null)
      await loadAwards()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return (
    <DashboardLayout title="Награды и дипломы">
      <Container className="py-5">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <Spinner animation="border" />
        </div>
      </Container>
    </DashboardLayout>
  )

  if (error) return (
    <DashboardLayout title="Награды и дипломы">
      <Container className="py-4">
        <Alert variant="danger" className="mb-3">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 18 }}></i>
            <span>{error}</span>
          </div>
        </Alert>
        <Button variant="outline-primary" onClick={loadAwards}>
          <i className="bi bi-arrow-repeat me-2"></i>
          Повторить
        </Button>
      </Container>
    </DashboardLayout>
  )

  return (
    <DashboardLayout title="Награды и дипломы">
      <Container className="py-4">
        <div className="mb-4">
          <h1>Награды и дипломы</h1>
          <div className="mb-4">

            <p className="text-muted">Загрузите изображения и подписи для раздела "Награды и дипломы".</p>

            <a href="https://disk.yandex.ru/d/fs6mtyFlrmn9yw"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-dark  d-flex align-items-center"
              style={{ width: 'fit-content', margin: '20px 0' }}
            >
              <i className="bi bi-info-lg me-2"></i>
              Советы по публикации
            </a>

            <small className="text-primary">Всего: {items.length}</small>
          </div>

          <div className="d-flex gap-2 mb-4">
            <Button
              variant="primary"
              onClick={openAddModal}
            >
              <i className="bi bi-plus-lg me-2"></i>
              Добавить
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="border rounded p-4 text-muted">Пока нет загруженных наград</div>
          ) : (
            <Row className="g-3">
              {items
                .slice()
                .sort((a, b) => {
                  const ta = a.createdAt ? Date.parse(a.createdAt) : 0
                  const tb = b.createdAt ? Date.parse(b.createdAt) : 0
                  return tb - ta
                })
                .map((it) => (
                  <Col key={it.id} xs={12} sm={6} md={3}>
                    <Card className="h-100 position-relative">
                      <div className="btn-group" style={{ display: 'flex', width: 'fit-content', position: 'absolute', top: '0', right: '0' }}>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDeleteModal(it)}
                          disabled={deletingId === it.id}
                        >
                          {deletingId === it.id ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <i className="bi bi-trash"></i>
                          )}
                        </Button>
                      </div>


                      <Card.Body className="d-flex flex-column gap-2">
                        <div className="d-flex justify-content-center mb-2">
                          <img
                            src={resolveImageUrl(it.imageUrl)}
                            alt="Награда"
                            style={{ maxHeight: 350, objectFit: 'contain', width: '100%' }}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/320x180?text=Фото'
                            }}
                          />
                        </div>
                        {it.caption && (
                          <p className="mb-0 text-muted" style={{ fontSize: '0.9rem' }}>
                            {it.caption}
                          </p>
                        )}
                        <p className="mb-0 text-muted" style={{ fontSize: '0.8rem' }}>
                          {it.createdAt ? new Date(it.createdAt).toLocaleString('ru-RU') : ''}
                        </p>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
            </Row>
          )}
        </div>
      </Container>

      <Modal show={addModalOpened} onHide={() => setAddModalOpened(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Добавить награду</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">
            {formError && (
              <Alert variant="danger" className="d-flex align-items-center gap-2 mb-0">
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 16 }}></i>
                <span>{formError}</span>
              </Alert>
            )}

            <ImageUploadInput
              id="awardImage"
              label="Изображение награды"
              required
              helpText="Выберите файл (JPG, PNG, WEBP) или укажите URL-ссылку."
              value={uploadSource}
              onChange={(val) => {
                setUploadSource(val)
                setFormError('')
              }}
              disabled={uploading}
              accept="image/jpeg,image/png,image/webp"
            />

            <Form.Group controlId="awardCaption">
              <Form.Label>Подпись</Form.Label>
              <Form.Control
                type="text"
                placeholder="Короткое описание (опционально)"
                value={caption}
                onChange={(e) => setCaption(e.currentTarget.value)}
              />
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAddModalOpened(false)} disabled={uploading}>
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading && <Spinner animation="border" size="sm" className="me-2" />}
            Загрузить
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={deleteModalOpened} onHide={() => setDeleteModalOpened(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Удалить</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Уверены, что хотите удалить?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteModalOpened(false)}
            disabled={deletingId !== null}
          >
            Отменить
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deletingId !== null}>
            {deletingId !== null && <Spinner animation="border" size="sm" className="me-2" />}
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}

import { useState, useEffect } from 'react'
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
} from 'react-bootstrap'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import ImageUploadInput, { type ImageUploadValue } from '../../components/ImageUploadInput'

interface Partner {
  id: string
  name: string
  imageUrl: string
  link?: string
  createdAt: string
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [addModalOpened, setAddModalOpened] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [newPartnerName, setNewPartnerName] = useState('')
  const [newPartnerLink, setNewPartnerLink] = useState('')
  const [logoSource, setLogoSource] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  })

  const [editModalOpened, setEditModalOpened] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [updating, setUpdating] = useState(false)
  const [editLogoSource, setEditLogoSource] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  })

  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [deletingPartner, setDeletingPartner] = useState<Partner | null>(null)
  const [deleting, setDeleting] = useState(false)

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
    loadPartners()
  }, [])

  const loadPartners = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(API_ENDPOINTS.PARTNERS_LIST, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки партнеров')
      }

      const data = await response.json()
      setPartners(data)

      const currentCount = data.length
      console.log('Saving partners count to cache:', currentCount)
      localStorage.setItem('partners_count', currentCount.toString())
      localStorage.setItem('partners_count_timestamp', Date.now().toString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setFormError('')
    setNewPartnerName('')
    setNewPartnerLink('')
    setLogoSource({ mode: 'file', file: null, url: '' })
    setAddModalOpened(true)
  }

  const handleCreatePartner = async () => {
    const name = newPartnerName.trim()
    const link = newPartnerLink.trim()

    if (!name) {
      setFormError('Укажите название')
      return
    }

    if (logoSource.mode === 'file' && !logoSource.file) {
      setFormError('Загрузите логотип партнёра')
      return
    }

    if (logoSource.mode === 'url' && !logoSource.url.trim()) {
      setFormError('Укажите ссылку на логотип')
      return
    }

    try {
      setCreating(true)
      setFormError('')

      const token = localStorage.getItem('admin_token')
      const formData = new FormData()
      formData.append('name', name)
      if (link) formData.append('link', link)

      if (logoSource.mode === 'file' && logoSource.file) {
        formData.append('image', logoSource.file)
      } else if (logoSource.mode === 'url') {
        formData.append('imageUrl', logoSource.url.trim())
      }

      const response = await fetch(API_ENDPOINTS.PARTNERS_CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Не удалось добавить партнера')
      }

      setAddModalOpened(false)
      setLogoSource({ mode: 'file', file: null, url: '' })
      await loadPartners()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setCreating(false)
    }
  }

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner)
    setNewPartnerName(partner.name)
    setNewPartnerLink(partner.link || '')
    setEditLogoSource({ mode: 'file', file: null, url: '' })
    setFormError('')
    setEditModalOpened(true)
  }

  const handleUpdatePartner = async () => {
    if (!editingPartner) return

    const name = newPartnerName.trim()
    const link = newPartnerLink.trim()

    if (!name) {
      setFormError('Укажите название')
      return
    }

    try {
      setUpdating(true)
      setFormError('')

      const token = localStorage.getItem('admin_token')
      const formData = new FormData()
      formData.append('name', name)
      if (link) formData.append('link', link)

      if (editLogoSource.mode === 'file' && editLogoSource.file) {
        formData.append('image', editLogoSource.file)
      } else if (editLogoSource.mode === 'url' && editLogoSource.url.trim()) {
        formData.append('imageUrl', editLogoSource.url.trim())
      }

      const response = await fetch(API_ENDPOINTS.PARTNERS_UPDATE(editingPartner.id), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Не удалось обновить партнёра')
      }

      setEditModalOpened(false)
      setEditingPartner(null)
      await loadPartners()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setUpdating(false)
    }
  }

  const openDeleteModal = (partner: Partner) => {
    setDeletingPartner(partner)
    setDeleteModalOpened(true)
  }

  const handleDeletePartner = async () => {
    if (!deletingPartner) return

    try {
      setDeleting(true)

      const token = localStorage.getItem('admin_token')
      const response = await fetch(API_ENDPOINTS.PARTNERS_DELETE(deletingPartner.id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Не удалось удалить партнера')
      }

      setDeleteModalOpened(false)
      setDeletingPartner(null)
      await loadPartners()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Партнеры">
        <Container className="py-5">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
            <Spinner animation="border" />
          </div>
        </Container>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Партнеры">
        <Container className="py-4">
          <Alert variant="danger" className="mb-3">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 18 }}></i>
              <span>{error}</span>
            </div>
          </Alert>
          <Button variant="outline-primary" onClick={loadPartners}>
            <i className="bi bi-arrow-repeat me-2"></i>
            Повторить
          </Button>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Партнеры">
      <Container className="py-4">
        <div className="mb-4">
          <h1>Партнеры</h1>
          <p className="text-muted mb-0">Управление партнёрами организации</p>
          <a href="https://disk.yandex.ru/d/mTYhPk1BMjAr9w"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-dark  d-flex align-items-center"
            style={{ width: 'fit-content', margin: '20px 0' }}
          >
            <i className="bi bi-info-lg me-2"></i>
            Советы по публикации
          </a>
        </div>

        <div className="d-flex flex-wrap gap-2 pt-4 mb-4">
          <Button variant="primary" onClick={openAddModal}>
            <i className="bi bi-plus-lg me-2"></i>
            Добавить партнера
          </Button>
        </div>

        {partners.length === 0 ? (
          <div className="border rounded p-4 text-center text-muted">
            Партнеры не найдены
          </div>
        ) : (
          <Row className="g-3">
            {partners.map((partner) => (
              <Col key={partner.id} xs={12} sm={6} md={4}>
                <Card className="h-100 position-relative">
                  <div className="position-absolute" style={{ top: 8, right: 8 }}>
                    <div className="btn-group">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => openEditModal(partner)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => openDeleteModal(partner)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </div>
                  <Card.Body className="d-flex flex-column align-items-center text-center gap-2">
                    <div className="mb-2" style={{ width: '100%' }}>
                      <img
                        src={resolveImageUrl(partner.imageUrl)}
                        alt={partner.name}
                        style={{ maxHeight: 100, objectFit: 'contain', width: '100%' }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/200x80?text=Нет+логотипа'
                        }}
                      />
                    </div>
                    <h2 className="h6 mb-1">{partner.name}</h2>
                    {partner.link && (
                      <a
                        href={partner.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-secondary"
                      >
                        <i className="bi bi-box-arrow-up-right me-1"></i>
                        На сайт
                      </a>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>

      <Modal show={addModalOpened} onHide={() => setAddModalOpened(false)} centered dialogClassName="modal-content-md">
        <Modal.Header closeButton>
          <Modal.Title>Добавить партнера</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">
            {formError && (
              <Alert variant="danger" className="d-flex align-items-center gap-2 mb-0">
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 16 }}></i>
                <span>{formError}</span>
              </Alert>
            )}

            <Form.Group controlId="partnerName">
              <Form.Label>Название <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Название компании"
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.currentTarget.value)}
                disabled={creating}
                required
              />
            </Form.Group>

            <ImageUploadInput
              id="partnerLogo"
              label="Логотип"
              required
              helpText="Загрузите логотип или вставьте ссылку на изображение. Поддерживаются JPG, PNG, WEBP, SVG, GIF."
              value={logoSource}
              onChange={(val) => {
                setLogoSource(val)
                setFormError('')
              }}
              disabled={creating}
            />

            <Form.Group controlId="partnerLink">
              <Form.Label>Ссылка на сайт (опционально)</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://example.com"
                value={newPartnerLink}
                onChange={(e) => setNewPartnerLink(e.currentTarget.value)}
                disabled={creating}
              />
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAddModalOpened(false)} disabled={creating}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleCreatePartner} disabled={creating}>
            {creating && <Spinner animation="border" size="sm" className="me-2" />}
            Добавить
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={editModalOpened} onHide={() => setEditModalOpened(false)} centered dialogClassName="modal-content-md">
        <Modal.Header closeButton>
          <Modal.Title>Редактировать партнера</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">
            {formError && (
              <Alert variant="danger" className="d-flex align-items-center gap-2 mb-0">
                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 16 }}></i>
                <span>{formError}</span>
              </Alert>
            )}

            <Form.Group controlId="partnerNameEdit">
              <Form.Label>Название</Form.Label>
              <Form.Control
                type="text"
                placeholder="Название компании"
                value={newPartnerName}
                onChange={(e) => setNewPartnerName(e.currentTarget.value)}
                disabled={updating}
                required
              />
            </Form.Group>

            <ImageUploadInput
              id="partnerLogoEdit"
              label="Новый логотип (опционально)"
              helpText="Прикрепите новый логотип или вставьте ссылку, чтобы заменить текущий. Если ничего не указывать, логотип останется прежним."
              value={editLogoSource}
              onChange={(val) => {
                setEditLogoSource(val)
                setFormError('')
              }}
              disabled={updating}
            />

            <Form.Group controlId="partnerLinkEdit">
              <Form.Label>Ссылка на сайт (опционально)</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://example.com"
                value={newPartnerLink}
                onChange={(e) => setNewPartnerLink(e.currentTarget.value)}
                disabled={updating}
              />
            </Form.Group>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditModalOpened(false)} disabled={updating}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleUpdatePartner} disabled={updating}>
            {updating && <Spinner animation="border" size="sm" className="me-2" />}
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={deleteModalOpened} onHide={() => setDeleteModalOpened(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Удалить партнера</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Вы уверены, что хотите удалить партнера <strong>{deletingPartner?.name}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteModalOpened(false)}
            disabled={deleting}
          >
            Отменить
          </Button>
          <Button variant="danger" onClick={handleDeletePartner} disabled={deleting}>
            {deleting && <Spinner animation="border" size="sm" className="me-2" />}
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}

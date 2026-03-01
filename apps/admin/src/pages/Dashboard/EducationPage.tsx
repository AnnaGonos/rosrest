import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap'
import 'bootstrap-icons/font/bootstrap-icons.css'
import ImageUploadInput, { type ImageUploadValue } from '../../components/ImageUploadInput'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'

const TYPE_LABELS: Record<string, string> = {
  professional_development: 'Повышение квалификации',
  secondary: 'Среднее профессиональное образование',
  higher: 'Высшее профессиональное образование',
}

const TYPE_ORDER = ['professional_development', 'secondary', 'higher'] as const

export type EducationType = typeof TYPE_ORDER[number]

export type EducationInstitution = {
  id: number
  type: EducationType
  name: string
  websiteUrl: string
  imageUrl?: string | null
  specialties?: string[] | null
  createdAt?: string
}

export default function EducationPage() {
  const [items, setItems] = useState<EducationInstitution[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addModalType, setAddModalType] = useState<EducationType | null>(null)
  const [editingItem, setEditingItem] = useState<EducationInstitution | null>(null)
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [imageSource, setImageSource] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  })
  const [formError, setFormError] = useState('')
  const [uploading, setUploading] = useState(false)

  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    loadEducation()
  }, [])

  const grouped = useMemo(() => {
    const map: Record<EducationType, EducationInstitution[]> = {
      professional_development: [],
      secondary: [],
      higher: [],
    }
    items.forEach((it) => {
      map[it.type].push(it)
    })
    return map
  }, [items])

  const resolveImageUrl = (url?: string | null) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:3002'
    return url.startsWith('/') ? `${base}${url}` : url
  }

  const loadEducation = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_ENDPOINTS.EDUCATION_LIST, { headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error('Не удалось загрузить список образования')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const openAdd = (type: EducationType) => {
    setAddModalType(type)
    setEditingItem(null)
    setName('')
    setWebsiteUrl('')
    setSpecialties([])
    setImageSource({ mode: 'file', file: null, url: '' })
    setFormError('')
  }

  const openEdit = (item: EducationInstitution) => {
    setAddModalType(item.type)
    setEditingItem(item)
    setName(item.name)
    setWebsiteUrl(item.websiteUrl)
    setSpecialties(item.specialties ?? [])
    setImageSource({
      mode: item.imageUrl ? 'url' : 'file',
      file: null,
      url: item.imageUrl || '',
    })
    setFormError('')
  }

  const handleSubmit = async () => {
    if (!addModalType) return
    if (!name.trim()) { setFormError('Введите название учреждения'); return }
    if (!websiteUrl.trim()) { setFormError('Добавьте ссылку на сайт'); return }

    const hasFile = !!imageSource.file
    const trimmedImageUrl = imageSource.url.trim()
    const hasUrl = !!trimmedImageUrl

    if (!editingItem && !hasFile && !hasUrl) {
      setFormError('Добавьте логотип: загрузите файл или укажите URL изображения')
      return
    }

    const specialtiesClean = specialties
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      setUploading(true)
      setFormError('')
      const token = localStorage.getItem('admin_token')

      if (editingItem) {
      if (hasFile) {
        const fd = new FormData()
        fd.append('name', name.trim())
        fd.append('websiteUrl', websiteUrl.trim())
        fd.append('type', addModalType)
        if (specialtiesClean.length > 0) {
          fd.append('specialties', JSON.stringify(specialtiesClean))
        } else {
          fd.append('specialties', JSON.stringify([]))
        }
        fd.append('imageFile', imageSource.file as File)

        const res = await fetch(API_ENDPOINTS.EDUCATION_UPDATE(editingItem.id), {
          method: 'PATCH',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: fd,
        })
        if (!res.ok) throw new Error('Не удалось обновить запись')
      } else {
        const body: Record<string, unknown> = {
          name: name.trim(),
          websiteUrl: websiteUrl.trim(),
          type: addModalType,
        }
        if (specialtiesClean.length > 0) {
          body.specialties = JSON.stringify(specialtiesClean)
        } else {
          body.specialties = JSON.stringify([])
        }

        if (imageSource.mode === 'url') {
          body.imageUrl = trimmedImageUrl || ''
        }

        const res = await fetch(API_ENDPOINTS.EDUCATION_UPDATE(editingItem.id), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Не удалось обновить запись')
      }
      } else {
        const fd = new FormData()
        fd.append('type', addModalType)
        fd.append('name', name.trim())
        fd.append('websiteUrl', websiteUrl.trim())
      if (specialtiesClean.length > 0) {
        fd.append('specialties', JSON.stringify(specialtiesClean))
      } else {
        fd.append('specialties', JSON.stringify([]))
      }
      if (hasFile) {
        fd.append('imageFile', imageSource.file as File)
      } else if (hasUrl) {
        fd.append('imageUrl', trimmedImageUrl)
      }

        const res = await fetch(API_ENDPOINTS.EDUCATION_CREATE, {
          method: 'POST',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: fd,
        })
        if (!res.ok) throw new Error('Не удалось добавить образовательную организацию')
      }

      setAddModalType(null)
      setEditingItem(null)
      await loadEducation()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setUploading(false)
    }
  }

  const askDelete = (id: number) => {
    setDeletingId(id)
    setDeleteModalOpened(true)
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(API_ENDPOINTS.EDUCATION_DELETE(deletingId), {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      })
      if (!res.ok) throw new Error('Не удалось удалить запись')
      setDeleteModalOpened(false)
      setDeletingId(null)
      await loadEducation()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    }
  }

  const addSpecialtyField = () => setSpecialties((prev) => [...prev, ''])
  const updateSpecialty = (index: number, value: string) => {
    setSpecialties((prev) => prev.map((s, i) => (i === index ? value : s)))
  }
  const removeSpecialty = (index: number) => {
    setSpecialties((prev) => prev.filter((_, i) => i !== index))
  }

  const renderList = (type: EducationType) => {
    const list = grouped[type]
    if (list.length === 0) {
      return (
        <div className="bg-white border rounded p-3">
          <p className="mb-0 text-muted">Нет записей</p>
        </div>
      )
    }
    return (
      <Row className="g-3">
        {list.map((it) => {
          const imgSrc = resolveImageUrl(it.imageUrl) || 'https://placehold.co/320x180?text=Logo'
          return (
            <Col key={it.id} xs={12} sm={6} md={6}>
              <Card className="h-100 position-relative" style={{ border: '1px solid #dee2e0', borderRadius: '8px', padding: '0.5rem' }}>
                <div className="position-absolute top-0 end-0 p-2 d-flex gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => openEdit(it)}
                    title="Редактировать"
                  >
                    <i className="bi bi-pencil" />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => askDelete(it.id)}
                    title="Удалить"
                  >
                    <i className="bi bi-trash" />
                  </Button>
                </div>
                <Card.Img
                  variant="top"
                  src={imgSrc}
                  alt={it.name}
                  style={{ objectFit: 'contain', height: 160 }}
                />
                <Card.Body>
                  <h5 className="card-title mb-1">{it.name}</h5>
                  <a
                    href={it.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="d-block mb-2 text-primary text-decoration-none"
                    style={{ wordBreak: 'break-all' }}
                  >
                    {it.websiteUrl}
                  </a>
                  {it.specialties && it.specialties.length > 0 && (
                    <div className="mb-2">
                      <small className="text-muted d-block mb-1">Специальности</small>
                      <div className="d-flex flex-wrap gap-1">
                        {it.specialties.map((s, idx) => (
                          <div key={idx} className="fw-normal" style={{ flexWrap: 'wrap', fontSize: '0.85em', padding: '0.25em 0.5em', borderRadius: '0.25rem', backgroundColor: '#e0e0e0' }}>
                            {s}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {it.createdAt && (
                    <small className="text-muted">
                      Добавлено: {new Date(it.createdAt).toLocaleString('ru-RU')}
                    </small>
                  )}
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>
    )
  }

  if (loading) {
    return (
      <DashboardLayout title="Образование">
        <Container className="py-4">
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: 300 }}
          >
            <Spinner animation="border" role="status" />
          </div>
        </Container>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Образование">
        <Container className="py-4">
          <Alert variant="danger" className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill" />
            <span>{error}</span>
          </Alert>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Образование">
      <Container className="py-4">
        <div className="d-flex flex-column gap-4">
          <div>
            <h1 className="mb-1">Образование</h1>
            <p className="text-muted mb-1">
              Три списка: повышение квалификации, среднее профессиональное, высшее профессиональное образование
            </p>
            <a href="https://disk.yandex.ru/d/Zsqi-3wjBVmYqA"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-dark  d-flex align-items-center"
              style={{ width: 'fit-content', margin: '20px 0' }}
            >
              <i className="bi bi-info-lg me-2"></i>
              Советы по публикации
            </a>
            <p className="mb-0 text-primary">Всего записей: {items.length}</p>
          </div>

          {TYPE_ORDER.map((type) => (
            <div key={type} className="d-flex flex-column gap-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div>
                  <h3 className="h5 mb-1">{TYPE_LABELS[type]}</h3>
                  <p className="text-muted mb-0">Записей: {grouped[type].length}</p>
                </div>
                <Button
                  variant="primary"
                  className="d-inline-flex align-items-center gap-2"
                  onClick={() => openAdd(type)}
                >
                  <i className="bi bi-plus-lg" />
                  Добавить
                </Button>
              </div>
              {renderList(type)}
            </div>
          ))}
        </div>
      </Container>

      <Modal
        show={addModalType !== null}
        onHide={() => {
          setAddModalType(null)
          setEditingItem(null)
        }}
        centered
        dialogClassName="modal-content-md"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {addModalType
              ? `${editingItem ? 'Редактировать' : 'Добавить'}: ${TYPE_LABELS[addModalType]}`
              : 'Добавить'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && (
            <Alert variant="danger" className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{formError}</span>
            </Alert>
          )}

          <Form>
            <Form.Group className="mb-3" controlId="eduName">
              <Form.Label>
                Название учреждения <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Название учреждения"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                disabled={uploading}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="eduWebsite">
              <Form.Label>
                Сайт <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="https://..."
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.currentTarget.value)}
                disabled={uploading}
              />
            </Form.Group>

            <div className="mb-3">
              <Form.Label>Специальности (опционально)</Form.Label>
              {specialties.length === 0 && (
                <p className="text-muted mb-2">
                  Пока нет специализаций. Добавьте через кнопку ниже.
                </p>
              )}
              <div className="d-flex flex-column gap-2 mb-2">
                {specialties.map((value, idx) => (
                  <div key={idx} className="d-flex gap-2 align-items-center">
                    <Form.Control
                      type="text"
                      placeholder="Название специальности"
                      value={value}
                      onChange={(e) => updateSpecialty(idx, e.currentTarget.value)}
                      disabled={uploading}
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => removeSpecialty(idx)}
                      title="Удалить специальность"
                      disabled={uploading}
                    >
                      <i className="bi bi-x-lg" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                className="d-inline-flex align-items-center gap-2"
                onClick={addSpecialtyField}
                disabled={uploading}
              >
                <i className="bi bi-plus-lg" />
                Добавить специальность
              </Button>
            </div>

            <ImageUploadInput
              id="eduImage"
              label={
                <span>
                  Логотип / изображение (JPG/PNG/WEBP)
                  {!editingItem && <span className="text-danger"> *</span>}
                </span>
              }
              helpText={
                editingItem
                  ? 'Оставьте поле пустым, если не нужно менять логотип.'
                  : 'Загрузите логотип или укажите URL изображения.'
              }
              value={imageSource}
              onChange={(val) => {
                setImageSource(val)
                setFormError('')
              }}
              disabled={uploading}
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setAddModalType(null)
              setEditingItem(null)
            }}
            disabled={uploading}
          >
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={uploading}>
            {uploading && (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                className="me-2"
              />
            )}
            Сохранить
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={deleteModalOpened}
        onHide={() => {
          setDeleteModalOpened(false)
          setDeletingId(null)
        }}
        centered
        dialogClassName="modal-content-md"
      >
        <Modal.Header closeButton>
          <Modal.Title>Удалить запись</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">Удалить выбранное образовательное учреждение?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpened(false)
              setDeletingId(null)
            }}
          >
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}

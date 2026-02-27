import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Modal,
  Row,
  Spinner,
  Carousel,
} from 'react-bootstrap'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import ImageUploadInput, { ImageUploadValue } from '../../components/ImageUploadInput'

interface HomeSlide {
  id: number
  imageUrl: string
  createdAt: string
}

interface FallbackImageProps {
  src: string
  alt: string
  height?: number
  className?: string
  style?: CSSProperties
  placeholder: string
}

function FallbackImage({ src, alt, height, className, style, placeholder }: FallbackImageProps) {
  const [hasError, setHasError] = useState(false)
  const finalSrc = !src || hasError ? placeholder : src

  return (
    <img
      src={finalSrc}
      alt={alt}
      height={height}
      className={className}
      style={style}
      onError={() => setHasError(true)}
    />
  )
}

export default function HomeSliderPage() {
  const [slides, setSlides] = useState<HomeSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addModalOpened, setAddModalOpened] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageSource, setImageSource] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  })
  const [formError, setFormError] = useState('')

  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [deletingSlide, setDeletingSlide] = useState<HomeSlide | null>(null)

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
    loadSlides()
  }, [])

  const loadSlides = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(API_ENDPOINTS.HOME_SLIDER_LIST, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки слайдов')
      }

      const data = await response.json()
      setSlides(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setImageSource({
      mode: 'file',
      file: null,
      url: '',
    })
    setFormError('')
    setAddModalOpened(true)
  }

  const handleUpload = async () => {
    try {
      setUploading(true)
      setFormError('')

      const token = localStorage.getItem('admin_token')
      let response: Response

      if (imageSource.mode === 'file') {
        if (!imageSource.file) {
          setFormError('Загрузите изображение для слайдера')
          return
        }

        const formData = new FormData()
        formData.append('image', imageSource.file)

        response = await fetch(API_ENDPOINTS.HOME_SLIDER_CREATE, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })
      } else {
        if (!imageSource.url) {
          setFormError('Укажите ссылку на изображение для слайдера')
          return
        }

        response = await fetch(API_ENDPOINTS.HOME_SLIDER_CREATE, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: imageSource.url }),
        })
      }

      if (!response.ok) {
        throw new Error('Не удалось добавить изображение')
      }

      setAddModalOpened(false)
      setImageSource({
        mode: 'file',
        file: null,
        url: '',
      })
      await loadSlides()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setUploading(false)
    }
  }

  const openDeleteModal = (slide: HomeSlide) => {
    setDeletingSlide(slide)
    setDeleteModalOpened(true)
  }

  const handleDeleteSlide = async () => {
    if (!deletingSlide) return

    try {
      setDeletingId(deletingSlide.id)

      const token = localStorage.getItem('admin_token')
      const response = await fetch(API_ENDPOINTS.HOME_SLIDER_DELETE(String(deletingSlide.id)), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Не удалось удалить слайд')
      }

      setDeleteModalOpened(false)
      setDeletingSlide(null)
      await loadSlides()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Главная страница">
        <Container>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <Spinner animation="border" role="status" />
          </div>
        </Container>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Главная страница">
        <Container className="mt-3">
          <Alert variant="danger" className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <span>{error}</span>
          </Alert>
          <Button className="mt-3" variant="outline-primary" onClick={loadSlides}>
            <i className="bi bi-arrow-repeat me-2"></i> Повторить
          </Button>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Главная страница">
      <Container className="mt-3">
        <div className="d-flex flex-column gap-4">
          <div className="mb-4">
            <h1>Слайдер на главной странице</h1>
            <p className="text-muted mb-1">При добавлении изображений они будут отображаться в слайдере в порядке убывания даты загрузки (сначала новые, затем старые).</p>
            <a href="https://disk.yandex.ru/d/L_HSqLrVc7tc_Q"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-dark  d-flex align-items-center"
              style={{ width: 'fit-content', margin: '20px 0' }}
            >
              <i className="bi bi-info-lg me-2"></i>
              Советы по публикации
            </a>
            <small className="text-primary">Загружено изображений: {slides.length}</small>
          </div>

          {slides.length > 0 && (
            <Carousel
              indicators
              controls
              interval={3000}
              pause="hover"
              className="mb-3"
              prevIcon={
                <span
                  className="d-flex justify-content-center align-items-center bg-white rounded-circle"
                  style={{ width: 50, height: 50, color: '#000', marginRight: '70px' }}
                >
                  <i className="bi bi-chevron-left"></i>
                </span>
              }
              nextIcon={
                <span
                  className="d-flex justify-content-center align-items-center bg-white rounded-circle"
                  style={{ width: 50, height: 50, color: '#000', marginLeft: '70px' }}
                >
                  <i className="bi bi-chevron-right"></i>
                </span>
              }
            >
              {slides.map((slide) => (
                <Carousel.Item key={slide.id}>
                  <div
                    className="d-flex justify-content-center align-items-center bg-light"
                    style={{ height: 600 }}
                  >
                    <FallbackImage
                      src={resolveImageUrl(slide.imageUrl)}
                      alt="Слайд"
                      placeholder="https://placehold.co/1200x400?text=Слайд"
                      className="d-block w-100"
                      style={{ maxHeight: 600, objectFit: 'cover' }}
                    />
                  </div>
                </Carousel.Item>
              ))}
            </Carousel>
          )}

          <div className="d-flex gap-2">
            <Button variant="primary" onClick={openAddModal}>
              <i className="bi bi-plus-lg me-2"></i>
              Добавить изображение
            </Button>
          </div>

          {slides.length === 0 ? (
            <div className="border rounded p-4 text-center text-muted">
              Пока нет изображений в слайдере
            </div>
          ) : (
            <Row className="g-3">
              {slides.map((slide) => (
                <Col key={slide.id} xs={12} sm={6} md={4} className="d-flex">
                  <Card className="w-100 h-100 position-relative">

                    <div className="btn-group" style={{ display: 'flex', width: 'fit-content', position: 'absolute', top: '0', right: '0' }}>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => openDeleteModal(slide)}
                        disabled={deletingId === slide.id}
                      >
                        {deletingId === slide.id ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <i className="bi bi-trash"></i>
                        )}
                      </Button>
                    </div>

                    <div className="d-flex flex-column gap-3 p-3">
                      <div className="d-flex justify-content-center">
                        <FallbackImage
                          src={resolveImageUrl(slide.imageUrl)}
                          alt="Слайд"
                          placeholder="https://placehold.co/320x180?text=Слайд"
                          style={{ maxHeight: 180, objectFit: 'contain', width: '100%' }}
                        />
                      </div>
                      <p className="text-muted text-center mb-0" style={{ fontSize: '0.875rem' }}>
                        Загружено: {new Date(slide.createdAt).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Container>

      <Modal show={addModalOpened} onHide={() => setAddModalOpened(false)} centered
        dialogClassName="modal-content-md">
        <Modal.Header closeButton>
          <Modal.Title>Добавить изображение</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-column gap-3">
            {formError && (
              <Alert variant="danger" className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill"></i>
                <span>{formError}</span>
              </Alert>
            )}

            <ImageUploadInput
              id="homeSliderImage"
              label="Изображение для слайдера"
              required
              helpText="Выберите файл (JPG, PNG, WEBP, SVG) или укажите ссылку."
              value={imageSource}
              disabled={uploading}
              onChange={(val) => {
                setImageSource(val)
                setFormError('')
              }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAddModalOpened(false)} disabled={uploading}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={uploading}>
            {uploading && <Spinner animation="border" size="sm" className="me-2" />}
            Добавить
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={deleteModalOpened} onHide={() => setDeleteModalOpened(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Удалить изображение</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">Вы уверены, что хотите удалить это изображение?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setDeleteModalOpened(false)}
            disabled={deletingId !== null}
          >
            Отменить
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteSlide}
            disabled={deletingId !== null}
          >
            {deletingId !== null && <Spinner animation="border" size="sm" className="me-2" />}
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}

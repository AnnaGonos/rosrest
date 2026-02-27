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
  Form,
  Table,
  Badge,
  Tab,
  Nav,
} from 'react-bootstrap'
import { registerLocale } from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { ru as ruLocale } from 'date-fns/locale'

import { useEditor } from '@tiptap/react'
import Highlight from '@tiptap/extension-highlight'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Superscript from '@tiptap/extension-superscript'
import SubScript from '@tiptap/extension-subscript'
import LinkExtension from '@tiptap/extension-link'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import RichTextEditorField from '../../components/RichTextEditorField'
import ImageUploadInput, { type ImageUploadValue } from '../../components/ImageUploadInput'

type Moderator = {
  name: string;
  position?: string;
  photoUrl?: string;
  originalPhotoUrl?: string;
  imageUploadValue?: ImageUploadValue;
}

type Speaker = {
  name: string;
  position?: string;
  photoUrl?: string;
  originalPhotoUrl?: string;
  imageUploadValue?: ImageUploadValue;
}

type ScheduleBlock = {
  timeStart: string;
  timeEnd?: string;
  title: string;
  description: string;
  location?: string;
  moderators?: Moderator[];
  speakers?: Speaker[];
}

type EventScheduleDay = {
  date: string;
  blocks: ScheduleBlock[];
}

type Event = {
  id: number;
  title: string;
  startDate: string;
  endDate?: string;
  previewImageUrl?: string;
  description?: string;
  address?: string;
  detailedAddress?: string;
  mapCoordinates?: string;
  registrationUrl?: string;
  faq?: Array<{ question: string; answer: string }>;
  schedule?: EventScheduleDay[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

registerLocale('ru', ruLocale)

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<string>('upcoming')

  const token = localStorage.getItem('admin_token')
  const filesBaseUrl = (import.meta as any).env.VITE_FILES_BASE_URL || window.location.origin

  const [createModalOpened, setCreateModalOpened] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState('')

  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [previewImageSource, setPreviewImageSource] = useState<ImageUploadValue>({ mode: 'file', file: null, url: '' })
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [detailedAddress, setDetailedAddress] = useState('')
  const [mapCoordinates, setMapCoordinates] = useState('')
  const [registrationUrl, setRegistrationUrl] = useState('')
  const [faq, setFaq] = useState<Array<{ question: string; answer: string }>>([])
  const [schedule, setSchedule] = useState<EventScheduleDay[]>([])
  const [isPublished, setIsPublished] = useState(true)

  const [editModalOpened, setEditModalOpened] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editFormError, setEditFormError] = useState('')

  const [editTitle, setEditTitle] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editPreviewImageSource, setEditPreviewImageSource] = useState<ImageUploadValue>({ mode: 'file', file: null, url: '' })
  const [editOriginalPreviewImageUrl, setEditOriginalPreviewImageUrl] = useState<string>('')
  const [editDescription, setEditDescription] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editDetailedAddress, setEditDetailedAddress] = useState('')
  const [editMapCoordinates, setEditMapCoordinates] = useState('')
  const [editRegistrationUrl, setEditRegistrationUrl] = useState('')
  const [editFaq, setEditFaq] = useState<Array<{ question: string; answer: string }>>([])
  const [editSchedule, setEditSchedule] = useState<EventScheduleDay[]>([])
  const [editIsPublished, setEditIsPublished] = useState(true)

  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [pastTotalCount, setPastTotalCount] = useState<number | null>(null);
  const [pastPage, setPastPage] = useState(0);
  const PAST_LIMIT = 10;

  const createDescriptionEditor = useEditor({
    extensions: [
      StarterKit.configure({ link: true }),
      LinkExtension.configure({
        openOnClick: false,
      }),
      Superscript,
      SubScript,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: description,
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML())
    },
  })

  const editDescriptionEditor = useEditor({
    extensions: [
      StarterKit.configure({ link: true }),
      LinkExtension.configure({
        openOnClick: false,
      }),
      Superscript,
      SubScript,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: editDescription,
    onUpdate: ({ editor }) => {
      setEditDescription(editor.getHTML())
    },
  })

  const resolveImageUrl = (url?: string): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('data:image')) return url
    const base = filesBaseUrl.replace(/\/$/, '')
    const path = url.replace(/^\//, '')
    return `${base}/${path}`
  }


  const parseCoordinates = (coords: string): { lat: number; lon: number } | null => {
    if (!coords || !coords.trim()) return null
    const parts = coords.split(',').map(p => p.trim())
    if (parts.length !== 2) return null
    const lat = parseFloat(parts[0])
    const lon = parseFloat(parts[1])
    if (isNaN(lat) || isNaN(lon)) return null
    return { lat, lon }
  }

  const generateMapUrl = (coords: string): string | null => {
    const parsed = parseCoordinates(coords)
    if (!parsed) return null

    return `https://yandex.ru/map-widget/v1/?ll=${parsed.lon},${parsed.lat}&z=17&l=map&pt=${parsed.lon},${parsed.lat},pm2rdm`
  }

  const generateDateOptions = (startDateStr: string, endDateStr?: string): { label: string; value: string }[] => {
    if (!startDateStr) return []

    const parseDate = (dateStr: string) => {
      const parts = dateStr.split('.')
      if (parts.length === 3) {
        const day = parseInt(parts[0])
        const month = parseInt(parts[1]) - 1
        const year = parseInt(parts[2])
        return new Date(year, month, day)
      }
      return null
    }

    const startDate = parseDate(startDateStr)
    const endDate = endDateStr ? parseDate(endDateStr) : startDate

    if (!startDate || !endDate) return []

    const dates: { label: string; value: string }[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const day = String(currentDate.getDate()).padStart(2, '0')
      const month = String(currentDate.getMonth() + 1).padStart(2, '0')
      const year = currentDate.getFullYear()
      const dateStr = `${day}.${month}.${year}`

      dates.push({
        label: dateStr,
        value: dateStr,
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }


  const fetchEvents = async (filter: 'past' | 'upcoming' = 'upcoming', page = 0) => {
    try {
      setLoading(true)
      setError('')
      if (filter === 'past') {
        const params = new URLSearchParams({ filter, limit: String(PAST_LIMIT), offset: String(page * PAST_LIMIT) })
        const response = await fetch(`${API_ENDPOINTS.events.list}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (Array.isArray(data)) {
          setPastEvents(page === 0 ? data : prev => [...prev, ...data])
        } else if (data && Array.isArray(data.events)) {
          setPastEvents(page === 0 ? data.events : prev => [...prev, ...data.events])
          setPastTotalCount(typeof data.totalCount === 'number' ? data.totalCount : null)
        } else {
          setPastEvents([])
        }
      } else {
        const params = new URLSearchParams({ filter })
        const response = await fetch(`${API_ENDPOINTS.events.list}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (Array.isArray(data)) {
          setEvents(data)
        } else if (data && Array.isArray(data.events)) {
          setEvents(data.events)
        } else {
          setEvents([])
        }
      }
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить события')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'past') {
      fetchEvents('past', 0);
      setPastPage(0);
    } else {
      fetchEvents('upcoming');
    }
  }, [activeTab]);

  const handleLoadMorePastEvents = () => {
    const nextPage = pastPage + 1;
    setPastPage(nextPage);
    fetchEvents('past', nextPage);
  };

  const handleCreateEvent = async () => {
    if (!title.trim()) {
      setFormError('Название события обязательно')
      return
    }
    if (!startDate.trim()) {
      setFormError('Дата начала обязательна')
      return
    }
    setIsCreating(true)
    setFormError('')

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('startDate', startDate.trim());
      if (endDate.trim()) formData.append('endDate', endDate.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (address.trim()) formData.append('address', address.trim());
      if (detailedAddress.trim()) formData.append('detailedAddress', detailedAddress.trim());
      if (mapCoordinates.trim()) formData.append('mapCoordinates', mapCoordinates.trim());
      if (registrationUrl.trim()) formData.append('registrationUrl', registrationUrl.trim());
      if (faq.length > 0) {
        const faqJson = JSON.stringify(faq);
        formData.append('faq', faqJson);
      }
      const scheduleToSubmit = schedule.map((day, dayIndex) => ({
        ...day,
        blocks: day.blocks.map((block, blockIndex) => ({
          ...block,
          moderators: block.moderators?.map((mod, moderatorIndex) => {
            let photoUrl = mod.photoUrl || '';
            if (mod.imageUploadValue) {
              if (mod.imageUploadValue.mode === 'file' && mod.imageUploadValue.file) {

                formData.append(`moderatorPhoto_${dayIndex}_${blockIndex}_${moderatorIndex}`, mod.imageUploadValue.file);
                photoUrl = '';
              } else if (mod.imageUploadValue.mode === 'url') {
                photoUrl = mod.imageUploadValue.url;
              }
            }
            return {
              name: mod.name,
              position: mod.position,
              photoUrl,
            };
          }) || [],
          speakers: block.speakers?.map((sp, speakerIndex) => {
            let photoUrl = sp.photoUrl || '';
            if (sp.imageUploadValue) {
              if (sp.imageUploadValue.mode === 'file' && sp.imageUploadValue.file) {
                formData.append(`speakerPhoto_${dayIndex}_${blockIndex}_${speakerIndex}`, sp.imageUploadValue.file);
                photoUrl = '';
              } else if (sp.imageUploadValue.mode === 'url') {
                photoUrl = sp.imageUploadValue.url;
              }
            }
            return {
              name: sp.name,
              position: sp.position,
              photoUrl,
            };
          }) || [],
        })),
      }));
      formData.append('schedule', JSON.stringify(scheduleToSubmit));
      formData.append('isPublished', isPublished ? '1' : '0');
      if (previewImageSource.mode === 'file' && previewImageSource.file) {
        formData.append('previewImage', previewImageSource.file);
      } else if (previewImageSource.mode === 'url' && previewImageSource.url.trim()) {
        formData.append('previewImageUrl', previewImageSource.url.trim());
      }
      const response = await fetch(API_ENDPOINTS.events.create, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      await fetchEvents(activeTab as 'past' | 'upcoming')
      setCreateModalOpened(false)
      resetCreateForm()
    } catch (err: any) {
      setFormError(err.message || 'Не удалось создать событие')
    } finally {
      setIsCreating(false)
    }
  }

  const resetCreateForm = () => {
    setTitle('')
    setStartDate('')
    setEndDate('')
    setPreviewImageSource({ mode: 'file', file: null, url: '' })
    setDescription('')
    setAddress('')
    setDetailedAddress('')
    setMapCoordinates('')
    setRegistrationUrl('')
    setFaq([])
    setSchedule([])
    setIsPublished(true)
    setFormError('')
    createDescriptionEditor?.commands.setContent('')
  }

  const openEditModal = (event: Event) => {
    setEditingEvent(event)
    setEditTitle(event.title)
    setEditStartDate(event.startDate)
    setEditEndDate(event.endDate || '')
    setEditDescription(event.description || '')
    setEditAddress(event.address || '')
    setEditDetailedAddress(event.detailedAddress || '')
    setEditMapCoordinates(event.mapCoordinates || '')
    setEditRegistrationUrl(event.registrationUrl || '')
    setEditFaq(event.faq || [])

    const scheduleWithImages = (event.schedule || []).map(day => ({
      ...day,
      blocks: day.blocks.map(block => ({
        ...block,
        moderators: block.moderators?.map(mod => ({
          ...mod,
          originalPhotoUrl: mod.photoUrl,
          imageUploadValue: {
            mode: mod.photoUrl ? 'url' : 'file',
            file: null,
            url: mod.photoUrl ? resolveImageUrl(mod.photoUrl) : ''
          } as ImageUploadValue
        })) || [],
        speakers: block.speakers?.map(sp => ({
          ...sp,
          originalPhotoUrl: sp.photoUrl,
          imageUploadValue: {
            mode: sp.photoUrl ? 'url' : 'file',
            file: null,
            url: sp.photoUrl ? resolveImageUrl(sp.photoUrl) : ''
          } as ImageUploadValue
        })) || []
      }))
    }));
    setEditSchedule(scheduleWithImages)
    setEditIsPublished(event.isPublished)
    setEditOriginalPreviewImageUrl(event.previewImageUrl || '')
    setEditPreviewImageSource({
      mode: event.previewImageUrl ? 'url' : 'file',
      file: null,
      url: event.previewImageUrl ? resolveImageUrl(event.previewImageUrl) : '',
    })
    setEditFormError('')
    editDescriptionEditor?.commands.setContent(event.description || '')
    setEditModalOpened(true)
  }

  const handleEditEvent = async () => {
    if (!editTitle.trim()) {
      setEditFormError('Название события обязательно')
      return
    }
    if (!editStartDate.trim()) {
      setEditFormError('Дата начала обязательна')
      return
    }
    setIsEditing(true)
    setEditFormError('')

    try {
      const formData = new FormData()
      formData.append('title', editTitle.trim())
      formData.append('startDate', editStartDate.trim())
      if (editEndDate?.trim()) formData.append('endDate', editEndDate.trim())
      if (editDescription?.trim()) formData.append('description', editDescription.trim())
      if (editAddress?.trim()) formData.append('address', editAddress.trim())
      if (editDetailedAddress?.trim()) formData.append('detailedAddress', editDetailedAddress.trim())
      if (editMapCoordinates?.trim()) formData.append('mapCoordinates', editMapCoordinates.trim())
      if (editRegistrationUrl?.trim()) formData.append('registrationUrl', editRegistrationUrl.trim())
      const faqJson = JSON.stringify(editFaq)
      formData.append('faq', faqJson)
      const scheduleToSubmit = editSchedule.map((day, dayIndex) => ({
        ...day,
        blocks: day.blocks.map((block, blockIndex) => ({
          ...block,
          moderators: block.moderators?.map((mod, moderatorIndex) => {
            let photoUrl = mod.photoUrl || '';
            if (mod.imageUploadValue) {
              if (mod.imageUploadValue.mode === 'file' && mod.imageUploadValue.file) {

                formData.append(`moderatorPhoto_${dayIndex}_${blockIndex}_${moderatorIndex}`, mod.imageUploadValue.file);
                photoUrl = '';
              } else if (mod.imageUploadValue.mode === 'url') {
                const originalResolved = mod.originalPhotoUrl ? resolveImageUrl(mod.originalPhotoUrl) : '';
                if (mod.imageUploadValue.url === originalResolved && mod.originalPhotoUrl) {
                  photoUrl = mod.originalPhotoUrl;
                } else {
                  photoUrl = mod.imageUploadValue.url;
                }
              }
            }
            return {
              name: mod.name,
              position: mod.position,
              photoUrl,
            };
          }) || [],
          speakers: block.speakers?.map((sp, speakerIndex) => {
            let photoUrl = sp.photoUrl || '';
            if (sp.imageUploadValue) {
              if (sp.imageUploadValue.mode === 'file' && sp.imageUploadValue.file) {
                formData.append(`speakerPhoto_${dayIndex}_${blockIndex}_${speakerIndex}`, sp.imageUploadValue.file);
                photoUrl = '';
              } else if (sp.imageUploadValue.mode === 'url') {
                const originalResolved = sp.originalPhotoUrl ? resolveImageUrl(sp.originalPhotoUrl) : '';
                if (sp.imageUploadValue.url === originalResolved && sp.originalPhotoUrl) {
                  photoUrl = sp.originalPhotoUrl;
                } else {
                  photoUrl = sp.imageUploadValue.url;
                }
              }
            }
            return {
              name: sp.name,
              position: sp.position,
              photoUrl,
            };
          }) || []
        }))
      }));
      formData.append('schedule', JSON.stringify(scheduleToSubmit));
      formData.append('isPublished', editIsPublished ? '1' : '0')

      if (editPreviewImageSource.mode === 'file' && editPreviewImageSource.file) {

        formData.append('previewImage', editPreviewImageSource.file)
      } else if (editPreviewImageSource.mode === 'url' && editPreviewImageSource.url.trim()) {
        const originalResolved = editOriginalPreviewImageUrl ? resolveImageUrl(editOriginalPreviewImageUrl) : '';
        if (editPreviewImageSource.url === originalResolved && editOriginalPreviewImageUrl) {
          formData.append('previewImageUrl', editOriginalPreviewImageUrl)
        } else {
          formData.append('previewImageUrl', editPreviewImageSource.url.trim())
        }
      }
      const response = await fetch(API_ENDPOINTS.events.update(editingEvent!.id), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      await fetchEvents(activeTab as 'past' | 'upcoming')
      setEditModalOpened(false)
      setEditingEvent(null)
    } catch (err: any) {
      setEditFormError(err.message || 'Не удалось обновить событие')
    } finally {
      setIsEditing(false)
    }
  }

  const openDeleteModal = (event: Event) => {
    setDeletingEvent(event)
    setDeleteModalOpened(true)
  }

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return

    setIsDeleting(true)
    try {
      const response = await fetch(API_ENDPOINTS.events.delete(deletingEvent.id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      await fetchEvents(activeTab as 'past' | 'upcoming')
      setDeleteModalOpened(false)
      setDeletingEvent(null)
    } catch (err: any) {
      setError(err.message || 'Не удалось удалить событие')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DashboardLayout title="Обзор">
      <Container fluid="lg" className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="h4 mb-1">События и мероприятия</h2>
                <p className="text-muted small mb-0">Управление событиями и мероприятиями</p>
                <a href="https://disk.yandex.ru/d/VzIXk5bRPAn-2w"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-dark  d-flex align-items-center"
                  style={{ width: 'fit-content', margin: '20px 0' }}
                >
                  <i className="bi bi-info-lg me-2"></i>
                  Советы по публикации
                </a>
              </div>
              <Button
                variant="primary"
                className="d-inline-flex align-items-center gap-2"
                onClick={() => {
                  resetCreateForm();
                  setCreateModalOpened(true);
                }}
              >
                <i className="bi bi-plus-lg me-2" />
                Создать событие
              </Button>
            </div>
          </Col>
        </Row>

        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {error && (
          <Alert variant="danger" className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill" />
            <span>{error}</span>
          </Alert>
        )}

        {!loading && !error && (
          <Tab.Container activeKey={activeTab} onSelect={(key) => setActiveTab(key || 'upcoming')}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="upcoming">Актуальные события</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="past">Прошедшие события</Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="upcoming">
                {events.length === 0 ? (
                  <Card className="text-center">
                    <Card.Body className="py-5">
                      <i className="bi bi-calendar-week mb-3"></i>
                      <p className="text-muted">Нет актуальных событий</p>
                      <Button
                        variant="primary"
                        onClick={() => setCreateModalOpened(true)}
                        className="mt-2"
                      >
                        <i className="bi bi-plus-lg" />
                        Создать событие
                      </Button>
                    </Card.Body>
                  </Card>
                ) : (
                  <Card>
                    <Card.Body className="p-0">
                      <Table hover responsive>
                        <thead>
                          <tr>
                            <th style={{ width: '80px' }}>Превью</th>
                            <th>Название</th>
                            <th>Дата начала</th>
                            <th>Дата окончания</th>
                            <th>Статус</th>
                            <th style={{ width: '120px' }}>Действия</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((event) => (
                            <tr key={event.id}>
                              <td>
                                {event.previewImageUrl ? (
                                  <img
                                    src={resolveImageUrl(event.previewImageUrl)}
                                    alt={event.title}
                                    className="img-thumbnail"
                                    style={{ width: 60, height: 60, objectFit: 'cover' }}
                                  />
                                ) : (
                                  <div
                                    className="d-flex align-items-center justify-content-center bg-light rounded"
                                    style={{ width: 60, height: 60 }}
                                  >
                                    <i className="bi bi-calendar-week"></i>
                                  </div>
                                )}
                              </td>
                              <td>
                                <strong>{event.title}</strong>
                              </td>
                              <td>{event.startDate}</td>
                              <td>{event.endDate || '—'}</td>
                              <td>
                                <Badge bg={event.isPublished ? 'success' : 'secondary'}>
                                  {event.isPublished ? 'Опубликовано' : 'Черновик'}
                                </Badge>
                              </td>
                              <td>
                                <div className="d-flex gap-2">
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => openEditModal(event)}
                                    title="Редактировать"
                                  >
                                    <i className="bi bi-pencil" />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => openDeleteModal(event)}
                                    title="Удалить"
                                  >
                                    <i className="bi bi-trash" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                )}
              </Tab.Pane>

              <Tab.Pane eventKey="past">
                {pastEvents.length === 0 ? (
                  <Card className="text-center">
                    <Card.Body className="py-5">
                      <i className="bi bi-calendar-week"></i>
                      <p className="text-muted">Нет прошедших событий</p>
                    </Card.Body>
                  </Card>
                ) : (
                  <>
                    <Card>
                      <Card.Body className="p-0">
                        <Table hover responsive>
                          <thead>
                            <tr>
                              <th style={{ width: '80px' }}>Превью</th>
                              <th>Название</th>
                              <th>Дата начала</th>
                              <th>Дата окончания</th>
                              <th>Статус</th>
                              <th style={{ width: '120px' }}>Действия</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pastEvents.map((event, dayIndex) => (
                              <tr key={event.id}>
                                <td>
                                  {event.previewImageUrl ? (
                                    <img
                                      src={resolveImageUrl(event.previewImageUrl)}
                                      alt={event.title}
                                      className="img-thumbnail"
                                      style={{ width: 60, height: 60, objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <div
                                      className="d-flex align-items-center justify-content-center bg-light rounded"
                                      style={{ width: 60, height: 60 }}
                                    >
                                      <i className="bi bi-calendar-week"></i>
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <strong>{event.title}</strong>
                                </td>
                                <td>{event.startDate}</td>
                                <td>{event.endDate || '—'}</td>
                                <td>
                                  <Badge bg={event.isPublished ? 'success' : 'secondary'}>
                                    {event.isPublished ? 'Опубликовано' : 'Черновик'}
                                  </Badge>
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <Button
                                      variant="outline-secondary"
                                      size="sm"
                                      onClick={() => openEditModal(event)}
                                      title="Редактировать"
                                    >
                                      <i className="bi bi-pencil" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                    {(pastTotalCount === null || pastEvents.length < pastTotalCount) && pastEvents.length > 0 && (
                      <div className="text-center mt-3">
                        <Button variant="light" onClick={handleLoadMorePastEvents}>
                          Больше событий
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        )}
      </Container>

      <Modal
        show={createModalOpened}
        onHide={() => {
          setCreateModalOpened(false)
          resetCreateForm()
        }}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Создать событие</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <span className="text-danger me-2">*</span>
            <span className="text-danger">— обязательное поле для заполнения</span>
          </div>
          <Form className="d-flex flex-column gap-3" onSubmit={e => { e.preventDefault(); handleCreateEvent(); }}>
            <Form.Group controlId="createEventTitle">
              <Form.Label>Название события <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Например: Конференция реставраторов 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={120}
              />
            </Form.Group>

            <Row style={{ marginLeft: '-5px' }}>
              <Col md={6}>
                <Form.Group controlId="createEventStartDate">
                  <Form.Label>Дата начала <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="ДД.МММ.ГГГГ или МММ.ГГГГ"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    Формат: 25.12.2026 или 12.2026
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="createEventEndDate">
                  <Form.Label>Дата окончания</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="ДД.МММ.ГГГГ или МММ.ГГГГ"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Формат: 25.12.2026 или 12.2026
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <ImageUploadInput
              id="createEventPreviewImage"
              label={<span>Превью-изображение (JPG/PNG/WEBP) <span className="text-danger">*</span></span>}
              value={previewImageSource}
              onChange={setPreviewImageSource}
              helpText="Загрузите изображение или укажите URL."
            />

            <RichTextEditorField
              label="Описание события"
              editor={createDescriptionEditor}
            />

            <Form.Group controlId="createEventAddress">
              <Form.Label>Адрес проведения</Form.Label>
              <Form.Control
                type="text"
                placeholder="Например: г. Москва / г. Москва, ул. Пушкина, д. 10"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <Form.Text className="text-muted">
                Формат: можно указать просто город или полностью город, улицу, дом и т.д.
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="createEventDetailedAddress">
              <Form.Label>Подробный адрес (площадка, здание)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Например: Международный центр реставрации, Лен. обл., с. Рождествено"
                value={detailedAddress}
                onChange={(e) => setDetailedAddress(e.target.value)}
              />
              <Form.Text className="text-muted">
                Дополнительная информация о месте проведения (название площадки, здания, заведения)
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="createEventMapCoordinates">
              <Form.Label>Координаты на карте</Form.Label>
              <Form.Control
                type="text"
                placeholder="59.933505, 30.328543"
                value={mapCoordinates}
                onChange={(e) => setMapCoordinates(e.target.value)}
              />
              <Form.Text className="text-muted">
                Формат: широта, долгота (например: 59.933505, 30.328543)
              </Form.Text>
            </Form.Group>

            {mapCoordinates && generateMapUrl(mapCoordinates) && (
              <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
                <p className="fw-bold mb-2">Предпросмотр карты</p>
                <iframe
                  src={generateMapUrl(mapCoordinates)!}
                  width="100%"
                  height="400"
                  frameBorder="0"
                  style={{ display: 'block' }}
                />
              </div>
            )}

            <Form.Group controlId="createEventRegistrationUrl">
              <Form.Label>Ссылка на регистрацию</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://timepad.ru/..."
                value={registrationUrl}
                onChange={(e) => setRegistrationUrl(e.target.value)}
              />
            </Form.Group>

            <hr className="my-1" />

            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <p className="mb-0" style={{ textTransform: 'uppercase', fontWeight: '500' }}>Расписание мероприятия</p>
                  <p className="text-muted small mb-0">Добавьте дни и блоки расписания с временем</p>
                </div>

              </div>

              {schedule.map((day, dayIndex) => (
                <div key={dayIndex} className="border border-2 rounded p-3 mb-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Form.Group controlId={`createScheduleDate${dayIndex}`} className="flex-grow-1 me-3">
                      <Form.Label>Дата</Form.Label>
                      <Form.Select
                        value={day.date}
                        onChange={(e) => {
                          const newSchedule = [...schedule]
                          newSchedule[dayIndex].date = e.target.value || ''
                          setSchedule(newSchedule)
                        }}
                      >
                        <option value="">Выберите дату</option>
                        {generateDateOptions(startDate, endDate).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setSchedule(schedule.filter((_, i) => i !== dayIndex))}
                      className="mt-3"
                    >
                      Удалить день
                    </Button>
                  </div>

                  <p className="fw-bold mb-2">Блоки расписания</p>

                  {day.blocks.map((block, blockIndex) => (
                    <div key={blockIndex} className="border rounded p-3 mb-3 bg-white">
                      <div className="d-flex gap-3 mb-2 align-items-center">
                        <Form.Group controlId={`createScheduleTimeStart${dayIndex}-${blockIndex}`}>
                          <Form.Label>Начало:</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="09:00"
                            value={block.timeStart}
                            onChange={(e) => {
                              const newSchedule = [...schedule]
                              newSchedule[dayIndex].blocks[blockIndex].timeStart = e.currentTarget.value
                              setSchedule(newSchedule)
                            }}
                            style={{ width: '100px' }}
                          />
                        </Form.Group>

                        <Form.Group controlId={`createScheduleTimeEnd${dayIndex}-${blockIndex}`}>
                          <Form.Label>Окончание:</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="10:00"
                            value={block.timeEnd || ''}
                            onChange={(e) => {
                              const newSchedule = [...schedule]
                              newSchedule[dayIndex].blocks[blockIndex].timeEnd = e.currentTarget.value
                              setSchedule(newSchedule)
                            }}
                            style={{ width: '100px' }}
                          />
                        </Form.Group>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="ms-auto align-self-start"
                          onClick={() => {
                            const newSchedule = [...schedule];
                            newSchedule[dayIndex].blocks.splice(blockIndex, 1);
                            setSchedule(newSchedule);
                          }}
                        >
                          <i className="bi bi-trash" /> Удалить блок
                        </Button>
                      </div>

                      <Form.Group controlId={`createScheduleBlockTitle${dayIndex}-${blockIndex}`} className="mb-2">
                        <Form.Label>Заголовок блока</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Торжественное открытие Форума"
                          value={block.title}
                          onChange={(e) => {
                            const newSchedule = [...schedule]
                            newSchedule[dayIndex].blocks[blockIndex].title = e.currentTarget.value
                            setSchedule(newSchedule)
                          }}
                        />
                      </Form.Group>

                      <Form.Group controlId={`createScheduleBlockDescription${dayIndex}-${blockIndex}`} className="mb-2">
                        <Form.Label>Описание</Form.Label>
                        <Form.Control
                          as="textarea"
                          placeholder="Подробное описание блока..."
                          value={block.description}
                          onChange={(e) => {
                            const newSchedule = [...schedule]
                            newSchedule[dayIndex].blocks[blockIndex].description = e.currentTarget.value
                            setSchedule(newSchedule)
                          }}
                        />
                      </Form.Group>

                      <Form.Group controlId={`createScheduleBlockLocation${dayIndex}-${blockIndex}`} className="mb-2">
                        <Form.Label>Место проведения</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Круглый стол, Сессия 7"
                          value={block.location || ''}
                          onChange={(e) => {
                            const newSchedule = [...schedule]
                            newSchedule[dayIndex].blocks[blockIndex].location = e.currentTarget.value
                            setSchedule(newSchedule)
                          }}
                        />
                      </Form.Group>

                      <p className="fw-bold mt-3 mb-2">Модераторы (опционально, добавьте при необходимости)</p>
                      {block.moderators && block.moderators.map((moderator: Moderator, moderatorIndex: number) => (
                        <div key={moderatorIndex} className="border border-secondary border-dashed rounded p-2 mb-2 bg-white">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold small">Модератор {moderatorIndex + 1}</span>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const newSchedule = [...schedule]
                                newSchedule[dayIndex].blocks[blockIndex].moderators!.splice(moderatorIndex, 1)
                                setSchedule(newSchedule)
                              }}
                            >
                              <i className="bi bi-trash" /> Удалить
                            </Button>
                          </div>
                          <Form.Group controlId={`createModeratorName${dayIndex}-${blockIndex}-${moderatorIndex}`} className="mb-2">
                            <Form.Label>Имя</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Имя Модератора"
                              value={moderator.name}
                              onChange={(e) => {
                                const newSchedule = [...schedule]
                                newSchedule[dayIndex].blocks[blockIndex].moderators![moderatorIndex].name = e.currentTarget.value
                                setSchedule(newSchedule)
                              }}
                            />
                          </Form.Group>
                          <Form.Group controlId={`createModeratorPosition${dayIndex}-${blockIndex}-${moderatorIndex}`} className="mb-2">
                            <Form.Label>Должность</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Должность модератора"
                              value={moderator.position || ''}
                              onChange={e => {
                                const newSchedule = [...schedule];
                                newSchedule[dayIndex].blocks[blockIndex].moderators![moderatorIndex].position = e.currentTarget.value;
                                setSchedule(newSchedule);
                              }}
                            />
                          </Form.Group>
                          <ImageUploadInput
                            id={`createModeratorPhotoFile${dayIndex}-${blockIndex}-${moderatorIndex}`}
                            label={<>Фото модератора</>}
                            value={moderator.imageUploadValue || {
                              mode: moderator.photoUrl && moderator.photoUrl.startsWith('http') ? 'url' : 'file',
                              file: null,
                              url: moderator.photoUrl || ''
                            }}
                            onChange={(val) => {
                              const newSchedule = [...schedule];

                              newSchedule[dayIndex].blocks[blockIndex].moderators![moderatorIndex].imageUploadValue = val;
                              if (val.mode === 'url') {
                                newSchedule[dayIndex].blocks[blockIndex].moderators![moderatorIndex].photoUrl = val.url;
                              } else if (val.mode === 'file') {
                                if (val.file) {
                                  newSchedule[dayIndex].blocks[blockIndex].moderators![moderatorIndex].photoUrl = '';
                                }
                              }
                              setSchedule(newSchedule);
                            }}
                          />
                        </div>
                      ))}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          const newSchedule = [...schedule]
                          if (!newSchedule[dayIndex].blocks[blockIndex].moderators) {
                            newSchedule[dayIndex].blocks[blockIndex].moderators = []
                          }
                          newSchedule[dayIndex].blocks[blockIndex].moderators!.push({
                            name: '',
                            photoUrl: '',
                            imageUploadValue: { mode: 'file', file: null, url: '' }
                          })
                          setSchedule(newSchedule)
                        }}
                        className="mt-2"
                      >
                        <i className="bi bi-plus-lg" />
                        Добавить модератора
                      </Button>
                      <p className="fw-bold mt-4 mb-2">Спикеры (опционально, добавьте при необходимости)</p>
                      {block.speakers && block.speakers.map((speaker: Speaker, speakerIndex: number) => (
                        <div key={speakerIndex} className="border border-secondary border-dashed rounded p-2 mb-2 bg-white">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold small">Спикер {speakerIndex + 1}</span>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const newSchedule = [...schedule]
                                newSchedule[dayIndex].blocks[blockIndex].speakers!.splice(speakerIndex, 1)
                                setSchedule(newSchedule)
                              }}
                            >
                              <i className="bi bi-trash" /> Удалить
                            </Button>
                          </div>
                          <Form.Group controlId={`createSpeakerName${dayIndex}-${blockIndex}-${speakerIndex}`} className="mb-2">
                            <Form.Label>Имя</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Имя Спикера"
                              value={speaker.name}
                              onChange={(e) => {
                                const newSchedule = [...schedule]
                                if (newSchedule[dayIndex].blocks[blockIndex].speakers) {
                                  newSchedule[dayIndex].blocks[blockIndex].speakers![speakerIndex].name = e.currentTarget.value
                                  setSchedule(newSchedule)
                                }
                              }}
                            />
                          </Form.Group>
                          <Form.Group controlId={`createSpeakerPosition${dayIndex}-${blockIndex}-${speakerIndex}`} className="mb-2">
                            <Form.Label>Должность</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Должность спикера"
                              value={speaker.position || ''}
                              onChange={e => {
                                const newSchedule = [...schedule];
                                if (newSchedule[dayIndex].blocks[blockIndex].speakers) {
                                  newSchedule[dayIndex].blocks[blockIndex].speakers![speakerIndex].position = e.currentTarget.value;
                                  setSchedule(newSchedule);
                                }
                              }}
                            />
                          </Form.Group>
                          <ImageUploadInput
                            id={`createSpeakerPhotoFile${dayIndex}-${blockIndex}-${speakerIndex}`}
                            label={<>Фото спикера</>}
                            value={speaker.imageUploadValue || {
                              mode: speaker.photoUrl && speaker.photoUrl.startsWith('http') ? 'url' : 'file',
                              file: null,
                              url: speaker.photoUrl || ''
                            }}
                            onChange={(val) => {
                              const newSchedule = [...schedule];
                              if (newSchedule[dayIndex].blocks[blockIndex].speakers) {

                                newSchedule[dayIndex].blocks[blockIndex].speakers![speakerIndex].imageUploadValue = val;
                                if (val.mode === 'url') {
                                  newSchedule[dayIndex].blocks[blockIndex].speakers![speakerIndex].photoUrl = val.url;
                                } else if (val.mode === 'file') {
                                  if (val.file) {
                                    newSchedule[dayIndex].blocks[blockIndex].speakers![speakerIndex].photoUrl = '';
                                  }
                                }
                                setSchedule(newSchedule);
                              }
                            }}
                          />
                        </div>
                      ))}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          const newSchedule = [...schedule]
                          if (!newSchedule[dayIndex].blocks[blockIndex].speakers) {
                            newSchedule[dayIndex].blocks[blockIndex].speakers = []
                          }
                          newSchedule[dayIndex].blocks[blockIndex].speakers!.push({
                            name: '',
                            photoUrl: '',
                            imageUploadValue: { mode: 'file', file: null, url: '' }
                          })
                          setSchedule(newSchedule)
                        }}
                        className="mt-2"
                      >
                        <i className="bi bi-plus-lg" />
                        Добавить спикера
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const newSchedule = [...schedule]
                      newSchedule[dayIndex].blocks.push({
                        timeStart: '',
                        timeEnd: '',
                        title: '',
                        description: '',
                        location: '',
                        moderators: [],
                        speakers: []
                      })
                      setSchedule(newSchedule)
                    }}
                  >
                    + Добавить блок времени
                  </Button>
                </div>
              ))}

              <Button
                variant="outline-primary"
                className="d-inline-flex align-items-center gap-2"
                size="sm"
                onClick={() => setSchedule([...schedule, { date: '', blocks: [] }])}
              >
                <i className="bi bi-plus-lg" />
                Добавить день
              </Button>
            </div>

            <hr className="my-1" />

            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <p className="mb-0" style={{ textTransform: 'uppercase', fontWeight: '500' }}>Часто задаваемые вопросы (FAQ)</p>
                  <p className="text-muted small mb-0">Добавьте вопросы и ответы для события</p>
                </div>
                <Button
                  variant="outline-primary"
                  className="d-inline-flex align-items-center gap-2"
                  size="sm"
                  onClick={() => setEditFaq([...editFaq, { question: '', answer: '' }])}
                >
                  <i className="bi bi-plus-lg" />
                  Добавить вопрос
                </Button>
              </div>

              {editFaq.map((item, index) => (
                <div key={index} className="border rounded p-3 mb-3 bg-light">
                  <Form.Group controlId={`editFaqQuestion${index}`} className="mb-2">
                    <Form.Label>Вопрос</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Когда начинается событие?"
                      value={item.question}
                      onChange={(e) => {
                        const newFaq = [...editFaq]
                        newFaq[index].question = e.currentTarget.value
                        setEditFaq(newFaq)
                      }}
                    />
                  </Form.Group>
                  <Form.Group controlId={`editFaqAnswer${index}`} className="mb-2">
                    <Form.Label>Ответ</Form.Label>
                    <Form.Control
                      as="textarea"
                      placeholder="Событие начинается в 10:00"
                      value={item.answer}
                      onChange={(e) => {
                        const newFaq = [...editFaq]
                        newFaq[index].answer = e.currentTarget.value
                        setEditFaq(newFaq)
                      }}
                    />
                  </Form.Group>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setEditFaq(editFaq.filter((_, i) => i !== index))}
                  >
                    <i className="bi bi-trash" /> Удалить
                  </Button>
                </div>
              ))}
            </div>

            <hr className="my-1" />

            <Form.Group controlId="createEventIsPublished">
              <Form.Label className="mb-2 mt-0">Статус публикации (Опубликовать / Черновик) <span className="text-danger">*</span></Form.Label>
              <Form.Check
                type="checkbox"
                label="Опубликовать событие"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
            </Form.Group>

            {formError && (
              <Alert variant="danger" className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{formError}</span>
              </Alert>
            )}

            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="secondary" className="me-2"
                onClick={() => {
                  setCreateModalOpened(false);
                  resetCreateForm();
                }}
              >
                Отмена
              </Button>
              <Button variant="primary" type="submit" disabled={isCreating}>
                {isCreating ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Создать
              </Button>
            </div>
          </Form>
        </Modal.Body>

      </Modal>

      <Modal
        show={editModalOpened}
        onHide={() => {
          setEditModalOpened(false)
          setEditingEvent(null)
        }}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Редактировать событие</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <span className="text-danger me-2">*</span>
            <span className="text-danger">— обязательное поле для заполнения</span>
          </div>
          <Form className="d-flex flex-column gap-3" onSubmit={e => { e.preventDefault(); handleEditEvent(); }}>
            <Form.Group controlId="editEventTitle">
              <Form.Label>Название события <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="Например: Конференция реставраторов 2026"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                maxLength={120}
              />
            </Form.Group>
            <Row style={{ marginLeft: '-5px' }}>
              <Col md={6}>
                <Form.Group controlId="editEventStartDate">
                  <Form.Label>Дата начала <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="ДД.МММ.ГГГГ или МММ.ГГГГ"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    required
                  />
                  <Form.Text className="text-muted">
                    Формат: 25.12.2026 или 12.2026
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="editEventEndDate">
                  <Form.Label>Дата окончания</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="ДД.МММ.ГГГГ или МММ.ГГГГ"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Формат: 25.12.2026 или 12.2026
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            <ImageUploadInput
              id="editEventPreviewImage"
              label={<span>Превью-изображение (JPG/PNG/WEBP)</span>}
              value={editPreviewImageSource}
              onChange={setEditPreviewImageSource}
              helpText="Загрузите изображение или укажите URL."
            />
            <RichTextEditorField
              label="Описание события"
              editor={editDescriptionEditor}
            />
            <Form.Group controlId="editEventAddress">
              <Form.Label>Адрес проведения</Form.Label>
              <Form.Control
                type="text"
                placeholder="Например: г. Москва / г. Москва, ул. Пушкина, д. 10"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />
              <Form.Text className="text-muted">
                Формат: можно указать просто город
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="editEventDetailedAddress">
              <Form.Label>Подробный адрес (площадка, здание)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Например: Международный центр реставрации, Лен. обл., с. Рождествено"
                value={editDetailedAddress}
                onChange={(e) => setEditDetailedAddress(e.target.value)}
              />
              <Form.Text className="text-muted">
                Дополнительная информация о месте проведения (название площадки, здания, заведения)
              </Form.Text>
            </Form.Group>

            <Form.Group controlId="editEventMapCoordinates">
              <Form.Label>Координаты на карте</Form.Label>
              <Form.Control
                type="text"
                placeholder="59.933505, 30.328543"
                value={editMapCoordinates}
                onChange={(e) => setEditMapCoordinates(e.target.value)}
              />
              <Form.Text className="text-muted">
                Формат: широта, долгота (например: 59.933505, 30.328543)
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="editEventRegistrationUrl">
              <Form.Label>Ссылка на регистрацию</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://timepad.ru/..."
                value={editRegistrationUrl}
                onChange={(e) => setEditRegistrationUrl(e.target.value)}
              />
            </Form.Group>

            <hr className="my-1" />
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <p className="mb-0" style={{ textTransform: 'uppercase', fontWeight: '500' }}>Расписание мероприятия</p>
                  <p className="text-muted small mb-0">Добавьте дни и блоки расписания с временем</p>
                </div>

              </div>
              {editSchedule.map((day, dayIndex) => (
                <div key={dayIndex} className="border border-2 rounded p-3 mb-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Form.Group controlId={`editScheduleDate${dayIndex}`} className="flex-grow-1 me-3">
                      <Form.Label>Дата</Form.Label>
                      <Form.Select
                        value={day.date}
                        onChange={(e) => {
                          const newSchedule = [...editSchedule]
                          newSchedule[dayIndex].date = e.target.value || ''
                          setEditSchedule(newSchedule)
                        }}
                      >
                        <option value="">Выберите дату</option>
                        {generateDateOptions(editStartDate, editEndDate).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => setEditSchedule(editSchedule.filter((_, i) => i !== dayIndex))}
                      className="mt-3"
                    >
                      Удалить день
                    </Button>
                  </div>
                  <p className="fw-bold mb-2">Блоки расписания</p>
                  {day.blocks.map((block, blockIndex) => (
                    <div key={blockIndex} className="border rounded p-3 mb-3 bg-white">
                      <div className="d-flex gap-3 mb-2 align-items-center">
                        <Form.Group controlId={`editScheduleTimeStart${dayIndex}-${blockIndex}`}>
                          <Form.Label>Начало:</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="09:00"
                            value={block.timeStart}
                            onChange={(e) => {
                              const newSchedule = [...editSchedule]
                              newSchedule[dayIndex].blocks[blockIndex].timeStart = e.currentTarget.value
                              setEditSchedule(newSchedule)
                            }}
                            style={{ width: '100px' }}
                          />
                        </Form.Group>
                        <Form.Group controlId={`editScheduleTimeEnd${dayIndex}-${blockIndex}`}>
                          <Form.Label>Окончание:</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="10:00"
                            value={block.timeEnd || ''}
                            onChange={(e) => {
                              const newSchedule = [...editSchedule]
                              newSchedule[dayIndex].blocks[blockIndex].timeEnd = e.currentTarget.value
                              setEditSchedule(newSchedule)
                            }}
                            style={{ width: '100px' }}
                          />
                        </Form.Group>
                      </div>
                      <Form.Group controlId={`editScheduleBlockTitle${dayIndex}-${blockIndex}`} className="mb-2">
                        <Form.Label>Заголовок блока</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Торжественное открытие Форума"
                          value={block.title}
                          onChange={(e) => {
                            const newSchedule = [...editSchedule]
                            newSchedule[dayIndex].blocks[blockIndex].title = e.currentTarget.value
                            setEditSchedule(newSchedule)
                          }}
                        />
                      </Form.Group>
                      <Form.Group controlId={`editScheduleBlockDescription${dayIndex}-${blockIndex}`} className="mb-2">
                        <Form.Label>Описание</Form.Label>
                        <Form.Control
                          as="textarea"
                          placeholder="Подробное описание блока..."
                          value={block.description}
                          onChange={(e) => {
                            const newSchedule = [...editSchedule]
                            newSchedule[dayIndex].blocks[blockIndex].description = e.currentTarget.value
                            setEditSchedule(newSchedule)
                          }}
                        />
                      </Form.Group>
                      <Form.Group controlId={`editScheduleBlockLocation${dayIndex}-${blockIndex}`} className="mb-2">
                        <Form.Label>Место проведения</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Круглый стол, Сессия 7"
                          value={block.location || ''}
                          onChange={(e) => {
                            const newSchedule = [...editSchedule]
                            newSchedule[dayIndex].blocks[blockIndex].location = e.currentTarget.value
                            setEditSchedule(newSchedule)
                          }}
                        />
                      </Form.Group>
                      <p className="fw-bold mt-3 mb-2">Модераторы (опционально, добавьте при необходимости)</p>
                      {block.moderators && block.moderators.map((moderator: Moderator, moderatorIndex: number) => (
                        <div key={moderatorIndex} className="border border-secondary border-dashed rounded p-2 mb-2 bg-white">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold small">Модератор {moderatorIndex + 1}</span>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const newSchedule = [...editSchedule]
                                newSchedule[dayIndex].blocks[blockIndex].moderators!.splice(moderatorIndex, 1)
                                setEditSchedule(newSchedule)
                              }}
                            >
                              <i className="bi bi-trash" /> Удалить
                            </Button>
                          </div>
                          <Form.Group controlId={`createModeratorName${dayIndex}-${blockIndex}-${moderatorIndex}`} className="mb-2">
                            <Form.Label>Имя</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Имя Модератора"
                              value={moderator.name}
                              onChange={(e) => {
                                const newSchedule = [...editSchedule]
                                newSchedule[dayIndex].blocks[blockIndex].moderators![moderatorIndex].name = e.currentTarget.value
                                setEditSchedule(newSchedule)
                              }}
                            />
                          </Form.Group>
                          <Form.Group controlId={`createModeratorPosition${dayIndex}-${blockIndex}-${moderatorIndex}`} className="mb-2">
                            <Form.Label>Должность</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Должность модератора"
                              value={moderator.position || ''}
                              onChange={e => {
                                const newSchedule = [...editSchedule];
                                newSchedule[dayIndex].blocks[blockIndex].moderators![moderatorIndex].position = e.currentTarget.value;
                                setEditSchedule(newSchedule);
                              }}
                            />
                          </Form.Group>
                          <Form.Group controlId={`createModeratorPhotoFile${dayIndex}-${blockIndex}-${moderatorIndex}`} className="mb-2">
                            <ImageUploadInput
                              id={`editModeratorPhotoFile${dayIndex}-${blockIndex}-${moderatorIndex}`}
                              label={<>Фото модератора</>}
                              value={moderator.imageUploadValue || { mode: 'file', file: null, url: moderator.photoUrl || '' }}
                              onChange={(val) => {
                                const newSchedule = [...editSchedule];

                                newSchedule[dayIndex].blocks[blockIndex].moderators![moderatorIndex].imageUploadValue = val;
                                if (val.mode === 'url') {
                                  newSchedule[dayIndex].blocks[blockIndex].moderators![moderatorIndex].photoUrl = val.url;
                                } else if (val.mode === 'file') {
                                  if (val.file) {
                                    newSchedule[dayIndex].blocks[blockIndex].moderators![moderatorIndex].photoUrl = '';
                                  }
                                }
                                setEditSchedule(newSchedule);
                              }}
                            />
                          </Form.Group>
                        </div>
                      ))}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          const newSchedule = [...editSchedule]
                          if (!newSchedule[dayIndex].blocks[blockIndex].moderators) {
                            newSchedule[dayIndex].blocks[blockIndex].moderators = []
                          }
                          newSchedule[dayIndex].blocks[blockIndex].moderators!.push({
                            name: '',
                            photoUrl: '',
                            imageUploadValue: { mode: 'file', file: null, url: '' }
                          })
                          setEditSchedule(newSchedule)
                        }}
                        className="mt-2"
                      >
                        <i className="bi bi-plus-lg" />
                        Добавить модератора
                      </Button>
                      <p className="fw-bold mt-4 mb-2">Спикеры (опционально, добавьте при необходимости)</p>
                      {block.speakers && block.speakers.map((speaker: Speaker, speakerIndex: number) => (
                        <div key={speakerIndex} className="border border-secondary border-dashed rounded p-2 mb-2 bg-white">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold small">Спикер {speakerIndex + 1}</span>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                const newSchedule = [...editSchedule]
                                newSchedule[dayIndex].blocks[blockIndex].speakers!.splice(speakerIndex, 1)
                                setEditSchedule(newSchedule)
                              }}
                            >
                              <i className="bi bi-trash" /> Удалить
                            </Button>
                          </div>
                          <Form.Group controlId={`createSpeakerName${dayIndex}-${blockIndex}-${speakerIndex}`} className="mb-2">
                            <Form.Label>Имя</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Имя Спикера"
                              value={speaker.name}
                              onChange={(e) => {
                                const newSchedule = [...editSchedule]
                                if (newSchedule[dayIndex].blocks[blockIndex].speakers) {
                                  newSchedule[dayIndex].blocks[blockIndex].speakers![speakerIndex].name = e.currentTarget.value
                                  setEditSchedule(newSchedule)
                                }
                              }}
                            />
                          </Form.Group>
                          <Form.Group controlId={`createSpeakerPosition${dayIndex}-${blockIndex}-${speakerIndex}`} className="mb-2">
                            <Form.Label>Должность</Form.Label>
                            <Form.Control
                              type="text"
                              placeholder="Должность спикера"
                              value={speaker.position || ''}
                              onChange={e => {
                                const newSchedule = [...editSchedule];
                                if (newSchedule[dayIndex].blocks[blockIndex].speakers) {
                                  newSchedule[dayIndex].blocks[blockIndex].speakers![speakerIndex].position = e.currentTarget.value;
                                  setEditSchedule(newSchedule);
                                }
                              }}
                            />
                          </Form.Group>
                          <Form.Group controlId={`createSpeakerPhotoFile${dayIndex}-${blockIndex}-${speakerIndex}`} className="mb-2">
                            <ImageUploadInput
                              id={`editSpeakerPhotoFile${dayIndex}-${blockIndex}-${speakerIndex}`}
                              label={<>Фото спикера</>}
                              value={speaker.imageUploadValue || { mode: 'file', file: null, url: speaker.photoUrl || '' }}
                              onChange={(val) => {
                                const newSchedule = [...editSchedule];
                                if (newSchedule[dayIndex].blocks[blockIndex].speakers) {
                                  newSchedule[dayIndex].blocks[blockIndex].speakers![speakerIndex].imageUploadValue = val;
                                  if (val.mode === 'url') {
                                    newSchedule[dayIndex].blocks[blockIndex].speakers![speakerIndex].photoUrl = val.url;
                                  } else if (val.mode === 'file') {
                                    if (val.file) {
                                      newSchedule[dayIndex].blocks[blockIndex].speakers![speakerIndex].photoUrl = '';
                                    }
                                  }
                                  setEditSchedule(newSchedule);
                                }
                              }}
                            />
                          </Form.Group>

                        </div>
                      ))}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          const newSchedule = [...editSchedule]
                          if (!newSchedule[dayIndex].blocks[blockIndex].speakers) {
                            newSchedule[dayIndex].blocks[blockIndex].speakers = []
                          }
                          newSchedule[dayIndex].blocks[blockIndex].speakers!.push({
                            name: '',
                            photoUrl: '',
                            imageUploadValue: { mode: 'file', file: null, url: '' }
                          })
                          setEditSchedule(newSchedule)
                        }}
                        className="mt-2"
                      >
                        <i className="bi bi-plus-lg" />
                        Добавить спикера
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      const newSchedule = [...editSchedule]
                      newSchedule[dayIndex].blocks.push({
                        timeStart: '',
                        timeEnd: '',
                        title: '',
                        description: '',
                        location: '',
                        moderators: [],
                        speakers: []
                      })
                      setEditSchedule(newSchedule)
                    }}
                  >
                    + Добавить блок времени
                  </Button>
                </div>
              ))}

              <Button
                variant="outline-primary"
                className="d-inline-flex align-items-center gap-2"
                size="sm"
                onClick={() => setEditSchedule([...editSchedule, { date: '', blocks: [] }])}
              >
                <i className="bi bi-plus-lg" />
                Добавить день
              </Button>
            </div>
            <hr className="my-1" />
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <p className="mb-0" style={{ textTransform: 'uppercase', fontWeight: '500' }}>Часто задаваемые вопросы (FAQ)</p>
                  <p className="text-muted small mb-0">Добавьте вопросы и ответы для события</p>
                </div>
                <Button
                  variant="outline-primary"
                  className="d-inline-flex align-items-center gap-2"
                  size="sm"
                  onClick={() => setEditFaq([...editFaq, { question: '', answer: '' }])}
                >
                  <i className="bi bi-plus-lg" />
                  Добавить вопрос
                </Button>
              </div>
              {editFaq.map((item, index) => (
                <div key={index} className="border rounded p-3 mb-3 bg-light">
                  <Form.Group controlId={`editFaqQuestion${index}`} className="mb-2">
                    <Form.Label>Вопрос</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Когда начинается событие?"
                      value={item.question}
                      onChange={(e) => {
                        const newFaq = [...editFaq]
                        newFaq[index].question = e.currentTarget.value
                        setEditFaq(newFaq)
                      }}
                    />
                  </Form.Group>
                  <Form.Group controlId={`editFaqAnswer${index}`} className="mb-2">
                    <Form.Label>Ответ</Form.Label>
                    <Form.Control
                      as="textarea"
                      placeholder="Событие начинается в 10:00"
                      value={item.answer}
                      onChange={(e) => {
                        const newFaq = [...editFaq]
                        newFaq[index].answer = e.currentTarget.value
                        setEditFaq(newFaq)
                      }}
                    />
                  </Form.Group>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setEditFaq(editFaq.filter((_, i) => i !== index))}
                  >
                    <i className="bi bi-trash" /> Удалить
                  </Button>
                </div>
              ))}
            </div>
            <hr className="my-1" />
            <Form.Group controlId="editEventIsPublished">
              <Form.Label className="mb-2 mt-0">Статус публикации (Опубликовать / Черновик) <span className="text-danger">*</span></Form.Label>
              <Form.Check
                type="checkbox"
                label="Опубликовать событие"
                checked={editIsPublished}
                onChange={(e) => setEditIsPublished(e.target.checked)}
              />
            </Form.Group>
            {editFormError && (
              <Alert variant="danger" className="d-flex align-items-center gap-2">
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{editFormError}</span>
              </Alert>
            )}
            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="secondary" className="me-2"
                onClick={() => {
                  setEditModalOpened(false);
                  setEditingEvent(null);
                }}
              >
                Отмена
              </Button>
              <Button variant="primary" type="submit" disabled={isEditing}>
                {isEditing ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                Сохранить изменения
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Модальное окно удаления события */}
      <Modal
        show={deleteModalOpened}
        onHide={() => setDeleteModalOpened(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Удалить событие</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Вы уверены, что хотите удалить событие "{deletingEvent?.title}"? Это действие необратимо.
          {error && (
            <Alert variant="danger" className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{error}</span>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModalOpened(false)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={handleDeleteEvent} disabled={isDeleting}>
            {isDeleting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}


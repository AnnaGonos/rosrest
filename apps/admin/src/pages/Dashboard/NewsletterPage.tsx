import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Modal, Nav } from 'react-bootstrap'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { getFileUrl } from '../../utils/getFileUrl'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'

interface QueueItem {
    id: number
    newsId: string
    note?: string
    isSent: boolean
    sentAt?: string
    addedAt: string
    news?: { previewImage?: string; lastIncludedInNewsletterAt?: string; page?: { title?: string; isDraft?: boolean } }
}

export default function NewsletterPage() {
    const [items, setItems] = useState<QueueItem[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
    const [showConfirm, setShowConfirm] = useState(false)
    const [selectedSendSchedule, setSelectedSendSchedule] = useState<Date | null>(null)
    const [activeTab, setActiveTab] = useState<'queue'|'archive'|'subscribers'>('queue')
    const [archive, setArchive] = useState<any[] | null>(null)
    const [subscribers, setSubscribers] = useState<any[] | null>(null)
    const [subsLoading, setSubsLoading] = useState(false)
    const [newsCache, setNewsCache] = useState<Record<string, any>>({})

    const load = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('admin_token')
            const res = await fetch(API_ENDPOINTS.NEWSLETTER.list, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            if (!res.ok) throw new Error('Не удалось загрузить очередь')
            const data = await res.json()
            setItems(Array.isArray(data) ? data : [])
        } catch (err: any) {
            setError(err?.message || 'Ошибка')
        } finally {
            setLoading(false)
        }
    }

    const loadSubscriberCount = async () => {
        try {
            const token = localStorage.getItem('admin_token')
            const res = await fetch(API_ENDPOINTS.SUBSCRIPTIONS.count, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            if (!res.ok) throw new Error('Не удалось загрузить количество подписчиков')
            const data = await res.json()
            if (data && typeof data.count === 'number') setSubscriberCount(data.count)
        } catch (err: any) {
            // silently ignore - show nothing
            console.warn('Failed to load subscriber count', err?.message || err)
        }
    }

    useEffect(() => {
        load()
        loadSubscriberCount()
        if (activeTab === 'archive') loadArchive()
        if (activeTab === 'subscribers') loadSubscribers()
        const onQueueChanged = () => load()
        window.addEventListener('newsletter:queue:changed', onQueueChanged)
        return () => window.removeEventListener('newsletter:queue:changed', onQueueChanged)
    }, [activeTab])

    const loadArchive = async () => {
        try {
            const token = localStorage.getItem('admin_token')
            const res = await fetch(API_ENDPOINTS.NEWSLETTER.archive, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            if (!res.ok) throw new Error('Не удалось загрузить архив')
            const data = await res.json()
            if (data && Array.isArray(data.data)) setArchive(data.data)
            else setArchive([])
            // prefetch news details for archive items missing preview
            if (data && Array.isArray(data.data)) {
                for (const entry of data.data) {
                    if (!entry.items) continue
                    for (const it of entry.items) {
                        const key = it.newsId || it.id || it.slug
                        const hasPreview = it.previewImage || it.preview || it.image
                        if (!hasPreview && key) ensureNewsData(key)
                    }
                }
            }
        } catch (err) {
            console.warn('Failed to load archive', err)
            setArchive([])
        }
    }

    const ensureNewsData = async (key: string | number) => {
        const k = String(key)
        if (newsCache[k]) return
        try {
            const token = localStorage.getItem('admin_token')
            const res = await fetch(API_ENDPOINTS.NEWS.get(k), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            if (!res.ok) return
            const data = await res.json()
            if (data) setNewsCache(prev => ({ ...prev, [k]: data }))
        } catch (err) {
            // ignore
        }
    }

    const loadSubscribers = async () => {
        setSubsLoading(true)
        try {
            const token = localStorage.getItem('admin_token')
            const res = await fetch(API_ENDPOINTS.SUBSCRIPTIONS.list, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            if (!res.ok) throw new Error('Не удалось загрузить подписчиков')
            const data = await res.json()
            setSubscribers(Array.isArray(data.data) ? data.data : [])
        } catch (err) {
            console.warn('Failed to load subscribers', err)
            setSubscribers([])
        } finally {
            setSubsLoading(false)
        }
    }

    const toggleSubscriberActive = async (sub: any) => {
        try {
            const token = localStorage.getItem('admin_token')
            if (sub.isActive) {
                // block -> call unsubscribe
                const res = await fetch(API_ENDPOINTS.SUBSCRIPTIONS.unsubscribe, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ email: sub.email }),
                })
                if (!res.ok) throw new Error('Не удалось заблокировать подписчика')
            } else {
                // reactivate -> call subscribe
                const res = await fetch(API_ENDPOINTS.SUBSCRIPTIONS.subscribe, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ email: sub.email }),
                })
                if (!res.ok) throw new Error('Не удалось восстановить подписчика')
            }

            await loadSubscribers()
            await loadSubscriberCount()
        } catch (err: any) {
            setError(err?.message || 'Ошибка при изменении статуса')
        }
    }

    const deleteSubscriber = async (id: number) => {
        if (!confirm('Удалить подписчика?')) return
        try {
            const token = localStorage.getItem('admin_token')
            const res = await fetch(API_ENDPOINTS.SUBSCRIPTIONS.delete(id), { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
            if (!res.ok) throw new Error('Не удалось удалить подписчика')
            await loadSubscribers()
            await loadSubscriberCount()
        } catch (err: any) {
            setError(err?.message || 'Ошибка при удалении')
        }
    }

    const handleSend = async (ids?: number[], scheduledAt?: Date | null) => {
        setLoading(true)
        try {
            const token = localStorage.getItem('admin_token')
            const body: any = { ids }
            if (scheduledAt) body.scheduledAt = scheduledAt.toISOString()
            const res = await fetch(API_ENDPOINTS.NEWSLETTER.send, {
                method: 'POST',
                headers: token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) throw new Error('Ошибка отправки')
            await load()
        } catch (err: any) {
            setError(err?.message || 'Ошибка при отправке')
        } finally { setLoading(false) }
    }

    const handleDelete = async (id: number) => {
        try {
            const token = localStorage.getItem('admin_token')
            const res = await fetch(API_ENDPOINTS.NEWSLETTER.delete(id), { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
            if (!res.ok) throw new Error('Не удалось удалить')
            setItems(items.filter(i => i.id !== id))
        } catch (err: any) { setError(err?.message || 'Ошибка') }
    }

    const renderContent = () => {
        if (activeTab === 'queue') {
            if (loading) {
                return (
                    <div className="text-center py-5">
                        <Spinner animation="border" role="status" className="mb-3">
                            <span className="visually-hidden">Загрузка...</span>
                        </Spinner>
                        <p>Загрузка очереди...</p>
                    </div>
                )
            }

            if (items.length === 0) {
                return <div className="text-center py-5 text-muted">Нет элементов в очереди</div>
            }

            return (
                <div className="list-group">
                    {items.map(it => (
                        <Card key={it.id} className="mb-3 shadow-sm">
                            <div className="d-flex align-items-start p-2">
                                <div style={{ width: 120, height: 80, flex: '0 0 120px', overflow: 'hidden', borderRadius: 6, background: '#f0f0f0' }}>
                                    {it.news?.previewImage ? (
                                        <img src={getFileUrl(it.news.previewImage)} alt={it.news?.page?.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                            Нет превью
                                        </div>
                                    )}
                                </div>

                                <div style={{ flex: 1, paddingLeft: 12 }}>
                                    <div className="d-flex align-items-start">
                                        <div style={{ flex: 1 }}>
                                            <h5 className="mb-1 d-flex flex-column" style={{ marginBottom: 6, gap: '10px' }}>
                                                <span style={{ marginRight: 8 }}>{it.news?.page?.title || ''}</span>
                                                <div>
                                                    {typeof it.news?.page?.isDraft !== 'undefined' && (
                                                        <Badge bg={it.news.page.isDraft ? 'secondary' : 'success'}>
                                                            {it.news.page.isDraft ? 'Черновик' : 'Опубликовано'}
                                                        </Badge>
                                                    )}
                                                </div>

                                            </h5>
                                            <div className="text-muted small" style={{ maxHeight: 40, overflow: 'hidden' }}>{it.note || ''}</div>
                                        </div>
                                        <div style={{ marginLeft: 12, textAlign: 'right' }}>
                                            <div className="mb-2"><small className="text-muted">{it.isSent ? `Отправлено` : 'Ожидает'}</small></div>
                                            <div>
                                                <Button size="sm" variant="danger" onClick={() => handleDelete(it.id)}>Удалить</Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-muted mt-2"><small>Добавлено: {new Date(it.addedAt).toLocaleString('ru-RU')}</small></div>
                                    {it.news?.lastIncludedInNewsletterAt && (
                                        <div className="text-muted mt-1"><small>Последняя в рассылке: {new Date(it.news.lastIncludedInNewsletterAt).toLocaleString('ru-RU')}</small></div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )
        }

        if (activeTab === 'subscribers') {
            if (subsLoading) return <div className="text-center py-5"><Spinner /></div>
            if (!subscribers || subscribers.length === 0) return <div className="text-center py-5 text-muted">Нет подписчиков</div>

            return (
                <div className="list-group">
                    {subscribers.map((s: any) => (
                        <Card key={s.id} className="mb-2">
                            <Card.Body className="d-flex justify-content-between align-items-center">
                                <div>
                                    <div><strong>{s.name || '—'}</strong> <small className="text-muted">{s.email}</small></div>
                                    <div className="text-muted small">Статус: {s.isActive ? 'Активен' : 'Заблокирован'}</div>
                                </div>
                                <div className="d-flex gap-2">
                                    <Button size="sm" variant={s.isActive ? 'warning' : 'success'} onClick={() => toggleSubscriberActive(s)}>{s.isActive ? 'Блокировать' : 'Восстановить'}</Button>
                                    <Button size="sm" variant="danger" onClick={() => deleteSubscriber(s.id)}>Удалить</Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )
        }

        // archive view
        if (archive === null) {
            return <div className="text-center py-5"><Spinner /></div>
        }

        if (archive.length === 0) {
            return <div className="text-center py-5 text-muted">Архив пуст</div>
        }

        const siteBase = import.meta.env.VITE_SITE_URL || 'http://rosrest.com'

        return (
            <div className="list-group">
                {archive.map((entry: any, idx: number) => (
                    <Card key={idx} className="mb-3">
                        <Card.Body>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <strong>Отправлено:</strong> {new Date(entry.sentAt).toLocaleString('ru-RU')}
                                </div>
                                <div>
                                    <Badge bg="primary">{entry.count} новостей</Badge>
                                </div>
                            </div>

                            <div>
                                {entry.items.map((it: any) => {
                                    const key = it.newsId || it.id || it.slug
                                    const cached = newsCache[String(key)]
                                    const title = it.title || (cached && (cached.title || cached.name)) || it.slug || it.newsId
                                    const slug = it.slug || it.id || (cached && cached.slug)
                                    const preview = it.previewImage || it.preview || it.image || (cached && (cached.previewImage || cached.preview || cached.image || cached.photo))
                                    const date = it.publishedAt || it.published_at || it.date || it.createdAt || it.addedAt || (cached && (cached.publishedAt || cached.published_at || cached.date || cached.createdAt))

                                    const makePreviewUrl = (p: any) => {
                                        if (!p) return null
                                        if (typeof p !== 'string') return null
                                        if (p.startsWith('http') || p.startsWith('//')) return p
                                        return getFileUrl(p)
                                    }

                                    const previewUrl = makePreviewUrl(preview)

                                    // placeholder image removed; show text fallback when no preview available

                                    const newsUrl = `${siteBase.replace(/\/$/, '')}/news/${slug}`

                                    return (
                                        <Card key={it.id || slug} className="mb-2">
                                            <div className="d-flex align-items-start p-2">
                                                <div style={{ width: 120, height: 80, flex: '0 0 120px', overflow: 'hidden', borderRadius: 6, background: '#f0f0f0' }}>
                                                    {previewUrl ? (
                                                        <img src={previewUrl} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                                            Нет превью
                                                        </div>
                                                    )}
                                                </div>

                                                <div style={{ flex: 1, paddingLeft: 12 }}>
                                                    <div className="d-flex align-items-start">
                                                        <div style={{ flex: 1 }}>
                                                            <a href={newsUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                                                                <h6 className="mb-1 d-flex flex-column" style={{ marginBottom: 6, gap: '6px' }}>{title}</h6>
                                                            </a>
                                                            {date && <div className="text-muted small">{new Date(date).toLocaleDateString('ru-RU')}</div>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <DashboardLayout title="Рассылка">
            <Container fluid className="py-4">
                <Row className="mb-4">
                    <Col>
                        <h1 className="mb-1">Рассылка</h1>
                        <p className="text-muted">Управление очередью рассылки новостей</p>
                        <div className="mt-2">
                            <small className="text-muted">Подписчиков: </small>
                            <strong style={{ color: '#1D407C', marginLeft: 6 }}>{subscriberCount ?? '—'}</strong>
                        </div>
                    </Col>
                    <Col xs="auto" className="d-flex gap-2">
                        <Button variant="primary" size="lg" onClick={() => setShowConfirm(true)} disabled={loading || items.length === 0} style={{ height: 'fit-content' }}>
                            Отправить рассылку писем подписчикам
                        </Button>
                    </Col>
                </Row>

                {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible>
                        {error}
                    </Alert>
                )}

                <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => {
                    const key = k as 'queue' | 'archive' | 'subscribers'
                    setActiveTab(key)
                    if (key === 'archive') loadArchive()
                    if (key === 'subscribers') loadSubscribers()
                }}>
                    <Nav.Item>
                        <Nav.Link eventKey="queue">Очередь</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="archive">Архив рассылок</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="subscribers">Подписчики</Nav.Link>
                    </Nav.Item>
                </Nav>

                    <Card>
                    <Card.Body>
                        {renderContent()}
                    </Card.Body>
                </Card>
                <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Подтвердите отправку рассылки</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>Вы собираетесь отправить всем подписчикам письма из очереди.</p>
                        <div className="mt-2 mb-2">
                            <small className="text-muted">Вы можете указать дату и время отправки. Если не указано — отправка начнётся немедленно.</small>
                        </div>
                        <div className="d-flex justify-content-center">
                            <div style={{ minWidth: 260 }}>
                                <DatePicker
                                    selected={selectedSendSchedule}
                                    onChange={(d: Date | null) => setSelectedSendSchedule(d)}
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={5}
                                    dateFormat="dd.MM.yyyy HH:mm"
                                    timeCaption="Время"
                                    className="form-control"
                                    placeholderText="Не указывать — отправить сейчас"
                                    isClearable
                                    minDate={new Date()}
                                />
                                {selectedSendSchedule && selectedSendSchedule < new Date() && (
                                    <div className="text-danger small mt-1">Нельзя выбрать прошедшее время</div>
                                )}
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowConfirm(false)}>Отмена</Button>
                        <Button variant="danger" onClick={async () => { setShowConfirm(false); await handleSend(undefined, selectedSendSchedule); setSelectedSendSchedule(null); }} disabled={loading || (selectedSendSchedule !== null && selectedSendSchedule < new Date())}>
                            {loading ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" />&nbsp;Отправка...
                                </>
                            ) : (
                                'Отправить рассылку'
                            )}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </DashboardLayout>
    )
}

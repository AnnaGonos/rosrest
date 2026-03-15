import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Modal } from 'react-bootstrap'
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
    const [showConfirm, setShowConfirm] = useState(false)
    const [selectedSendSchedule, setSelectedSendSchedule] = useState<Date | null>(null)

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

    useEffect(() => {
        load()
        const onQueueChanged = () => load()
        window.addEventListener('newsletter:queue:changed', onQueueChanged)
        return () => window.removeEventListener('newsletter:queue:changed', onQueueChanged)
    }, [])

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

    return (
        <DashboardLayout title="Рассылка">
            <Container fluid className="py-4">
                <Row className="mb-4">
                    <Col>
                        <h1 className="mb-1">Рассылка</h1>
                        <p className="text-muted">Управление очередью рассылки новостей</p>
                    </Col>
                    <Col xs="auto" className="d-flex gap-2">
                        <Button variant="primary" size="lg" onClick={() => setShowConfirm(true)} disabled={loading || items.length === 0}>
                            Отправить рассылку писем подписчикам
                        </Button>
                    </Col>
                </Row>

                {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible>
                        {error}
                    </Alert>
                )}

                <Card>
                    <Card.Body>
                        {loading ? (
                            <div className="text-center py-5">
                                <Spinner animation="border" role="status" className="mb-3">
                                    <span className="visually-hidden">Загрузка...</span>
                                </Spinner>
                                <p>Загрузка очереди...</p>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-5 text-muted">Нет элементов в очереди</div>
                        ) : (
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
                        )}
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

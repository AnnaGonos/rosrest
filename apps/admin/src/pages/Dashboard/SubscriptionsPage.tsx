import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Button, Table, Alert, Spinner, Modal } from 'react-bootstrap'
import { IconTrash, IconSend, IconAlertCircle, IconEye } from '@tabler/icons-react'
import 'bootstrap/dist/css/bootstrap.min.css'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'

interface NewsSubscription {
  id: number
  email: string
  isActive: boolean
  createdAt: string
  lastDigestSentAt?: string
}

export default function SubscriptionsPage() {
  const navigate = useNavigate()
  const [subscriptions, setSubscriptions] = useState<NewsSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sendingDigest, setSendingDigest] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [confirmDeleteModal, setConfirmDeleteModal] = useState(false)
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<NewsSubscription | null>(null)

  const [confirmDigestModal, setConfirmDigestModal] = useState(false)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(API_ENDPOINTS.SUBSCRIPTIONS.list)
      if (!response.ok) throw new Error('Ошибка загрузки подписчиков')

      const data = await response.json()
      setSubscriptions(data.data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при загрузке'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSubscription = async (subscription: NewsSubscription) => {
    setSubscriptionToDelete(subscription)
    setConfirmDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!subscriptionToDelete) return

    setDeletingId(subscriptionToDelete.id)
    try {
      const response = await fetch(API_ENDPOINTS.SUBSCRIPTIONS.delete(subscriptionToDelete.id), {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Ошибка удаления подписчика')

      setSubscriptions(subscriptions.filter(s => s.id !== subscriptionToDelete.id))
      setSuccess(`Подписчик ${subscriptionToDelete.email} удален`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при удалении'
      setError(message)
    } finally {
      setDeletingId(null)
      setConfirmDeleteModal(false)
      setSubscriptionToDelete(null)
    }
  }

  const handleSendDigest = async () => {
    setSendingDigest(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(API_ENDPOINTS.DIGEST.send, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Ошибка при отправке дайджеста')

      const data = await response.json()
      setSuccess(
        `✓ Дайджест успешно отправлен ${data.subscriberCount} подписчикам (${data.newsCount} новостей)`
      )
      
      fetchSubscriptions()
      
      setTimeout(() => setSuccess(null), 7000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при отправке'
      setError(message)
    } finally {
      setSendingDigest(false)
      setConfirmDigestModal(false)
    }
  }

  const handlePreviewTemplate = (type: 'welcome' | 'digest') => {
    navigate(`/template-preview?type=${type}`)
  }

  const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <DashboardLayout title="Управление подписками">
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <h1 className="mb-1">Подписки на новости</h1>
            <p className="text-muted">
              Управление подписчиками на рассылку дайджеста новостей
            </p>
          </Col>
          <Col xs="auto" className="d-flex gap-2">
            <Button
              variant="outline-secondary"
              size="lg"
              onClick={() => handlePreviewTemplate('welcome')}
              className="gap-2 d-flex align-items-center"
              title="Посмотреть шаблон приветственного письма"
            >
              <IconEye size={20} />
              Приветствие
            </Button>
            <Button
              variant="outline-secondary"
              size="lg"
              onClick={() => handlePreviewTemplate('digest')}
              className="gap-2 d-flex align-items-center"
              title="Посмотреть шаблон дайджеста"
            >
              <IconEye size={20} />
              Дайджест
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setConfirmDigestModal(true)}
              disabled={sendingDigest || subscriptions.length === 0}
              className="gap-2 d-flex align-items-center"
            >
              <IconSend size={20} />
              {sendingDigest ? 'Отправка...' : 'Отправить дайджест'}
            </Button>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            <Alert.Heading className="d-flex align-items-center gap-2">
              <IconAlertCircle size={20} />
              Ошибка
            </Alert.Heading>
            <p>{error}</p>
          </Alert>
        )}

        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}

        <Card>
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" role="status" className="mb-3">
                  <span className="visually-hidden">Загрузка...</span>
                </Spinner>
                <p>Загрузка подписчиков...</p>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <p>Нет подписчиков</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover borderless className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40%' }}>Email</th>
                      <th style={{ width: '20%' }}>Статус</th>
                      <th style={{ width: '20%' }}>Подписан</th>
                      <th style={{ width: '20%' }}>Последний дайджест</th>
                      <th style={{ width: '5%' }} className="text-center">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id}>
                        <td className="align-middle">
                          <code style={{ wordBreak: 'break-all' }}>{subscription.email}</code>
                        </td>
                        <td className="align-middle">
                          {subscription.isActive ? (
                            <span className="badge bg-success">Активна</span>
                          ) : (
                            <span className="badge bg-secondary">Неактивна</span>
                          )}
                        </td>
                        <td className="align-middle text-muted small">
                          {formatDate(subscription.createdAt)}
                        </td>
                        <td className="align-middle text-muted small">
                          {formatDate(subscription.lastDigestSentAt)}
                        </td>
                        <td className="align-middle text-center">
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteSubscription(subscription)}
                            disabled={deletingId === subscription.id}
                            className="gap-1 d-flex align-items-center"
                            style={{ padding: '0.35rem 0.5rem' }}
                          >
                            {deletingId === subscription.id ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              <IconTrash size={16} />
                            )}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
          {!loading && (
            <Card.Footer className="text-muted small">
              Всего подписчиков: <strong>{subscriptions.length}</strong> |
              Активных: <strong>{subscriptions.filter(s => s.isActive).length}</strong>
            </Card.Footer>
          )}
        </Card>
      </Container>

      <Modal show={confirmDigestModal} onHide={() => setConfirmDigestModal(false)} centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="d-flex align-items-center gap-2">
            <IconSend size={24} />
            Отправить дайджест
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Вы готовы отправить дайджест новостей{' '}
            <strong>{subscriptions.filter(s => s.isActive).length}</strong> активным подписчикам?
          </p>
          <p className="text-muted small mb-0">
            Дайджест будет содержать только опубликованные новости, добавленные после последней рассылки.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmDigestModal(false)}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleSendDigest} disabled={sendingDigest}>
            {sendingDigest ? 'Отправляем...' : 'Отправить'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={confirmDeleteModal} onHide={() => setConfirmDeleteModal(false)} centered>
        <Modal.Header closeButton className="border-bottom">
          <Modal.Title className="d-flex align-items-center gap-2">
            <IconAlertCircle size={24} className="text-danger" />
            Удалить подписчика
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Вы уверены, что хотите удалить подписчика?</p>
          {subscriptionToDelete && (
            <p className="text-break">
              <strong>{subscriptionToDelete.email}</strong>
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmDeleteModal(false)}>
            Отмена
          </Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deletingId !== null}>
            Удалить
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api'
import { Container, Table, Button, Modal, Form, Row, Col } from 'react-bootstrap'

interface CommentItem {
  id: number
  parentCommentId?: number | null
  commentableType: string
  commentableId: string
  authorName: string
  authorEmail: string
  content: string
  isVisible: boolean
  isModerated: boolean
  isFlagged: boolean
  createdAt: string
}

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<CommentItem | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyAuthorName, setReplyAuthorName] = useState('РАР')
  const [replyAuthorEmail, setReplyAuthorEmail] = useState('rosrest@list.ru')
  const [replyFormToken, setReplyFormToken] = useState<string | null>(null)
  const [replyFormTimestamp, setReplyFormTimestamp] = useState<number | null>(null)
  const [editingComment, setEditingComment] = useState<CommentItem | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [entityInfoMap, setEntityInfoMap] = useState<Record<string, Record<string, { title: string; slug: string; url: string }>>>({})

  const TYPE_LABELS: Record<string, string> = {
    'news': 'Новость',
    'monitoring-zakon': 'Мониторинг законодательства',
    'rar-member': 'Член РАР',
  }

  const fetchComments = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('admin_token')
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`${API_BASE_URL}/comments`, { headers })
      if (!res.ok) throw new Error('Ошибка загрузки комментариев')
      const data = await res.json()
      const allComments = Array.isArray(data) ? data : []

      allComments.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setComments(allComments)

      fetchEntitiesInfo(allComments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const fetchEntitiesInfo = async (allComments: any[]) => {
    const token = localStorage.getItem('admin_token')
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    const toFetch: Array<Promise<void>> = []
    const map: Record<string, Record<string, { title: string; slug: string; url: string }>> = {}

    const unique = allComments.reduce((acc: Record<string, Set<string>>, c: any) => {
      acc[c.commentableType] = acc[c.commentableType] || new Set()
      acc[c.commentableType].add(c.commentableId)
      return acc
    }, {})

    const SITE_BASE = (import.meta as any).env.VITE_SITE_URL || 'https://rosrest.com'

    for (const type of Object.keys(unique)) {
      map[type] = {}
      for (const id of Array.from(unique[type])) {
        toFetch.push((async () => {
          try {
            let url = ''
            let title = id
            let slug = id
            if (type === 'news') {
              const res = await fetch(API_ENDPOINTS.NEWS.get(id), { headers })
              if (res.ok) {
                const data = await res.json()
                title = data?.page?.title || data?.title || title
                slug = data?.page?.slug || data?.slug || id
                if (typeof slug === 'string' && slug.includes('/')) slug = slug.split('/').pop() || ''
                url = `${SITE_BASE}/news/${slug}`
              }
            } else if (type === 'monitoring-zakon') {
              let data: any = null
              try {
                const listRes = await fetch(`${API_ENDPOINTS.MONITORING_ZAKON.list}?pageSize=1000`, { headers })
                if (listRes.ok) {
                  const listData = await listRes.json()
                  const found = Array.isArray(listData?.items) ? listData.items.find((it: any) => String(it.id) === String(id)) : null
                  if (found) data = found
                }
              } catch (e) {
              }

              if (!data) {
                try {
                  const slugRes = await fetch(`${API_BASE_URL}/monitoring-zakon/slug/${id}`, { headers })
                  if (slugRes.ok) data = await slugRes.json()
                } catch (e) {

                }
              }

              if (!data) {
                try {
                  const idRes = await fetch(API_ENDPOINTS.MONITORING_ZAKON.get(id), { headers })
                  if (idRes.ok) data = await idRes.json()
                } catch (e) {
                }
              }

              if (data) {
                title = data?.page?.title || data?.title || title
                slug = data?.page?.slug || data?.slug || id
                if (typeof slug === 'string' && slug.includes('/')) slug = slug.split('/').pop() || ''
                url = `${SITE_BASE}/monitoring-zakon/${slug}`
              }
            } else if (type === 'rar-member') {
              const res = await fetch(API_ENDPOINTS.RAR_MEMBERS.get(id), { headers })
              if (res.ok) {
                const data = await res.json()
                title = data?.page?.title || data?.title || title
                slug = data?.page?.slug || data?.slug || id
                if (typeof slug === 'string' && slug.includes('/')) slug = slug.split('/').pop() || ''

                url = `${SITE_BASE}/portfolio/${slug}`
              }
            }
            map[type][id] = { title, slug, url }
          } catch (e) {
          }
        })())
      }
    }

    await Promise.all(toFetch)
    setEntityInfoMap(prev => ({ ...prev, ...map }))
  }

  useEffect(() => {
    fetchComments()
  }, [])

  const handleDelete = async (id: number) => {
    setDeleteTargetId(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${API_BASE_URL}/comments/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Ошибка при удалении')
      setShowDeleteModal(false)
      setDeleteTargetId(null)
      await fetchComments()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setDeleteTargetId(null)
  }

  const handleMarkReviewed = async (id: number) => {
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${API_BASE_URL}/comments/${id}/show`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Ошибка при пометке')
      await fetchComments()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const openReply = (c: CommentItem) => {
    setSelected(c)
    setReplyingTo(c.id)
    setReplyText(`${c.authorName},`)
    setReplyAuthorEmail('rosrest@list.ru');
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/comments/form-token`)
        if (res.ok) {
          const td = await res.json()
          setReplyFormToken(td?.token || String(Date.now()))
        } else {
          setReplyFormToken(String(Date.now()))
        }
      } catch (e) {
        setReplyFormToken(String(Date.now()))
      }
      setReplyFormTimestamp(Date.now() - 5000)
      setReplyAuthorName('rosrest@list.ru')
    })()
  }

  const sendReply = async () => {
    if (!selected) return
    if (!replyText || replyText.trim().length < 10) {
      alert('Текст ответа должен содержать минимум 10 символов')
      return
    }
    try {
      const token = localStorage.getItem('admin_token')
      const payload = {
        commentableType: selected.commentableType,
        commentableId: selected.commentableId,
        parentCommentId: selected.id,
        authorName: replyAuthorEmail && replyAuthorEmail.trim().length > 0 ? replyAuthorEmail.trim() : (replyAuthorName && replyAuthorName.trim().length > 0 ? replyAuthorName.trim() : 'РАР'),
        authorEmail: replyAuthorEmail && replyAuthorEmail.trim().length > 0 ? replyAuthorEmail.trim() : 'rosrest@list.ru',
        content: replyText,
        website: '',
        formToken: replyFormToken || String(Date.now()),
        formTimestamp: replyFormTimestamp || (Date.now() - 5000),
      }
      const res = await fetch(`${API_BASE_URL}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Ошибка отправки ответа')
      setReplyText('')
      setReplyAuthorName('')
      setReplyAuthorEmail('rosrest@list.ru')
      setSelected(null)
      setReplyingTo(null)
      
      try {
        if (selected && selected.id) {
          await handleMarkReviewed(selected.id)
        } else {
          await fetchComments()
        }
      } catch (e) {
        await fetchComments()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const openEdit = (c: CommentItem) => {
    setEditingComment(c)
  }

  const saveEdit = async () => {
    if (!editingComment) return
    try {
      const token = localStorage.getItem('admin_token')
      const payload = { content: editingComment.content, authorName: editingComment.authorName, authorEmail: editingComment.authorEmail }
      const res = await fetch(`${API_BASE_URL}/comments/${editingComment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Ошибка при сохранении')
      setEditingComment(null)
      await fetchComments()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    }
  }


  return (
    <DashboardLayout title="Комментарии">
      <Container fluid>
        <h3>Новые комментарии</h3>
        {error && <div className="text-danger">{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <Button onClick={fetchComments} disabled={loading}>{loading ? 'Загрузка...' : 'Обновить'}</Button>
        </div>

        <Table bordered hover size="sm">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th style={{ width: 150 }}>Автор / Время</th>
              <th>Комментарий</th>
              <th style={{ width: 300 }}>В ответ на</th>
              <th style={{ width: 260 }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {comments.map(c => (
              <tr key={c.id} style={{ backgroundColor: c.isModerated ? undefined : '#fffef0' }}>
                <td>
                  {!c.isModerated ? <i className="bi bi-exclamation-circle-fill text-danger" title="Непрочитанный" /> : ''}
                </td>
                <td>
                  {c.authorName && c.authorEmail && c.authorName === c.authorEmail ? (
                    <div style={{ fontWeight: 600 }}>{c.authorEmail}</div>
                  ) : (
                    <>
                      <div style={{ fontWeight: 600 }}>{c.authorName}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{c.authorEmail}</div>
                    </>
                  )}
                  <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{new Date(c.createdAt).toLocaleString('ru-RU')}</div>
                </td>
                <td>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{c.content}</div>
                  {c.parentCommentId ? (
                    (() => {
                      const parent = comments.find(p => p.id === c.parentCommentId)
                      return parent ? (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                          В ответ на комментарий <a href="#" onClick={(e) => { e.preventDefault(); setSelected(parent); }}>{`#${parent.id} — ${parent.authorName}`}</a>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>В ответ на комментарий #{c.parentCommentId}</div>
                      )
                    })()
                  ) : null}
                </td>
                <td>
                  {entityInfoMap[c.commentableType] && entityInfoMap[c.commentableType][c.commentableId] ? (
                    <>
                      <a href={entityInfoMap[c.commentableType][c.commentableId].url} target="_blank" rel="noreferrer">
                        {entityInfoMap[c.commentableType][c.commentableId].title}
                      </a>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                        {TYPE_LABELS[c.commentableType] || c.commentableType}
                      </div>
                    </>
                  ) : (
                    <div>
                      <div>{c.commentableType} / {c.commentableId}</div>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{TYPE_LABELS[c.commentableType] || c.commentableType}</div>
                    </div>
                  )}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="outline-success" onClick={() => openReply(c)}>Ответить</Button>
                    <Button size="sm" variant="outline-warning" onClick={() => handleMarkReviewed(c.id)}>Отметить</Button>
                    <Button size="sm" variant="outline-secondary" onClick={() => openEdit(c)}>Изменить</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => handleDelete(c.id)}>Удалить</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Modal show={!!selected} onHide={() => setSelected(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Комментарий #{selected?.id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ marginBottom: 8 }}><strong>Автор:</strong> {selected?.authorName} &lt;{selected?.authorEmail}&gt;</div>
            <div style={{ marginBottom: 8 }}><strong>Текст:</strong></div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{selected?.content}</div>

            {replyingTo && selected && (
              <div style={{ marginTop: '40px' }}>
                <Row className="mb-2">
                  <Col md={12}>
                    <Form.Control placeholder="Email" value={replyAuthorEmail} onChange={(e) => { setReplyAuthorEmail(e.target.value); setReplyAuthorName(e.target.value); }} />
                  </Col>
                </Row>
                <div style={{ fontSize: 12, color: '#333', marginBottom: 8 }}>
                  Отправитель: {replyAuthorName && replyAuthorEmail && replyAuthorName === replyAuthorEmail ? (
                    <>{replyAuthorEmail}</>
                  ) : (
                    <>{replyAuthorName} &lt;{replyAuthorEmail}&gt;</>
                  )}
                </div>
                <Form.Control as="textarea" rows={4} value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                <div className="d-flex gap-2 mt-2">
                  <Button onClick={sendReply}>Отправить ответ</Button>
                  <Button variant="secondary" onClick={() => { setReplyingTo(null); setSelected(null); }}>Отмена</Button>
                </div>
              </div>
            )}
          </Modal.Body>
        </Modal>

        <Modal show={showDeleteModal} onHide={cancelDelete} centered>
          <Modal.Header closeButton>
            <Modal.Title>Удалить комментарий</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Вы уверены, что хотите безвозвратно удалить этот комментарий?</p>
            <div style={{ whiteSpace: 'pre-wrap', background: '#f8f9fa', padding: 8, borderRadius: 4 }}>
              {comments.find(c => c.id === deleteTargetId)?.content}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelDelete} disabled={deleting}>Отмена</Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleting}>{deleting ? 'Удаление...' : 'Удалить'}</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={!!editingComment} onHide={() => setEditingComment(null)}>
          <Modal.Header closeButton>
            <Modal.Title>Редактировать комментарий #{editingComment?.id}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Автор</Form.Label>
              <Form.Control value={editingComment?.authorName || ''} onChange={(e) => setEditingComment(prev => prev ? { ...prev, authorName: e.target.value } : prev)} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control value={editingComment?.authorEmail || ''} onChange={(e) => setEditingComment(prev => prev ? { ...prev, authorEmail: e.target.value } : prev)} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Текст</Form.Label>
              <Form.Control as="textarea" rows={6} value={editingComment?.content || ''} onChange={(e) => setEditingComment(prev => prev ? { ...prev, content: e.target.value } : prev)} />
            </Form.Group>
            <div className="d-flex gap-2 mt-3">
              <Button onClick={saveEdit}>Сохранить</Button>
              <Button variant="secondary" onClick={() => setEditingComment(null)}>Отмена</Button>
            </div>
          </Modal.Body>
        </Modal>

      </Container>
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import {
  Container,
  Button,
  Table,
  Spinner,
  Alert,
  Modal,
  Form,
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import 'bootstrap-icons/font/bootstrap-icons.css'

type Category = {
  id: number
  name: string
  createdAt: string
  children?: any[]
  slug?: string | null
  icon?: string | null
}

const transliterate = (text: string): string => {
  const map: { [key: string]: string } = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  }

  return text
    .split('')
    .map(char => map[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const token = localStorage.getItem('admin_token')

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editModalOpened, setEditModalOpened] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [createModalOpened, setCreateModalOpened] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [suggestedSlug, setSuggestedSlug] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(API_ENDPOINTS.DOCUMENT_CATEGORIES_LIST, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []

      const sorted = list.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime()
        const dateB = new Date(b.createdAt || 0).getTime()
        return dateA - dateB
      })
      setCategories(sorted)
    } catch (err: any) {
      console.error('Load categories error:', err)
      setError(err.message || 'Ошибка загрузки категорий')
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (c: Category) => {
    setEditingCategory(c)
    setEditName(c.name)
    setEditSlug(c.slug || '')
    setEditIcon((c as any).icon || '')
    setFormError('')
    setEditModalOpened(true)
  }

  const openDelete = (c: Category) => {
    setDeletingCategory(c)
    setDeleteModalOpened(true)
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return
    try {
      setIsDeleting(true)
      const res = await fetch(API_ENDPOINTS.DOCUMENT_CATEGORIES_DELETE(deletingCategory.id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Ошибка удаления: ${res.status}`)
      setCategories(categories.filter((c) => c.id !== deletingCategory.id))
      setDeleteModalOpened(false)
      setDeletingCategory(null)
    } catch (err: any) {
      console.error('Delete category error:', err)
      setError(err.message || 'Ошибка при удалении категории')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingCategory) return
    if (!editName.trim()) {
      setFormError('Введите название категории')
      return
    }
    try {
      setIsSaving(true)
      
      const slugValue = (editSlug || '').trim()
      if (!slugValue) {
        setFormError('Введите slug категории')
        setIsSaving(false)
        return
      }
      if (!/^[a-z0-9-]+$/.test(slugValue)) {
        setFormError('Slug может содержать только строчные латинские буквы, цифры и дефисы')
        setIsSaving(false)
        return
      }

      const flatten = (nodes: Category[] = []): Category[] => nodes.reduce((acc: Category[], n) => acc.concat(n, n.children && n.children.length ? flatten(n.children) : []), [])
      const allCats = flatten(categories)
      const duplicate = allCats.find((c) => c.slug === slugValue && c.id !== editingCategory.id)
      if (duplicate) {
        setFormError(`Slug уже используется в категории "${duplicate.name}"`)
        setIsSaving(false)
        return
      }

      const payload = { name: editName.trim(), slug: slugValue, icon: editIcon || undefined }

      const res = await fetch(API_ENDPOINTS.DOCUMENT_CATEGORIES_UPDATE(editingCategory.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        throw new Error(`Ошибка обновления: ${res.status}`)
      }
      const updated = await res.json()
      setCategories(categories.map((c) => (c.id === updated.id ? updated : c)))
      setEditModalOpened(false)
      setEditingCategory(null)
    } catch (err: any) {
      console.error('Update category error:', err)
      setFormError(err.message || 'Ошибка при обновлении')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Основные категории документов">
        <Container className="py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
            <Spinner animation="border" role="status" />
          </div>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Основные категории документов">
      <Container className="py-4">
        <div className="d-flex flex-column gap-4">
          <div className="mb-4">
            <h1>Основные категории документов</h1>

            <p className="text-muted">
              Создайте основные категории для организации документов. Для корректной загрузки обратите внимание на советы по публикации.
            </p>

            <a href="https://disk.yandex.ru/d/jCh4-iRjmJ7b2Q"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-dark  d-flex align-items-center"
              style={{ width: 'fit-content', margin: '20px 0' }}
            >
              <i className="bi bi-info-lg me-2"></i>
              Советы по публикации
            </a>

            <Button
              variant="primary"
              onClick={() => setCreateModalOpened(true)}
              className="mt-3"
            >
              <i className="bi bi-plus-lg me-2" />
              Создать основную категорию
            </Button>
          </div>

          {error && (
            <Alert variant="danger" className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{error}</span>
            </Alert>
          )}

          <div className="bg-white border rounded p-3">
            <Table striped hover responsive size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Кол-во подкатегорий</th>
                  <th>Дата создания</th>
                  <th style={{ textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }}>
                    <td onClick={() => navigate(`/documents/${c.id}`)}>
                      {c.icon ? (
                        (c.icon.startsWith('http') || c.icon.startsWith('/')) ? (
                          <img src={c.icon} alt="icon" style={{ width: 25, height: 25, objectFit: 'contain', marginRight: 8 }} />
                        ) : (
                          c.icon.startsWith('bi ') ? (
                            <i className={c.icon} style={{ display: 'inline-block', width: 25, height: 25, fontSize: 20, lineHeight: '25px', textAlign: 'center', marginRight: 8 }} />
                          ) : c.icon.startsWith('bi-') ? (
                            <i className={`bi ${c.icon}`} style={{ display: 'inline-block', width: 25, height: 25, fontSize: 20, lineHeight: '25px', textAlign: 'center', marginRight: 8 }} />
                          ) : (
                            <i className={`bi bi-${c.icon.replace(/^bi-/, '')}`} style={{ display: 'inline-block', width: 25, height: 25, fontSize: 20, lineHeight: '25px', textAlign: 'center', marginRight: 8 }} />
                          )
                        )
                      ) : null}
                      {c.name}
                    </td>
                    <td onClick={() => navigate(`/documents/${c.id}`)}>{(c.children || []).length}</td>
                    <td onClick={() => navigate(`/documents/${c.id}`)}>{new Date(c.createdAt).toLocaleDateString('ru-RU')}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="d-flex justify-content-end gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => openEdit(c)}
                          title="Редактировать"
                        >
                          <i className="bi bi-pencil" />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDelete(c)}
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
          </div>

          {/* Edit Modal */}
          <Modal
            show={editModalOpened}
            onHide={() => setEditModalOpened(false)}
            centered
            dialogClassName="modal-content-md"
          >
            <Modal.Header closeButton>
              <Modal.Title>Редактировать категорию</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {formError && (
                <Alert variant="danger" className="d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill" />
                  <span>{formError}</span>
                </Alert>
              )}

              <Form>
                <Form.Group className="mb-3" controlId="editCategoryName">
                  <Form.Label>Название</Form.Label>
                  <Form.Control
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.currentTarget.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="editCategorySlug">
                  <Form.Label>Slug</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      placeholder="например: razjasneniya-gosorganov"
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.currentTarget.value)}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        if (editName.trim()) {
                          setEditSlug(transliterate(editName))
                        }
                      }}
                      disabled={!editName.trim() || isSaving}
                      title="Сгенерировать из названия"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="bi bi-magic me-1"></i>
                      Авто
                    </Button>
                  </div>
                </Form.Group>

                {editingCategory && (
                  <Form.Group className="mb-3" controlId="editCategoryIcon">
                    <Form.Label>Icon (bootstrap класс или URL)</Form.Label>
                    <Form.Control
                      type="text"
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.currentTarget.value)}
                    />
                  </Form.Group>
                )}
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setEditModalOpened(false)}
                disabled={isSaving}
              >
                Отмена
              </Button>
              <Button variant="primary" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving && (
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

          {/* Create Modal */}
          <Modal
            show={createModalOpened}
            onHide={() => setCreateModalOpened(false)}
            centered
            dialogClassName="modal-content-md"
          >
            <Modal.Header closeButton>
              <Modal.Title>Создать основную категорию</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {createError && (
                <Alert variant="danger" className="d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill" />
                  <span>{createError}</span>
                </Alert>
              )}

              <Form>
                <Form.Group className="mb-3" controlId="newCategoryName">
                  <Form.Label>Название <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Например: Аттестация"
                    value={newName}
                    onChange={(e) => {
                      const value = e.currentTarget.value
                      setNewName(value)
                      if (value.trim()) {
                        setSuggestedSlug(transliterate(value))
                      } else {
                        setSuggestedSlug('')
                      }
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-2" controlId="newCategorySlug">
                  <Form.Label>Slug (URL адрес)  <span className="text-danger">*</span></Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      placeholder="Например: attestation"
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.currentTarget.value)}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        if (newName.trim()) {
                          setNewSlug(transliterate(newName))
                        }
                      }}
                      disabled={!newName.trim() || isCreating}
                      title="Сгенерировать из названия"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="bi bi-magic me-1"></i>
                      Авто
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Используется в ссылке на категорию. Только латинские буквы, цифры и дефисы.
                  </Form.Text>
                </Form.Group>

                {suggestedSlug && !newSlug && (
                  <p
                    className="text-primary small mt-1 mb-2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setNewSlug(suggestedSlug)}
                  >
                    Предложение: <strong>{suggestedSlug}</strong> (нажмите, чтобы использовать)
                  </p>
                )}

                <Form.Label className="mt-3">Выберите иконку (опционально)</Form.Label><p className="mb-2"></p>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {['folder', 'file-earmark-pdf', 'journal-text', 'building', 'globe', 'file-earmark-text'].map((ic) => (
                    <Button
                      key={ic}
                      variant={newIcon === `bi-${ic}` ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => setNewIcon(`bi-${ic}`)}
                      title={ic}
                    >
                      <i className={`bi bi-${ic}`} style={{ fontSize: 18 }} />
                    </Button>
                  ))}
                </div>

                <Form.Group className="mb-3" controlId="newCategoryIcon">
                  <Form.Label className="d-flex align-items-center justify-content-between gap-2">
                    <span>Или вставьте класс иконки (например: bi-folder)</span>
                    <a
                      href="https://icons.getbootstrap.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '14px', textDecoration: 'none' }}
                    >
                      Все иконки
                      <i className="bi bi-arrow-up-right ms-1" />
                    </a>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.currentTarget.value)}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setCreateModalOpened(false)}
                disabled={isCreating}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!newName.trim()) {
                    setCreateError('Введите название')
                    return
                  }
                  if (!newSlug.trim()) {
                    setCreateError('Введите slug категории')
                    return
                  }
                  if (!/^[a-z0-9-]+$/.test(newSlug)) {
                    setCreateError('Slug может содержать только строчные латинские буквы, цифры и дефисы')
                    return
                  }
                  try {
                    setIsCreating(true)
                    setCreateError('')
                    const res = await fetch(API_ENDPOINTS.DOCUMENT_CATEGORIES_CREATE, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ name: newName.trim(), slug: newSlug.trim(), icon: newIcon || undefined }),
                    })
                    if (!res.ok) throw new Error(`Ошибка создания: ${res.status}`)
                    const created = await res.json()
                    setCategories([created, ...categories])
                    setCreateModalOpened(false)
                    setNewName('')
                    setNewSlug('')
                    setNewIcon('')
                  } catch (err: any) {
                    setCreateError(err.message || 'Ошибка создания')
                  } finally {
                    setIsCreating(false)
                  }
                }}
                disabled={isCreating}
              >
                {isCreating && (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    className="me-2"
                  />
                )}
                Создать
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Delete Modal */}
          <Modal
            show={deleteModalOpened}
            onHide={() => setDeleteModalOpened(false)}
            centered
            dialogClassName="modal-content-md"
          >
            <Modal.Header closeButton>
              <Modal.Title>Удалить категорию</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-0">
                Вы уверены, что хотите удалить категорию <strong>{deletingCategory?.name}</strong>?
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setDeleteModalOpened(false)}
                disabled={isDeleting}
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteCategory}
                disabled={isDeleting}
              >
                {isDeleting && (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    className="me-2"
                  />
                )}
                Удалить
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </Container>
    </DashboardLayout>
  )
}

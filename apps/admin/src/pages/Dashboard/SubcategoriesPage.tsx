import { useEffect, useState } from 'react'
import {
  Container,
  Button,
  Spinner,
  Alert,
  Modal,
  Form,
  Table,
  Badge,
  Tabs,
  Tab,
} from 'react-bootstrap'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import 'bootstrap-icons/font/bootstrap-icons.css'
import ImageUploadInput, { type ImageUploadValue } from '../../components/ImageUploadInput'

type Category = {
  id: number
  name: string
  createdAt: string
  children?: any[]
  parentId?: string
}

type Document = {
  id: string
  title: string
  pdfUrl?: string
  type: string
  category?: any
  subcategory?: any
  isPublished: boolean
  createdAt: string
}

export default function SubcategoriesPage() {
  const { categoryId } = useParams<{ categoryId?: string }>()
  const navigate = useNavigate()

  const [parentCategory, setParentCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [parentDocuments, setParentDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('admin_token')
  const filesBaseUrl = (import.meta as any).env.VITE_FILES_BASE_URL || window.location.origin

  const resolveDocumentUrl = (url: string): string => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (url.startsWith('//')) return `${window.location.protocol}${url}`
    const base = filesBaseUrl.replace(/\/$/, '')
    const path = url.replace(/^\//, '')
    return `${base}/${path}`
  }

  const [modalOpened, setModalOpened] = useState(false)
  const [subcategoryName, setSubcategoryName] = useState('')
  const [formError, setFormError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [deletingSubcategory, setDeletingSubcategory] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [editModalOpened, setEditModalOpened] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<Category | null>(null)
  const [editSubcategoryName, setEditSubcategoryName] = useState('')
  const [editFormError, setEditFormError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const [addDocumentModalOpened, setAddDocumentModalOpened] = useState(false)
  const [selectedSubcategoryForDoc, setSelectedSubcategoryForDoc] = useState<Category | null>(null)
  const [docTitle, setDocTitle] = useState('')
  const [docSource, setDocSource] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  })
  const [docPlacement, setDocPlacement] = useState<'category' | 'subcategory'>('category')
  const [docIsPublished, setDocIsPublished] = useState(true)
  const [docFormError, setDocFormError] = useState('')
  const [isAddingDocument, setIsAddingDocument] = useState(false)
  const [subcategoryDocuments, setSubcategoryDocuments] = useState<{ [key: number]: Document[] }>({})

  const [deleteDocModalOpened, setDeleteDocModalOpened] = useState(false)
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null)
  const [isDeletingDoc, setIsDeletingDoc] = useState(false)

  const [editDocModalOpened, setEditDocModalOpened] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [editDocTitle, setEditDocTitle] = useState('')
  const [editDocSource, setEditDocSource] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  })
  const [editDocIsPublished, setEditDocIsPublished] = useState(true)
  const [editDocFormError, setEditDocFormError] = useState('')
  const [isEditingDoc, setIsEditingDoc] = useState(false)

  useEffect(() => {
    if (categoryId) {
      loadCategoryAndSubcategories()
    }
  }, [categoryId])

  const loadCategoryAndSubcategories = async () => {
    try {
      setLoading(true)
      setError('')

      const res = await fetch(API_ENDPOINTS.DOCUMENT_CATEGORIES_LIST, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Ошибка загрузки: ${res.status}`)
      }

      const data = await res.json()
      const categories = Array.isArray(data) ? data : []
      const numCategoryId = parseInt(categoryId || '', 10)

      const parent = categories.find((c: any) => c.id === numCategoryId)
      if (!parent) {
        throw new Error('Категория не найдена')
      }

      setParentCategory(parent)
      setSubcategories(parent.children || [])

      const docRes = await fetch(
        `${API_ENDPOINTS.DOCUMENTS_LIST}?type=documents&categoryId=${numCategoryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (docRes.ok) {
        const docData = await docRes.json()
        const sorted = (Array.isArray(docData) ? docData : []).sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime()
          const dateB = new Date(b.createdAt || 0).getTime()
          return dateB - dateA
        })
        setDocuments(sorted)
        const parentDocs: Document[] = []
        const subcatDocs: { [key: number]: Document[] } = {}

        if (parent.children) {
          parent.children.forEach((subcat: any) => {
            subcatDocs[subcat.id] = []
          })
        }

        sorted.forEach((doc: any) => {
          if (doc.subcategory && doc.subcategory.id in subcatDocs) {
            subcatDocs[doc.subcategory.id].push(doc)
          } else {
            parentDocs.push(doc)
          }
        })

        setSubcategoryDocuments(subcatDocs)
        setParentDocuments(parentDocs)
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки категорий')
      console.error('Load categories error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubcategory = async () => {
    setFormError('')

    if (!subcategoryName.trim()) {
      setFormError('Введите название подкатегории')
      return
    }

    try {
      setIsCreating(true)
      const res = await fetch(API_ENDPOINTS.DOCUMENT_CATEGORIES_CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: subcategoryName.trim(),
          parentId: categoryId,
        }),
      })

      if (!res.ok) {
        throw new Error(`Ошибка создания: ${res.status}`)
      }

      const newSubcategory = await res.json()
      setSubcategories([...subcategories, newSubcategory])
      setSubcategoryName('')
      setModalOpened(false)
    } catch (err: any) {
      setFormError(err.message || 'Ошибка при создании подкатегории')
      console.error('Create subcategory error:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditSubcategory = async () => {
    setEditFormError('')

    if (!editingSubcategory) return

    if (!editSubcategoryName.trim()) {
      setEditFormError('Введите название подкатегории')
      return
    }

    try {
      setIsEditing(true)
      const res = await fetch(API_ENDPOINTS.DOCUMENT_CATEGORIES_UPDATE(editingSubcategory.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editSubcategoryName.trim(),
        }),
      })

      if (!res.ok) {
        throw new Error(`Ошибка обновления: ${res.status}`)
      }

      const updated = await res.json()
      setSubcategories(subcategories.map((s) => (s.id === updated.id ? updated : s)))
      setEditModalOpened(false)
      setEditingSubcategory(null)
    } catch (err: any) {
      setEditFormError(err.message || 'Ошибка при обновлении подкатегории')
      console.error('Edit subcategory error:', err)
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeleteSubcategory = async () => {
    if (!deletingSubcategory) return

    try {
      setIsDeleting(true)
      const res = await fetch(API_ENDPOINTS.DOCUMENT_CATEGORIES_DELETE(deletingSubcategory.id), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Ошибка удаления: ${res.status}`)
      }

      setSubcategories(subcategories.filter((s) => s.id !== deletingSubcategory.id))
      setDeleteModalOpened(false)
      setDeletingSubcategory(null)
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении подкатегории')
      console.error('Delete subcategory error:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddDocument = async () => {
    setDocFormError('')

    if (!parentCategory?.id) {
      setDocFormError('Категория не найдена')
      return
    }

    if (docPlacement === 'subcategory' && !selectedSubcategoryForDoc) {
      setDocFormError('Подкатегория не выбрана')
      return
    }

    if (!docTitle.trim()) {
      setDocFormError('Введите название документа')
      return
    }

    const hasFile = !!docSource.file
    const trimmedUrl = docSource.url.trim()
    const hasUrl = !!trimmedUrl

    if (!hasFile && !hasUrl) {
      setDocFormError('Выберите файл или укажите ссылку на документ')
      return
    }

    try {
      setIsAddingDocument(true)

      const formData = new FormData()
      formData.append('title', docTitle.trim())
      formData.append('categoryId', String(parentCategory.id))
      if (docPlacement === 'subcategory' && selectedSubcategoryForDoc) {
        formData.append('subcategoryId', String(selectedSubcategoryForDoc.id))
      }
      formData.append('type', 'documents')
      formData.append('isPublished', String(docIsPublished))

      if (docSource.file) {
        formData.append('pdfFile', docSource.file)
      } else if (trimmedUrl) {
        formData.append('pdfUrl', trimmedUrl)
      }

      const res = await fetch(`${API_ENDPOINTS.DOCUMENTS_CREATE}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`Ошибка создания: ${res.status}. ${errorText}`)
      }

      const newDoc = await res.json()
      setDocuments((prev) => [newDoc, ...prev])
      if (docPlacement === 'subcategory' && selectedSubcategoryForDoc) {
        const subcatId = selectedSubcategoryForDoc.id
        setSubcategoryDocuments((prev) => ({
          ...prev,
          [subcatId]: [newDoc, ...(prev[subcatId] || [])],
        }))
      } else {
        setParentDocuments((prev) => [newDoc, ...prev])
      }

      setDocTitle('')
      setDocSource({ mode: 'file', file: null, url: '' })
      setDocPlacement('category')
      setDocIsPublished(true)
      setAddDocumentModalOpened(false)
      setSelectedSubcategoryForDoc(null)
    } catch (err: any) {
      setDocFormError(err.message || 'Ошибка при добавлении документа')
      console.error('Add document error:', err)
    } finally {
      setIsAddingDocument(false)
    }
  }

  const handleDeleteDocument = async () => {
    if (!deletingDocument) return

    try {
      setIsDeletingDoc(true)
      const res = await fetch(`${API_ENDPOINTS.DOCUMENTS_DELETE(deletingDocument.id)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Ошибка удаления: ${res.status}`)
      }

      setSubcategoryDocuments((prev) => {
        const updated = { ...prev }
        for (const subcatId in updated) {
          updated[Number(subcatId)] = updated[Number(subcatId)].filter((doc) => doc.id !== deletingDocument.id)
        }
        return updated
      })

      setParentDocuments((prev) => prev.filter((doc) => doc.id !== deletingDocument.id))

      setDocuments(documents.filter((doc) => doc.id !== deletingDocument.id))

      setDeleteDocModalOpened(false)
      setDeletingDocument(null)
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении документа')
      console.error('Delete document error:', err)
    } finally {
      setIsDeletingDoc(false)
    }
  }

  const handleEditDocument = async () => {
    if (!editingDocument) return

    if (!editDocTitle.trim()) {
      setEditDocFormError('Введите название документа')
      return
    }

    try {
      setIsEditingDoc(true)
      setEditDocFormError('')

      let res;


      if (editDocSource.file) {
        const formData = new FormData()
        formData.append('title', editDocTitle.trim())
        formData.append('isPublished', editDocIsPublished ? 'true' : 'false')

        formData.append('pdfFile', editDocSource.file)

        res = await fetch(`${API_ENDPOINTS.DOCUMENTS_UPDATE(editingDocument.id)}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })
      } else {
        const updateData: any = {
          title: editDocTitle.trim(),
          isPublished: editDocIsPublished,
        }

        const trimmedUrl = editDocSource.url.trim()
        if (editDocSource.mode === 'url' && trimmedUrl && trimmedUrl !== editingDocument.pdfUrl) {
          updateData.pdfUrl = trimmedUrl
        }

        res = await fetch(`${API_ENDPOINTS.DOCUMENTS_UPDATE(editingDocument.id)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        })
      }

      if (!res.ok) {
        throw new Error(`Ошибка обновления: ${res.status}`)
      }

      const updated = await res.json()

      setSubcategoryDocuments((prev) => {
        const newDocs = { ...prev }
        for (const subcatId in newDocs) {
          newDocs[Number(subcatId)] = newDocs[Number(subcatId)].map((doc) =>
            doc.id === updated.id ? updated : doc
          )
        }
        return newDocs
      })

      setDocuments(documents.map((doc) => (doc.id === updated.id ? updated : doc)))

      setParentDocuments((prev) => prev.map((doc) => (doc.id === updated.id ? updated : doc)))

      setEditDocModalOpened(false)
      setEditingDocument(null)
    } catch (err: any) {
      setEditDocFormError(err.message || 'Ошибка при обновлении документа')
      console.error('Edit document error:', err)
    } finally {
      setIsEditingDoc(false)
    }
  }
  if (loading) {
    return (
      <DashboardLayout title="Загрузка">
        <Container className="py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
            <Spinner animation="border" role="status" />
          </div>
        </Container>
      </DashboardLayout>
    )
  }

  if (!parentCategory) {
    return (
      <DashboardLayout title="Ошибка">
        <Container className="py-4">
          <Alert variant="danger" className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill" />
            <span>Категория не найдена</span>
          </Alert>
          <Button className="mt-3" variant="secondary" onClick={() => navigate('/documents')}>
            Вернуться к категориям
          </Button>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title={parentCategory.name}>
      <Container className="py-4">
        <div className="d-flex flex-column gap-4">
          <div className="d-flex justify-content-between align-items-start">
            <div className="mb-4">
              <Button
                variant="link"
                className="p-0 mb-2"
                onClick={() => navigate('/documents')}
              >
                <i className="bi bi-arrow-left me-1" />
                Категории
              </Button>
              <h1 className="mb-1 mt-1">{parentCategory.name}</h1>
              <p className="text-muted mb-0">Перед тем как добавлять документы и подкатегории, ознакомьтесь с советами из документации.</p>
              <a href="https://disk.yandex.ru/d/jCh4-iRjmJ7b2Q"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-dark  d-flex align-items-center"
                style={{ width: 'fit-content', margin: '20px 0' }}
              >
                <i className="bi bi-info-circle me-2"></i>
                Советы по публикации документов и категорий
              </a>
            </div>
            <div className="d-flex gap-2">
              <Button variant="primary" onClick={() => setModalOpened(true)}>
                <i className="bi bi-plus-lg me-2" />
                Добавить подкатегорию
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{error}</span>
            </Alert>
          )}

          <div className="bg-white border rounded p-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h4 className="mb-1">Документы категории</h4>
                <p className="text-muted small mb-0">Документы без подкатегорий</p>
              </div>
              <Button
                variant="outline-primary"
                onClick={() => {
                  setDocPlacement('category')
                  setSelectedSubcategoryForDoc(null)
                  setDocTitle('')
                  setDocSource({ mode: 'file', file: null, url: '' })
                  setDocIsPublished(true)
                  setDocFormError('')
                  setAddDocumentModalOpened(true)
                }}
              >
                <i className="bi bi-clipboard-plus me-2" />
                Добавить документ
              </Button>
            </div>

            {parentDocuments.length === 0 ? (
              <p className="text-muted text-center mb-0 py-3">Документов не найдено</p>
            ) : (
              <Table striped hover responsive size="sm" className="mb-0">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Статус</th>
                    <th>Дата создания</th>
                    <th style={{ textAlign: 'right' }}>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {parentDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        {doc.pdfUrl ? (
                          <a
                            href={resolveDocumentUrl(doc.pdfUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#0d6efd', textDecoration: 'none' }}
                          >
                            {doc.title}
                          </a>
                        ) : (
                          doc.title
                        )}
                      </td>
                      <td>
                        <Badge bg={doc.isPublished ? 'success' : 'secondary'}>
                          {doc.isPublished ? 'Опубликован' : 'Черновик'}
                        </Badge>
                      </td>
                      <td>{new Date(doc.createdAt).toLocaleDateString('ru-RU')}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              setEditingDocument(doc)
                              setEditDocTitle(doc.title)
                              setEditDocSource({ mode: 'file', file: null, url: '' })
                              setEditDocIsPublished(doc.isPublished)
                              setEditDocFormError('')
                              setEditDocModalOpened(true)
                            }}
                            title="Редактировать документ"
                          >
                            <i className="bi bi-pencil" />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setDeletingDocument(doc)
                              setDeleteDocModalOpened(true)
                            }}
                            title="Удалить документ"
                          >
                            <i className="bi bi-trash" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          <div className="mt-3">
            <Tabs defaultActiveKey="subcategories">
              <Tab eventKey="subcategories" title={`Подкатегории (${subcategories.length})`}>
                {subcategories.length === 0 ? (
                  <div className="bg-white border rounded p-4 text-center mt-3">
                    <p className="mb-1 text-muted">Подкатегорий не найдено</p>
                    <p className="mb-0 text-muted small">
                      Вы можете добавить документы напрямую в родительскую категорию через кнопку выше.
                    </p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3 mt-3">
                    {subcategories.map((subcategory) => {
                      const subcatDocs = subcategoryDocuments[subcategory.id] || []
                      return (
                        <div key={subcategory.id} className="bg-white border rounded p-3">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                              <h4 className="mb-1">{subcategory.name}</h4>
                              <p className="text-muted small mb-0">
                                {new Date(subcategory.createdAt).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                            <div className="d-flex gap-2">
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => {
                                  setDocPlacement('subcategory')
                                  setSelectedSubcategoryForDoc(subcategory)
                                  setDocTitle('')
                                  setDocSource({ mode: 'file', file: null, url: '' })
                                  setDocIsPublished(true)
                                  setDocFormError('')
                                  setAddDocumentModalOpened(true)
                                }}
                                title="Добавить документ"
                              >
                                <i className="bi bi-clipboard-plus" />
                              </Button>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => {
                                  setEditingSubcategory(subcategory)
                                  setEditSubcategoryName(subcategory.name)
                                  setEditModalOpened(true)
                                }}
                                title="Редактировать"
                              >
                                <i className="bi bi-pencil" />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setDeletingSubcategory(subcategory)
                                  setDeleteModalOpened(true)
                                }}
                                title="Удалить"
                              >
                                <i className="bi bi-trash" />
                              </Button>
                            </div>
                          </div>

                          {subcatDocs.length === 0 ? (
                            <p className="text-muted text-center mb-0 py-3">Документов не найдено</p>
                          ) : (
                            <Table striped hover responsive size="sm" className="mb-0">
                              <thead>
                                <tr>
                                  <th>Название</th>
                                  <th>Статус</th>
                                  <th>Дата создания</th>
                                  <th style={{ textAlign: 'right' }}>Действия</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subcatDocs.map((doc) => (
                                  <tr key={doc.id}>
                                    <td>
                                      {doc.pdfUrl ? (
                                        <a
                                          href={resolveDocumentUrl(doc.pdfUrl)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ color: '#0d6efd', textDecoration: 'none' }}
                                        >
                                          {doc.title}
                                        </a>
                                      ) : (
                                        doc.title
                                      )}
                                    </td>
                                    <td>
                                      <Badge bg={doc.isPublished ? 'success' : 'secondary'}>
                                        {doc.isPublished ? 'Опубликован' : 'Черновик'}
                                      </Badge>
                                    </td>
                                    <td>{new Date(doc.createdAt).toLocaleDateString('ru-RU')}</td>
                                    <td style={{ textAlign: 'right' }}>
                                      <div className="d-flex justify-content-end gap-2">
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          onClick={() => {
                                            setEditingDocument(doc)
                                            setEditDocTitle(doc.title)
                                            setEditDocSource({ mode: 'file', file: null, url: '' })
                                            setEditDocIsPublished(doc.isPublished)
                                            setEditDocFormError('')
                                            setEditDocModalOpened(true)
                                          }}
                                          title="Редактировать документ"
                                        >
                                          <i className="bi bi-pencil" />
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => {
                                            setDeletingDocument(doc)
                                            setDeleteDocModalOpened(true)
                                          }}
                                          title="Удалить документ"
                                        >
                                          <i className="bi bi-trash" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Tab>
            </Tabs>
          </div>

          <Modal
            show={modalOpened}
            onHide={() => setModalOpened(false)}
            centered
            dialogClassName="modal-content-md"
          >
            <Modal.Header closeButton>
              <Modal.Title>Добавить подкатегорию</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {formError && (
                <Alert variant="danger" className="d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill" />
                  <span>{formError}</span>
                </Alert>
              )}

              <Form>
                <Form.Group className="mb-3" controlId="subcategoryName">
                  <Form.Label>Название <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Введите название подкатегории"
                    value={subcategoryName}
                    onChange={(e) => setSubcategoryName(e.currentTarget.value)}
                    disabled={isCreating}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setModalOpened(false)}
                disabled={isCreating}
              >
                Отмена
              </Button>
              <Button variant="primary" onClick={handleAddSubcategory} disabled={isCreating}>
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


          <Modal
            show={editModalOpened}
            onHide={() => setEditModalOpened(false)}
            dialogClassName="modal-content-md"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Редактировать подкатегорию</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {editFormError && (
                <Alert variant="danger" className="d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill" />
                  <span>{editFormError}</span>
                </Alert>
              )}

              <Form>
                <Form.Group className="mb-3" controlId="editSubcategoryName">
                  <Form.Label>Название</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Введите название подкатегории"
                    value={editSubcategoryName}
                    onChange={(e) => setEditSubcategoryName(e.currentTarget.value)}
                    disabled={isEditing}
                  />
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setEditModalOpened(false)}
                disabled={isEditing}
              >
                Отмена
              </Button>
              <Button variant="primary" onClick={handleEditSubcategory} disabled={isEditing}>
                {isEditing && (
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
            onHide={() => setDeleteModalOpened(false)}
            dialogClassName="modal-content-md"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Удалить подкатегорию</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-0">
                Вы уверены, что хотите удалить подкатегорию <strong>{deletingSubcategory?.name}</strong>?
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
                onClick={handleDeleteSubcategory}
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


          <Modal
            show={addDocumentModalOpened}
            onHide={() => {
              setAddDocumentModalOpened(false)
              setSelectedSubcategoryForDoc(null)
              setDocTitle('')
              setDocSource({ mode: 'file', file: null, url: '' })
              setDocPlacement('category')
              setDocIsPublished(true)
              setDocFormError('')
            }}
            centered
            dialogClassName="modal-content-md"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {docPlacement === 'subcategory'
                  ? `Добавить документ в "${selectedSubcategoryForDoc?.name ?? 'подкатегорию'}"`
                  : `Добавить документ в "${parentCategory.name}"`}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {docFormError && (
                <Alert variant="danger" className="d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill" />
                  <span>{docFormError}</span>
                </Alert>
              )}

              <p className="text-muted small">
                {docPlacement === 'subcategory'
                  ? 'Документ будет доступен внутри выбранной подкатегории.'
                  : 'Документ будет доступен на уровне родительской категории.'}
              </p>

              <Form>
                <Form.Group className="mb-3" controlId="docTitle">
                  <Form.Label>Название документа <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Введите название"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.currentTarget.value)}
                    disabled={isAddingDocument}
                  />
                </Form.Group>
                <ImageUploadInput
                  id="docSource"
                  label="Файл документа или ссылка"
                  helpText="Загрузите PDF-файл или укажите URL на документ."
                  value={docSource}
                  onChange={setDocSource}
                  disabled={isAddingDocument}
                  accept="application/pdf"
                  required
                />
                <Form.Label className="mb-2 mt-4">Статус публикации (Опубликовать / Черновик) <span className="text-danger">*</span></Form.Label>
                <Form.Check
                  type="checkbox"
                  id="docIsPublished"
                  label="Опубликовать документ"
                  checked={docIsPublished}
                  onChange={(e) => setDocIsPublished(e.currentTarget.checked)}
                  disabled={isAddingDocument}
                />
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setAddDocumentModalOpened(false)
                  setSelectedSubcategoryForDoc(null)
                  setDocTitle('')
                  setDocSource({ mode: 'file', file: null, url: '' })
                  setDocPlacement('category')
                  setDocIsPublished(true)
                  setDocFormError('')
                }}
                disabled={isAddingDocument}
              >
                Отмена
              </Button>
              <Button variant="primary" onClick={handleAddDocument} disabled={isAddingDocument}>
                {isAddingDocument && (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    className="me-2"
                  />
                )}
                Добавить
              </Button>
            </Modal.Footer>
          </Modal>


          <Modal
            show={deleteDocModalOpened}
            onHide={() => setDeleteDocModalOpened(false)}
            dialogClassName="modal-content-md"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Удалить документ</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p className="mb-0">
                Вы уверены, что хотите удалить документ <strong>{deletingDocument?.title}</strong>?
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setDeleteDocModalOpened(false)}
                disabled={isDeletingDoc}
              >
                Отмена
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteDocument}
                disabled={isDeletingDoc}
              >
                {isDeletingDoc && (
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


          <Modal
            show={editDocModalOpened}
            onHide={() => {
              setEditDocModalOpened(false)
              setEditingDocument(null)
              setEditDocTitle('')
              setEditDocSource({ mode: 'file', file: null, url: '' })
              setEditDocIsPublished(true)
              setEditDocFormError('')
            }}
            centered
            dialogClassName="modal-content-md"
          >
            <Modal.Header closeButton>
              <Modal.Title>Редактировать документ</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {editDocFormError && (
                <Alert variant="danger" className="d-flex align-items-center gap-2">
                  <i className="bi bi-exclamation-triangle-fill" />
                  <span>{editDocFormError}</span>
                </Alert>
              )}

              <Form>
                <Form.Group className="mb-3" controlId="editDocTitle">
                  <Form.Label>Название документа</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Введите название"
                    value={editDocTitle}
                    onChange={(e) => setEditDocTitle(e.currentTarget.value)}
                    disabled={isEditingDoc}
                  />
                </Form.Group>
                <ImageUploadInput
                  id="editDocSource"
                  label="Обновить файл/ссылку (необязательно)"
                  helpText="Оставьте пустым, если не нужно менять файл."
                  value={editDocSource}
                  onChange={setEditDocSource}
                  disabled={isEditingDoc}
                  accept="application/pdf"
                />

                <Form.Label className="mb-1 mt-4">Статус публикации (Опубликовать / Черновик)</Form.Label>
                <Form.Check
                  type="checkbox"
                  id="editDocIsPublished"
                  label="Опубликовать документ"
                  className="mb-0"
                  checked={editDocIsPublished}
                  onChange={(e) => setEditDocIsPublished(e.currentTarget.checked)}
                  disabled={isEditingDoc}
                />
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditDocModalOpened(false)
                  setEditingDocument(null)
                  setEditDocTitle('')
                  setEditDocSource({ mode: 'file', file: null, url: '' })
                  setEditDocIsPublished(true)
                  setEditDocFormError('')
                }}
                disabled={isEditingDoc}
              >
                Отмена
              </Button>
              <Button variant="primary" onClick={handleEditDocument} disabled={isEditingDoc}>
                {isEditingDoc && (
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
        </div>
      </Container>
    </DashboardLayout>
  )
}


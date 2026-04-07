import { useEffect, useState } from 'react'
import { getFileUrl } from '../../utils/getFileUrl'
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
import { ImageUploadInput, type ImageUploadValue } from '../../components/ImageUploadInput';
import { PageBlocksEditor } from '../../components/PageBlocksEditor'


type Category = {
  id: number
  name: string
  createdAt: string
  children?: any[]
  parentId?: string
}

type Document = {
  id: string;
  title: string;
  fileUrl?: string;
  pdfUrl?: string;
  type: string;
  category?: any;
  subcategory?: any;
  isPublished: boolean;
  createdAt: string;
  orderIndex?: number;
}

export default function SubcategoriesPage() {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()

  const [parentCategory, setParentCategory] = useState<Category | null>(null)
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [parentDocuments, setParentDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('admin_token')
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
  const [movingDocumentId, setMovingDocumentId] = useState<string | null>(null)

  // Page blocks editor modal
  const [pageEditorOpened, setPageEditorOpened] = useState(false)
  const [editingCategoryForBlocks, setEditingCategoryForBlocks] = useState<Category | null>(null)
  const [editingBlocks, setEditingBlocks] = useState<any[] | undefined>(undefined)

  const withCacheBust = (url: string) => {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}_ts=${Date.now()}`
  }

  const sortDocumentsByOrder = (items: Document[]) => {
    return [...items].sort((a, b) => {
      const aOrder = typeof a.orderIndex === 'number' ? a.orderIndex : Number.MAX_SAFE_INTEGER
      const bOrder = typeof b.orderIndex === 'number' ? b.orderIndex : Number.MAX_SAFE_INTEGER
      if (aOrder !== bOrder) return bOrder - aOrder

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      if (aTime !== bTime) return bTime - aTime

      return String(b.id).localeCompare(String(a.id))
    })
  }

  const moveParentDocument = async (docId: string, direction: 'up' | 'down') => {
    const current = [...parentDocuments]
    const index = current.findIndex((doc) => doc.id === docId)
    if (index === -1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= current.length) return

    const tokenValue = localStorage.getItem('admin_token')
    if (!tokenValue) {
      setError('Нет токена администратора')
      return
    }

    const next = [...current]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)

    setParentDocuments(next)
    setMovingDocumentId(docId)

    try {
      const res = await fetch(API_ENDPOINTS.DOCUMENTS_MOVE_ORDER(docId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenValue}`,
        },
        body: JSON.stringify({ direction }),
      })

      if (!res.ok) throw new Error(`Ошибка обновления порядка: ${res.status}`)

      await loadCategoryAndSubcategories()
    } catch (err: any) {
      setParentDocuments(current)
      setError(err.message || 'Ошибка изменения порядка документа')
    } finally {
      setMovingDocumentId(null)
    }
  }

  const moveSubcategoryDocument = async (
    subcategoryId: number,
    docId: string,
    direction: 'up' | 'down'
  ) => {
    const current = subcategoryDocuments[subcategoryId] || []
    const index = current.findIndex((doc) => doc.id === docId)
    if (index === -1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= current.length) return

    const tokenValue = localStorage.getItem('admin_token')
    if (!tokenValue) {
      setError('Нет токена администратора')
      return
    }

    const reordered = [...current]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, moved)

    setSubcategoryDocuments((prev) => ({
      ...prev,
      [subcategoryId]: reordered,
    }))
    setMovingDocumentId(docId)

    try {
      const res = await fetch(API_ENDPOINTS.DOCUMENTS_MOVE_ORDER(docId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenValue}`,
        },
        body: JSON.stringify({ direction }),
      })

      if (!res.ok) throw new Error(`Ошибка обновления порядка: ${res.status}`)

      await loadCategoryAndSubcategories()
    } catch (err: any) {
      setSubcategoryDocuments((prev) => ({
        ...prev,
        [subcategoryId]: current,
      }))
      setError(err.message || 'Ошибка изменения порядка документа')
    } finally {
      setMovingDocumentId(null)
    }
  }

  const handleSavePageBlocks = async () => {
    if (!editingCategoryForBlocks) return
    try {
      const res = await fetch(API_ENDPOINTS.DOCUMENT_CATEGORIES_UPDATE(editingCategoryForBlocks.id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ blocks: editingBlocks || [] }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Ошибка сохранения: ${res.status} ${text}`)
      }
      const updated = await res.json()
      if (parentCategory && updated.id === parentCategory.id) {
        setParentCategory(updated as any)
      } else {
        setSubcategories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      }
      setPageEditorOpened(false)
    } catch (err: any) {
      console.error('Save page blocks error:', err)
      alert(err.message || 'Ошибка при сохранении')
    }
  }

  useEffect(() => {
    if (slug) {
      loadCategoryAndSubcategories()
    }
  }, [slug])

  const loadCategoryAndSubcategories = async () => {
    try {
      setLoading(true)
      setError('')

      const res = await fetch(withCacheBust(API_ENDPOINTS.DOCUMENT_CATEGORIES_LIST), {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Ошибка загрузки: ${res.status}`)
      }

      const data = await res.json()
      const categories = Array.isArray(data) ? data : []
      const parent =
        categories.find((c: any) => c.slug === slug) ||
        categories.find((c: any) => String(c.id) === String(slug))

      if (!parent) {
        throw new Error('Категория не найдена')
      }

      setParentCategory(parent)
      setSubcategories(parent.children || [])

      const docRes = await fetch(
        withCacheBust(`${API_ENDPOINTS.DOCUMENTS_LIST}?type=documents&categoryId=${parent.id}&noCache=1`),
        {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (docRes.ok) {
        const docData = await docRes.json()
        const sorted = Array.isArray(docData) ? docData : []
        const sortedByOrder = sortDocumentsByOrder(sorted)
        setDocuments(sortedByOrder)
        const parentDocs: Document[] = []
        const subcatDocs: { [key: number]: Document[] } = {}

        if (parent.children) {
          parent.children.forEach((subcat: any) => {
            subcatDocs[subcat.id] = []
          })
        }

        sortedByOrder.forEach((doc: any) => {
          if (doc.subcategory && doc.subcategory.id in subcatDocs) {
            subcatDocs[doc.subcategory.id].push(doc)
          } else {
            parentDocs.push(doc)
          }
        })

        const normalizedSubcatDocs: { [key: number]: Document[] } = {}
        Object.entries(subcatDocs).forEach(([key, docs]) => {
          normalizedSubcatDocs[Number(key)] = sortDocumentsByOrder(docs)
        })

        setSubcategoryDocuments(normalizedSubcatDocs)
        setParentDocuments(sortDocumentsByOrder(parentDocs))
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

    if (!parentCategory) {
      setFormError('Категория не найдена')
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
          parentId: parentCategory.id,
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

    const targetSubcategoryId = selectedSubcategoryForDoc?.id

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
      if (targetSubcategoryId) {
        // For subcategory documents send only subcategoryId; backend resolves parent category.
        formData.append('subcategoryId', String(targetSubcategoryId))
      } else {
        formData.append('categoryId', String(parentCategory.id))
      }
      formData.append('type', 'documents')
      formData.append('isPublished', String(docIsPublished))

      if (docSource.file) {
        formData.append('file', docSource.file)
      } else if (trimmedUrl) {
        formData.append('fileUrl', trimmedUrl)
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

      setDocTitle('')
      setDocSource({ mode: 'file', file: null, url: '' })
      setDocIsPublished(true)
      setAddDocumentModalOpened(false)
      setSelectedSubcategoryForDoc(null)
      await loadCategoryAndSubcategories()
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

        formData.append('file', editDocSource.file)

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
        const currentDocUrl = editingDocument.fileUrl || editingDocument.pdfUrl || ''
        if (editDocSource.mode === 'url' && trimmedUrl && trimmedUrl !== currentDocUrl) {
          updateData.fileUrl = trimmedUrl
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
                <Button variant="outline-secondary" onClick={() => {
                  setEditingCategoryForBlocks(parentCategory)
                  setEditingBlocks((parentCategory as any)?.blocks || [])
                  setPageEditorOpened(true)
                }}>
                  <i className="bi bi-layout-text-sidebar-reverse me-2" />
                  Редактировать страницу
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
                  {sortDocumentsByOrder(parentDocuments).map((doc, index) => (
                    <tr key={doc.id}>
                      <td>
                        {(doc.fileUrl || doc.pdfUrl) ? (
                          <a
                            href={getFileUrl(doc.fileUrl || doc.pdfUrl || '')}
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
                            variant="outline-primary"
                            size="sm"
                            onClick={() => moveParentDocument(doc.id, 'up')}
                            title="Переместить выше"
                            disabled={index === 0 || movingDocumentId !== null}
                          >
                            <i className="bi bi-chevron-up" />
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => moveParentDocument(doc.id, 'down')}
                            title="Переместить ниже"
                            disabled={index === parentDocuments.length - 1 || movingDocumentId !== null}
                          >
                            <i className="bi bi-chevron-down" />
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => {
                              setEditingDocument(doc)
                              setEditDocTitle(doc.title)
                              const docUrl = doc.fileUrl || doc.pdfUrl || ''
                              // Pre-fill editDocSource with current file or URL
                              if (docUrl && (docUrl.startsWith('http://') || docUrl.startsWith('https://'))) {
                                setEditDocSource({ mode: 'url', file: null, url: docUrl })
                              } else if (docUrl) {
                                setEditDocSource({ mode: 'file', file: null, url: docUrl })
                              } else {
                                setEditDocSource({ mode: 'file', file: null, url: '' })
                              }
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
                  <div className="d-flex flex-column bg-white border rounded p-4 text-center mt-3">
                    <p className="mb-1 text-muted">Подкатегорий не найдено</p>
                    <p className="mb-0 text-muted small">
                      Вы можете добавить документы напрямую в родительскую категорию через кнопку выше.
                    </p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3 mt-3">
                    {subcategories.map((subcategory) => {
                      const subcatDocs = sortDocumentsByOrder(subcategoryDocuments[subcategory.id] || [])
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
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setEditingCategoryForBlocks(subcategory)
                                  setEditingBlocks((subcategory as any)?.blocks || [])
                                  setPageEditorOpened(true)
                                }}
                                title="Редактировать страницу подкатегории"
                              >
                                <i className="bi bi-layout-text-sidebar-reverse" />
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => {
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
                                {subcatDocs.map((doc, index) => (
                                  <tr key={doc.id}>
                                    <td>
                                      {(doc.fileUrl || doc.pdfUrl) ? (
                                        <a
                                          href={getFileUrl(doc.fileUrl || doc.pdfUrl || '')}
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
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => moveSubcategoryDocument(subcategory.id, doc.id, 'up')}
                                          title="Переместить выше"
                                          disabled={index === 0 || movingDocumentId !== null}
                                        >
                                          <i className="bi bi-chevron-up" />
                                        </Button>
                                        <Button
                                          variant="outline-primary"
                                          size="sm"
                                          onClick={() => moveSubcategoryDocument(subcategory.id, doc.id, 'down')}
                                          title="Переместить ниже"
                                          disabled={index === subcatDocs.length - 1 || movingDocumentId !== null}
                                        >
                                          <i className="bi bi-chevron-down" />
                                        </Button>
                                        <Button
                                          variant="outline-secondary"
                                          size="sm"
                                          onClick={() => {
                                            setEditingDocument(doc)
                                            setEditDocTitle(doc.title)
                                            const docUrl = doc.fileUrl || doc.pdfUrl || ''
                                            if (docUrl && (docUrl.startsWith('http://') || docUrl.startsWith('https://'))) {
                                              setEditDocSource({ mode: 'url', file: null, url: docUrl })
                                            } else {
                                              setEditDocSource({ mode: 'file', file: null, url: docUrl })
                                            }
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

          {/* Page blocks editor modal (fullscreen like Projects/News) */}
          <Modal
            show={pageEditorOpened}
            onHide={() => setPageEditorOpened(false)}
            fullscreen={true}
            backdrop="static"
            dialogClassName="modal-fullscreen"
            contentClassName="border-0"
          >
            <div className="d-flex flex-column h-100">
              <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
                <div className="row g-4">
                  <div className="col-md-4" style={{ background: '#F7FAFF', padding: '20px 40px 40px 60px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
                    <div className="mb-4">
                      <span className="text-danger fs-5 me-2">*</span>
                      <span className="text-muted">Обязательные поля помечены</span>
                    </div>
                    <h5 className="mb-3">{editingCategoryForBlocks?.name}</h5>
                    <p className="text-muted small">Добавьте/измените блоки, которые будут отображаться над списком документов.</p>
                  </div>

                  <div className="col-md-8" style={{ padding: '10px 40px' }}>
                    {editingBlocks !== undefined ? (
                      <PageBlocksEditor blocks={editingBlocks} setBlocks={(b: any[]) => setEditingBlocks(b)} />
                    ) : (
                      <div>Загрузка...</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setPageEditorOpened(false)}>Отмена</Button>
                <Button variant="outline-primary" onClick={async () => await handleSavePageBlocks()}>Сохранить</Button>
              </div>
            </div>
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
              setDocIsPublished(true)
              setDocFormError('')
            }}
            centered
            dialogClassName="modal-content-md"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {selectedSubcategoryForDoc
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
                {selectedSubcategoryForDoc
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
                  helpText="Загрузите PDF, DOC или DOCX файл, либо укажите ссылку на документ."
                  value={docSource}
                  onChange={setDocSource}
                  disabled={isAddingDocument}
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                  helpText="Оставьте пустым, если не нужно менять файл. Поддерживаются PDF, DOC, DOCX."
                  value={editDocSource}
                  onChange={setEditDocSource}
                  disabled={isEditingDoc}
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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


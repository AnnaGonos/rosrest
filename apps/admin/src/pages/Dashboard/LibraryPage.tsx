import { useState, useEffect } from 'react'
import { getFileUrl } from '../../utils/getFileUrl'
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Modal,
  Nav,
  Row,
  Spinner,
  Tab,
} from 'react-bootstrap'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { IconDeviceFloppy, IconX, IconAlertCircle } from '@tabler/icons-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import ImageUploadInput, { type ImageUploadValue } from '../../components/ImageUploadInput'
import { PageBlocksEditor } from '../../components/PageBlocksEditor'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'
import RichTextEditorField from '../../components/RichTextEditorField'

interface Block {
  id: string
  type: string
  content: Record<string, any>
  order: number
  parentBlockId?: string
  children?: Block[]
}

interface Page {
  id: string
  slug: string
  title: string
  publishedAt?: string
  isDraft: boolean
  blocks: Block[]
}

interface LibraryCategory {
  id: number
  name: string
  createdAt: string
}

interface LibraryItem {
  id: number
  type: 'book' | 'article'
  title: string
  contentUrl: string
  previewImage?: string
  description: string
  categoryId: number
  isPublished: boolean
  createdAt: string
  category: LibraryCategory
  page?: Page
}

interface GroupedItems {
  category: LibraryCategory
  items: LibraryItem[]
}

export default function LibraryPage() {
  const [categories, setCategories] = useState<LibraryCategory[]>([])
  const [groupedItems, setGroupedItems] = useState<GroupedItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [addCategoryModalOpened, setAddCategoryModalOpened] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryFormError, setCategoryFormError] = useState('')

  const [addItemModalOpened, setAddItemModalOpened] = useState(false)
  const [selectedCategoryForAdd, setSelectedCategoryForAdd] = useState<number | null>(null)
  const [creatingItem, setCreatingItem] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [updatingItem, setUpdatingItem] = useState(false)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [itemPendingDelete, setItemPendingDelete] = useState<LibraryItem | null>(null)
  const [itemFormError, setItemFormError] = useState('')

  const [newItemType, setNewItemType] = useState<'book' | 'article'>('book')
  const [newItemTitle, setNewItemTitle] = useState('')
  const [contentMode, setContentMode] = useState<'url' | 'file'>('url')
  const [newItemContentUrl, setNewItemContentUrl] = useState('')
  const [newItemPreviewImage, setNewItemPreviewImage] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  })
  const [newItemPdfFile, setNewItemPdfFile] = useState<File | null>(null)
  const [newItemIsPublished, setNewItemIsPublished] = useState(true)
  const [newItemDescription, setNewItemDescription] = useState('')


  const [articleModalOpened, setArticleModalOpened] = useState(false)
  const [articleSlug, setArticleSlug] = useState('')
  const [articlePublishedAt, setArticlePublishedAt] = useState<Date | null>(() => new Date())
  const [articleIsDraft, setArticleIsDraft] = useState(true)
  const [articleBlocks, setArticleBlocks] = useState<Block[]>([])
  const [articlePreviewFile, setArticlePreviewFile] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  })


  const [unsavedArticleChanges, setUnsavedArticleChanges] = useState(false)
  const [initialArticleState, setInitialArticleState] = useState<{
    title: string
    slug: string
    publishedAt: Date | null
    isDraft: boolean
    previewFile: ImageUploadValue
    blocks: Block[]
  } | null>(null)
  const [confirmCloseArticleModal, setConfirmCloseArticleModal] = useState(false)




  const transliterate = (text: string): string => {
    const map: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh',
      'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
      'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c',
      'ч': 'ch', 'ш': 'sh', 'щ': 'shh', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'ju', 'я': 'ja',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh',
      'З': 'Z', 'И': 'I', 'Й': 'J', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O',
      'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'C',
      'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shh', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Ju', 'Я': 'Ja'
    }

    return text.split('').map(char => map[char] || char).join('')
  }

  const generateSlug = (title: string): string => {
    return transliterate(title)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleGenerateSlug = () => {
    if (newItemTitle.trim()) {
      setArticleSlug(generateSlug(newItemTitle))
    }
  }

  useEffect(() => {
    loadLibrary()
  }, [])

  const loadLibrary = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('admin_token')

      const categoriesResponse = await fetch(`${API_ENDPOINTS.LIBRARY}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!categoriesResponse.ok) {
        throw new Error('Ошибка загрузки категорий')
      }

      const categoriesData = await categoriesResponse.json()
      setCategories(categoriesData)

      const itemsResponse = await fetch(`${API_ENDPOINTS.LIBRARY}/admin/all?limit=10000000000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!itemsResponse.ok) {
        throw new Error('Ошибка загрузки библиотеки')
      }

      const itemsData: LibraryItem[] = await itemsResponse.json()

      const grouped = categoriesData.map((category: LibraryCategory) => ({
        category,
        items: itemsData.filter(item => item.categoryId === category.id)
      }))

      grouped.sort((a: GroupedItems, b: GroupedItems) => {
        const aDate = Date.parse(a.category.createdAt || '') || 0
        const bDate = Date.parse(b.category.createdAt || '') || 0
        return bDate - aDate
      })

      setGroupedItems(grouped)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const openAddCategoryModal = () => {
    setCategoryFormError('')
    setNewCategoryName('')
    setAddCategoryModalOpened(true)
  }

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim()

    if (!name) {
      setCategoryFormError('Укажите название категории')
      return
    }

    try {
      setCreatingCategory(true)
      setCategoryFormError('')

      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${API_ENDPOINTS.LIBRARY}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Не удалось создать категорию')
      }

      setAddCategoryModalOpened(false)
      await loadLibrary()
    } catch (err) {
      setCategoryFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setCreatingCategory(false)
    }
  }

  const openAddItemModal = (categoryId: number) => {
    setItemFormError('')
    setEditingItemId(null)
    setNewItemType('book')
    setNewItemTitle('')
    setContentMode('url')
    setNewItemContentUrl('')
    setNewItemPreviewImage({ mode: 'file', file: null, url: '' })
    setNewItemPdfFile(null)
    setNewItemIsPublished(true)
    setNewItemDescription('')
    setSelectedCategoryForAdd(categoryId)
    setAddItemModalOpened(true)
  }

  const openEditItemModal = (item: LibraryItem) => {
    if (item.type === 'article') {
      openEditArticleModal(item)
      return
    }

    setItemFormError('')
    setEditingItemId(item.id)
    setNewItemType(item.type)
    setNewItemTitle(item.title)

    setContentMode(item.contentUrl ? 'url' : 'file')
    setNewItemContentUrl(item.contentUrl || '')
    setNewItemPreviewImage({
      mode: item.previewImage ? 'url' : 'file',
      file: null,
      url: item.previewImage || '',
    })
    setNewItemPdfFile(null)
    setNewItemIsPublished(item.isPublished)
    setNewItemDescription(item.description || '')
    setSelectedCategoryForAdd(item.categoryId)
    setAddItemModalOpened(true)
  }

  const handleCreateItem = async () => {
    const title = newItemTitle.trim()

    if (!title) {
      setItemFormError('Укажите название')
      return
    }

    const hasFile = !!newItemPreviewImage.file
    const trimmedImageUrl = newItemPreviewImage.url.trim()
    const hasUrl = !!trimmedImageUrl

    if (!hasFile && !hasUrl) {
      setItemFormError('Загрузите изображение обложки или укажите URL изображения')
      return
    }


    if (contentMode === 'url' && !newItemContentUrl.trim()) {
      setItemFormError('Укажите URL контента')
      return
    }

    if (contentMode === 'file' && !newItemPdfFile) {
      setItemFormError('Загрузите PDF файл')
      return
    }

    if (!selectedCategoryForAdd) {
      setItemFormError('Выберите категорию')
      return
    }

    try {
      setCreatingItem(true)
      setItemFormError('')

      const token = localStorage.getItem('admin_token')
      const formData = new FormData()

      formData.append('type', newItemType)
      formData.append('title', title)
      formData.append('isPublished', newItemIsPublished.toString())
      formData.append('categoryId', selectedCategoryForAdd.toString())

      const description = newItemDescription || ''
      if (description) {
        formData.append('description', description)
      }

      if (contentMode === 'url' && newItemContentUrl.trim()) {
        formData.append('contentUrl', newItemContentUrl.trim())
      }

      if (hasFile) {
        formData.append('previewImage', newItemPreviewImage.file as File)
      } else if (hasUrl) {
        formData.append('previewImageUrl', trimmedImageUrl)
      }

      if (contentMode === 'file' && newItemPdfFile) {
        formData.append('pdfFile', newItemPdfFile)
      }

      const response = await fetch(API_ENDPOINTS.LIBRARY, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Не удалось добавить элемент')
      }

      setAddItemModalOpened(false)
      await loadLibrary()
    } catch (err) {
      setItemFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setCreatingItem(false)
    }
  }

  const handleUpdateItem = async () => {
    const title = newItemTitle.trim()

    if (!title) {
      setItemFormError('Укажите название')
      return
    }

    if (!selectedCategoryForAdd) {
      setItemFormError('Выберите категорию')
      return
    }

    if (!editingItemId) {
      setItemFormError('Не выбран элемент для редактирования')
      return
    }

    try {
      setUpdatingItem(true)
      setItemFormError('')

      const token = localStorage.getItem('admin_token')
      const hasFile = !!newItemPreviewImage.file
      const trimmedImageUrl = newItemPreviewImage.url.trim()

      const formData = new FormData()
      formData.append('type', newItemType)
      formData.append('title', title)
      formData.append('isPublished', newItemIsPublished.toString())
      formData.append('categoryId', selectedCategoryForAdd.toString())

      const description = newItemDescription || ''
      if (description) {
        formData.append('description', description)
      }


      if (contentMode === 'url' && newItemContentUrl.trim()) {
        formData.append('contentUrl', newItemContentUrl.trim())
      }

      if (contentMode === 'file' && newItemPdfFile) {
        formData.append('pdfFile', newItemPdfFile)
      }

      if (hasFile) {
        formData.append('previewImage', newItemPreviewImage.file as File)
      } else if (newItemPreviewImage.mode === 'url' && trimmedImageUrl) {
        formData.append('previewImageUrl', trimmedImageUrl)
      }

      const response = await fetch(`${API_ENDPOINTS.LIBRARY}/${editingItemId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Не удалось обновить элемент')
      }

      setAddItemModalOpened(false)
      setEditingItemId(null)
      await loadLibrary()
    } catch (err) {
      setItemFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setUpdatingItem(false)
    }
  }

  const openDeleteConfirm = (item: LibraryItem) => {
    setItemPendingDelete(item)
    setConfirmDeleteOpen(true)
  }

  const handleDeleteItem = async (id: number) => {
    try {
      setDeletingItemId(id)
      const token = localStorage.getItem('admin_token')

      const response = await fetch(`${API_ENDPOINTS.LIBRARY}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Не удалось удалить элемент')
      }

      await loadLibrary()
      setConfirmDeleteOpen(false)
      setItemPendingDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setDeletingItemId(null)
    }
  }

  const openAddArticleModal = (categoryId: number) => {
    setItemFormError('')
    setEditingItemId(null)
    setNewItemType('article')
    const title = ''
    const slug = ''
    const publishedAt = new Date()
    const isDraft = true
    const blocks: Block[] = []

    const articlesCategory = categories.find(cat => cat.name.toLowerCase().includes('стать'))
    const selectedCategory = articlesCategory ? articlesCategory.id : categoryId

    setNewItemTitle(title)
    setArticleSlug(slug)
    setArticlePublishedAt(publishedAt)
    setArticleIsDraft(isDraft)
    setArticleBlocks(blocks)
    setArticlePreviewFile({ mode: 'file', file: null, url: '' })
    setNewItemDescription('')
    setSelectedCategoryForAdd(selectedCategory)

    setInitialArticleState({
      title,
      slug,
      publishedAt,
      isDraft,
      previewFile: { mode: 'file', file: null, url: '' },
      blocks,
    })
    setUnsavedArticleChanges(false)
    setArticleModalOpened(true)
  }

  const openEditArticleModal = (item: LibraryItem) => {
    setItemFormError('')
    setEditingItemId(item.id)
    setNewItemType(item.type)

    const title = item.title
    const slug = item.page?.slug && item.page.slug.startsWith('library/')
      ? item.page.slug.slice('library/'.length)
      : (item.page?.slug || '')

    let publishedAt: Date | null = null
    if (item.page?.publishedAt) {
      const d = new Date(item.page.publishedAt)
      publishedAt = isNaN(d.getTime()) ? null : d
    }

    const isDraft = item.page?.isDraft ?? true
    const blocks = (item.page?.blocks || []).map(b => ({ ...b }))

    setNewItemTitle(title)
    setArticleSlug(slug)
    setArticlePublishedAt(publishedAt)
    setArticleIsDraft(isDraft)
    setArticleBlocks(blocks)
    setArticlePreviewFile({
      mode: item.previewImage ? 'url' : 'file',
      file: null,
      url: item.previewImage || '',
    })
    setNewItemDescription(item.description || '')
    setSelectedCategoryForAdd(item.categoryId)

    setInitialArticleState({
      title,
      slug,
      publishedAt,
      isDraft,
      previewFile: {
        mode: item.previewImage ? 'url' : 'file',
        file: null,
        url: item.previewImage || '',
      },
      blocks,
    })
    setUnsavedArticleChanges(false)
    setArticleModalOpened(true)
  }

  const closeArticleModal = () => {
    setArticleModalOpened(false)
    setEditingItemId(null)
    setItemFormError('')
    setUnsavedArticleChanges(false)
  }

  const handleRequestCloseArticleModal = () => {
    if (unsavedArticleChanges) {
      setConfirmCloseArticleModal(true)
    } else {
      closeArticleModal()
    }
  }

  const handleConfirmCloseArticle = () => {
    setConfirmCloseArticleModal(false)
    closeArticleModal()
  }

  const handleCancelCloseArticle = () => {
    setConfirmCloseArticleModal(false)
  }

  useEffect(() => {
    if (!articleModalOpened || !initialArticleState) return

    const publishedAtChanged =
      (articlePublishedAt && initialArticleState.publishedAt)
        ? articlePublishedAt.getTime() !== initialArticleState.publishedAt.getTime()
        : articlePublishedAt !== initialArticleState.publishedAt

    const previewFileChanged =
      articlePreviewFile.mode !== initialArticleState.previewFile.mode ||
      articlePreviewFile.file !== initialArticleState.previewFile.file ||
      articlePreviewFile.url !== initialArticleState.previewFile.url

    const changed =
      newItemTitle !== initialArticleState.title ||
      articleSlug !== initialArticleState.slug ||
      articleIsDraft !== initialArticleState.isDraft ||
      previewFileChanged ||
      publishedAtChanged ||
      JSON.stringify(articleBlocks) !== JSON.stringify(initialArticleState.blocks)

    setUnsavedArticleChanges(changed)
  }, [newItemTitle, articleSlug, articlePublishedAt, articleIsDraft, articlePreviewFile, articleBlocks, articleModalOpened, initialArticleState])

  const handleSaveArticle = async () => {
    const title = newItemTitle.trim()
    const slug = articleSlug.trim()

    if (!title) {
      setItemFormError('Укажите название статьи')
      return
    }

    if (!slug) {
      setItemFormError('Укажите адрес статьи (слаг)')
      return
    }

    if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
      setItemFormError('Слаг должен содержать только латинские буквы, цифры и дефисы, без "/"')
      return
    }

    if (!selectedCategoryForAdd) {
      setItemFormError('Выберите категорию')
      return
    }

    try {
      setCreatingItem(true)
      setUpdatingItem(true)
      setItemFormError('')

      const token = localStorage.getItem('admin_token')
      const formData = new FormData()

      formData.append('type', 'article')
      formData.append('title', title)
      formData.append('slug', slug)
      formData.append('isPublished', articleIsDraft ? 'false' : 'true')
      formData.append('isDraft', articleIsDraft ? 'true' : 'false')
      formData.append('categoryId', selectedCategoryForAdd.toString())
      formData.append('publishedAt', articlePublishedAt?.toISOString() || new Date().toISOString())
      formData.append('blocks', JSON.stringify(Array.isArray(articleBlocks) ? articleBlocks : []))

      console.log('📤 Сохраняем статью с блоками:', {
        blocksCount: articleBlocks.length,
        blocks: articleBlocks,
        blockTypes: articleBlocks.map(b => b.type),
      })

      if (articlePreviewFile.file) {
        formData.append('previewImage', articlePreviewFile.file)
      } else if (articlePreviewFile.mode === 'url' && articlePreviewFile.url.trim()) {
        formData.append('previewImageUrl', articlePreviewFile.url.trim())
      }

      let response
      if (editingItemId) {
        response = await fetch(`${API_ENDPOINTS.LIBRARY}/${editingItemId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })
      } else {
        response = await fetch(API_ENDPOINTS.LIBRARY, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Не удалось сохранить статью')
      }

      await loadLibrary()
      closeArticleModal()
    } catch (err) {
      setItemFormError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setCreatingItem(false)
      setUpdatingItem(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Библиотека">
        <Container className="py-4">
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: 400 }}
          >
            <Spinner animation="border" role="status" />
          </div>
        </Container>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Библиотека">
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
    <DashboardLayout title="Библиотека">
      <Container className="py-4">
        <div className="d-flex flex-column gap-4">
          <div>
            <h1 className="mb-1">Библиотека</h1>
            <p className="text-muted mb-3">Управление книгами и статьями</p>
            <a href="https://disk.yandex.ru/d/JeDA7dVSUSZLeA"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-dark  d-flex align-items-center"
              style={{ width: 'fit-content', margin: '20px 0' }}
            >
              <i className="bi bi-info-lg me-2"></i>
              Советы по публикации
            </a>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="primary"
              className="d-inline-flex align-items-center gap-2"
              onClick={openAddCategoryModal}
            >
              <i className="bi bi-plus-lg" />
              Добавить категорию
            </Button>
          </div>

          {groupedItems.length === 0 ? (
            <div className="bg-white border rounded p-4">
              <p className="mb-0 text-muted text-center">
                Категории не найдены. Добавьте первую категорию.
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {groupedItems.map((group) => (
                <div key={group.category.id} className="bg-white border rounded p-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="h4 mb-0">{group.category.name}</h3>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="d-inline-flex align-items-center gap-2"
                        onClick={() => openAddItemModal(group.category.id)}
                      >
                        <i className="bi bi-plus-lg" />
                        Добавить книгу
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="d-inline-flex align-items-center gap-2"
                        onClick={() => openAddArticleModal(group.category.id)}
                      >
                        <i className="bi bi-plus-lg" />
                        Добавить статью
                      </Button>
                    </div>
                  </div>

                  {group.items.length === 0 ? (
                    <p className="text-muted mb-0">
                      В этой категории нет материалов
                    </p>
                  ) : (
                    <Row className="g-3">
                      {group.items.map((item) => {
                        const imgSrc = getFileUrl(item.previewImage ?? '')
                        return (
                          <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
                            <Card className="h-100" style={{ border: '1px solid #dee2e0', borderRadius: '8px' }}>
                              <div className="position-relative">
                                <div className="top-0 d-flex start-0 mb-1 justify-content-between" style={{ paddingLeft: '10px' }}>
                                  <Badge bg={item.type === 'book' ? 'primary' : 'success'} style={{ height: 'fit-content', width: 'fit-content', padding: '8px 10px' }}>
                                    <i className={`bi ${item.type === 'book' ? 'bi-book' : 'bi-file-text'} me-1`} />
                                    {item.type === 'book' ? 'Книга' : 'Статья'}
                                  </Badge>
                                  <div className="d-flex gap-2 mt-auto justify-content-end me-2">
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => openEditItemModal(item)}
                                      title="Редактировать"
                                    >
                                      <i className="bi bi-pencil" />
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => openDeleteConfirm(item)}
                                      title="Удалить"
                                    >
                                      <i className="bi bi-trash" />
                                    </Button>
                                  </div>
                                </div>
                                {imgSrc && (
                                  <Card.Img
                                    variant="top"
                                    src={imgSrc}
                                    alt={item.title}
                                    style={{ objectFit: 'contain', height: 250 }}
                                  />
                                )}

                              </div>
                              <Card.Body className="d-flex flex-column gap-2" style={{ padding: '15px 10px 10px 10px' }}>
                                <h6 className="card-title mb-0" style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}>
                                  {item.title}
                                </h6>

                                {item.description && (
                                  <div
                                    className="text-muted small"
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: item.description }}
                                  />
                                )}

                                <Badge bg={item.isPublished ? 'success' : 'secondary'} style={{ width: 'fit-content' }}>
                                  {item.isPublished ? 'Опубликовано' : 'Черновик'}
                                </Badge>


                              </Card.Body>
                            </Card>
                          </Col>
                        )
                      })}
                    </Row>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>

      <Modal
        show={addCategoryModalOpened}
        onHide={() => setAddCategoryModalOpened(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Добавить категорию</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {categoryFormError && (
            <Alert variant="danger" className="d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{categoryFormError}</span>
            </Alert>
          )}

          <Form>
            <Form.Group controlId="categoryName">
              <Form.Label>
                Название категории <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder='Например: Журнал "Охраняется государством"'
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.currentTarget.value)}
                disabled={creatingCategory}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setAddCategoryModalOpened(false)}
            disabled={creatingCategory}
          >
            Отмена
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateCategory}
            disabled={creatingCategory}
          >
            {creatingCategory && (
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
        show={confirmDeleteOpen}
        onHide={() => {
          if (!deletingItemId) {
            setConfirmDeleteOpen(false)
            setItemPendingDelete(null)
          }
        }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Удалить материал</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-0">Вы уверены, что хотите удалить «{itemPendingDelete?.title}»?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              if (!deletingItemId) {
                setConfirmDeleteOpen(false)
                setItemPendingDelete(null)
              }
            }}
            disabled={!!deletingItemId}
          >
            Отмена
          </Button>
          <Button
            variant="danger"
            onClick={() => itemPendingDelete && handleDeleteItem(itemPendingDelete.id)}
            disabled={!!deletingItemId}
          >
            {deletingItemId === itemPendingDelete?.id && (
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
        show={addItemModalOpened}
        onHide={() => setAddItemModalOpened(false)}
        centered
        size="xl"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingItemId ? 'Редактировать материал' : 'Добавить материал'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
          {itemFormError && (
            <Alert variant="danger" className="d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{itemFormError}</span>
            </Alert>
          )}

          <Form>
            <Form.Group className="mb-3" controlId="itemCategory">
              <Form.Label>
                Категория <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={selectedCategoryForAdd || ''}
                onChange={(e) => setSelectedCategoryForAdd(e.target.value ? parseInt(e.target.value, 10) : null)}
                disabled={creatingItem || updatingItem}
              >
                <option value="">Выберите категорию</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="itemType">
              <Form.Label>
                Тип <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value as 'book' | 'article')}
                disabled={creatingItem || updatingItem}
              >
                <option value="book">Книга</option>
                <option value="article">Статья</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3" controlId="itemTitle">
              <Form.Label>
                Название <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Название книги или статьи"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.currentTarget.value)}
                disabled={creatingItem || updatingItem}
              />
            </Form.Group>

            <div className="mb-3">
              <RichTextEditorField
                label="Описание"
                value={newItemDescription}
                onChange={setNewItemDescription}
              />
            </div>

            <div className="mb-3">
              <Form.Label>
                Контент <span className="text-danger">*</span>
              </Form.Label>
              <Tab.Container
                activeKey={contentMode}
                onSelect={(key) => setContentMode(key as 'url' | 'file')}
              >
                <Nav variant="tabs" className="mb-3">
                  <Nav.Item>
                    <Nav.Link eventKey="url">
                      <i className="bi bi-link-45deg me-2"></i>
                      URL ссылка
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="file">
                      <i className="bi bi-file-earmark-pdf me-2"></i>
                      Загрузить PDF
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
                <Tab.Content>
                  <Tab.Pane eventKey="url">
                    <Form.Group controlId="itemContentUrl">
                      <Form.Control
                        type="text"
                        placeholder="https://example.com/document.pdf"
                        value={newItemContentUrl}
                        onChange={(e) => setNewItemContentUrl(e.currentTarget.value)}
                        disabled={creatingItem || updatingItem}
                      />
                      <Form.Text className="text-muted">
                        Ссылка на облако или внешний ресурс
                      </Form.Text>
                    </Form.Group>
                  </Tab.Pane>
                  <Tab.Pane eventKey="file">
                    <Form.Group controlId="itemPdfFile">
                      <Form.Control
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const target = e.target as HTMLInputElement
                          setNewItemPdfFile(target.files?.[0] || null)
                        }}
                        disabled={creatingItem || updatingItem}
                      />
                      <Form.Text className="text-muted">
                        Загрузите PDF файл для хранения на сервере
                      </Form.Text>
                    </Form.Group>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </div>

            <ImageUploadInput
              id="itemPreviewImage"
              label={
                <span>
                  Изображение обложки (JPG/PNG/WEBP)
                  {!editingItemId && <span className="text-danger"> *</span>}
                </span>
              }
              helpText={
                editingItemId
                  ? 'Оставьте поле пустым, если не нужно менять изображение.'
                  : 'Загрузите изображение обложки или укажите URL изображения.'
              }
              value={newItemPreviewImage}
              onChange={(val) => {
                setNewItemPreviewImage(val)
                setItemFormError('')
              }}
              disabled={creatingItem || updatingItem}
            />

            <Form.Group className="mb-3" controlId="itemStatus">
              <Form.Label>
                Статус <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={newItemIsPublished ? 'true' : 'false'}
                onChange={(e) => setNewItemIsPublished(e.target.value === 'true')}
                disabled={creatingItem || updatingItem}
              >
                <option value="true">Опубликовано</option>
                <option value="false">Черновик</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setAddItemModalOpened(false)}
            disabled={creatingItem || updatingItem}
          >
            Отмена
          </Button>
          {editingItemId ? (
            <Button
              variant="primary"
              onClick={handleUpdateItem}
              disabled={updatingItem}
            >
              {updatingItem && (
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  className="me-2"
                />
              )}
              Обновить
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleCreateItem}
              disabled={creatingItem}
            >
              {creatingItem && (
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
          )}
        </Modal.Footer>
      </Modal>

      <Modal
        show={articleModalOpened}
        onHide={handleRequestCloseArticleModal}
        fullscreen={true}
        backdrop="static"
        dialogClassName="modal-fullscreen"
        contentClassName="border-0"
      >
        <div className="d-flex flex-column h-100">
          <div className="modal-body p-4" style={{ overflowY: 'auto' }}>
            <div className="row g-4">
              <div className="col-md-4" style={{ background: '#F7FAFF', padding: '20px 40px 40px 60px', display: 'flex', flexDirection: 'column', height: '100%', minHeight: '710px' }}>
                <div className="mb-4">
                  <span className="text-danger fs-5 me-2">*</span>
                  <span className="text-danger">— обязательное поле для заполнения</span>
                </div>

                {itemFormError && (
                  <Alert variant="danger" className="mb-4">
                    <IconAlertCircle size={16} className="me-2" />
                    {itemFormError}
                  </Alert>
                )}

                <Form.Group className="mb-4">
                  <Form.Label>
                    Название статьи <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Введите название статьи"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    required
                  />
                </Form.Group>

                <ImageUploadInput
                  id="articlePreviewImage"
                  label="Превью изображения (JPG/PNG/WEBP)"
                  helpText={editingItemId ? 'Оставьте пустым, чтобы сохранить текущее изображение' : 'Опционально'}
                  value={articlePreviewFile}
                  onChange={setArticlePreviewFile}
                  disabled={creatingItem || updatingItem}
                />

                <Form.Group className="mb-4 mt-4">
                  <Form.Label>
                    Адрес статьи <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      placeholder="например: istoriya-restavratsii"
                      value={articleSlug}
                      onChange={(e) => setArticleSlug(e.target.value)}
                      required
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={handleGenerateSlug}
                      disabled={!newItemTitle.trim() || creatingItem || updatingItem}
                      title="Сгенерировать из названия"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <i className="bi bi-magic me-1"></i>
                      Авто
                    </Button>
                  </div>
                  <Form.Text className="text-muted">
                    Используйте только латинские буквы, цифры и дефисы. Итоговый URL: /library/{articleSlug}
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label style={{ width: '100%' }}>
                    Дата и время публикации <span className="text-danger">*</span>
                  </Form.Label>
                  <DatePicker
                    selected={articlePublishedAt || undefined}
                    onChange={(date: Date | null) => setArticlePublishedAt(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={5}
                    dateFormat="dd.MM.yyyy HH:mm"
                    timeCaption="Время"
                    className="form-control"
                    placeholderText="Выберите дату и время"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    Статус <span className="text-danger">*</span>
                  </Form.Label>
                  <div className="d-flex flex-row gap-4">
                    <Form.Check
                      type="radio"
                      id="article-status-published"
                      name="article-status"
                      label="Опубликовано"
                      checked={articleIsDraft === false}
                      onChange={() => setArticleIsDraft(false)}
                    />
                    <Form.Check
                      type="radio"
                      id="article-status-draft"
                      name="article-status"
                      label="Черновик"
                      checked={articleIsDraft === true}
                      onChange={() => setArticleIsDraft(true)}
                    />
                  </div>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>
                    Категория <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={categories.find(cat => cat.id === selectedCategoryForAdd)?.name || ''}
                    disabled
                    readOnly
                  />
                  <Form.Text className="text-muted">
                    Статьи автоматически добавляются в категорию "Статьи"
                  </Form.Text>
                </Form.Group>
              </div>

              <div className="col-md-8" style={{ padding: '10px 40px' }}>
                <PageBlocksEditor
                  blocks={articleBlocks}
                  setBlocks={setArticleBlocks}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer border-top d-flex justify-content-end gap-2">

            <a href="https://disk.yandex.ru/d/JeDA7dVSUSZLeA"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-dark  d-flex align-items-center"
              style={{ width: 'fit-content', marginRight: 'auto' }}
            >
              <i className="bi bi-info-lg me-2"></i>
              Советы по публикации
            </a>
            <Button
              variant="outline-primary"
              onClick={handleSaveArticle}
              disabled={creatingItem || updatingItem}
            >
              <IconDeviceFloppy size={16} className="me-2" />
              Сохранить
            </Button>
            <Button
              variant="outline-dark"
              onClick={handleRequestCloseArticleModal}
              disabled={creatingItem || updatingItem}
              style={{
                height: '38px',
                width: '38px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
              }}
              aria-label="Закрыть"
            >
              <IconX size={22} />
            </Button>
          </div>
        </div>

        <Modal
          show={confirmCloseArticleModal}
          onHide={handleCancelCloseArticle}
          centered
        >
          <Modal.Body className="text-center py-4">
            <p>Последние изменения не сохранены.<br />Закрыть панель?</p>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={handleCancelCloseArticle}>
              Отмена
            </Button>
            <Button variant="danger" onClick={handleConfirmCloseArticle}>
              ОК
            </Button>
          </Modal.Footer>
        </Modal>
      </Modal>
    </DashboardLayout>
  )
}
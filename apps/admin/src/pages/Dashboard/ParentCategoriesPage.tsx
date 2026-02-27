import { useEffect, useState } from 'react'
import {
  Container,
  Paper,
  Stack,
  Title,
  Text,
  Button,
  Loader,
  Center,
  Alert,
  Modal,
  TextInput,
  Group,
  Table,
  ActionIcon,
} from '@mantine/core'
import { IconPlus, IconAlertCircle, IconTrash, IconRefresh, IconChevronRight } from '@tabler/icons-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'

type Category = {
  id: number
  name: string
  createdAt: string
  children: any[]
}

export default function ParentCategoriesPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpened, setModalOpened] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [formError, setFormError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const [deleteModalOpened, setDeleteModalOpened] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const token = localStorage.getItem('admin_token')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
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
      const parentCategories = Array.isArray(data) 
        ? data.filter((c: any) => !c.parentId) 
        : []
      console.log('Loaded categories:', parentCategories)
      setCategories(parentCategories)
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки категорий')
      console.error('Load categories error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async () => {
    setFormError('')

    if (!categoryName.trim()) {
      setFormError('Введите название категории')
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
          name: categoryName.trim(),
        }),
      })

      if (!res.ok) {
        throw new Error(`Ошибка создания: ${res.status}`)
      }

      const newCategory = await res.json()
      setCategories([...categories, newCategory])
      setCategoryName('')
      setModalOpened(false)
    } catch (err: any) {
      setFormError(err.message || 'Ошибка при создании категории')
      console.error('Create category error:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    try {
      setIsDeleting(true)
      const res = await fetch(API_ENDPOINTS.DOCUMENT_CATEGORIES_DELETE(deletingCategory.id), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Ошибка удаления: ${res.status}`)
      }

      setCategories(categories.filter((c) => c.id !== deletingCategory.id))
      setDeleteModalOpened(false)
      setDeletingCategory(null)
    } catch (err: any) {
      setError(err.message || 'Ошибка при удалении категории')
      console.error('Delete category error:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenSubcategories = (categoryId: number) => {
    navigate(`/npa/${categoryId}`)
  }

  if (loading) {
    return (
      <DashboardLayout title="Основные категории">
        <Container size="lg" py="xl">
          <Center h={300}>
            <Stack align="center">
              <Loader />
              <Text>Загрузка...</Text>
            </Stack>
          </Center>
        </Container>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Основные категории">
      <Container size="lg" py="xl">
        <Stack gap="lg">
          <Group justify="space-between" align="center">
            <div>
              <Title order={2}>Основные категории документов</Title>
              <Text size="sm" c="dimmed">
                Создайте основные категории для организации документов
              </Text>
            </div>
            <Group>
              <Button variant="default" onClick={loadCategories} leftSection={<IconRefresh size={16} />}>
                Обновить
              </Button>
              <Button onClick={() => setModalOpened(true)} leftSection={<IconPlus size={16} />}>
                Добавить категорию
              </Button>
            </Group>
          </Group>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} color="red" title="Ошибка">
              {error}
            </Alert>
          )}

          {categories.length === 0 ? (
            <Paper p="lg" ta="center">
              <Text c="dimmed">Категорий не найдено</Text>
            </Paper>
          ) : (
            <Paper withBorder>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Название</Table.Th>
                    <Table.Th>Подкатегории</Table.Th>
                    <Table.Th>Дата создания</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Действия</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {categories.map((category) => (
                    <Table.Tr key={category.id}>
                      <Table.Td>{category.name}</Table.Td>
                      <Table.Td>{category.children?.length || 0}</Table.Td>
                      <Table.Td>{new Date(category.createdAt).toLocaleDateString('ru-RU')}</Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Group justify="flex-end" gap={0}>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleOpenSubcategories(category.id)}
                            title="Управлять подкатегориями"
                          >
                            <IconChevronRight size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => {
                              setDeletingCategory(category)
                              setDeleteModalOpened(true)
                            }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          )}
        </Stack>

        <Modal opened={modalOpened} onClose={() => setModalOpened(false)} title="Добавить категорию">
          <Stack gap="md">
            {formError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red">
                {formError}
              </Alert>
            )}
            <TextInput
              label="Название"
              placeholder="Введите название категории"
              value={categoryName}
              onChange={(e) => setCategoryName(e.currentTarget.value)}
              disabled={isCreating}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setModalOpened(false)} disabled={isCreating}>
                Отмена
              </Button>
              <Button onClick={handleAddCategory} loading={isCreating}>
                Создать
              </Button>
            </Group>
          </Stack>
        </Modal>

        <Modal
          opened={deleteModalOpened}
          onClose={() => setDeleteModalOpened(false)}
          title="Удалить категорию"
        >
          <Stack gap="md">
            <Text>
              Вы уверены, что хотите удалить категорию "<strong>{deletingCategory?.name}</strong>"?
            </Text>
            {deletingCategory?.children && deletingCategory.children.length > 0 && (
              <Alert icon={<IconAlertCircle size={16} />} color="yellow">
                В этой категории есть {deletingCategory.children.length} подкатегори(й). При удалении они
                также будут удалены.
              </Alert>
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setDeleteModalOpened(false)} disabled={isDeleting}>
                Отмена
              </Button>
              <Button color="red" onClick={handleDeleteCategory} loading={isDeleting}>
                Удалить
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Container>
    </DashboardLayout>
  )
}



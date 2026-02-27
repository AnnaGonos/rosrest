import { useEffect, useRef, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Spinner,
  Alert,
  Modal,
  Form,
} from 'react-bootstrap';
import DashboardLayout from '../../layouts/DashboardLayout';
import { API_ENDPOINTS } from '../../config/api';
import ImageUploadInput, { type ImageUploadValue } from '../../components/ImageUploadInput';

type Employee = {
  id?: string;
  fullName: string;
  position?: string | null;
  photoUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  profileUrl?: string | null;
  orderIndex?: number;
  createdAt?: string;
};

export default function EmployeesPage() {
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addModalOpened, setAddModalOpened] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoSource, setPhotoSource] = useState<ImageUploadValue>({
    mode: 'file',
    file: null,
    url: '',
  });
  const [formError, setFormError] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [editingItem, setEditingItem] = useState<Employee | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Employee | null>(null);
  const prevOrderRef = useRef<Employee[] | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_ENDPOINTS.EMPLOYEES_LIST, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Ошибка загрузки сотрудников');
      const data = await res.json();
      const sorted = (data || []).slice().sort((a: Employee, b: Employee) => {
        const ta = typeof a.orderIndex === 'number' ? a.orderIndex : Number.MAX_SAFE_INTEGER;
        const tb = typeof b.orderIndex === 'number' ? b.orderIndex : Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });
      setItems(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setPhotoSource({ mode: 'file', file: null, url: '' });
    setFullName('');
    setPosition('');
    setEmail('');
    setPhone('');
    setProfileUrl('');
    setFormError('');
    setEditingItem(null);
    setAddModalOpened(true);
  };

  const openEditModal = (it: Employee) => {
    setEditingItem(it);
    setPhotoSource({
      mode: 'url',
      file: null,
      url: it.photoUrl || '',
    });
    setFullName(it.fullName || '');
    setPosition(it.position || '');
    setEmail(it.email || '');
    setPhone(it.phone || '');
    setProfileUrl(it.profileUrl || '');
    setFormError('');
    setAddModalOpened(true);
  };

  const handleUpload = async () => {
    if (!fullName?.trim()) {
      setFormError('Введите имя');
      return;
    }

    if (!position?.trim()) {
      setFormError('Укажите должность');
      return;
    }

    const isEdit = Boolean(editingItem?.id);

    const trimmedPhotoUrl = photoSource.url.trim();
    const hasFile = !!photoSource.file;
    const hasUrl = !!trimmedPhotoUrl;

    if (!isEdit && !hasFile && !hasUrl) {
      setFormError('Загрузите фото сотрудника или укажите ссылку');
      return;
    }
    try {
      setUploading(true);
      setFormError('');
      const token = localStorage.getItem('admin_token');

      const fd = new FormData();
      fd.append('fullName', fullName.trim());
      fd.append('position', position.trim());
      if (email?.trim()) fd.append('email', email.trim());
      if (phone?.trim()) fd.append('phone', phone.trim());
      if (profileUrl?.trim()) fd.append('profileUrl', profileUrl.trim());

      if (!isEdit) {
        const newIndex = items.length;
        fd.append('orderIndex', String(newIndex));
      }

      if (photoSource.file) {
        fd.append('photo', photoSource.file);
      } else if (trimmedPhotoUrl) {
        fd.append('photoUrl', trimmedPhotoUrl);
      }

      const url = editingItem?.id
        ? API_ENDPOINTS.EMPLOYEES_UPDATE(editingItem.id)
        : API_ENDPOINTS.EMPLOYEES_CREATE;
      const method = editingItem?.id ? 'PATCH' : 'POST';

      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method,
        headers,
        body: fd,
      });

      if (!res.ok) {
        let errorMsg = `Ошибка ${res.status}: не удалось ${editingItem ? 'обновить' : 'создать'} сотрудника`;
        try {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const data = await res.json();
            errorMsg = data.message || data.error || errorMsg;
          } else {
            const text = await res.text();
            if (text) errorMsg = text.substring(0, 200);
          }
        } catch (e) {
          console.error('Error parsing server response:', e);
        }
        throw new Error(errorMsg);
      }

      setAddModalOpened(false);
      setEditingItem(null);
      setPhotoSource({ mode: 'file', file: null, url: '' });
      await loadEmployees();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setUploading(false);
    }
  };

  const openDeleteModal = (it: Employee) => {
    setDeletingItem(it);
    setDeleteModalOpened(true);
  };

  const handleDelete = async () => {
    if (!deletingItem || !deletingItem.id) return;
    try {
      setDeletingId(deletingItem.id);
      const token = localStorage.getItem('admin_token');
      const res = await fetch(API_ENDPOINTS.EMPLOYEES_DELETE(String(deletingItem.id)), {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!res.ok) throw new Error('Не удалось удалить');
      setDeleteModalOpened(false);
      await loadEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setDeletingId(null);
    }
  };

  const onDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    const src = Number(e.dataTransfer.getData('text/plain'));
    if (isNaN(src)) return;
    if (src === targetIdx) return;

    if (!prevOrderRef.current) prevOrderRef.current = items.slice();
    const list = items.slice();
    const [moved] = list.splice(src, 1);
    list.splice(targetIdx, 0, moved);
    list.forEach((it, i) => {
      it.orderIndex = i;
    });
    setItems(list);
    setOrderDirty(true);
  };

  const cancelOrder = () => {
    if (prevOrderRef.current) {
      setItems(prevOrderRef.current);
    }
    prevOrderRef.current = null;
    setOrderDirty(false);
  };

  const saveOrder = async () => {
    if (!orderDirty) return;
    try {
      const token = localStorage.getItem('admin_token');
      const list = items.slice();
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        if (!it.id) continue;
        const body = { orderIndex: i };
        const res = await fetch(API_ENDPOINTS.EMPLOYEES_UPDATE(String(it.id)), {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`Patch failed for ${it.id}: ${res.status} ${text}`);
        }
      }
      prevOrderRef.current = null;
      setOrderDirty(false);
      await loadEmployees();
    } catch (err) {
      console.error('saveOrder failed', err);
      setError(err instanceof Error ? err.message : 'Ошибка сохранения порядка');
    }
  };

  const resolveImageUrl = (raw?: string | null) => {
    if (!raw) return undefined;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:3002';
    return raw.startsWith('/') ? `${base}${raw}` : raw;
  };

  if (loading)
    return (
      <DashboardLayout title="Сотрудники">
        <Container className="py-5 text-center">
          <Spinner animation="border" />
        </Container>
      </DashboardLayout>
    );

  if (error)
    return (
      <DashboardLayout title="Сотрудники">
        <Container className="py-4">
          <Alert variant="danger">{error}</Alert>
          <Button variant="outline-primary" onClick={loadEmployees}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="bi bi-arrow-repeat me-1"
              viewBox="0 0 16 16"
            >
              <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
              <path
                fillRule="evenodd"
                d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"
              />
            </svg>
            Повторить
          </Button>
        </Container>
      </DashboardLayout>
    );

  return (
    <DashboardLayout title="Сотрудники">
      <Container className="py-4">
        <div className="mb-4">
          <h1>Контакты</h1>
          <p className="text-muted">
            Чтобы поменять порядок расположения сотрудников на странице - просто перетащите карточки.
          </p>
          <a href="https://disk.yandex.ru/d/7nMBxpNF3sybMA"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-dark  d-flex align-items-center"
            style={{ width: 'fit-content', margin: '20px 0' }}
          >
            <i className="bi bi-info-circle me-2"></i>
            Советы по публикации
          </a>
          <small className="text-primary">Всего: {items.length}</small>
        </div>

        <div className="d-flex gap-2 mb-4">
          <Button variant="primary" onClick={openAddModal}>
            <i className="bi bi-plus-lg me-2"></i>
            Добавить
          </Button>
        </div>


        {orderDirty && (
          <div className="d-flex gap-2 mb-4">
            <Button variant="success" onClick={saveOrder}>
              Сохранить порядок
            </Button>
            <Button variant="outline-secondary" onClick={cancelOrder}>
              Отменить изменения
            </Button>
          </div>
        )}

        <Row>
          {items.map((it, idx) => (
            <Col key={it.id || idx} xs={12} sm={6} md={4} className="mb-4">
              <Card
                className="position-relative"
                draggable
                style={{ paddingTop: '0', height: '100%' }}
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, idx)}
              >
                <Card.Body>
                  <div className="mb-3">
                    {resolveImageUrl(it.photoUrl) ? (
                      <img
                        src={resolveImageUrl(it.photoUrl)!}
                        alt={it.fullName}
                        style={{ width: '100%', height: '350px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center bg-light"
                        style={{ width: '100%', height: '350px' }}
                      >
                        {it.fullName
                          ?.split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    )}
                  </div>
                  <h5 className="fw-bold">{it.fullName}</h5>
                  {it.position && <p className="text-muted mb-1">{it.position}</p>}
                  {it.email && (
                    <a href={`mailto:${it.email}`} className="d-block text-decoration-none">
                      {it.email}
                    </a>
                  )}
                  {it.phone && <p className="mb-0">{it.phone}</p>}
                </Card.Body>

                <div className="btn-group" style={{ display: 'flex', width: 'fit-content', position: 'absolute', bottom: '0', right: '0' }}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => openEditModal(it)}
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => openDeleteModal(it)}
                    disabled={deletingId === it.id}
                  >
                    {deletingId === it.id ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <i className="bi bi-trash"></i>
                    )}
                  </Button>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      <Modal
        show={addModalOpened}
        onHide={() => setAddModalOpened(false)}
        centered
        dialogClassName="modal-content-md"
      >
        <Modal.Header closeButton>
          <Modal.Title>{editingItem ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Form>
            <Row>
              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>ФИО <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Иванов Иван"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Должность <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Роль"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    required
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Телефон</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="+7..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Ссылка на профиль</Form.Label>
                  <Form.Control
                    type="url"
                    placeholder="https://..."
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

            <ImageUploadInput
              id="employeePhoto"
              label={<span>Фото сотрудника <span className="text-danger">*</span></span>}
              helpText="Выберите файл (JPG, PNG, WEBP) или укажите URL-ссылку."
              value={photoSource}
              onChange={(val) => {
                setPhotoSource(val);
                setFormError('');
              }}
              disabled={uploading}
              accept="image/jpeg,image/png,image/webp"
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAddModalOpened(false)} disabled={uploading}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" /> Загрузка...
              </>
            ) : editingItem ? (
              'Сохранить'
            ) : (
              'Создать'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={deleteModalOpened} onHide={() => setDeleteModalOpened(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Удалить</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Уверены, что хотите удалить?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModalOpened(false)} disabled={deletingId !== null}>
            Отменить
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deletingId !== null}>
            {deletingId ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" /> Удаление...
              </>
            ) : (
              'Удалить'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </DashboardLayout>
  );
}


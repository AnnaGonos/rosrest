import { Form, Button, Row, Col, Card } from 'react-bootstrap'
import ImageUploadInput, { ImageUploadValue } from './ImageUploadInput'

export interface ServiceContactData {
    id?: string
    fullName: string
    photoMode: 'file' | 'url'
    photo: string
    photoFile?: File | null
    position?: string
    email?: string
    phone?: string
    order: number
}

interface ServiceContactsEditorProps {
    contacts: ServiceContactData[]
    setContacts: (contacts: ServiceContactData[]) => void
}

export function ServiceContactsEditor({ contacts, setContacts }: ServiceContactsEditorProps) {
    const handleAddContact = () => {
        setContacts([
            ...contacts,
            {
                fullName: '',
                photoMode: 'file',
                photo: '',
                photoFile: null,
                position: '',
                email: '',
                phone: '',
                order: contacts.length
            }
        ])
    }

    const handleRemoveContact = (index: number) => {
        setContacts(contacts.filter((_, i) => i !== index))
    }

    const handleMoveUp = (index: number) => {
        if (index === 0) return
        const updated = [...contacts]
        const temp = updated[index - 1]
        updated[index - 1] = updated[index]
        updated[index] = temp
        setContacts(updated)
    }

    const handleMoveDown = (index: number) => {
        if (index === contacts.length - 1) return
        const updated = [...contacts]
        const temp = updated[index + 1]
        updated[index + 1] = updated[index]
        updated[index] = temp
        setContacts(updated)
    }

    const handleContactChange = (index: number, field: keyof ServiceContactData, value: any) => {
        const updated = [...contacts]
        updated[index] = { ...updated[index], [field]: value }
        setContacts(updated)
    }

    const handlePhotoChange = (index: number, value: ImageUploadValue) => {
        const updated = [...contacts]
        updated[index] = { 
            ...updated[index], 
            photoMode: value.mode,
            photoFile: value.file,
            photo: value.mode === 'url' ? value.url : (updated[index].photo || '')
        }
        setContacts(updated)
    }

    return (
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <Form.Label className="mb-0">Ответственные лица</Form.Label>
                <Button variant="outline-primary" size="sm" onClick={handleAddContact}>
                    <i className="bi bi-plus me-1"></i>
                    Добавить контакт
                </Button>
            </div>

            {contacts.length === 0 && (
                <p className="text-muted">Нет добавленных контактов</p>
            )}

            {contacts.map((contact, index) => (
                <Card key={index} className="mb-3" style={{ padding: '20px', backgroundColor: '#fff' }}>
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-3">
                            <h6 className="mb-0">Контакт №{index + 1}</h6>
                            <div className="btn-group">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleMoveUp(index)}
                                    disabled={index === 0}
                                    title="Переместить вверх"
                                >
                                    <i className="bi bi-arrow-up"></i>
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => handleMoveDown(index)}
                                    disabled={index === contacts.length - 1}
                                    title="Переместить вниз"
                                >
                                    <i className="bi bi-arrow-down"></i>
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleRemoveContact(index)}
                                    title="Удалить"
                                >
                                    <i className="bi bi-trash"></i>
                                </Button>
                            </div>
                        </div>

                        <Row>
                            <Col md={12} className="mb-3">
                                <Form.Label>
                                    ФИО <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Иванов Иван Иванович"
                                    value={contact.fullName || ''}
                                    onChange={(e) => handleContactChange(index, 'fullName', e.target.value)}
                                    required
                                />
                            </Col>

                            <Col md={12} className="mb-3">
                                <ImageUploadInput
                                    id={`contact-photo-${index}`}
                                    label="Фото"
                                    required={true}
                                    value={{
                                        mode: contact.photoMode,
                                        file: contact.photoFile || null,
                                        url: contact.photoMode === 'url' ? contact.photo : ''
                                    }}
                                    onChange={(value) => handlePhotoChange(index, value)}
                                />
                            </Col>

                            <Col md={12} className="mb-3">
                                <Form.Label>Должность</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Введите должность"
                                    value={contact.position || ''}
                                    onChange={(e) => handleContactChange(index, 'position', e.target.value)}
                                />
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="example@email.com"
                                    value={contact.email || ''}
                                    onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                                />
                            </Col>

                            <Col md={6} className="mb-3">
                                <Form.Label>Телефон</Form.Label>
                                <Form.Control
                                    type="tel"
                                    placeholder="+7 (999) 123-45-67"
                                    value={contact.phone || ''}
                                    onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                                />
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ))}
        </div>
    )
}

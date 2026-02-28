import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { API_ENDPOINTS } from '../../config/api';

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!/^\S+@\S+$/.test(email)) {
      setError('Введите корректный email');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_FORGOT_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        setError('Ошибка при отправке запроса');
        return;
      }
      setSuccess('Письмо для сброса пароля отправлено на указанный email');
    } catch {
      setError('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container>
        <Card className="shadow-lg mx-auto" style={{ maxWidth: 400 }}>
          <Card.Body className="p-4">
            <h3 className="mb-4 text-center">Запрос сброса пароля</h3>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Введите email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </Form.Group>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить ссылку'}
              </Button>
              <Button variant="link" className="w-100 mt-2" onClick={() => navigate('/login')}>
                Назад к входу
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

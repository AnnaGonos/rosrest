import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { API_ENDPOINTS } from '../../config/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 8) {
      setError('Минимум 8 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_RESET_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      });
      if (!response.ok) {
        setError('Ошибка сброса пароля');
        return;
      }
      setSuccess('Пароль успешно сброшен!');
      setTimeout(() => navigate('/'), 2000);
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
            <h3 className="mb-4 text-center">Сброс пароля</h3>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Новый пароль</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Введите новый пароль"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Подтвердите пароль</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Повторите пароль"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </Form.Group>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                {loading ? 'Сброс...' : 'Сбросить пароль'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

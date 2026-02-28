import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Container, Row, Col, Form, Button, Alert, Nav, Tab, Card } from 'react-bootstrap'
import { API_ENDPOINTS } from '../../config/api'
import { setToken, setEmail } from '../../utils/auth'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [initError, setInitError] = useState('')
  const [activeTab, setActiveTab] = useState<string>('login')

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginEmailError, setLoginEmailError] = useState('')
  const [loginPasswordError, setLoginPasswordError] = useState('')

  // Init form state
  const [initEmail, setInitEmail] = useState('')
  const [initPassword, setInitPassword] = useState('')
  const [initConfirmPassword, setInitConfirmPassword] = useState('')
  const [initEmailError, setInitEmailError] = useState('')
  const [initPasswordError, setInitPasswordError] = useState('')
  const [initConfirmPasswordError, setInitConfirmPasswordError] = useState('')

  const validateLoginForm = () => {
    let isValid = true

    if (!/^\S+@\S+$/.test(loginEmail)) {
      setLoginEmailError('Неверный email')
      isValid = false
    } else {
      setLoginEmailError('')
    }

    if (loginPassword.length < 6) {
      setLoginPasswordError('Минимум 6 символов')
      isValid = false
    } else {
      setLoginPasswordError('')
    }

    return isValid
  }

  const validateInitForm = () => {
    let isValid = true

    if (!/^\S+@\S+$/.test(initEmail)) {
      setInitEmailError('Неверный email')
      isValid = false
    } else {
      setInitEmailError('')
    }

    if (initPassword.length < 8) {
      setInitPasswordError('Минимум 8 символов')
      isValid = false
    } else {
      setInitPasswordError('')
    }

    if (initPassword !== initConfirmPassword) {
      setInitConfirmPasswordError('Пароли не совпадают')
      isValid = false
    } else {
      setInitConfirmPasswordError('')
    }

    return isValid
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateLoginForm()) return

    setLoading(true)
    setLoginError('')

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      if (!response.ok) {
        let errorMessage = 'Ошибка при входе'

        try {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } else {
            const text = await response.text()
            if (text.includes('Cannot POST') || text.includes('Cannot GET')) {
              errorMessage = 'Роут не найден на сервере. Убедитесь, что API запущен на http://localhost:3002 и перезагрузите страницу'
            } else if (text.includes('Аккаунта не существует') || text.includes('Admin not found')) {
              errorMessage = 'Аккаунта не существует. Пожалуйста, создайте его в разделе "Первый запуск"'
            } else if (text) {
              errorMessage = text.substring(0, 100)
            } else {
              errorMessage = `Ошибка сервера (${response.status}). Попробуйте перезагрузить страницу`
            }
          }
        } catch (parseErr) {
          errorMessage = `Ошибка сервера (${response.status}). Попробуйте перезагрузить страницу`
        }

        setLoginError(errorMessage)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setToken(data.token)
      setEmail(loginEmail)

      setTimeout(() => navigate('/'), 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setLoginError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleInit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateInitForm()) return

    setLoading(true)
    setInitError('')

    try {
      const response = await fetch(API_ENDPOINTS.ADMIN_INIT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: initEmail,
          password: initPassword,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Ошибка при инициализации'

        try {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const errorData = await response.json()
            const backendMessage = errorData.message || errorMessage

            if (backendMessage.includes('Admin already initialized')) {
              errorMessage = 'Аккаунт уже существует. Перейдите на вкладку "Вход"'
            } else {
              errorMessage = backendMessage
            }
          } else {
            const text = await response.text()
            if (text.includes('Cannot POST') || text.includes('Cannot GET')) {
              errorMessage = 'Роут не найден на сервере. Убедитесь, что API запущен на http://localhost:3002 и перезагрузите страницу'
            } else if (text.includes('Admin already initialized') || text.includes('Аккаунт уже существует')) {
              errorMessage = 'Аккаунт уже существует. Перейдите на вкладку "Вход"'
            } else if (text) {
              errorMessage = text.substring(0, 100)
            } else {
              errorMessage = `Ошибка сервера (${response.status}). Попробуйте перезагрузить страницу`
            }
          }
        } catch (parseErr) {
          errorMessage = `Ошибка сервера (${response.status}). Попробуйте перезагрузить страницу`
        }

        setInitError(errorMessage)
        throw new Error(errorMessage)
      }

      const loginResponse = await fetch(API_ENDPOINTS.ADMIN_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: initEmail,
          password: initPassword,
        }),
      })

      if (!loginResponse.ok) {
        throw new Error('Ошибка входа после инициализации')
      }

      const loginData = await loginResponse.json()
      setToken(loginData.token)
      setEmail(initEmail)

      setTimeout(() => navigate('/'), 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка'
      setInitError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <Card className="shadow-lg">
              <Card.Body className="p-5">
                <h2 className="text-center mb-4">Админка Rosrest</h2>

                <Tab.Container activeKey={activeTab} onSelect={(k) => {
                  setActiveTab(k || 'login')
                  setLoginError('')
                  setInitError('')
                }}>
                  <Nav variant="tabs" className="mb-4">
                    <Nav.Item>
                      <Nav.Link eventKey="login">Вход</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="init">Первый запуск</Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content>
                    <Tab.Pane eventKey="login">
                      <Form onSubmit={handleLogin}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="admin@rosrest.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            isInvalid={!!loginEmailError}
                          />
                          <Form.Control.Feedback type="invalid">
                            {loginEmailError}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Пароль</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Ваш пароль"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            isInvalid={!!loginPasswordError}
                          />
                          <Form.Control.Feedback type="invalid">
                            {loginPasswordError}
                          </Form.Control.Feedback>
                        </Form.Group>

                        {loginError && (
                          <Alert variant="danger" className="mb-3">
                            ❌ {loginError}
                          </Alert>
                        )}

                        <Button
                          variant="primary"
                          type="submit"
                          className="w-100 mb-3"
                          size="lg"
                          disabled={loading}
                        >
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          {loading ? 'Вход...' : 'Войти в панель'}
                        </Button>

                        <Button
                          variant="outline-secondary"
                          className="w-100 mb-2"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate('/reset-password');
                          }}
                        >
                          <i className="bi bi-key me-2"></i>
                          Забыли пароль?
                        </Button>

                        <hr />

                        <p className="text-center text-muted small">
                          Нет аккаунта?{' '}
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveTab('init')
                            }}
                            style={{ textDecoration: 'underline' }}
                          >
                            Создайте его во вкладке "Первый запуск"
                          </a>
                        </p>
                                          <Tab.Pane eventKey="forgot">
                                            <Form
                                              onSubmit={async (e) => {
                                                e.preventDefault();
                                                if (!loginEmail || !/^\S+@\S+$/.test(loginEmail)) {
                                                  setLoginEmailError('Введите корректный email');
                                                  return;
                                                }
                                                setLoading(true);
                                                setLoginError('');
                                                try {
                                                  const response = await fetch(API_ENDPOINTS.ADMIN_FORGOT_PASSWORD, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ email: loginEmail }),
                                                  });
                                                  if (!response.ok) {
                                                    setLoginError('Ошибка при отправке запроса на сброс пароля');
                                                    return;
                                                  }
                                                  setLoginError('Письмо для сброса пароля отправлено на указанный email');
                                                } catch (err) {
                                                  setLoginError('Ошибка при отправке запроса');
                                                } finally {
                                                  setLoading(false);
                                                }
                                              }}
                                            >
                                              <Form.Group className="mb-3">
                                                <Form.Label>Email для сброса пароля</Form.Label>
                                                <Form.Control
                                                  type="email"
                                                  placeholder="admin@rosrest.com"
                                                  value={loginEmail}
                                                  onChange={(e) => setLoginEmail(e.target.value)}
                                                  isInvalid={!!loginEmailError}
                                                />
                                                <Form.Control.Feedback type="invalid">
                                                  {loginEmailError}
                                                </Form.Control.Feedback>
                                              </Form.Group>
                                              {loginError && (
                                                <Alert variant="info" className="mb-3">
                                                  {loginError}
                                                </Alert>
                                              )}
                                              <Button
                                                variant="primary"
                                                type="submit"
                                                className="w-100 mb-3"
                                                size="lg"
                                                disabled={loading}
                                              >
                                                {loading ? 'Отправка...' : 'Сбросить пароль'}
                                              </Button>
                                              <Button
                                                variant="link"
                                                className="w-100"
                                                onClick={() => setActiveTab('login')}
                                              >
                                                Назад к входу
                                              </Button>
                                            </Form>
                                          </Tab.Pane>
                      </Form>
                    </Tab.Pane>

                    <Tab.Pane eventKey="init">
                      <Form onSubmit={handleInit}>
                        <h5 className="mb-3">Создание администратора</h5>

                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="admin@rosrest.com"
                            value={initEmail}
                            onChange={(e) => setInitEmail(e.target.value)}
                            isInvalid={!!initEmailError}
                          />
                          <Form.Control.Feedback type="invalid">
                            {initEmailError}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Пароль</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Минимум 8 символов"
                            value={initPassword}
                            onChange={(e) => setInitPassword(e.target.value)}
                            isInvalid={!!initPasswordError}
                          />
                          <Form.Text className="text-muted">
                            Используйте надежный пароль
                          </Form.Text>
                          <Form.Control.Feedback type="invalid">
                            {initPasswordError}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Подтверждение пароля</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Повторите пароль"
                            value={initConfirmPassword}
                            onChange={(e) => setInitConfirmPassword(e.target.value)}
                            isInvalid={!!initConfirmPasswordError}
                          />
                          <Form.Control.Feedback type="invalid">
                            {initConfirmPasswordError}
                          </Form.Control.Feedback>
                        </Form.Group>

                        {initError && (
                          <Alert variant="danger" className="mb-3">
                            ❌ {initError}
                          </Alert>
                        )}

                        <Button
                          variant="success"
                          type="submit"
                          className="w-100 mb-3"
                          size="lg"
                          disabled={loading}
                        >
                          <i className="bi bi-person-add me-2"></i>
                          {loading ? 'Создание...' : 'Создать'}
                        </Button>

                        <hr />

                        <p className="text-center text-muted small">
                          Уже есть аккаунт?{' '}
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveTab('login')
                            }}
                            style={{ textDecoration: 'underline' }}
                          >
                            Используйте вкладку "Вход"
                          </a>
                        </p>
                      </Form>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

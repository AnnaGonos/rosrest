import { useState, useEffect } from 'react'
import { Container, Row, Col, Button, Alert, Spinner, ButtonGroup } from 'react-bootstrap'
import { IconArrowLeft, IconRefresh, IconDownload } from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import DashboardLayout from '../../layouts/DashboardLayout'
import { API_ENDPOINTS } from '../../config/api'

type TemplateType = 'welcome' | 'digest'

export default function TemplatePreviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [templateType, setTemplateType] = useState<TemplateType>(
    (searchParams.get('type') as TemplateType) || 'welcome'
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [html, setHtml] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    loadTemplate()
  }, [templateType])

  const loadTemplate = async () => {
    setLoading(true)
    setError(null)

    try {
      let data
      if (templateType === 'welcome') {
        const response = await fetch(API_ENDPOINTS.SUBSCRIPTIONS.previewWelcome)
        if (!response.ok) throw new Error('Ошибка загрузки шаблона')
        data = await response.json()
      } else {
        const response = await fetch(API_ENDPOINTS.DIGEST.preview)
        if (!response.ok) throw new Error('Ошибка загрузки предпросмотра')
        data = await response.json()
      }

      setHtml(data.html)
      setLastUpdated(new Date())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при загрузке'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const downloadHtml = () => {
    if (!html) return

    const element = document.createElement('a')
    const file = new Blob([html], { type: 'text/html' })
    element.href = URL.createObjectURL(file)
    element.download = `${templateType}-template.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const getPageTitle = () => {
    if (templateType === 'welcome') {
      return 'Шаблон приветственного письма'
    }
    return 'Шаблон дайджеста новостей'
  }

  return (
    <DashboardLayout title={getPageTitle()}>
      <Container fluid className="py-4">
        <Row className="mb-4 align-items-center">
          <Col>
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-secondary"
                onClick={() => navigate('/subscriptions')}
                className="gap-2 d-flex align-items-center"
              >
                <IconArrowLeft size={20} />
                Назад
              </Button>
              <div>
                <h1 className="mb-1">{getPageTitle()}</h1>
                <p className="text-muted mb-0">
                  Полный предпросмотр шаблона в реальном размере
                </p>
              </div>
            </div>
          </Col>
          <Col xs="auto">
            <ButtonGroup>
              <Button
                variant={templateType === 'welcome' ? 'primary' : 'outline-primary'}
                onClick={() => setTemplateType('welcome')}
                size="sm"
              >
                Приветствие
              </Button>
              <Button
                variant={templateType === 'digest' ? 'primary' : 'outline-primary'}
                onClick={() => setTemplateType('digest')}
                size="sm"
              >
                Дайджест
              </Button>
            </ButtonGroup>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            <strong>Ошибка:</strong> {error}
          </Alert>
        )}

        <Row className="mb-3">
          <Col>
            <div className="d-flex gap-2 align-items-center">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={loadTemplate}
                disabled={loading}
                className="gap-1 d-flex align-items-center"
              >
                <IconRefresh size={18} />
                Обновить
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={downloadHtml}
                disabled={!html}
                className="gap-1 d-flex align-items-center"
              >
                <IconDownload size={18} />
                Скачать HTML
              </Button>
              {lastUpdated && (
                <span className="text-muted small">
                  Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
                </span>
              )}
            </div>
          </Col>
        </Row>

        <div className="border rounded bg-light p-4" style={{ minHeight: '600px' }}>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" className="mb-3">
                <span className="visually-hidden">Загрузка...</span>
              </Spinner>
              <p>Загрузка шаблона...</p>
            </div>
          ) : html ? (
            <div
              className="bg-white rounded shadow-sm p-4"
              style={{
                maxWidth: '800px',
                margin: '0 auto',
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          ) : null}
        </div>

        <Row className="mt-4">
          <Col xs={12}>
            <div className="bg-light border rounded p-3">
              <h6 className="mb-3">📝 Информация о шаблоне</h6>
              {templateType === 'welcome' ? (
                <div>
                  <p className="mb-2">
                    <strong>Шаблон приветственного письма</strong> отправляется новому подписчику при регистрации.
                  </p>
                  <p className="mb-2">
                    <strong>Доступные переменные:</strong>
                    <br />
                    <code>{'{{email}}'}</code> - email адрес подписчика
                    <br />
                    <code>{'{{siteUrl}}'}</code> - URL сайта
                    <br />
                    <code>{'{{unsubscribeUrl}}'}</code> - ссылка для отписки
                  </p>
                  <p className="mb-0 text-muted small">
                    Файл шаблона: <code>src/email/templates/welcome.html</code>
                  </p>
                </div>
              ) : (
                <div>
                  <p className="mb-2">
                    <strong>Шаблон дайджеста новостей</strong> отправляется подписчикам с последними новостями.
                  </p>
                  <p className="mb-2">
                    <strong>Доступные переменные:</strong>
                    <br />
                    <code>{'{{newsItems}}'}</code> - HTML список новостей
                    <br />
                    <code>{'{{siteUrl}}'}</code> - URL сайта
                    <br />
                    <code>{'{{unsubscribeUrl}}'}</code> - ссылка для отписки
                  </p>
                  <p className="mb-0 text-muted small">
                    Файл шаблона: <code>src/email/templates/digest.html</code>
                  </p>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </DashboardLayout>
  )
}

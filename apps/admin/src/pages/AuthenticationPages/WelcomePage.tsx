import { Container, Row, Col, Button, Card } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

export default function WelcomePage() {
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
              <Card.Body className="p-5 text-center flex flex-column align-items-center">
                <h1 className="mb-4">Вход в admin.rosrest.com</h1>
                <p className="lead mb-4">
                  Административная панель сайта Российской ассоциации реставраторов
                </p>
              
                <Button 
                  variant="primary" 
                  size="lg" 
                  href="/login" 
                  className="w-100"
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Войти
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

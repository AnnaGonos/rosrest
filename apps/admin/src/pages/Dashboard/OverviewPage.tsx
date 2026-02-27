import { Container, Row, Col, Card } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import DashboardLayout from '../../layouts/DashboardLayout'
import './Dashboard.css'

export default function OverviewPage() {
  const navigate = useNavigate()
  const [_partnersCount, setPartnersCount] = useState<number | null>(null)

  useEffect(() => {
    const count = localStorage.getItem('partners_count')
    const timestamp = localStorage.getItem('partners_count_timestamp')

    if (count && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10)
      const threeMinutes = 3 * 60 * 1000

      if (age < threeMinutes) {
        setPartnersCount(parseInt(count, 10))
      }
    }
  }, [])

  type Section = {
    title: string
    to: string
    showCount?: boolean
    iconClass: string
    col?: {
      xs?: number
      sm?: number
      md?: number
      lg?: number
      xl?: number
    }
  }

  type GroupSection = {
    sectionTitle: string
    subsections: Section[]
    col?: {
      xs?: number
      sm?: number
      md?: number
      lg?: number
      xl?: number
    }
  }

  const groupedSections: GroupSection[] = [
    {
      sectionTitle: 'Главная',
      subsections: [
        {
          title: 'Слайдер',
          to: '/home-slider',
          iconClass: 'bi bi-image',

          col: { xs: 12, md: 12, lg: 12 },
        },
      ],
      col: { xs: 12, md: 4, lg: 4 },
    },
    {
      sectionTitle: 'Мониторинг законодательства',
      subsections: [
        {
          title: 'Мониторинг законодательства',
          to: '/monitoring-zakon',
          iconClass: 'bi bi-clipboard-data',
          col: { xs: 12, md: 12, lg: 12 }
        },
      ],
      col: { xs: 12, md: 4, lg: 4 },
    }, 
    {
      sectionTitle: 'Документы',
      subsections: [
        {
          title: 'Документы',
          to: '/documents',
          iconClass: 'bi bi-file-earmark-text',
          col: { xs: 12, md: 12, lg: 12 }
        },
      ],
      col: { xs: 12, md: 4, lg: 4 },
    },
    {
      sectionTitle: 'Ассоциация',
      subsections: [
        {
          title: 'Устав и ежегодные отчеты',
          to: '/documents',
          iconClass: 'bi bi-file-earmark-text',
          col: { xs: 12, md: 12, lg: 12 }
        },
        {
          title: 'Члены РАР',
          to: '',
          iconClass: 'bi bi-person-circle',
        },
        {
          title: 'Соглашения РАР',
          to: '',
          iconClass: 'bi bi-file-richtext',
        },
        {
          title: 'Награды, дипломы',
          to: '',
          iconClass: 'bi bi-award',
        },
        {
          title: 'Партнеры',
          to: '/partners',
          showCount: true,
          iconClass: 'bi bi-people',
          col: { xs: 12, md: 6, lg: 6 }
        },
        {
          title: 'Аппарат Ассоциации и Контакты',
          to: '',
          iconClass: 'bi bi-person-lines-fill',
          col: { xs: 12, md: 6, lg: 6 }
        },
      ],
      col: { xs: 12, md: 8, lg: 8 },
    },
    {
      sectionTitle: 'Пресс-центр',
      subsections: [
        {
          title: 'Новости',
          to: '/news',
          iconClass: 'bi bi-newspaper',
          col: { xs: 12, md: 12, lg: 12 }
        },
        {
          title: 'Календарь мероприятий',
          to: '/events',
          iconClass: 'bi bi-calendar-week',
          col: { xs: 12, md: 12, lg: 12 }
        },
        {
          title: 'журналистам',
          to: '/for-journalist',
          iconClass: 'bi bi-mic',
          col: { xs: 12, md: 12, lg: 12 }
        },
      ],
      col: { xs: 12, md: 4, lg: 4 },
    },
    {
      sectionTitle: 'Услуги',
      subsections: [
        {
          title: 'Услуги',
          to: '/services',
          iconClass: 'bi bi-tools',
          col: { xs: 12, md: 12, lg: 12 }
        },
      ],
      col: { xs: 12, md: 3, lg: 3 },
    },
    {
      sectionTitle: 'Проекты',
      subsections: [
        {
          title: 'Проекты',
          to: '/projects',
          iconClass: 'bi bi-briefcase',
          col: { xs: 12, md: 12, lg: 12 }
        },
      ],
      col: { xs: 12, md: 3, lg: 3 },
    },

    {
      sectionTitle: 'Образование',
      subsections: [
        {
          title: 'Образование',
          to: '/education',
          iconClass: 'bi bi-mortarboard',
          col: { xs: 12, md: 12, lg: 12 }
        },
      ],
      col: { xs: 12, md: 3, lg: 3 },
    },
    {
      sectionTitle: 'Библиотека',
      subsections: [
        {
          title: 'Библиотека',
          to: '/library',
          iconClass: 'bi bi-book',
          col: { xs: 12, md: 12, lg: 12 }
        },
      ],
      col: { xs: 12, md: 3, lg: 3 },
    }
  ]

  return (
    <DashboardLayout title="Обзор">
      <Container fluid="lg" className="py-4">
        <div className="mb-4">
          <h1>Дашборд организации</h1>
          <a href="https://disk.yandex.ru/d/KAk3B4DQn9jucA"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-dark  d-flex align-items-center"
            style={{ width: 'fit-content', margin: '20px 0' }}
          >
            <i className="bi bi-info-lg me-2"></i>
            Документация по заполнению разделов
          </a>
        </div>

        <Row className="g-3">
          {groupedSections.map((group) => (
            <Col
              key={group.sectionTitle}
              xs={group.col?.xs ?? 12}
              sm={group.col?.sm}
              md={group.col?.md}
              lg={group.col?.lg}
              xl={group.col?.xl}
              className="mb-4"
            >
              <div className="dashboard-card h-100">
                <div className="dashboard-card-body">
                  <div className="d-flex justify-content-between align-items-center">
                    <h2 className="h5 mb-0">{group.sectionTitle}</h2>
                    {/* <a
                      href="https://rosrest.com/association/"
                      target="_blank"
                      rel="noreferrer"
                      className="small text-muted d-inline-flex align-items-center"
                      style={{ lineHeight: 1 }}
                    >
                      Перейти на сайт
                      <i className="bi bi-arrow-up-right ms-1"></i>
                    </a> */}
                  </div>

                  <Row className="mt-3 dashboard-card-body__container">
                    {group.subsections.map((section) => (
                      <Col
                        key={section.title}
                        xs={section.col?.xs ?? 12}
                        sm={section.col?.sm ?? 6}
                        md={section.col?.md ?? 4}
                        lg={section.col?.lg}
                        xl={section.col?.xl}
                        className="mb-3"
                      >
                        <div
                          onClick={() => navigate(section.to)}
                          className="h-100 dashboard-card-body__item"
                          style={{ cursor: section.to ? 'pointer' : 'default' }}
                        >
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <div className="text-uppercase dashboard-stat-title" style={{ color: '#122f60ff' }}>
                                  {section.title}
                                </div>
                              </div>
                              <div className="dashboard-icon">
                                <i
                                  className={`${section.iconClass} fs-4`}
                                  style={{ color: 'rgb(0, 56, 152)' }}
                                ></i>
                              </div>
                            </div>
                          </Card.Body>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </div>
              </div>
            </Col>
          ))}
        </Row>

      </Container>
    </DashboardLayout>
  )
}

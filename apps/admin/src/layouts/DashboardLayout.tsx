import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { removeAuth, getEmail } from '../utils/auth'
import { API_BASE_URL } from '../config/api'
import './DashboardLayout.css'
import logoImage from '../logo-icon-main.png'

interface SubLink {
  label: string
  path: string
}

interface NavItem {
  iconClass: string
  label: string
  path: string
  submenu?: SubLink[]
}

const navItems: NavItem[] = [
  { iconClass: 'bi bi-house', label: 'Обзор', path: '/' },
  { iconClass: 'bi bi-newspaper', label: 'Новости', path: '/news' },
  { iconClass: 'bi bi-clipboard-data', label: 'Мониторинг', path: '/monitoring-zakon' },
  { iconClass: 'bi bi-chat-dots', label: 'Комментарии', path: '/comments' },
  {
    iconClass: 'bi bi-image',
    label: 'Главная',
    path: '/home',
    submenu: [{ label: 'Слайдер', path: '/home-slider' }],
  },

  {
    iconClass: 'bi bi-people',
    label: 'Ассоциация',
    path: '/association',
    submenu: [
      { label: 'Устав и ежегодные отчеты', path: '/charter' },
      { label: 'Соглашения РАР', path: '/contracts' },
      { label: 'Награды, дипломы', path: '/awards' },
      { label: 'Партнёры', path: '/partners' },
      { label: 'Члены РАР', path: '/rar-members' },
      { label: 'Аппарат Ассоциации и Контакты', path: '/employees' },
    ],
  },
  {
    iconClass: 'bi bi-file-text', label: 'Документы', path: '/documents'
  },
  { iconClass: 'bi bi-tools', label: 'Услуги', path: '/services' },
  { iconClass: 'bi bi-briefcase', label: 'Проекты', path: '/projects' },
  { iconClass: 'bi bi-calendar-week', label: 'События', path: '/events' },
  { iconClass: 'bi bi-mortarboard', label: 'Образование', path: '/education' },
  { iconClass: 'bi bi-book', label: 'Библиотека', path: '/library' },
  { iconClass: 'bi bi-mic', label: 'Для журналистов', path: '/for-journalist' },
  { iconClass: 'bi bi-menu-button', label: 'Шапка сайта', path: '/menus' },
  // { iconClass: 'bi bi-gear', label: 'Настройки', path: '/settings' },
]

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const adminEmail = getEmail() || 'admin@rosrest.com'
  const [expandedItemPath, setExpandedItemPath] = useState<string | null>(null)
  const [newCommentsCount, setNewCommentsCount] = useState<number>(0)

  const handleLogout = () => {
    removeAuth()
    navigate('/welcome')
  }

  const handleNavClick = (path: string) => {
    const item = navItems.find((i) => i.path === path)
    if (item && item.submenu && item.submenu.length > 0) {
      setExpandedItemPath(item.path)
      return
    }
    setExpandedItemPath(null)
    navigate(path)
  }

  useEffect(() => {
    let mounted = true
    const fetchCount = async () => {
      try {
        const token = localStorage.getItem('admin_token')
        const res = await fetch(`${API_BASE_URL}/comments/unread-count`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) return
        const data = await res.json()
        if (mounted) setNewCommentsCount(data.count || 0)
      } catch (err) {
      }
    }

    fetchCount()
    const id = setInterval(fetchCount, 20000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  const activeMainItem = expandedItemPath
    ? navItems.find((i) => i.path === expandedItemPath)
    : undefined
  const activeSubmenu = activeMainItem?.submenu ?? []
  const submenuOpen = !!expandedItemPath && activeSubmenu.length > 0

  const isNavItemActive = (item: NavItem): boolean => {
    const pathname = location.pathname

    if (item.path === '/') {
      return pathname === '/'
    }

    if (pathname === item.path || pathname.startsWith(item.path + '/')) {
      return true
    }

    if (item.submenu && item.submenu.length > 0) {
      return item.submenu.some(
        (sub) => pathname === sub.path || pathname.startsWith(sub.path + '/'),
      )
    }

    return false
  }

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh' }} aria-label={title}>
      <header className="header d-flex align-items-center">
        <Container fluid className="d-flex justify-content-between align-items-center px-3" style={{ padding: '6px 15px' }}>
          <div className="d-flex align-items-center gap-3" style={{ flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center' }}>
            <img src={logoImage} alt="RosRest Logo" className="header__logo" style={{ height: 45 }} />
            <span className="text-white" style={{ fontWeight: 300, fontSize: 22 }}>«Российская Ассоциация Реставраторов»</span>

          </div>
          <span className="text-white-50 small">{adminEmail}</span>
        </Container>
      </header>

      {/* Левое вертикальное меню с иконками */}
      <nav className="navbar">
        <div className="d-flex flex-column justify-content-between h-100" style={{ width: 60 }}>
          <div className="d-flex flex-column gap-1">
            {navItems.map((item) => {
              const isActive = expandedItemPath === item.path || isNavItemActive(item)
              return (
                <button
                  key={item.path}
                  type="button"
                  className="navbarLink"
                  data-active={isActive ? true : undefined}
                  onClick={() => handleNavClick(item.path)}
                  title={item.label}
                  style={{ position: 'relative' }}
                >
                  <i className={item.iconClass} style={{ fontSize: 25, lineHeight: 1 }} />
                  {item.path === '/comments' && newCommentsCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      background: '#dc3545',
                      color: '#fff',
                      borderRadius: 10,
                      padding: '2px 6px',
                      fontSize: 12,
                      lineHeight: '12px',
                    }}>{newCommentsCount}</span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="d-flex flex-column gap-2">
            {/* <button type="button" className="navbarLink" title="Настройки аккаунта">
              <i className="bi bi-person-gear" style={{ fontSize: 24, lineHeight: 1 }} />
            </button> */}
            <button
              type="button"
              className="navbarLink"
              data-logout
              onClick={handleLogout}
              title="Выйти"
            >
              <i className="bi bi-box-arrow-right" style={{ fontSize: 24, lineHeight: 1 }} />
            </button>
          </div>
        </div>
      </nav>

      {submenuOpen && (
        <div
          className="bg-white border-end"
          style={{
            position: 'fixed',
            top: 80,
            left: 75,
            bottom: 0,
            width: 300,
            padding: '12px 10px',
            overflowY: 'auto',
            zIndex: 200,
          }}
        >
      <h5 className="mb-2">{activeMainItem?.label}</h5>
      <div className="d-flex flex-column gap-1">
        {activeSubmenu.map((sub) => {
          const active = location.pathname === sub.path
          return (
            <button
              key={sub.path}
              type="button"
              onClick={() => {
                setExpandedItemPath(null)
                navigate(sub.path)
              }}
              className="text-start border-0 bg-transparent w-100 px-2 py-2 small rounded"
              style={{
                color: active ? '#1d407c' : 'inherit',
                backgroundColor: active ? '#e7f5ff' : 'transparent',
              }}
            >
              {sub.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}


<main
  className="main flex-grow-1"
  style={{
    marginLeft: submenuOpen ? 260 : 60,
    marginTop: 60,
    padding: '20px 24px',
  }}
>
  {children}
</main>
    </div >
  )
}

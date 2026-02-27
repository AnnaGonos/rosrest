import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Layout.css'
import { OutlineButtonLink } from '../components/LinkButtons'
import 'bootstrap-icons/font/bootstrap-icons.css'

interface Project {
    id: string
    previewImage: string
    page: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft: boolean
    }
}

interface Service {
    id: string
    page: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft: boolean
    }
}

interface DocumentCategory {
    id: number
    name: string
    slug?: string | null
    icon?: string | null
    createdAt?: string
    children?: DocumentCategory[]
}

export default function Header() {
    const [_searchOpen, setSearchOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>([])
    const [menuItems, setMenuItems] = useState<any[] | null>(null)

    useEffect(() => {
        fetchProjects()
        fetchServices()
        fetchDocumentCategories()
        fetchMenu()
    }, [])

    const fetchMenu = async () => {
        try {
            const cacheKey = 'mainMenuCache';
            const cacheTtl = 60 * 60 * 1000; // 1 час
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.timestamp && Date.now() - parsed.timestamp < cacheTtl && parsed.items) {
                    setMenuItems(parsed.items);
                    return;
                }
            }
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';
            const res = await fetch(`${API_BASE}/menus/main`);
            if (res.ok) {
                const data = await res.json();
                const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : null);
                setMenuItems(items);
                sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), items }));
            }
        } catch (e) {
        }
    }

    const renderMenuItem = (item: any) => {
        const title = item.title || item.label || (item.page?.navTitle || item.page?.title) || item.url || item.pageUrl || ''
        const url = item.url || item.pageUrl || (item.page ? `/${(item.page.slug || '').replace(/^[^/]*\//, '')}` : '#')
        if (item.children && item.children.length > 0) {
            return (
                <div key={item.id} className="nav-item-with-dropdown">
                    <Link to={url} className="nav-link" title={item.page?.title || item.title || item.label || item.url}>{title}</Link>
                    <div className="dropdown">
                        {item.children.map((c: any) => {
                            const childTitle = c.title || c.label || c.page?.navTitle || c.page?.title || c.url || c.pageUrl || ''
                            const childUrl = c.url || c.pageUrl || (c.page ? `/${(c.page.slug || '').replace(/^[^/]*\//, '')}` : '#')
                            return (
                                <Link key={c.id} to={childUrl} className="dropdown-item" title={c.page?.title || c.title || c.label || c.url}>
                                    {childTitle}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )
        }
        return <Link key={item.id} to={url} className="nav-link" title={item.page?.title || item.label || item.url}>{title}</Link>
    }

    const fetchProjects = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'
            const response = await fetch(`${API_BASE}/projects?isDraft=false`)
            if (!response.ok) return
            const data = await response.json()
            setProjects(data)
        } catch (err) {
            console.error('Error fetching projects:', err)
        }
    }

    const fetchServices = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'
            const response = await fetch(`${API_BASE}/services?isDraft=false`)
            if (!response.ok) return
            const data = await response.json()

            const sorted = data.sort((a: Service, b: Service) => {
                const dateA = new Date(a.page.publishedAt || 0).getTime()
                const dateB = new Date(b.page.publishedAt || 0).getTime()
                return dateA - dateB
            })
            setServices(sorted)
        } catch (err) {
            console.error('Error fetching services:', err)
        }
    }

    const fetchDocumentCategories = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'
            const response = await fetch(`${API_BASE}/document-categories/tree`)
            if (!response.ok) return
            const data = await response.json()

            const sorted = data.sort((a: DocumentCategory, b: DocumentCategory) => {
                const dateA = new Date(a.createdAt || 0).getTime()
                const dateB = new Date(b.createdAt || 0).getTime()
                return dateA - dateB
            })
            setDocumentCategories(sorted)
        } catch (err) {
            console.error('Error fetching document categories:', err)
        }
    }

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="nav-link"><img src="../public/logo_header.png" alt="RosRest Logo" className='header__logo' /></Link>
                <nav className="header-nav">
                    {menuItems && menuItems.length ? (
                        menuItems.map((item: any) => renderMenuItem(item))
                    ) : (
                        <>
                            <div className="nav-item-with-dropdown">
                                <Link to="/about" className="nav-link">Ассоциация</Link>
                                <div className="dropdown">
                                    <Link to="/about" className="dropdown-item">Об Ассоциации</Link>
                                    <Link to="/about/head-speech" className="dropdown-item">Обращение председателя</Link>
                                    <Link to="/charter" className="dropdown-item">Устав и ежегодные отчёты</Link>
                                    <Link to="/members" className="dropdown-item">Члены РАР</Link>
                                    <Link to="/contracts" className="dropdown-item">Соглашения РАР</Link>
                                    <Link to="/about/awards" className="dropdown-item">Награды и дипломы</Link>
                                    <Link to="/about/partners" className="dropdown-item">Партнеры</Link>
                                    <Link to="/contacts" className="dropdown-item">Аппарат Ассоциации и Контакты</Link>
                                </div>
                            </div>
                            <div className="nav-item-with-dropdown">
                                <Link to="/documents" className="nav-link">Документы</Link>
                                <div className="dropdown">
                                    {documentCategories.map(category => (
                                        <Link
                                            key={category.id}
                                            to={`/documents/${category.slug || category.id}`}
                                            className="dropdown-item"
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="nav-item-with-dropdown">
                                <Link to="/services" className="nav-link">Услуги</Link>
                                <div className="dropdown">
                                    {services.map(service => (
                                        <Link
                                            key={service.id}
                                            to={`/services/${service.page.slug.replace(/^services\//, '')}`}
                                            className="dropdown-item"
                                        >
                                            {service.page.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <div className="nav-item-with-dropdown">
                                <Link to="/press-center" className="nav-link">Пресс-центр</Link>
                                <div className="dropdown">
                                    <Link to="/news" className="dropdown-item">Новости</Link>
                                    <Link to="/for-journalist" className="dropdown-item">Журналистам</Link>
                                </div>
                            </div>
                            <div className="nav-item-with-dropdown">
                                <Link to="/projects" className="nav-link">Проекты</Link>
                                <div className="dropdown">
                                    {projects.map(project => (
                                        <Link
                                            key={project.id}
                                            to={`/projects/${project.page.slug.replace(/^projects\//, '')}`}
                                            className="dropdown-item"
                                        >
                                            {project.page.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            <Link to="/events" className="nav-link">События</Link>
                            <Link to="/education" className="nav-link">Образование</Link>
                            <Link to="/library" className="nav-link">Библиотека</Link>
                        </>
                    )}
                </nav>

                <div className="header-actions">
                    <OutlineButtonLink href="/services/join">Вступить в РАР</OutlineButtonLink>
                    {/* <div className="search-container">
                        <button
                            className="search-button"
                            onClick={() => {
                                setSearchOpen(!searchOpen);
                                if (!searchOpen) setMenuOpen(false);
                            }}
                            aria-label="Поиск"
                        >
                            <i className="bi bi-search icon icon--h"></i>
                        </button>
                        {searchOpen && (
                            <div className="search-input">
                                <input
                                    type="text"
                                    placeholder="Поиск"
                                    autoFocus
                                />
                            </div>
                        )}
                            {searchOpen && (
                                <div className="search-backdrop" onClick={() => setSearchOpen(false)} />
                            )}
                    </div> */}
                    <button
                        className="mobile-menu-button"
                        onClick={() => {
                            setMenuOpen(!menuOpen);
                            if (!menuOpen) setSearchOpen(false);
                        }}
                        aria-label={menuOpen ? "Закрыть меню" : "Меню"}
                    >
                        {menuOpen ? (
                            <i className="bi bi-x-lg icon icon--h"></i>
                        ) : (
                            <i className="bi bi-list icon icon--h"></i>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="mobile-menu">
                    <>
                        {!activeSubmenu ? (
                            <>
                                <nav className="mobile-nav">
                                    {menuItems && menuItems.length ? (
                                        menuItems.map((item: any) => (
                                            item.children && item.children.length ? (
                                                <button className="mobile-nav-item" key={item.id} onClick={() => setActiveSubmenu(String(item.id))}>
                                                    <span>{item.title || item.label || item.page?.navTitle || item.page?.title}</span>
                                                    <i className="bi bi-arrow-right icon icon--h"></i>
                                                </button>
                                            ) : (
                                                <Link
                                                    key={item.id}
                                                    to={item.url || item.pageUrl || (item.page ? `/${(item.page.slug || '').replace(/^[^/]*\//, '')}` : '#')}
                                                    className="mobile-nav-item"
                                                    onClick={() => setMenuOpen(false)}
                                                >
                                                    <span>{item.title || item.label || item.page?.navTitle || item.page?.title}</span>
                                                </Link>
                                            )
                                        ))
                                    ) : (
                                        <>
                                            <button className="mobile-nav-item" onClick={() => setActiveSubmenu('association')}>
                                                <span>Ассоциация</span>
                                                <i className="bi bi-arrow-right icon icon--h"></i>
                                            </button>
                                            <button className="mobile-nav-item" onClick={() => setActiveSubmenu('documents')}>
                                                <span>Документы</span>
                                                <i className="bi bi-arrow-right icon icon--h"></i>
                                            </button>
                                            <button className="mobile-nav-item" onClick={() => setActiveSubmenu('services')}>
                                                <span>Услуги</span>
                                                <i className="bi bi-arrow-right icon icon--h"></i>
                                            </button>
                                            <button className="mobile-nav-item" onClick={() => setActiveSubmenu('press-center')}>
                                                <span>Пресс-центр</span>
                                                <i className="bi bi-arrow-right icon icon--h"></i>
                                            </button>
                                            <button className="mobile-nav-item" onClick={() => setActiveSubmenu('projects')}>
                                                <span>Проекты</span>
                                                <i className="bi bi-arrow-right icon icon--h"></i>
                                            </button>
                                            <Link to="/events" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>
                                                <span>События</span>
                                            </Link>
                                            <Link to="/education" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>
                                                <span>Образование</span>
                                            </Link>
                                            <Link to="/library" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>
                                                <span>Библиотека</span>
                                            </Link>
                                        </>
                                    )}
                                </nav>
                            </>
                        ) : (
                            <div className="mobile-submenu">
                                <button className="mobile-back-button" onClick={() => setActiveSubmenu(null)}>
                                    <i className="bi bi-arrow-left icon icon--h"></i>
                                    <span>Назад</span>
                                </button>
                                {activeSubmenu === 'association' && (
                                    <nav className="mobile-submenu-items">
                                        <Link to="/about" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Об Ассоциации
                                        </Link>
                                        <Link to="/about/head-speech" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Обращение председателя
                                        </Link>
                                        <Link to="/charter" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Устав и ежегодные отчёты
                                        </Link>
                                        <Link to="/members" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Члены РАР
                                        </Link>
                                        <Link to="/contracts" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Соглашения РАР
                                        </Link>
                                        <Link to="/about/awards" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Награды и дипломы
                                        </Link>
                                        <Link to="/about/partners" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Партнеры
                                        </Link>
                                        <Link to="/contacts" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Аппарат Ассоциации и Контакты
                                        </Link>
                                    </nav>
                                )}
                                {activeSubmenu === 'projects' && (
                                    <nav className="mobile-submenu-items">
                                        <Link to="/projects" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Все проекты
                                        </Link>
                                        {projects.map(project => (
                                            <Link
                                                key={project.id}
                                                to={`/projects/${project.page.slug.replace(/^projects\//, '')}`}
                                                className="mobile-submenu-item"
                                                onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}
                                            >
                                                {project.page.title}
                                            </Link>
                                        ))}
                                    </nav>
                                )}
                                {activeSubmenu === 'documents' && (
                                    <nav className="mobile-submenu-items">
                                        <Link to="/documents" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Все документы
                                        </Link>
                                        {documentCategories.map(category => (
                                            <Link
                                                key={category.id}
                                                to={`/documents/${category.slug || category.id}`}
                                                className="mobile-submenu-item"
                                                onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}
                                            >
                                                {category.name}
                                            </Link>
                                        ))}
                                    </nav>
                                )}
                                {activeSubmenu === 'services' && (
                                    <nav className="mobile-submenu-items">
                                        <Link to="/services" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Все услуги
                                        </Link>
                                        {services.map(service => (
                                            <Link
                                                key={service.id}
                                                to={`/services/${service.page.slug.replace(/^services\//, '')}`}
                                                className="mobile-submenu-item"
                                                onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}
                                            >
                                                {service.page.title}
                                            </Link>
                                        ))}
                                    </nav>
                                )}
                                {activeSubmenu === 'press-center' && (
                                    <nav className="mobile-submenu-items">
                                        <Link to="/press-center" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Пресс-центр
                                        </Link>
                                        <Link to="/news" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Новости
                                        </Link>
                                        <Link to="/for-journalist" className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                            Журналистам
                                        </Link>
                                    </nav>
                                )}
                                {menuItems && !['association','documents','services','projects','press-center'].includes(activeSubmenu || '') && (() => {
                                    const parent = menuItems.find((i: any) => String(i.id) === activeSubmenu)
                                    const children = parent?.children || []
                                    const parentUrl = parent ? (parent.url || parent.pageUrl || (parent.page ? `/${(parent.page.slug || '').replace(/^[^/]*\//, '')}` : '#')) : '#'
                                    const parentTitle = parent ? (parent.title || parent.label || parent.page?.navTitle || parent.page?.title) : ''
                                    return (
                                        <nav className="mobile-submenu-items">
                                            {parent && (
                                                <Link to={parentUrl} className="mobile-submenu-item" onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}>
                                                    {parentTitle}
                                                </Link>
                                            )}
                                            {children.map((c: any) => (
                                                <Link
                                                    key={c.id}
                                                    to={c.url || c.pageUrl || (c.page ? `/${(c.page.slug || '').replace(/^[^/]*\//, '')}` : '#')}
                                                    className="mobile-submenu-item"
                                                    onClick={() => { setMenuOpen(false); setActiveSubmenu(null); }}
                                                >
                                                    {c.title || c.label || c.page?.navTitle || c.page?.title}
                                                </Link>
                                            ))}
                                        </nav>
                                    )
                                })()}
                            </div>
                        )}
                    </>

                    <div className="mobile-menu-actions">
                        <OutlineButtonLink href="/services/join">Вступить в РАР</OutlineButtonLink>
                    </div>
                </div>
            )}
        </header>
    )
}

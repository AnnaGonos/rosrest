import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import { BlocksRenderer } from '../../components/BlocksRenderer'
import './ServiceDetailPage.css'

interface Block {
    id: string
    type: string
    content: Record<string, any>
    order: number
    children?: Block[]
}

interface ServiceContact {
    id: string
    fullName: string
    photo: string
    position?: string
    email?: string
    phone?: string
    order: number
}

interface Service {
    id: string
    page: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft: boolean
        blocks: Block[]
    }
    contacts: ServiceContact[]
}

export default function ServiceDetailPage() {
    const { slug } = useParams<{ slug: string }>()
    const [service, setService] = useState<Service | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    const resolveImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        if (url.startsWith('//')) return `${window.location.protocol}${url}`
        return `${API_BASE.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
    }

    useEffect(() => {
        fetchService()
    }, [slug])

    const fetchService = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${API_BASE}/services`)
            if (!response.ok) throw new Error('Ошибка загрузки услуги')
            const data: Service[] = await response.json()
            const found = data.find(s => s.page.slug.replace(/^services\//, '') === slug)
            if (!found) throw new Error('Услуга не найдена')
            setService(found)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="page-main"><div className="page__container">Загрузка...</div></div>
    if (error) return <div className="page-main"><div className="page__container">Ошибка: {error}</div></div>
    if (!service) return null

    return (
        <div className="page-main">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Услуги', to: '/services' },
                        { label: service.page.title, isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container page__container--27">
                <div className="page__header-title page__header-title--column-2 page__header-title--service">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                        <BackToSectionButton to="/services" label="К разделу Услуги" />
                        <h1 className="page-title">{service.page.title}</h1>
                    </div>

                    {service.contacts && service.contacts.length > 0 && (
                        <div className="service-contacts">
                            <div className="service-contacts__grid">
                                {service.contacts.map(contact => (
                                    <div key={contact.id} className="service-contact-card">
                                        {contact.photo && (
                                            <div className="service-contact-card__photo">
                                                <img
                                                    src={resolveImageUrl(contact.photo)}
                                                    alt={contact.fullName}
                                                />
                                            </div>
                                        )}
                                        <div className="service-contact-card__info">
                                            <h3 className="service-contact-card__name">{contact.fullName}</h3>
                                            {contact.position && (
                                                <p className="service-contact-card__position">{contact.position}</p>
                                            )}
                                            {contact.email && (
                                                <a
                                                    href={`mailto:${contact.email}`}
                                                    className="service-contact-card__email"
                                                >
                                                    {contact.email}
                                                </a>
                                            )}
                                            {contact.phone && (
                                                <a
                                                    href={`tel:${contact.phone}`}
                                                    className="service-contact-card__phone"
                                                >
                                                    {contact.phone}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <ContentSection columns={1}>
                    <BlocksRenderer blocks={service.page.blocks} />
                </ContentSection>
            </div>
        </div>
    )
}

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import { getFileUrl } from '../../utils/getFileUrl';
import { BlocksRenderer } from '../../components/BlocksRenderer'
import './ServiceDetailPage.css'
import RequestState from '../../components/RequestState/RequestState'
import NotFoundPage from '../not-found/NotFoundPage'
import Seo from '../../components/Seo/Seo'

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

function collectStringsDeep(value: unknown, bucket: string[] = []): string[] {
    if (value == null) return bucket
    if (typeof value === 'string') {
        const cleaned = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        if (cleaned) bucket.push(cleaned)
        return bucket
    }
    if (Array.isArray(value)) {
        value.forEach((item) => collectStringsDeep(item, bucket))
        return bucket
    }
    if (typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach((item) => collectStringsDeep(item, bucket))
    }
    return bucket
}

function buildSeoDescription(page: Service['page']): string {
    const fallback = `${page.title} - услуга Российской ассоциации реставраторов: содержание услуги, формат взаимодействия и контакты.`
    const text = collectStringsDeep(page.blocks.map((block) => block.content)).join(' ').replace(/\s+/g, ' ').trim()
    if (!text) return fallback
    return text.length > 190 ? `${text.slice(0, 187).trim()}...` : text
}

export default function ServiceDetailPage() {
    const { slug } = useParams<{ slug: string }>()
    const [service, setService] = useState<Service | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [notFound, setNotFound] = useState(false)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    useEffect(() => {
        fetchService()
    }, [slug])

    const fetchService = async () => {
        setLoading(true)
        setError(null)
        setNotFound(false)
        try {
            const response = await fetch(`${API_BASE}/services`)
            if (response.status === 404) {
                setNotFound(true)
                return
            }
            if (!response.ok) throw new Error(`Ошибка загрузки услуги (HTTP ${response.status})`)
            const data: Service[] = await response.json()
            const found = data.find(s => s.page.slug.replace(/^services\//, '') === slug)
            if (!found) {
                setNotFound(true)
                return
            }
            setService(found)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    if (notFound) {
        return <NotFoundPage />
    }

    if (loading || error) {
        return <RequestState loading={loading} error={error} loadingText="Загрузка услуги..." />
    }
    if (!service) return null

    const serviceSlug = service.page.slug.replace(/^services\//, '')
    const serviceUrl = `${window.location.origin}/services/${serviceSlug}`
    const seoDescription = buildSeoDescription(service.page)

    return (
        <div className="page-main">
            <Seo
                title={`${service.page.title} - Услуга Российской ассоциации реставраторов`}
                description={seoDescription}
                canonical={serviceUrl}
                url={serviceUrl}
            />
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
                                                    src={getFileUrl(contact.photo) ?? undefined}
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

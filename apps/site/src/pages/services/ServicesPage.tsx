import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { useEffect, useState } from 'react'
import LinkList from '../../components/LinkList/LinkList'

interface Service {
    id: string
    page: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft: boolean
        blocks: any[]
    }
    contacts: any[]
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('http://localhost:3002/services?isDraft=false')
            if (!response.ok) throw new Error('Ошибка загрузки услуг')
            const data = await response.json()
            setServices(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="page-main"><div className="page__container">Загрузка...</div></div>
    if (error) return <div className="page-main"><div className="page__container">Ошибка: {error}</div></div>

    return (
        <div className="page-main">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Услуги', isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container page__container--27">
                <div className='page__header-title'>
                    <h1 className="page-title">Услуги</h1>
                </div>

                <ContentSection columns={1}>
                    <LinkList
                        items={services.map(service => ({
                            label: service.page.title,
                            href: `${service.page.slug.replace(/^services\//, '')}`,
                        }))}
                        variant="primary-icon"
                    />
                </ContentSection>
            </div>
        </div>
    )
}

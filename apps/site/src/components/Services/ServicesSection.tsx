import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './Services.css'

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

export default function ServicesSection() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/services?isDraft=false`)
                if (!response.ok) throw new Error('Failed to fetch services')
                const data = await response.json()
                setServices(data)
            } catch (err) {
                console.error('Error fetching services:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchServices()
    }, [])

    if (loading) {
        return null
    }

    return (
        <div className='service-section'>
            <div className='event-section__header'>
                <a href="/services" className="event-section__title section-title--lg">
                    [ Услуги ]
                </a>
            </div>
            <div className='event-section__list-items'>
                {services.map(service => (
                    <Link 
                        key={service.id} 
                        to={`/services/${service.page.slug.replace(/^services\//, '')}`} 
                        className='event-section__item'
                    >
                        <span className='body-text--light'>{service.page.title}</span>
                        <i className="bi bi-arrow-up-right icon icon--sm"></i>
                    </Link>
                ))}
            </div>
        </div>
    )
}
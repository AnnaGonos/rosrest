import './MonitoringZakonCard.css'
import { ArrowButton } from '../LinkButtons'
import { Link } from 'react-router-dom'

export interface MonitoringZakonCardItem {
    id: string
    slug: string
    title: string
    publishedAt?: string
}

const formatDate = (value?: string) => {
    if (!value) return 'Дата не указана'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Дата не указана'
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}

export default function MonitoringZakonCard({ item, type }: { item: MonitoringZakonCardItem, type?: 'recommendation' | 'main-page' | 'default' }) {
    const safeSlug = encodeURIComponent(item.slug.replace(/^monitoring-zakon\//, ''))

    return (
        <Link className={`monitoring-card ${type === 'recommendation' ? 'monitoring-card--recommendation' : type === 'main-page' ? 'monitoring-card--main-page' : ''}`} to={`/monitoring-zakon/${safeSlug}`}>
            <h3 className="monitoring-card__title" >{item.title}</h3>
            <div className="monitoring-card__meta">
                <div className="monitoring-card__date">
                    {formatDate(item.publishedAt)}
                </div>

                {type !== 'main-page' && (
                    <ArrowButton asButton aria-label="Перейти" />
                )}
            </div>
        </Link>
    )
}

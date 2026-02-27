import './MonitoringZakonCard.css'
import { ArrowButton } from '../LinkButtons'

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
    return (
        <a className={`monitoring-card ${type === 'recommendation' ? 'monitoring-card--recommendation' : type === 'main-page' ? 'monitoring-card--main-page' : ''}`} href={`/monitoring-zakon/${item.slug.replace(/^monitoring-zakon\//, '')}`}>
            <h3 className="monitoring-card__title" >{item.title}</h3>
            <div className="monitoring-card__meta">
                <div className="monitoring-card__date">
                    {formatDate(item.publishedAt)}
                </div>

                {type !== 'main-page' && (
                    <ArrowButton asButton aria-label="Перейти" />
                )}
            </div>
        </a>
    )
}

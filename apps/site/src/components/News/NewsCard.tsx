import { Link } from 'react-router-dom'
import './NewsCard.css'
import { ArrowButton } from '../LinkButtons'

export type NewsCardItem = {
    id: string
    previewImage: string
    page: {
        slug: string
        title: string
        publishedAt?: string
    }
    tags?: Array<{ id: number; name: string; slug: string }>
}

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
]

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

const formatDate = (dateStr?: string): string => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const day = date.getDate()
    const month = MONTH_NAMES[date.getMonth()]
    const year = date.getFullYear()
    return `${day} ${month} ${year}`
}

type NewsCardProps = {
    news: NewsCardItem
}

export default function NewsCard({ news }: NewsCardProps) {
    const resolveImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        if (url.startsWith('//')) return `${window.location.protocol}${url}`
        const base = API_BASE.replace(/\/$/, '')
        const path = url.replace(/^\//, '')
        return `${base}/${path}`
    }

    return (
        <Link to={`/news/${news.page.slug.replace(/^news\//, '')}`} className="news-card">
            <div className="news-card__image-wrapper">
                <img
                    src={resolveImageUrl(news.previewImage)}
                    alt={news.page.title}
                    className="news-card__image"
                />
            </div>
            <div className="news-card__content">
                <div className="news-card__tags-link">
                    {news.tags && news.tags.length > 0 && (
                        <div className="news-card__tags">
                            {news.tags.map(tag => (
                                <span key={tag.id} className="news-card__tag body-text--sm">
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="news-card__links">
                        <ArrowButton asButton={true}></ArrowButton>
                    </div>
                </div>
                <h3 className="news-card__title">{news.page.title}</h3>
                {news.page.publishedAt && (
                    <div className="news-card__date body-text--sm">
                        {formatDate(news.page.publishedAt)}
                    </div>
                )}
            </div>
        </Link>
    )
}

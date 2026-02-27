import './NewsSection.css'
import { OutlineButtonLink } from '../LinkButtons'
import { useEffect, useState } from 'react'
import ContentSection from '../ContentSection/ContentSection'
import NewsCard, { NewsCardItem } from './NewsCard'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

type SectionProps = {
    news: NewsCardItem[];
    emptyText: string;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

const NewsGrid = ({ news, emptyText, columns = 2 }: SectionProps) => (
    <section className="news-section">
        {news.length === 0 ? (
            <div className="news-empty body-text" style={{ textAlign: 'center', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emptyText}</div>
        ) : (
            <ContentSection
                columns={columns}
                items={news}
                renderItem={(item) => (
                    <NewsCard news={item} />
                )}
            />
        )}
    </section>
)

export type LinkPosition = 'header' | 'footer' | 'both' | 'none'

export interface NewsSectionProps {
    title?: string;
    limit?: number;
    sortOrder?: 'ASC' | 'DESC';
    emptyText?: string;
    linkPosition?: LinkPosition;
    linkText?: string;
    linkHref?: string;
    showLink?: boolean;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
}

export default function NewsSection({
    title = 'Новости',
    limit = 2,
    sortOrder = 'DESC',
    emptyText = 'Новостей пока нет',
    linkPosition = 'header',
    linkText = 'Все новости',
    linkHref = '/news?page=1',
    showLink = true,
    columns = 2,
    className = ''
}: NewsSectionProps) {
    const [news, setNews] = useState<NewsCardItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
            isDraft: 'false',
            page: '1',
            pageSize: limit.toString()
        })

        fetch(`${API_BASE}/news?${params}`)
            .then((res) => {
                if (!res.ok) throw new Error(`Не удалось загрузить новости (HTTP ${res.status})`)
                return res.json()
            })
            .then((data) => {
                if (!active) return
                const list = Array.isArray(data) ? data : (data?.items || [])
                const sorted = sortOrder === 'ASC' 
                    ? list.sort((a: NewsCardItem, b: NewsCardItem) => 
                        new Date(a.page.publishedAt || 0).getTime() - new Date(b.page.publishedAt || 0).getTime()
                    )
                    : list.sort((a: NewsCardItem, b: NewsCardItem) => 
                        new Date(b.page.publishedAt || 0).getTime() - new Date(a.page.publishedAt || 0).getTime()
                    )
                setNews(sorted.slice(0, limit))
            })
            .catch((err) => {
                if (!active) return
                setError(err instanceof Error ? err.message : 'Произошла ошибка')
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [limit, sortOrder])

    const renderLink = (position: LinkPosition) => {
        if (!showLink) return null

        if (position === 'footer') {
            return (
                <div className="news-section__footer">
                    <OutlineButtonLink href={linkHref}>{linkText}</OutlineButtonLink>
                </div>
            )
        }

        return <OutlineButtonLink href={linkHref}>{linkText}</OutlineButtonLink>
    }

    return (
        <div className={`news-section ${className}`}>

            <div className='news-section__header'>
                <h2 className="news-section__title section-title">
                    {title}
                </h2>
                {(linkPosition === 'header' || linkPosition === 'both') && renderLink('header')}
            </div>

            {loading && <div className="news-status">Загрузка новостей...</div>}
            {error && !loading && <div className="news-status news-status--error">{error}</div>}

            {!loading && !error && (
                <div className="news-section__content">
                    <NewsGrid
                        news={news}
                        emptyText={emptyText}
                        columns={columns}
                    />
                </div>
            )}

            {(linkPosition === 'footer' || linkPosition === 'both') && !loading && renderLink('footer')}
        </div>
    )
}

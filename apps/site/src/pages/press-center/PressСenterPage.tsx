import { useEffect, useState } from "react"
import Breadcrumbs from "../../components/Breadcrumbs/Breadcrumbs"
import ContentSection from "../../components/ContentSection/ContentSection"
import LinkList from "../../components/LinkList/LinkList"
import NewsCard, { NewsCardItem } from "../../components/News/NewsCard"
import EventCard, { EventCardItem } from "../../components/Event/EventCard"
import { OutlineButtonLink } from "../../components/LinkButtons"
import './PressCenter.css'

export default function PressCenterPage() {
    const [latestNews, setLatestNews] = useState<NewsCardItem[]>([])
    const [newsLoading, setNewsLoading] = useState(true)
    const [upcomingEvents, setUpcomingEvents] = useState<EventCardItem[]>([])
    const [eventsLoading, setEventsLoading] = useState(true)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    useEffect(() => {
        const fetchLatestNews = async () => {
            setNewsLoading(true)
            try {
                const response = await fetch(`${API_BASE}/news?isDraft=false&page=1&pageSize=2`)
                if (!response.ok) throw new Error('Ошибка загрузки новостей')
                const data = await response.json()
                const list = Array.isArray(data) ? data : (data?.items || [])
                setLatestNews(list.slice(0, 2))
            } catch (err) {
                console.error('Error loading news:', err)
                setLatestNews([])
            } finally {
                setNewsLoading(false)
            }
        }

        const fetchUpcomingEvents = async () => {
            setEventsLoading(true)
            try {
                const params = new URLSearchParams({
                    isPublished: 'true',
                    limit: '2',
                    filter: 'upcoming',
                    sortOrder: 'ASC'
                })
                const response = await fetch(`${API_BASE}/events?${params}`)
                if (!response.ok) throw new Error('Ошибка загрузки событий')
                const data = await response.json()
                const list = Array.isArray(data) ? data : (data?.events || [])
                setUpcomingEvents(list.slice(0, 2))
            } catch (err) {
                console.error('Error loading events:', err)
                setUpcomingEvents([])
            } finally {
                setEventsLoading(false)
            }
        }

        fetchLatestNews()
        fetchUpcomingEvents()
    }, [API_BASE])

    return (
        <div className="page-main">
            <div className="page__header">
                <Breadcrumbs items={[{
                    label: 'Главная', to: '/'
                },
                { label: 'Пресс-центр', isCurrent: true }]} />
            </div>
            <div className="page__container">
                <div style={{ display: 'flex', alignItems: 'start', gap: '20px', marginBottom: '80px', marginTop: '-30px' }}>
                    <h1 className="page-title">Пресс-центр</h1>
                </div>

                <div className="press-center__sections">
                    {!newsLoading && latestNews.length > 0 && (
                        <div style={{ marginBottom: '80px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                <h2 className="section-title--sm">Новости</h2>
                            </div>
                            <ContentSection columns={2}>
                                {latestNews.map(news => (
                                    <NewsCard key={news.id} news={news} />
                                ))}
                            </ContentSection>
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                                <OutlineButtonLink href="/news?page=1">Все новости</OutlineButtonLink>
                            </div>
                        </div>
                    )}

                    {!eventsLoading && upcomingEvents.length > 0 && (
                        <div style={{ marginBottom: '80px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                <h2 className="section-title--sm">Календарь мероприятий</h2>
                            </div>
                            <ContentSection columns={2}>
                                {upcomingEvents.map(event => (
                                    <EventCard key={event.id} event={event} />
                                ))}
                            </ContentSection>
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
                                <OutlineButtonLink href="/events">Все мероприятия</OutlineButtonLink>
                            </div>
                        </div>
                    )}
                </div>

                <ContentSection columns={1}>
                    <div style={{ marginTop: '80px' }}>

                    </div>
                    <LinkList
                        items={[
                            { label: 'Журналистам', href: '/for-journalist' },
                        ]}
                        variant="primary-icon"
                    />
                </ContentSection>
            </div>
        </div>
    )
}



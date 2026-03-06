import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import EventCard, { EventCardItem } from '../../components/Event/EventCard'
import './EventsPage.css'
import './../../index.css'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

const parseDateValue = (value?: string | null): number => {
    if (!value) return 0
    const trimmed = value.trim()
    if (!trimmed) return 0

    const parts = trimmed.split('.')

    if (parts.length === 3) {
        const [day, month, year] = parts
        const d = Number(day)
        const m = Number(month)
        const y = Number(year)
        if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y)) {
            return new Date(y, m - 1, d).getTime()
        }
    }

    if (parts.length === 2) {
        const [month, year] = parts
        const m = Number(month)
        const y = Number(year)
        if (!Number.isNaN(m) && !Number.isNaN(y)) {
            const lastDay = new Date(y, m, 0).getDate()
            return new Date(y, m - 1, lastDay).getTime()
        }
    }

    const fallback = Date.parse(trimmed)
    return Number.isNaN(fallback) ? 0 : fallback
}

type SectionProps = {
    title: string
    events: (EventCardItem & { dateValue: number })[]
    emptyText: string
}

const EventsSection = ({ title, events, emptyText }: SectionProps) => (
    <section className="events-section">
        <div className="events-section__header">
            <h2 className="section-title--lg">{title}</h2>
            <span className="events-section__pill body-text">[ {events.length} ]</span>
        </div>
        {events.length === 0 ? (
            <div className="events-empty body-text" style={{ textAlign: 'center', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emptyText}</div>
        ) : (
            <ContentSection
                columns={4}
                items={events}
                renderItem={(event) => (
                    <AnimatePresence>
                        <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            style={{ height: '100%' }}
                        >
                            <EventCard event={event} />
                        </motion.div>
                    </AnimatePresence>
                )}
            />
        )}
    </section>
)

export default function EventsPage() {
    const [upcomingEvents, setUpcomingEvents] = useState<(EventCardItem & { dateValue: number })[]>([])
    const [pastEvents, setPastEvents] = useState<(EventCardItem & { dateValue: number })[]>([])
    const [loadingUpcoming, setLoadingUpcoming] = useState(true)
    const [loadingPast, setLoadingPast] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    const [pastPage, setPastPage] = useState(0)
    const [pastTotalCount, setPastTotalCount] = useState<number | null>(null)
    const PAST_LIMIT = 4

    useEffect(() => {
        let active = true
        setLoadingUpcoming(true)
        setError(null)
        
        fetch(`${API_BASE}/events?isPublished=true&filter=upcoming&sortOrder=ASC`)
            .then((res) => {
                if (!res.ok) throw new Error(`Не удалось загрузить актуальные события (HTTP ${res.status})`)
                return res.json()
            })
            .then((data) => {
                if (!active) return
                let eventsArr: any[] = []
                if (Array.isArray(data)) {
                    eventsArr = data
                } else if (data && Array.isArray(data.events)) {
                    eventsArr = data.events
                }
                const withDate = eventsArr.map((event) => ({
                    ...event,
                    dateValue: parseDateValue(event.startDate),
                    endDateValue: event.endDate ? parseDateValue(event.endDate) : parseDateValue(event.startDate)
                }))
                setUpcomingEvents(withDate)
            })
            .catch((err) => {
                if (!active) return
                setError(err instanceof Error ? err.message : 'Произошла ошибка')
            })
            .finally(() => {
                if (active) setLoadingUpcoming(false)
            })

        return () => {
            active = false
        }
    }, [])

    useEffect(() => {
        let active = true
        if (pastPage === 0) {
            setLoadingPast(true)
            setError(null)
        }
        
        fetch(`${API_BASE}/events?isPublished=true&filter=past&sortOrder=DESC&limit=${PAST_LIMIT}&offset=${pastPage * PAST_LIMIT}`)
            .then((res) => {
                if (!res.ok) throw new Error(`Не удалось загрузить прошедшие события (HTTP ${res.status})`)
                return res.json()
            })
            .then((data) => {
                if (!active) return
                let eventsArr: any[] = []
                let totalCount = null
                if (Array.isArray(data)) {
                    eventsArr = data
                } else if (data && Array.isArray(data.events)) {
                    eventsArr = data.events
                    totalCount = typeof data.totalCount === 'number' ? data.totalCount : null
                }
                const withDate = eventsArr.map((event) => ({
                    ...event,
                    dateValue: parseDateValue(event.startDate),
                    endDateValue: event.endDate ? parseDateValue(event.endDate) : parseDateValue(event.startDate)
                }))
                setPastEvents(prev => pastPage === 0 ? withDate : [...prev, ...withDate])
                if (totalCount !== null) setPastTotalCount(totalCount)
            })
            .catch((err) => {
                if (!active) return
                setError(err instanceof Error ? err.message : 'Произошла ошибка')
            })
            .finally(() => {
                if (active) setLoadingPast(false)
            })
        
        return () => { active = false }
    }, [pastPage])

    useEffect(() => {
        setPastEvents([])
        setPastPage(0)
    }, [])

    const loading = loadingUpcoming || loadingPast

    return (
        <div className="page-main">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Пресс-центр', to: '/press-center' },
                        { label: 'Календарь мероприятий', isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container">
                <div className='page__header-title'>
                    <BackToSectionButton to="/press-center" label="К странице Пресс-центр" />
                    <h1 className="page-title">Календарь мероприятий</h1>
                </div>

                <p className="body-text" style={{ marginBottom: '50px' }}>
                    Чтобы добавить ваше мероприятие в календарь, направьте информацию о нем на info.rosrest@mail.ru, press.rosrest@mail.ru
                </p>

                {loading && <div className="events-status">Загрузка событий...</div>}
                {error && !loading && <div className="events-status events-status--error">{error}</div>}

                {!loading && !error && (
                    <div className="events-page__sections">
                        <EventsSection
                            title="Ближайшие мероприятия"
                            events={upcomingEvents}
                            emptyText="Ближайших мероприятий пока нет"
                        />

                        <EventsSection
                            title="Прошедшие"
                            events={pastEvents}
                            emptyText="Пока нет прошедших мероприятий"
                        />
                        
                        {(pastTotalCount === null || pastEvents.length < pastTotalCount) && pastEvents.length > 0 && (
                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                                <button className="outline-link" onClick={() => setPastPage((p) => p + 1)}>
                                    Больше событий
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

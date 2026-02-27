import './Event.css'
import { OutlineButtonLink } from '../LinkButtons'
import { useEffect, useMemo, useState } from 'react'
import ContentSection from '../../components/ContentSection/ContentSection'
import EventCard, { EventCardItem } from './EventCard'

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
    events: (EventCardItem & { dateValue: number })[];
    emptyText: string;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
}

const EventsGrid = ({ events, emptyText, columns = 2 }: SectionProps) => (
    <section className="events-section">
        {events.length === 0 ? (
            <div className="events-empty body-text" style={{ textAlign: 'center', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{emptyText}</div>
        ) : (
            <ContentSection
                columns={columns}
                items={events}
                renderItem={(event) => (
                    <EventCard event={event} />
                )}
            />
        )}
    </section>
)

export type LinkPosition = 'header' | 'footer' | 'both' | 'none'

export interface EventSectionProps {
    title?: string;
    limit?: number;
    filter?: 'upcoming' | 'past' | 'all';
    sortOrder?: 'ASC' | 'DESC';
    emptyText?: string;
    linkPosition?: LinkPosition;
    linkText?: string;
    linkHref?: string;
    showLink?: boolean;
    columns?: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
}

export default function EventSection({
    title = '[ Календарь мероприятий ]',
    limit = 2,
    filter = 'upcoming',
    sortOrder = 'ASC',
    emptyText = 'Мероприятий пока нет',
    linkPosition = 'header',
    linkText = 'Все мероприятия',
    linkHref = '/events',
    showLink = true,
    columns = 2,
    className = ''
}: EventSectionProps) {
    const [events, setEvents] = useState<EventCardItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
            isPublished: 'true',
            limit: limit.toString(),
            filter,
            sortOrder
        })

        fetch(`${API_BASE}/events?${params}`)
            .then((res) => {
                if (!res.ok) throw new Error(`Не удалось загрузить события (HTTP ${res.status})`)
                return res.json()
            })
            .then((data) => {
                if (!active) return
                if (Array.isArray(data)) {
                    setEvents(data)
                } else if (data && Array.isArray(data.events)) {
                    setEvents(data.events)
                } else {
                    setEvents([])
                }
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
    }, [limit, filter, sortOrder])

    const eventsWithDates = useMemo(() => {
        return events.map((event) => ({
            ...event,
            dateValue: parseDateValue(event.startDate),
            endDateValue: event.endDate ? parseDateValue(event.endDate) : parseDateValue(event.startDate)
        }))
    }, [events])

    const renderLink = (position: LinkPosition) => {
        if (!showLink) return null

        if (position === 'footer') {
            return (
                <div className="event-section__footer">
                    <OutlineButtonLink href={linkHref}>{linkText}</OutlineButtonLink>
                </div>
            )
        }

        return <OutlineButtonLink href={linkHref}>{linkText}</OutlineButtonLink>
    }

    return (
        <div className={`event-section ${className}`}>

            <div className='event-section__header'>
                <h2 className="event-section__title section-title--lg">
                    {title}
                </h2>
                {(linkPosition === 'header' || linkPosition === 'both') && renderLink('header')}
            </div>

            {loading && <div className="events-status">Загрузка событий...</div>}
            {error && !loading && <div className="events-status events-status--error">{error}</div>}

            {!loading && !error && (
                <div className="event-section__content">
                    <EventsGrid
                        events={eventsWithDates}
                        emptyText={emptyText}
                        columns={columns}
                    />
                </div>
            )}

            {(linkPosition === 'footer' || linkPosition === 'both') && !loading && renderLink('footer')}
        </div>
    )
}



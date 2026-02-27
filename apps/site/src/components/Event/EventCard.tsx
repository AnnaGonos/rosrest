import { Link } from 'react-router-dom'
import './Event.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

export type EventCardItem = {
    schedule: any
    id: number
    title: string
    startDate: string
    endDate?: string | null
    previewImageUrl?: string | null
    description?: string | null
    address?: string | null
    detailedAddress?: string | null
    mapCoordinates?: string | null
    registrationUrl?: string | null
    faq?: Array<{ question: string; answer: string }> | null
    isPublished?: boolean
    vkPosts?: string[]
}

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

const MONTH_NAMES = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
]

const MONTH_NAMES_NOM = [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
]

const parseDateParts = (dateStr: string): { day?: number; month: number; year: number; onlyMonth?: boolean } | null => {
    if (!dateStr) return null
    const parts = dateStr.trim().split('.')

    if (parts.length === 3) {
        const day = Number(parts[0])
        const month = Number(parts[1])
        const year = Number(parts[2])
        if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
            return { day, month, year }
        }
    }

    if (parts.length === 2) {
        const month = Number(parts[0])
        const year = Number(parts[1])
        if (!Number.isNaN(month) && !Number.isNaN(year)) {
            return { month, year, onlyMonth: true }
        }
    }

    return null
}

export const formatDateRange = (start?: string | null, end?: string | null) => {
    if (!start && !end) return 'Дата уточняется'
    if (!end || start === end) {
        const parsed = parseDateParts(start || '')
        if (parsed) {
            if (parsed.onlyMonth) {
                return `${MONTH_NAMES_NOM[parsed.month - 1]} ${parsed.year}`
            }
            return `${parsed.day} ${MONTH_NAMES[parsed.month - 1]} ${parsed.year}`
        }
        return start || 'Дата уточняется'
    }

    const startParsed = parseDateParts(start || '')
    const endParsed = parseDateParts(end || '')

    if (!startParsed || !endParsed) {
        return start && end ? `${start} - ${end}` : start || end || 'Дата уточняется'
    }

    if (startParsed.onlyMonth && endParsed.onlyMonth && startParsed.year === endParsed.year) {
        return `${MONTH_NAMES_NOM[startParsed.month - 1]} - ${MONTH_NAMES_NOM[endParsed.month - 1]} ${startParsed.year}`
    }
    
    if (startParsed.onlyMonth && !endParsed.onlyMonth) {
        return `${MONTH_NAMES_NOM[startParsed.month - 1]} ${startParsed.year} - ${endParsed.day} ${MONTH_NAMES[endParsed.month - 1]} ${endParsed.year}`
    }
    
    if (!startParsed.onlyMonth && endParsed.onlyMonth) {
        return `${startParsed.day} ${MONTH_NAMES[startParsed.month - 1]} ${startParsed.year} - ${MONTH_NAMES_NOM[endParsed.month - 1]} ${endParsed.year}`
    }
    
    if (startParsed.year === endParsed.year && startParsed.month === endParsed.month) {
        return `${startParsed.day}-${endParsed.day} ${MONTH_NAMES[startParsed.month - 1]} ${startParsed.year}`
    }
    
    if (startParsed.year === endParsed.year) {
        return `${startParsed.day} ${MONTH_NAMES[startParsed.month - 1]} - ${endParsed.day} ${MONTH_NAMES[endParsed.month - 1]} ${startParsed.year}`
    }
    
    return `${startParsed.day} ${MONTH_NAMES[startParsed.month - 1]} ${startParsed.year} - ${endParsed.day} ${MONTH_NAMES[endParsed.month - 1]} ${endParsed.year}`
}

const resolveUrl = (raw?: string | null) => {
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return raw.startsWith('/') ? `${API_BASE}${raw}` : `${API_BASE}/${raw}`
}

type Props = {
    event: EventCardItem
    to?: string
}

export default function EventCard({ event, to }: Props) {
    const imageUrl = resolveUrl(event.previewImageUrl)
    const hasImage = Boolean(imageUrl)
    const linkTo = to || `/events/${event.id}`

    return (
        <Link to={linkTo} className="event-card-link">
            <article className="event-card">
                {hasImage && (
                    <div className="event-card__cover">
                        <img src={imageUrl} alt={`Превью события ${event.title}`} loading="lazy" />
                    </div>
                )}
                <div className="event-card__body">
                    <div className='event-card__meta'>
                        <div className="event-card__date">
                            <i className="bi bi-calendar-week"></i>
                            <p>{formatDateRange(event.startDate, event.endDate)}</p>
                        </div>

                        <h3>{event.title}</h3>
                    </div>

                    {event.address && <span className="event-card__address">{event.address}</span>}
                </div>
            </article>
        </Link>
    )
}

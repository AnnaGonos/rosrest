import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BackToSectionButton, OutlineArrowButtonLink } from '../../components/LinkButtons'
import { EventCardItem, formatDateRange } from '../../components/Event/EventCard'
import './EventsPage.css'
import ImageViewer from '../../components/ImageViewer/ImageViewer'
import ShareModal from '../../components/ShareModal'
import FAQSection from '../../components/FAQSection/FAQSection'
import ScheduleSection from '../../components/ScheduleSection/ScheduleSection'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

const resolveUrl = (raw?: string | null) => {
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    return raw.startsWith('/') ? `${API_BASE}${raw}` : `${API_BASE}/${raw}`
}

const buildYandexMapUrl = (coordinates?: string | null) => {
    if (!coordinates) return null
    const [lat, lon] = coordinates.split(',').map(c => c.trim())
    if (!lat || !lon) return null
    return `https://yandex.ru/map-widget/v1/?ll=${lon},${lat}&z=17&l=map&pt=${lon},${lat},pm2rdm`
}

export default function EventDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [event, setEvent] = useState<EventCardItem | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)

    useEffect(() => {
        if (!id) return
        let active = true
        setLoading(true)
        setError(null)

        fetch(`${API_BASE}/events/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error(`Не удалось загрузить событие (HTTP ${res.status})`)
                return res.json()
            })
            .then((data: EventCardItem) => {
                if (!active) return
                setEvent(data)
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
    }, [id])

    const coverUrl = resolveUrl(event?.previewImageUrl)
    const hasCover = Boolean(coverUrl)

    return (
        <div className="page-main">
            <div className="page__header">
                <BackToSectionButton to="/events" label="К разделу События" title='Назад' />
            </div>

            {loading && <div className="page__container"><div className="events-status">Загрузка события...</div></div>}
            {error && !loading && <div className="page__container"><div className="events-status events-status--error">{error}</div></div>}

            {!loading && !error && event && (
                <>
                    <div className="page__container">
                        <div className={`event-detail__preview ${hasCover ? 'has-cover' : 'no-cover'}`}>
                            <div className="event-detail__preview-info">
                                {event.address && <div className="event-detail__address">{event.address}</div>}

                                <h1 className="page-title">{event.title}</h1>
                                <div>
                                    <p className='block-label-md'>{formatDateRange(event.startDate, event.endDate)}</p>
                                </div>

                                <div className="event-detail__actions" >
                                    {event.registrationUrl && (
                                        <OutlineArrowButtonLink
                                            href={event.registrationUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Подробности и регистрация
                                        </OutlineArrowButtonLink>
                                    )}
                                </div>
                            </div>

                            {hasCover && (
                                <div className="event-detail__cover">
                                    <ImageViewer src={coverUrl} alt={`Превью события ${event.title}`} />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="page__container page__container--27 events-page__container" >
                        {event.description && event.description.trim() && event.description.replace(/<[^>]*>/g, '').trim() && (
                            <div>
                                <h2 className="section-title--lg" style={{ marginBottom: '50px' }}>О событии</h2>
                                <p className="body-text article-text"
                                    dangerouslySetInnerHTML={{ __html: event.description }}
                                />
                            </div>

                        )}

                        {(event.mapCoordinates || event.detailedAddress) && (
                            <div className="event" style={{ marginTop: '80px' }}>
                                <h2 className="section-title--lg" style={{ marginBottom: '50px' }}>Адрес</h2>
                                {event.detailedAddress && (
                                    <div style={{ display: 'flex',  marginBottom: '30px', gap: '7px' }}>
                                        <i className="bi bi-geo-alt-fill" style={{ color: 'var(--primary-strong)'}}></i>
                                        <p className="body-text">{event.detailedAddress}</p>
                                    </div>
                                )}
                                {event.mapCoordinates && (
                                    <div className="event-detail__map-container">
                                        <iframe
                                            title="Карта мероприятия"
                                            src={buildYandexMapUrl(event.mapCoordinates) || ''}
                                            width="100%"
                                            height="400"
                                            frameBorder="0"
                                            style={{ display: 'block' }}
                                            allowFullScreen
                                            loading="lazy"
                                        ></iframe>
                                    </div>
                                )}

                            </div>
                        )}

                        {Array.isArray(event.schedule) && event.schedule.length > 0 && (
                            <ScheduleSection schedule={event.schedule} />
                        )}

                        {event.faq && event.faq.length > 0 && (
                            <FAQSection items={event.faq} title='Вопрос-ответ' />
                        )}

                        <div style={{ marginTop: '150px', alignContent: 'center', display: 'flex', justifyContent: 'center' }}>
                            <button
                                className="share__button-link"
                                onClick={() => setIsShareModalOpen(true)}
                                title="Поделиться событием"
                            >
                                Поделиться
                            </button>
                        </div>
                    </div>
                    <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} url={window.location.origin + '/events/' + id} title={event?.title} />
                </>
            )}
        </div>
    )
}

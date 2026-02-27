import { useState } from 'react'
import './ScheduleSection.css'

export type ScheduleBlock = {
    timeStart: string
    timeEnd?: string
    title: string
    description: string
    location?: string
    moderators?: Array<{
        name: string
        position?: string
        photoUrl?: string
    }>
    speakers?: Array<{
        name: string
        position?: string
        photoUrl?: string
    }>
}

export type ScheduleDay = {
    date: string
    blocks: ScheduleBlock[]
}

type Props = {
    schedule: ScheduleDay[]
    title?: string
}

const resolveUrl = (raw?: string | null) => {
    if (!raw) return ''
    if (raw.startsWith('data:')) return raw
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
    const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'
    return raw.startsWith('/') ? `${API_BASE}${raw}` : `${API_BASE}/${raw}`
}

export default function ScheduleSection({ schedule, title = 'Расписание' }: Props) {
    const [selectedDayIndex, setSelectedDayIndex] = useState(0)

    if (!schedule || schedule.length === 0) return null

    const selectedDay = schedule[selectedDayIndex]

    return (
        <div className="schedule-section">
            <h2 className="section-title--lg schedule-section__title">{title}</h2>

            {schedule.length > 1 && (
                <div className="schedule-section__tabs">
                    {schedule.map((day, dayIndex) => (
                        <button
                            key={dayIndex}
                            className={`schedule-section__tab ${selectedDayIndex === dayIndex ? 'schedule-section__tab--active' : ''}`}
                            onClick={() => setSelectedDayIndex(dayIndex)}
                        >
                            {day.date}
                        </button>
                    ))}
                </div>
            )}

            <div className="schedule-section__container">
                <div className="schedule-day">
                    <div className="schedule-day__blocks">
                        {selectedDay.blocks.map((block, blockIndex) => (
                            <div key={blockIndex} className="schedule-block">
                                <div className="schedule-block__time article-text">
                                    {block.timeStart}
                                    {block.timeEnd && ` – ${block.timeEnd}`}
                                </div>

                                <div className="schedule-block__content">
                                    <h4 className="schedule-block__title body-text">{block.title}</h4>

                                    {block.location && (
                                        <div className="schedule-block__location body-text">
                                            {block.location}
                                        </div>
                                    )}

                                    <p className="schedule-block__description body-text body-text--light">{block.description}</p>

                                    {block.moderators && block.moderators.length > 0 && (
                                        <div className="schedule-block__person-section">
                                            <h5 className="schedule-block__person-title">
                                                {block.moderators.length === 1 ? 'Модератор' : 'Модераторы'}
                                            </h5>
                                            <div className="schedule-block__speakers">
                                                {block.moderators.map((moderator, moderatorIndex) => (
                                                    <div key={moderatorIndex} className="schedule-block__person">
                                                        {moderator.photoUrl && (
                                                            <img
                                                                src={resolveUrl(moderator.photoUrl)}
                                                                alt={moderator.name}
                                                                className="schedule-block__person-photo"
                                                            />
                                                        )}
                                                        <div className="schedule-block__person-info">
                                                            <div className="schedule-block__person-name">{moderator.name}</div>
                                                            {moderator.position && (
                                                                <div className="schedule-block__person-position">{moderator.position}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {block.speakers && block.speakers.length > 0 && (
                                        <div className="schedule-block__person-section">
                                            <h5 className="schedule-block__person-title">
                                                {block.speakers.length === 1 ? 'Спикер' : 'Спикеры'}
                                            </h5>
                                            <div className="schedule-block__speakers">
                                                {block.speakers.map((speaker, speakerIndex) => (
                                                    <div key={speakerIndex} className="schedule-block__person">
                                                        {speaker.photoUrl && (
                                                            <img
                                                                src={resolveUrl(speaker.photoUrl)}
                                                                alt={speaker.name}
                                                                className="schedule-block__person-photo"
                                                            />
                                                        )}
                                                        <div className="schedule-block__person-info">
                                                            <div className="schedule-block__person-name">{speaker.name}</div>
                                                            {speaker.position && (
                                                                <div className="schedule-block__person-position">{speaker.position}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

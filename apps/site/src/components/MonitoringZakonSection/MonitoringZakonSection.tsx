import { useEffect, useState, useRef } from 'react'
import MonitoringZakonCard from '../MonitoringZakonCard/MonitoringZakonCard'
import ContentSection from '../ContentSection/ContentSection'
import { OutlineButtonLink } from '../LinkButtons'
import './MonitoringZakonSection.css'

interface MonitoringItem {
    id: string
    page: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft: boolean
        blocks: any[]
    }
}

const getPublishedAtValue = (value?: string) => {
    if (!value) return 0
    const dateValue = new Date(value).getTime()
    return Number.isNaN(dateValue) ? 0 : dateValue
}

export default function MonitoringZakonSection() {
    const [monitoringItems, setMonitoringItems] = useState<MonitoringItem[]>([])
    const [monitoringLoading, setMonitoringLoading] = useState(true)
    const [monitoringError, setMonitoringError] = useState<string | null>(null)
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    useEffect(() => {
        let active = true

        const fetchMonitoring = async () => {
            setMonitoringLoading(true)
            setMonitoringError(null)

            try {
                const response = await fetch(`${API_BASE}/monitoring-zakon?isDraft=false&page=1&pageSize=6`)
                if (!response.ok) throw new Error('Ошибка загрузки данных')
                const data = await response.json()
                const list: MonitoringItem[] = Array.isArray(data) ? data : (data?.items || [])

                if (!active) return
                const latest = [...list]
                    .sort((a, b) => getPublishedAtValue(b.page.publishedAt) - getPublishedAtValue(a.page.publishedAt))
                    .slice(0, 6)
                setMonitoringItems(latest)
            } catch (err) {
                if (!active) return
                setMonitoringError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            } finally {
                if (active) setMonitoringLoading(false)
            }
        }

        fetchMonitoring()

        return () => {
            active = false
        }
    }, [API_BASE])

    return (
        <section className="monitoring-section">
            <div className="monitoring-section__sidebar" id="MonitoringSidebar">
                <h2 className="section-title--lg">[ Мониторинг законодательства ]</h2>
            </div>

            <div className="monitoring-section__content" id="MonitoringContent">
                {monitoringLoading && (
                    <div className="monitoring-section__status">Загрузка...</div>
                )}

                {monitoringError && !monitoringLoading && (
                    <div className="monitoring-section__status monitoring-section__status--error">
                        Ошибка: {monitoringError}
                    </div>
                )}

                {!monitoringLoading && !monitoringError && (
                    monitoringItems.length === 0 ? (
                        <div className="monitoring-section__status">Материалы пока не опубликованы</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
                            <AnimatedMonitoringItems items={monitoringItems} />
                            <div>
                                <OutlineButtonLink href="/monitoring-zakon">Подробнее</OutlineButtonLink>
                            </div>
                        </div>
                    )
                )}
            </div>
        </section>
    )
}

function AnimatedMonitoringItems({ items }: { items: MonitoringItem[] }) {
    const itemRefs = useRef<(HTMLDivElement | null)[]>([])
    const [visibleIndexes, setVisibleIndexes] = useState<number[]>([])

    useEffect(() => {
        if (!items.length) return
        let observer: IntersectionObserver | null = null
        let timeoutIds: number[] = []
        setVisibleIndexes([])

        observer = new window.IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const index = Number(entry.target.getAttribute('data-index'))
                if (entry.isIntersecting && !visibleIndexes.includes(index)) {
                    timeoutIds.push(window.setTimeout(() => {
                        setVisibleIndexes((prev) => [...prev, index])
                    }, index * 200))
                }
            })
        }, { threshold: 0.2 })

        itemRefs.current.forEach((ref) => {
            if (ref) observer?.observe(ref)
        })

        if (!('IntersectionObserver' in window)) {
            setVisibleIndexes(items.map((_, i) => i))
        }

        return () => {
            observer?.disconnect()
            timeoutIds.forEach(clearTimeout)
        }
    }, [items])

    return (
        <ContentSection
            columns={2}
            items={items}
            renderItem={(item, index) => (
                <div
                    ref={el => itemRefs.current[index] = el}
                    data-index={index}
                    style={{ height: '100%' }}
                    className={
                        'monitoring-section__item-animated' +
                        (visibleIndexes.includes(index) ? ' monitoring-section__item-visible' : '')
                    }
                >
                    <MonitoringZakonCard
                        item={{
                            id: item.id,
                            slug: item.page.slug,
                            title: item.page.title,
                            publishedAt: item.page.publishedAt,
                        }}
                        type="main-page"
                    />
                </div>
            )}
        />
    )
}


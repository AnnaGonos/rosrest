import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import Pagination from '../../components/Pagination/Pagination'
import './MonitoringZakonPage.css'
import MonitoringZakonCard from '../../components/MonitoringZakonCard/MonitoringZakonCard'

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

const PAGE_SIZE = 21

export default function MonitoringZakonPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [items, setItems] = useState<MonitoringItem[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalPages, setTotalPages] = useState(1)

    const currentPage = useMemo(() => {
        const raw = Number(searchParams.get('page') || '1')
        return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
    }, [searchParams])

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true)
            setError(null)

            try {
                const response = await fetch(`${API_BASE}/monitoring-zakon?isDraft=false&page=${currentPage}&pageSize=${PAGE_SIZE}`)
                if (!response.ok) throw new Error('Ошибка загрузки данных')
                const data = await response.json()
                const list = Array.isArray(data) ? data : (data?.items || [])
                setItems(list)
                const pages = typeof data?.totalPages === 'number' ? data.totalPages : 1
                setTotalPages(pages > 0 ? pages : 1)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
            } finally {
                setLoading(false)
            }
        }

        fetchItems()
    }, [API_BASE, currentPage])

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [currentPage])

    const handlePageChange = (page: number) => {
        setSearchParams({ page: String(page) })
    }

    if (loading) return <div className="page-main"><div className="page__container">Загрузка...</div></div>
    if (error) return <div className="page-main"><div className="page__container">Ошибка: {error}</div></div>

    return (
        <div className="page-main">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Мониторинг законодательства', isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container">
                <div className='page__header-title'>
                    <h1 className="page-title">Мониторинг законодательства</h1>
                </div>

                <p className="body-text" style={{ marginBottom: '50px' }}>
                    * Материал подготовлен с использованием информационно-правовых систем КонсультантПлюс и Гарант
                </p>

                <ContentSection
                    columns={3}
                    items={items}
                    renderItem={(item) => (
                        <MonitoringZakonCard
                            item={{
                                id: item.id,
                                slug: item.page.slug,
                                title: item.page.title,
                                publishedAt: item.page.publishedAt,
                            }}
                        />
                    )}
                />

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
        </div>
    )
}

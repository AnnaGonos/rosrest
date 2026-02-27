import { useEffect, useState } from 'react'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import LinkCardList from '../../components/LinkCardList/LinkCardList'
import './RarMembersPage.css'

interface RarSection {
    id: string
    title: string
    slug: string
    icon?: string | null
}

export default function RarMembersPage() {
    const [sections, setSections] = useState<RarSection[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    useEffect(() => {
        fetchSections()
    }, [])

    const fetchSections = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${API_BASE}/rar-sections`)
            if (!response.ok) throw new Error('Ошибка загрузки секций')
            const data = await response.json()
            setSections(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    const items = sections.map(section => ({
        title: section.title,
        href: `/members/${section.slug}`,
        icon: section.icon || undefined
    }))

    return (
        <div className="page-main">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Члены РАР', isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container page__container--members">
                <div className='page__header-title'>
                    <h1 className="page-title">Члены РАР</h1>
                </div>

                <ContentSection columns={1}>
                    {loading && <div>Загрузка...</div>}
                    {error && <div className="body-text">Ошибка: {error}</div>}
                    {!loading && !error && (
                        <LinkCardList items={items} columns={4} variant="categories" />
                    )}
                </ContentSection>
            </div>
        </div>
    )
}

import { useEffect, useState } from 'react'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import LinkCardList from '../../components/LinkCardList/LinkCardList'
import './RarMembersPage.css'
import RequestState from '../../components/RequestState/RequestState'
import Seo from '../../components/Seo/Seo'

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
    const ruCollator = new Intl.Collator('ru', { sensitivity: 'base', ignorePunctuation: true, numeric: true })

    const normalizeSortText = (value: string): string =>
        value
            .normalize('NFKC')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/ё/gi, match => (match === 'Ё' ? 'Е' : 'е'))

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

    const items = [...sections]
        .sort((a, b) => ruCollator.compare(normalizeSortText(a.title), normalizeSortText(b.title)))
        .map(section => ({
            title: section.title,
            href: `/members/${section.slug}`,
            icon: section.icon || undefined
        }))

    return (
        <div className="page-main">
            <Seo
                title="Члены Российской ассоциации реставраторов"
                description="Каталог членов Российской ассоциации реставраторов по секциям и направлениям."
                canonical="https://rosrest.com/members"
                url="https://rosrest.com/members"
            />
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
                    <RequestState
                        loading={loading}
                        error={error}
                        loadingText="Загрузка секций..."
                        variant="inline"
                        className="rar-status"
                    />
                    {!loading && !error && (
                        <LinkCardList items={items} columns={4} variant="categories" />
                    )}
                </ContentSection>
            </div>
        </div>
    )
}

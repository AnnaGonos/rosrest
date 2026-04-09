import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import LinkCardList from '../../components/LinkCardList/LinkCardList'
import './RarSectionPage.css'
import RequestState from '../../components/RequestState/RequestState'
import NotFoundPage from '../not-found/NotFoundPage'
import Seo from '../../components/Seo/Seo'

interface Page {
    id: string
    slug: string
    title: string
    publishedAt?: string
    isDraft: boolean
}

interface RarSection {
    id: string
    title: string
    slug: string
    icon?: string | null
}

interface RarMember {
    id: string
    previewImage?: string
    page: Page
    sections: RarSection[]
}

export default function RarSectionPage() {
    const { slug } = useParams<{ slug: string }>()
    const [section, setSection] = useState<RarSection | null>(null)
    const [members, setMembers] = useState<RarMember[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [notFound, setNotFound] = useState(false)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'
    const ruCollator = new Intl.Collator('ru', { sensitivity: 'base', ignorePunctuation: true, numeric: true })
    const latinToCyrillicMap: Record<string, string> = {
        A: 'А',
        B: 'В',
        C: 'С',
        E: 'Е',
        H: 'Н',
        K: 'К',
        M: 'М',
        O: 'О',
        P: 'Р',
        T: 'Т',
        X: 'Х',
        Y: 'У',
        a: 'а',
        c: 'с',
        e: 'е',
        o: 'о',
        p: 'р',
        x: 'х',
        y: 'у'
    }

    const normalizeSortText = (value: string): string =>
        value
            .normalize('NFKC')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[ABCEHKMOPTXYaceopxy]/g, char => latinToCyrillicMap[char] || char)
            .replace(/ё/gi, match => (match === 'Ё' ? 'Е' : 'е'))

    const resolveImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        if (url.startsWith('//')) return `${window.location.protocol}${url}`
        return `${API_BASE.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
    }

    useEffect(() => {
        fetchSectionAndMembers()
    }, [slug])

    const fetchSectionAndMembers = async () => {
        setLoading(true)
        setError(null)
        setNotFound(false)
        try {
            const sectionsResponse = await fetch(`${API_BASE}/rar-sections`)
            if (sectionsResponse.status === 404) {
                setNotFound(true)
                return
            }
            if (!sectionsResponse.ok) throw new Error('Ошибка загрузки секции')
            const sectionsData: RarSection[] = await sectionsResponse.json()
            const foundSection = sectionsData.find(s => s.slug === slug)
            if (!foundSection) {
                setNotFound(true)
                return
            }
            setSection(foundSection)

            const membersResponse = await fetch(`${API_BASE}/rar-members`)
            if (membersResponse.status === 404) {
                setNotFound(true)
                return
            }
            if (!membersResponse.ok) throw new Error('Ошибка загрузки членов')
            const membersData: RarMember[] = await membersResponse.json()
            
            const filteredMembers = membersData.filter(
                member => 
                    !member.page.isDraft && 
                    member.sections?.some(s => s.id === foundSection.id)
            )
            setMembers(filteredMembers)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    if (notFound) {
        return <NotFoundPage />
    }

    if (loading || error) {
        return <RequestState loading={loading} error={error} loadingText="Загрузка секции..." />
    }
    if (!section) return null

    const items = [...members]
        .sort((a, b) => ruCollator.compare(normalizeSortText(a.page.title), normalizeSortText(b.page.title)))
        .map(member => ({
            title: member.page.title,
            href: `/portfolio/${member.page.slug.replace(/^portfolio\//, '')}`,
            image: member.previewImage ? resolveImageUrl(member.previewImage) : undefined,
        }))

    return (
        <div className="page-main">
            <Seo
                title={`${section.title} - Члены Российской ассоциации реставраторов`}
                description={section.title + ' — список членов Российской ассоциации реставраторов, их портфолио и контактная информация.'}
                canonical={window.location.origin + '/members/' + (section.slug || section.id)}
                url={window.location.origin + '/members/' + (section.slug || section.id)}
            />
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Члены РАР', to: '/members' },
                        { label: section.title, isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container page__container--members">
                <div className="page__header-title">
                    <BackToSectionButton to="/members" label="К разделу Члены РАР" />
                    <h1 className="page-title">{section.title}</h1>
                </div>

                <ContentSection columns={1}>
                    {items.length === 0 && (
                        <p className="body-text">В этой секции пока никого нет</p>
                    )}
                    {items.length > 0 && (
                        <LinkCardList items={items} columns={4} variant="categories" />
                    )}
                </ContentSection>
            </div>
        </div>
    )
}

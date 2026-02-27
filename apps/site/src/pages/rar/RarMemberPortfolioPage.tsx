import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import { BlocksRenderer } from '../../components/BlocksRenderer'
import TableOfContents from '../../components/TableOfContents'
import './RarMemberPortfolioPage.css'
import ScrollToTopButton from '../../components/ScrollToTop/ScrollToTopButton'
import ShareModal from '../../components/ShareModal'
import CommentsSection from '../../components/Comments/CommentsSection'

interface Block {
    id: string
    type: string
    content: Record<string, any>
    order: number
    children?: Block[]
}

interface Page {
    id: string
    slug: string
    title: string
    publishedAt?: string
    isDraft: boolean
    blocks: Block[]
}

interface RarSection {
    id: string
    title: string
    slug: string
    icon?: string | null
}

interface RarMember {
    id: string
    page: Page
    sections: RarSection[]
}

export default function RarMemberPortfolioPage() {
    const { slug } = useParams<{ slug: string }>()
    const [member, setMember] = useState<RarMember | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [commentsCount, setCommentsCount] = useState(0)
    const commentsRef = useRef<HTMLDivElement>(null)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    const resolveImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        if (url.startsWith('//')) return `${window.location.protocol}${url}`
        return `${API_BASE.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
    }

    const scrollToComments = () => {
        if (commentsRef.current) {
            commentsRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }

    useEffect(() => {
        fetchMember()
    }, [slug])

    const fetchMember = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${API_BASE}/rar-members`)
            if (!response.ok) throw new Error('Ошибка загрузки портфолио')
            const data: RarMember[] = await response.json()
            const found = data.find(m =>
                m.page.slug.replace(/^portfolio\//, '') === slug && !m.page.isDraft
            )
            if (!found) throw new Error('Портфолио не найдено')
            setMember(found)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="page-main"><div className="page__container">Загрузка...</div></div>
    if (error) return <div className="page-main"><div className="page__container">Ошибка: {error}</div></div>
    if (!member) return null

    return (
        <div className="page-main page-main--portfolio">
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Члены РАР', to: '/members' },
                        { label: member.page.title, isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container page__container--37">
                <div className="page__header-title">
                    <BackToSectionButton to="/members" label="К разделу Члены РАР" />
                    <h1 className="page-title">{member.page.title}</h1>

                    {member.sections && member.sections.length > 0 && (
                        <div className="rar-portfolio-sections">
                            {member.sections.map(section => (
                                <Link
                                    key={section.id}
                                    to={`/members/${section.slug}`}
                                    className="rar-portfolio-section-badge"
                                >
                                    {section.title}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="page__container">
                <div className="rar-portfolio-layout">
                    <aside className="rar-portfolio-sidebar">
                        <TableOfContents blocks={member.page.blocks} />
                    </aside>

                    <div className="rar-portfolio-content">
                        <ContentSection columns={1}>
                            <BlocksRenderer blocks={member.page.blocks} />
                        </ContentSection>

                        <div style={{ marginTop: '100px', alignContent: 'center', display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                className="share__button-link"
                                onClick={() => setIsShareModalOpen(true)}
                                title="Поделиться"
                            >
                                Поделиться
                            </button>

                            <div
                                className="comments-section__counter"
                                onClick={scrollToComments}
                                title="Перейти к комментариям"
                            >
                                <i className="bi bi-chat-text"></i>
                                <span>{commentsCount}</span>
                            </div>
                        </div>

                        <div ref={commentsRef}>
                            <CommentsSection
                                commentableType="rar-member"
                                commentableId={member.id}
                                onCommentCountChange={setCommentsCount}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} url={window.location.origin + '/' +member?.page.slug} title={member?.page.title} />
            <ScrollToTopButton />
        </div>
    )
}

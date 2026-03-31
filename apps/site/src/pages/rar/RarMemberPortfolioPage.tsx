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
import RequestState from '../../components/RequestState/RequestState'
import NotFoundPage from '../not-found/NotFoundPage'
import Seo from '../../components/Seo/Seo'

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

function collectStringsDeep(value: unknown, bucket: string[] = []): string[] {
    if (value == null) return bucket
    if (typeof value === 'string') {
        const cleaned = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        if (cleaned) bucket.push(cleaned)
        return bucket
    }
    if (Array.isArray(value)) {
        value.forEach((item) => collectStringsDeep(item, bucket))
        return bucket
    }
    if (typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach((item) => collectStringsDeep(item, bucket))
    }
    return bucket
}

function collectBlockTexts(blocks: Block[] = []): string[] {
    const result: string[] = []
    const walk = (items: Block[]) => {
        items.forEach((block) => {
            collectStringsDeep(block.content, result)
            if (block.children?.length) walk(block.children)
        })
    }
    walk(blocks)
    return result
}

function buildSeoDescription(page: Page): string {
    const fallback = `${page.title} - портфолио члена Российской ассоциации реставраторов: профиль, направления деятельности и реализованные работы.`
    const text = collectBlockTexts(page.blocks).join(' ').replace(/\s+/g, ' ').trim()
    if (!text) return fallback
    return text.length > 190 ? `${text.slice(0, 187).trim()}...` : text
}

export default function RarMemberPortfolioPage() {
    const { slug } = useParams<{ slug: string }>()
    const [member, setMember] = useState<RarMember | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [notFound, setNotFound] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [commentsCount, setCommentsCount] = useState(0)
    const commentsRef = useRef<HTMLDivElement>(null)

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'


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
        setNotFound(false)
        try {
            const response = await fetch(`${API_BASE}/rar-members`)
            if (response.status === 404) {
                setNotFound(true)
                return
            }
            if (!response.ok) throw new Error('Ошибка загрузки портфолио')
            const data: RarMember[] = await response.json()
            const found = data.find(m =>
                m.page.slug.replace(/^portfolio\//, '') === slug && !m.page.isDraft
            )
            if (!found) {
                setNotFound(true)
                return
            }
            setMember(found)
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
        return <RequestState loading={loading} error={error} loadingText="Загрузка портфолио..." />
    }
    if (!member) return null

    const portfolioSlug = member.page.slug.replace(/^portfolio\//, '')
    const portfolioUrl = `${window.location.origin}/portfolio/${portfolioSlug}`
    const seoDescription = buildSeoDescription(member.page)

    return (
        <div className="page-main page-main--portfolio">
            <Seo
                title={`${member.page.title} - Портфолио Российской ассоциации реставраторов`}
                description={seoDescription}
                canonical={portfolioUrl}
                url={portfolioUrl}
            />
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

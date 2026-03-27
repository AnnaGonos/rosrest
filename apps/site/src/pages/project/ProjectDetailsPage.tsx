import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import { BlocksRenderer } from '../../components/BlocksRenderer'
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

interface Project {
    id: string
    previewImage: string
    page: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft: boolean
        blocks: Block[]
    }
}

export default function ProjectDetailsPage() {
    const { slug } = useParams<{ slug: string }>()
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [notFound, setNotFound] = useState(false)

    useEffect(() => {
        fetchProject()
    }, [slug])

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

    const fetchProject = async () => {
        setLoading(true)
        setError(null)
        setNotFound(false)
        try {
            const response = await fetch(`${API_BASE}/projects`)
            if (response.status === 404) {
                setNotFound(true)
                return
            }
            if (!response.ok) throw new Error(`Ошибка загрузки проекта (HTTP ${response.status})`)
            const data: Project[] = await response.json()
            const found = data.find(p => p.page.slug.replace(/^projects\//, '') === slug)
            if (!found) {
                setNotFound(true)
                return
            }

            setProject(found)
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
        return <RequestState loading={loading} error={error} loadingText="Загрузка проекта..." />
    }
    if (!project) return null

    return (
        <div className="page-main">
            <Seo
                title={`${project.page.title} - Российская ассоциация реставраторов`}
                description={project.page.title + ' — проект Российской ассоциации реставраторов.'}
                canonical={window.location.origin + '/projects/' + (project.page.slug || project.page.id)}
                url={window.location.origin + '/projects/' + (project.page.slug || project.page.id)}
            />
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Проекты', to: '/projects' },
                        { label: '', isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container page__container--27">
                <div className='page__header-title'>
                    <BackToSectionButton to="/projects" label="К разделу Проекты" />
                    <h1 className="page-title">{project.page.title}</h1>
                </div>

                <ContentSection columns={1}>
                    <BlocksRenderer blocks={project.page.blocks} />
                </ContentSection>
            </div>
        </div>
    )
}

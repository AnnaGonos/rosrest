import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import { BackToSectionButton } from '../../components/LinkButtons'
import { BlocksRenderer } from '../../components/BlocksRenderer'

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

    useEffect(() => {
        fetchProject()
    }, [slug])

    const fetchProject = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`http://localhost:3002/projects`)
            if (!response.ok) throw new Error('Ошибка загрузки проекта')
            const data: Project[] = await response.json()
            const found = data.find(p => p.page.slug.replace(/^projects\//, '') === slug)
            if (!found) throw new Error('Проект не найден')
            
            setProject(found)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="page-main"><div className="page__container">Загрузка...</div></div>
    if (error) return <div className="page-main"><div className="page__container">Ошибка: {error}</div></div>
    if (!project) return null

    return (
        <div className="page-main">
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

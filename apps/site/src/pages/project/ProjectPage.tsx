import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import { getFileUrl } from '../../utils/getFileUrl';
import ContentSection from '../../components/ContentSection/ContentSection'
import LinkCardList from '../../components/LinkCardList/LinkCardList'
import './ProjectPage.css'
import { useEffect, useState } from 'react'
import RequestState from '../../components/RequestState/RequestState'
import Seo from '../../components/Seo/Seo'

interface Project {
    id: string
    previewImage: string
    page: {
        id: string
        slug: string
        title: string
        publishedAt?: string
        isDraft: boolean
        blocks: any[]
    }
}

export default function ProjectPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchProjects()
    }, [])

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002';
    const fetchProjects = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch(`${API_BASE}/projects?isDraft=false`)
            if (response.status === 404) {
                setProjects([])
                return
            }
            if (!response.ok) throw new Error(`Ошибка загрузки проектов (HTTP ${response.status})`)
            const data = await response.json()
            setProjects(Array.isArray(data) ? data : [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }




    if (loading || error) {
        return <RequestState loading={loading} error={error} loadingText="Загрузка проектов..." />
    }

    return (
        <div className="page-main">
            <Seo
                title="Проекты Российской ассоциации реставраторов"
                description="Проекты Российской ассоциации реставраторов: образовательные, выставочные и исследовательские инициативы в сфере реставрации."
                canonical="https://rosrest.com/projects"
                url="https://rosrest.com/projects"
            />
            <div className="page__header">
                <Breadcrumbs
                    items={[
                        { label: 'Главная', to: '/' },
                        { label: 'Проекты', isCurrent: true },
                    ]}
                />
            </div>

            <div className="page__container">
                <div className='page__header-title'>
                    <h1 className="page-title">Проекты</h1>
                </div>

                <ContentSection columns={1}>
                    <LinkCardList
                        columns={3}
                        items={projects.map(project => ({
                            title: project.page.title,
                            href: `/projects/${project.page.slug.replace(/^projects\//, '')}`,
                            image: getFileUrl(project.previewImage) || '',
                        }))}
                        variant='image'
                    />
                </ContentSection>
            </div>
        </div>
    )
}


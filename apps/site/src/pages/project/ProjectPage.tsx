import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import LinkCardList from '../../components/LinkCardList/LinkCardList'
import './Projectpage.css'
import { useEffect, useState } from 'react'

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
            if (!response.ok) throw new Error('Ошибка загрузки проектов')
            const data = await response.json()
            setProjects(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
        } finally {
            setLoading(false)
        }
    }


    const resolveImageUrl = (url: string): string => {
        if (!url) return ''
        if (url.startsWith('http://') || url.startsWith('https://')) return url
        if (url.startsWith('//')) return `${window.location.protocol}${url}`
        
        return `${API_BASE.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
    }

    if (loading) return <div className="page-main"><div className="page__container">Загрузка...</div></div>
    if (error) return <div className="page-main"><div className="page__container">Ошибка: {error}</div></div>

    return (
        <div className="page-main">
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
                        columns={2}
                        items={projects.map(project => ({
                            title: project.page.title,
                            href: `/projects/${project.page.slug.replace(/^projects\//, '')}`,
                            image: resolveImageUrl(project.previewImage),
                        }))}
                        variant='image'
                    />
                </ContentSection>
            </div>
        </div>
    )
}


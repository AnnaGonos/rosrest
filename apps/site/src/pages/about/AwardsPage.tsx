import { useEffect, useState } from 'react'
import Breadcrumbs from '../../components/Breadcrumbs/Breadcrumbs'
import ContentSection from '../../components/ContentSection/ContentSection'
import Gallery from '../../components/Gallery/Gallery'
import { BackToSectionButton } from '../../components/LinkButtons'

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

type Award = {
    id: string
    imageUrl: string
    caption?: string | null
    createdAt?: string
}

export default function AwardsPage() {
    const [items, setItems] = useState<Award[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let mounted = true
        setLoading(true)
        fetch(`${API_BASE}/awards`)
            .then((r) => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`)
                return r.json()
            })
            .then((data: Award[]) => {
                if (mounted) setItems(data || [])
            })
            .catch((err) => {
                if (mounted) setError(String(err))
            })
            .finally(() => {
                if (mounted) setLoading(false)
            })
        return () => { mounted = false }
    }, [])

    const images = items
        .slice()
        .sort((a, b) => {
            const ta = a.createdAt ? Date.parse(a.createdAt) : 0
            const tb = b.createdAt ? Date.parse(b.createdAt) : 0
            return tb - ta
        })
        .map((it) => {
            const raw = it.imageUrl || ''
            const src = raw.startsWith('/') ? `${API_BASE}${raw}` : raw
            return { imageUrl: src, caption: it.caption || undefined }
        })

    return (
        <div className="page-main">
            <div className="page__header">
                <Breadcrumbs items={[
                    { label: 'Главная', to: '/' },
                    { label: 'Об Ассоциации', to: '/about' },
                    { label: 'Награды и дипломы', isCurrent: true }]} />
            </div>

            <div className="page__container about-page__container">
                <div className='page__header-title'>
                    <BackToSectionButton to="/about" label="К разделу Об Ассоциации" />
                    <h1 className="page-title">Награды и дипломы</h1>
                </div>

                <ContentSection columns={1}>
                    <p className="body-text article-text" style={{ marginBottom: '80px' }}>
                        С момента создания Российской ассоциации реставраторов ее коллектив и руководство неоднократно награждались различными грамотами и благодарностями Министерства культуры Российской Федерации, Русской Православной Церкви, государственных учреждений, организационных комитетов российских и зарубежных выставок.
                    </p>
                </ContentSection>

                <ContentSection columns={1}>
                    {loading && <div>Загрузка...</div>}
                    {error && <div className="body-text">Ошибка: {error}</div>}
                    {!loading && !error && (
                        <Gallery images={images} mode="grid" columns={5} thumbnailHeight={350} />
                    )}
                </ContentSection>
            </div>
        </div>
    )
}

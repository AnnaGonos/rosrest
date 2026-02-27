import './DocumentList.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

type DocItem = {
    id: string
    title: string
    pdfUrl?: string | null
    previewUrl?: string | null
    createdAt?: string
}

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3002'

type Props = {
    items: DocItem[]
    loading: boolean
    error: string | null
    emptyMessage?: string
    variant?: 'list' | 'gallery'
}

export default function DocumentList({ items, loading, error, emptyMessage = 'Документы не найдены.', variant = 'list' }: Props) {
    const resolvePdf = (raw?: string | null) => {
        if (!raw) return undefined
        if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
        return raw.startsWith('/') ? `${API_BASE}${raw}` : raw
    }

    const resolvePreview = (raw?: string | null) => {
        if (!raw) return undefined
        if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
        return raw.startsWith('/') ? `${API_BASE}${raw}` : raw
    }

    if (loading) return <div>Загрузка...</div>
    if (error) return <div className="body-text">Ошибка: {error}</div>


    if (variant === 'list') {
        return (
            <div className="documents-list">
                {items.length === 0 && <div className="body-text">{emptyMessage}</div>}
                <ul>
                    {items.map((d) => (
                        <li key={d.id}>
                            <a href={resolvePdf(d.pdfUrl)} target="_blank" rel="noopener noreferrer">{d.title} <i className="bi bi-arrow-up-right"></i></a>
                        </li>
                    ))}
                </ul>
            </div>
        )
    } else {
        return (
            <div className="documents-list documents-grid">
                {items.length === 0 && <div className="body-text">{emptyMessage}</div>}
                <div className="documents-grid__items">
                    {items.map((d) => {
                        const preview = resolvePreview(d.previewUrl)
                        return (
                            <a
                                key={d.id}
                                href={resolvePdf(d.pdfUrl)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="documents-grid__item"
                                title={d.title}
                            >
                                {preview ? (
                                    <img src={preview} alt={d.title} className="documents-grid__image" />
                                ) : (
                                    <div className="documents-grid__placeholder">
                                        <i className="bi bi-file-earmark-pdf"></i>
                                        <span>{d.title}</span>
                                    </div>
                                )}
                            </a>
                        )
                    })}
                </div>
            </div>
        )
    }

}

import './DocumentList.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import { getFileUrl } from '../../utils/getFileUrl'

type DocItem = {
    id: string
    title: string
    fileUrl?: string | null
    previewUrl?: string | null
    createdAt?: string
}


type Props = {
    items: DocItem[]
    loading: boolean
    error: string | null
    emptyMessage?: string
    emptyClassName?: string
    variant?: 'list' | 'gallery'
}

export default function DocumentList({
    items,
    loading,
    error,
    emptyMessage = 'Документы не найдены.',
    emptyClassName = 'body-text',
    variant = 'list',
}: Props) {
    const resolveFile = (raw?: string | null) => getFileUrl(raw) || ''
    const resolvePreview = (raw?: string | null) => getFileUrl(raw) || undefined

    if (loading) return <div>Загрузка...</div>
    if (error) return <div className="body-text">Ошибка: {error}</div>


    if (variant === 'list') {
        return (
            <div className="documents-list">
                {items.length === 0 && <div className={emptyClassName}>{emptyMessage}</div>}
                <ul>
                    {items.map((d) => {
                        const fileUrl = resolveFile(d.fileUrl);
                        return (
                            <li key={d.id}>
                                {fileUrl ? (
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                        {d.title}
                                        <i className="bi bi-arrow-up-right"></i>
                                    </a>
                                ) : (
                                    <span>{d.title}</span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        )
    } else {
        return (
            <div className="documents-list documents-grid">
                {items.length === 0 && <div className={emptyClassName}>{emptyMessage}</div>}
                <div className="documents-grid__items">
                    {items.map((d) => {
                        const preview = resolvePreview(d.previewUrl);
                        const fileUrl = resolveFile(d.fileUrl);
                        return fileUrl ? (
                            <a
                                key={d.id}
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="documents-grid__item"
                                title={d.title}
                            >
                                {preview ? (
                                    <img src={preview} alt={d.title} className="documents-grid__image" />
                                ) : (
                                    <div className="documents-grid__placeholder">
                                        <span>{d.title}</span>
                                    </div>
                                )}
                            </a>
                        ) : (
                            <div key={d.id} className="documents-grid__item" title={d.title}>
                                {preview ? (
                                    <img src={preview} alt={d.title} className="documents-grid__image" />
                                ) : (
                                    <div className="documents-grid__placeholder">
                                        <span>{d.title}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )
    }

}

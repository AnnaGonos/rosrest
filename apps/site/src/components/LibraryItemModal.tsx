import { useState } from 'react'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'
import { PrimaryButtonLink } from './LinkButtons'
import ShareModal from './shared/ShareModal/ShareModal'
import './LibraryItemModal.css'

interface LibraryItem {
    id: number
    type: string
    title: string
    contentUrl: string
    previewImage?: string
    description: string
    categoryId: number
    isPublished: boolean
    createdAt: string
    category: {
        id: number
        name: string
        createdAt: string
    }
}

interface LibraryItemModalProps {
    item: LibraryItem | null
    isOpen: boolean
    onClose: () => void
}

export default function LibraryItemModal({ item, isOpen, onClose }: LibraryItemModalProps) {
    const [isShareOpen, setIsShareOpen] = useState(false)

    const imageSrc = item?.previewImage
        ? item.previewImage.startsWith('http')
            ? item.previewImage
            : `${API_BASE_URL}${item.previewImage}`
        : undefined

    if (!isOpen || !item) return null

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return (
        <div className="library-modal-backdrop" onClick={handleBackdropClick}>
            <div className="library-modal">
                <div className="library-modal__header">
                    <button
                        className="library-modal__close"
                        onClick={onClose}
                        aria-label="Закрыть"
                    >
                        <i className="bi bi-x-lg icon icon--md" />
                    </button>
                </div>

                <div className="library-modal__content">
                    {imageSrc && (
                        <img
                            src={imageSrc}
                            alt={item?.title}
                            className="library-modal__image"
                        />
                    )}

                        <div className="library-modal__info">
                        <h2 className="library-modal__title">{item.title}</h2>
           
                        {item.description && (
                            <div
                                className="library-modal__description body-text article-text"
                                dangerouslySetInnerHTML={{ __html: item.description }}
                            />
                        )}

                        <div className="library-modal__actions body-text">
                            <PrimaryButtonLink
                                href={item.contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Смотреть
                            </PrimaryButtonLink>

                            <button
                                className="library-modal__download-btn"
                                onClick={() => setIsShareOpen(true)}
                            >
                                <i className="bi bi-reply-fill icon--flip" />
                            </button>
                    
                        </div>
                    </div>
                </div>
                <ShareModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} url={window.location.origin + '/library/' + item.id} title={item.title} />
            </div>
        </div>
    )
}

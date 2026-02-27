import React, { useState } from 'react'
import './ShareModal.css'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    url: string
    title?: string
}

export default function ShareModal({ isOpen, onClose, url, title }: ShareModalProps) {
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose()
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('copy failed', err)
        }
    }

    const handleVK = () => {
        window.open(`https://vk.com/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '')}`, '_blank')
        onClose()
    }

    const handleTelegram = () => {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || '')}`, '_blank')
        onClose()
    }

    return (
        <div className="share-modal-backdrop" onClick={handleBackdropClick}>
            <div className="share-modal" role="dialog" aria-modal="true">
                <div className="share-modal__header">
                    <button className="share-modal__close" onClick={onClose} aria-label="Закрыть">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="share-modal__content">
                    <h2 className='section-title--sm' style={{ margin: 0, color: 'var(--dark-default)', textTransform: 'uppercase' }}>Поделиться</h2>
                    <p style={{ marginTop: 10, marginBottom: 16, color: 'var(--primary-strong, #222)' }}>Выберите способ</p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 30 }}>
                        <button className="share-modal__download-btn" onClick={handleVK}>
                            <svg className="icon icon--md" viewBox="0 0 101 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_2_40)">
                                    <path d="M0.5 48C0.5 25.3726 0.5 14.0589 7.52944 7.02944C14.5589 0 25.8726 0 48.5 0H52.5C75.1274 0 86.4411 0 93.4706 7.02944C100.5 14.0589 100.5 25.3726 100.5 48V52C100.5 74.6274 100.5 85.9411 93.4706 92.9706C86.4411 100 75.1274 100 52.5 100H48.5C25.8726 100 14.5589 100 7.52944 92.9706C0.5 85.9411 0.5 74.6274 0.5 52V48Z" fill="#0077FF" />
                                    <path d="M53.7085 72.042C30.9168 72.042 17.9169 56.417 17.3752 30.417H28.7919C29.1669 49.5003 37.5834 57.5836 44.25 59.2503V30.417H55.0004V46.8752C61.5837 46.1669 68.4995 38.667 70.8329 30.417H81.5832C79.7915 40.5837 72.2915 48.0836 66.9582 51.1669C72.2915 53.6669 80.8336 60.2086 84.0836 72.042H72.2499C69.7082 64.1253 63.3754 58.0003 55.0004 57.1669V72.042H53.7085Z" fill="white" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_2_40">
                                        <rect width="100" height="100" fill="white" transform="translate(0.5)" />
                                    </clipPath>
                                </defs>
                            </svg>
                        </button>

                        <button className="share-modal__download-btn" onClick={handleTelegram}>
                            <i className="bi bi-telegram icon icon--md tg-color"></i>
                        </button>

                    </div>


                    <button className="share-modal__close-btn" onClick={handleCopy}>
                        <i className="bi bi-link-45deg" />&nbsp;{copied ? <p>Ссылка скопирована</p> : <p>Скопировать ссылку</p>}
                    </button>

                </div>
            </div>
        </div>
    )
}

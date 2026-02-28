import { useEffect, useRef, useState } from 'react'
import './ImageViewer.css'

type ImageItem = string | { imageUrl?: string; src?: string; caption?: string }

interface ImageViewerProps {
    src?: string
    images?: ImageItem[]
    alt?: string
    className?: string
    startIndex?: number
}

function resolveSrc(item?: ImageItem | string) {
    if (!item) return ''
    if (typeof item === 'string') return item
    return item.imageUrl || item.src || ''
}

function resolveCaption(item?: ImageItem | string) {
    if (!item || typeof item === 'string') return undefined
    return item.caption
}

export default function ImageViewer({ src, images, alt = '', className = '', startIndex = 0 }: ImageViewerProps) {
    const [open, setOpen] = useState(false)
    const [scale, setScale] = useState(1)
    const [showIcon, setShowIcon] = useState(false)
    const imgRef = useRef<HTMLImageElement | null>(null)
    const [translate, setTranslate] = useState({ x: 0, y: 0 })
    const draggingRef = useRef(false)
    const startRef = useRef({ x: 0, y: 0 })
    const lastRef = useRef({ x: 0, y: 0 })
    const [dragging, setDragging] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(startIndex)

    useEffect(() => {
        setCurrentIndex(() => {
            const next = Math.max(0, Math.min(startIndex || 0, (images && images.length - 1) || 0))
            return next
        })
    }, [startIndex, images])

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
            if (!open) return
            if (e.key === '+') setScale((s) => Math.min(s + 0.25, 4))
            if (e.key === '-') setScale((s) => Math.max(s - 0.25, 0.25))
            if (e.key === 'ArrowRight') next()
            if (e.key === 'ArrowLeft') prev()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open])

    useEffect(() => {
        if (!open) setScale(1)
    }, [open])

    const openViewer = (e?: any) => {
        e?.preventDefault()
        setCurrentIndex(startIndex)
        setOpen(true)
    }
    const closeViewer = () => setOpen(false)
    const zoomIn = () => setScale((s) => Math.min(s + 0.25, 4))
    const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.25))


    const resetAll = () => {
        setScale(1)
        setTranslate({ x: 0, y: 0 })
        lastRef.current = { x: 0, y: 0 }
    }

    const prev = () => {
        if (!images || images.length === 0) return
        setCurrentIndex((i) => (i - 1 + images.length) % images.length)
        resetAll()
    }

    const next = () => {
        if (!images || images.length === 0) return
        setCurrentIndex((i) => (i + 1) % images.length)
        resetAll()
    }

    const startPan = (clientX: number, clientY: number) => {
        if (scale <= 1) return
        draggingRef.current = true
        setDragging(true)
        startRef.current = { x: clientX, y: clientY }
        document.body.style.userSelect = 'none'
    }

    const movePan = (clientX: number, clientY: number) => {
        if (!draggingRef.current) return
        const dx = clientX - startRef.current.x
        const dy = clientY - startRef.current.y
        const nx = lastRef.current.x + dx
        const ny = lastRef.current.y + dy
        setTranslate({ x: nx, y: ny })
    }

    const endPan = (clientX?: number, clientY?: number) => {
        if (!draggingRef.current) return
        if (typeof clientX === 'number' && typeof clientY === 'number') {
            const dx = clientX - startRef.current.x
            const dy = clientY - startRef.current.y
            lastRef.current = { x: lastRef.current.x + dx, y: lastRef.current.y + dy }
        } else {
            lastRef.current = { ...translate }
        }
        draggingRef.current = false
        setDragging(false)
        document.body.style.userSelect = ''
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        startPan(e.clientX, e.clientY)
        const onMove = (ev: MouseEvent) => movePan(ev.clientX, ev.clientY)
        const onUp = (ev: MouseEvent) => { endPan(ev.clientX, ev.clientY); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        const t = e.touches[0]
        startPan(t.clientX, t.clientY)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        const t = e.touches[0]
        movePan(t.clientX, t.clientY)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        const t = e.changedTouches[0]
        endPan(t?.clientX, t?.clientY)
    }

    return (
        <>
            <div
                className={`image-viewer-thumbnail ${className}`}
                onMouseEnter={() => setShowIcon(true)}
                onMouseLeave={() => setShowIcon(false)}
            >
                <img src={images && images.length ? resolveSrc(images[currentIndex]) : src} alt={alt} onClick={openViewer} className="image-viewer-thumb-img" />
                <button
                    className={`image-viewer-thumb-icon ${showIcon ? 'visible' : ''}`}
                    aria-label="Открыть просмотр"
                    onClick={openViewer}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
            </div>

            {open && (
                <div className="image-viewer-modal" role="dialog" aria-modal="true">
                    <div className="image-viewer-backdrop" onClick={closeViewer} />
                    <div className="image-viewer-content">
                        <div className="image-viewer-frame" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>

                            <div className="image-viewer-controls">
                                <button className="iv-btn" onClick={zoomOut} aria-label="Уменьшить">−</button>
                                <button className="iv-btn" onClick={zoomIn} aria-label="Увеличить">+</button>
                                <button className="iv-btn" onClick={resetAll} aria-label="Сбросить"><i className="bi bi-arrows-angle-contract"></i></button>
                                <button className="iv-close" onClick={closeViewer} aria-label="Закрыть">✕</button>
                            </div>

                                        <img
                                            ref={imgRef}
                                            src={images && images.length ? resolveSrc(images[currentIndex]) : src}
                                            alt={alt}
                                            className={`image-viewer-large ${dragging ? 'dragging' : ''}`}
                                            style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})` }}
                                            draggable={false}
                                        />
                                        {resolveCaption(images && images.length ? images[currentIndex] : undefined) && (
                                            <div className="image-viewer-caption" aria-hidden={false}>
                                                {resolveCaption(images && images.length ? images[currentIndex] : undefined)}
                                            </div>
                                        )}
                        </div>
                        {images && images.length > 1 && (
                            <>
                                <button className="image-viewer-nav image-viewer-nav--left" onClick={prev} aria-label="Предыдущее изображение"><i className="bi bi-chevron-left"></i></button>
                                <button className="image-viewer-nav image-viewer-nav--right" onClick={next} aria-label="Следующее изображение"><i className="bi bi-chevron-right"></i></button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

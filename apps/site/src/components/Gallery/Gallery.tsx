import { useState } from 'react'
import ImageViewer from '../ImageViewer/ImageViewer'
import './Gallery.css'

type Mode = 'preview' | 'grid'

type ImageItem = string | { imageUrl?: string; src?: string; caption?: string }

interface GalleryProps {
    images: ImageItem[]
    mode?: Mode
    columns?: 1 | 2 | 3 | 4 | 5 | 6
    startIndex?: number
    thumbnailHeight?: number | string
    className?: string
}


export default function Gallery({ images, mode = 'preview', columns = 3, startIndex = 0, thumbnailHeight, className = '' }: GalleryProps) {
    const [index, setIndex] = useState(startIndex)
    const heightVal = typeof thumbnailHeight === 'number' ? `${thumbnailHeight}px` : thumbnailHeight

    if (!images || images.length === 0) return null

    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length)
    const next = () => setIndex((i) => (i + 1) % images.length)

    if (mode === 'grid') {
        return (
            <div className={`gallery-grid columns-${columns} ${className}`.trim()}>
                {images.map((item, i) => (
                    <div key={i} className="gallery-grid__item" style={heightVal ? { height: heightVal } : {}}>
                        <ImageViewer images={images} startIndex={i} alt={`image-${i}`} className="gallery-thumb" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <>
            <div className={`gallery-preview ${className}`.trim()}>
                <button className="gallery-nav gallery-nav--left" onClick={prev} aria-label="Предыдущее"><i className="bi bi-chevron-left"></i></button>
                <div className="gallery-preview__frame" style={heightVal ? { height: heightVal } : {}}>
                    <ImageViewer images={images} startIndex={index} alt={`gallery-${index}`} className="gallery-thumb" />
                </div>
                <button className="gallery-nav gallery-nav--right" onClick={next} aria-label="Следующее"><i className="bi bi-chevron-right"></i></button>

            </div>
            <div className="gallery-dots" role="tablist" aria-label="Gallery navigation">
                {images.map((_, i) => (
                    <button
                        key={i}
                        className={`gallery-dot ${i === index ? 'active' : ''}`}
                        onClick={() => setIndex(i)}
                        aria-label={`Показать изображение ${i + 1}`}
                        aria-selected={i === index}
                    />
                ))}
            </div>
        </>

    )
}

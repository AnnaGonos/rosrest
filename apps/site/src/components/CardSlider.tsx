import { useState, ReactNode, useEffect } from 'react'
import './CardSlider.css'

export interface CardSliderProps<T> {
    items: T[]
    maxTotal?: number
    maxInSlider?: number
    itemsPerView?: number
    renderCard: (item: T, index: number) => ReactNode
    showAllLink?: string
    showAllLabel?: string
}

export default function CardSlider<T>({
    items,
    maxTotal = 25,
    maxInSlider = 9,
    itemsPerView: initialItemsPerView = 5,
    renderCard,
    showAllLink,
    showAllLabel = 'Показать все',
}: CardSliderProps<T>) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [itemsPerView, setItemsPerView] = useState(initialItemsPerView)

    const getItemsPerView = (width: number): number => {
        if (width >= 1200) return 5
        if (width >= 768) return 4
        return 2
    }

    useEffect(() => {
        const handleResize = () => {
            const newItemsPerView = getItemsPerView(window.innerWidth)
            setItemsPerView(newItemsPerView)
        }

        handleResize()

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const limitedItems = items.slice(0, maxTotal)
    const sliderItems = limitedItems.slice(0, maxInSlider)
    const hasMoreItems = limitedItems.length > maxInSlider
    const visibleItems = sliderItems.slice(currentIndex, currentIndex + itemsPerView)
    const shouldShowAllButton = hasMoreItems && (currentIndex + itemsPerView >= sliderItems.length)
    
    const canGoPrev = currentIndex > 0
    const canGoNext = currentIndex + itemsPerView < sliderItems.length

    const handlePrev = () => {
        if (canGoPrev) {
            setCurrentIndex(Math.max(0, currentIndex - itemsPerView))
        }
    }

    const handleNext = () => {
        if (canGoNext) {
            setCurrentIndex(currentIndex + itemsPerView)
        }
    }

    return (
        <div className="card-slider">
            <div className="card-slider__container">
                {canGoPrev && (
                    <button
                        className="card-slider__btn card-slider__btn--prev"
                        onClick={handlePrev}
                        aria-label="Назад"
                    >
                        <i className="bi bi-chevron-left" />
                    </button>
                )}

                <div className="card-slider__content">
                    <div className="card-slider__grid">
                        {visibleItems.map((item, index) => (
                            <div key={currentIndex + index} className="card-slider__item">
                                {renderCard(item, currentIndex + index)}
                            </div>
                        ))}
                        
                        {shouldShowAllButton && showAllLink && (
                            <div className="card-slider__item card-slider__item--show-all">
                                <a
                                    href={showAllLink}
                                    className="card-slider__show-all-btn"
                                >
                                    <i className="bi bi-grid-3x3-gap icon icon--md" />
                                    <span>{showAllLabel}</span>
                                    <span className="card-slider__count">+{limitedItems.length - maxInSlider}</span>
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {canGoNext && !shouldShowAllButton && (
                    <button
                        className="card-slider__btn card-slider__btn--next"
                        onClick={handleNext}
                        aria-label="Вперёд"
                    >
                        <i className="bi bi-chevron-right icon icon--md" />
                    </button>
                )}
            </div>

            
        </div>
    )
}

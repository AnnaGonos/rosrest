import { useState, useEffect } from 'react'
import './Slider.css'
import TypewriterText from './TypewriterText'

interface Slide {
    id: number
    imageUrl: string
    createdAt: string
}

export default function Slider() {
    const [slides, setSlides] = useState<Slide[]>([])
    const [currentSlide, setCurrentSlide] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [_touchEnd, setTouchEnd] = useState<number | null>(null)
    const [lastInteraction, setLastInteraction] = useState(Date.now())

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/home-slider`)
                if (!response.ok) throw new Error('Failed to fetch slides')
                const data = await response.json()
                setSlides(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
                console.error('Error fetching slides:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchSlides()
    }, [])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                setLastInteraction(Date.now())
                prevSlide()
            } else if (e.key === 'ArrowRight') {
                setLastInteraction(Date.now())
                nextSlide()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [slides.length])

    useEffect(() => {
        if (slides.length === 0) return

        const checkInactivity = setInterval(() => {
            const timeSinceLastInteraction = Date.now() - lastInteraction
            if (timeSinceLastInteraction >= 3000) {
                setCurrentSlide((prev) => (prev + 1) % slides.length)
            }
        }, 3000)

        return () => clearInterval(checkInactivity)
    }, [slides.length, lastInteraction])

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX)
    }

    const handleTouchEnd = (e: React.TouchEvent) => {
        setTouchEnd(e.changedTouches[0].clientX)
        if (touchStart && e.changedTouches[0].clientX) {
            const distance = touchStart - e.changedTouches[0].clientX
            if (distance > 50) {
                nextSlide()
            } else if (distance < -50) {
                prevSlide()
            }
        }
    }

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
        setLastInteraction(Date.now())
    }

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
        setLastInteraction(Date.now())
    }

    const goToSlide = (index: number) => {
        setCurrentSlide(index)
        setLastInteraction(Date.now())
    }

    if (loading) {
        return (
            <section className="slider-section">
                <div className="slider-container">
                    <p style={{ color: 'white', fontSize: '18px' }}>Загрузка слайдов...</p>
                </div>
            </section>
        )
    }

    if (error || slides.length === 0) {
        return (
            <section className="slider-section">
                <div className="slider-container">
                    <p style={{ color: 'white', fontSize: '18px' }}>
                        {error ? `Ошибка: ${error}` : 'Слайды не найдены'}
                    </p>
                </div>
            </section>
        )
    }

    const slide = slides[currentSlide]
    const slideImageUrl = slide?.imageUrl
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}${slide.imageUrl}`
        : null

    return (
        <section className="slider-section">
            <div className="slider-text-block">
                <h1 className="hero-title">
                    <TypewriterText
                        text="Сохраняем культурное наследие России"
                        speed={60}
                        delay={15}
                        cursor={true}
                    />
                </h1>
                <svg className='slider-text-block__vector' viewBox="0 0 147 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M146 8.62077C116.012 6.54638 86.282 2.67849 56.2393 1.8177C38.9703 1.32291 -12.673 -0.125491 4.42085 2.66808C32.5176 7.2598 61.5561 7.11226 89.8453 10.2001C100.806 11.3965 111.679 13.0001 122.584 14.695C126.781 15.3472 130.058 16.4494 123.343 16.0313C93.3711 14.1653 63.5547 10.0186 33.5822 8.01337C30.3838 7.79938 20.9074 7.69508 23.9883 8.68151C35.2812 12.2973 47.3965 13.7218 58.9494 15.7276C72.8614 18.143 86.9985 19.6514 100.794 22.8344C105.75 23.9777 112.387 24.3345 117.001 26.6611C125.166 30.7784 99.1222 28.2461 90.1706 28.0582C75.2728 27.7454 60.3921 26.7817 45.507 26.1144" stroke="#1D407C" strokeWidth="2" strokeLinecap="round" />
                </svg>

            </div>

            <div
                className="slider-image-block"
                style={{
                    backgroundImage: slideImageUrl ? `url('${slideImageUrl}')` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="slider-dots">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`slider-dot ${index === currentSlide ? 'slider-dot--active' : ''}`}
                            onClick={() => goToSlide(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    )
}

import { useState, useEffect } from 'react'
import './ScrollToTopButton.css'

export default function ScrollToTopButton() {
    const [isVisible, setIsVisible] = useState(false)

    const toggleVisibility = () => {
        if (window.scrollY > 500) {
            setIsVisible(true)
        } else {
            setIsVisible(false)
        }
    }

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility)
        return () => {
            window.removeEventListener('scroll', toggleVisibility)
        }
    }, [])

    return (
        <button
            className={`scroll-to-top-button ${isVisible ? 'visible' : ''}`}
            onClick={scrollToTop}
            title="Вернуться вверх"
            aria-label="Вернуться в начало страницы"
        >
            <i className="bi bi-triangle-fill"></i>
        </button>
    )
}

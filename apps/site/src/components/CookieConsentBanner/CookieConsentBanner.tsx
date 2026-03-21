import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCookieConsent, saveCookieConsent, type CookieConsentValue } from '../../utils/cookieConsent'
import './CookieConsentBanner.css'

export default function CookieConsentBanner() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const saved = getCookieConsent()
        setIsVisible(!saved)
    }, [])

    const handleChoice = (value: CookieConsentValue) => {
        saveCookieConsent(value)
        setIsVisible(false)
    }

    if (!isVisible) {
        return null
    }

    return (
        <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Согласие на использование файлов cookie">
            <div className="cookie-consent__content">
                <p className="cookie-consent__text">
                    На этом веб-сайте используются файлы куки и аналогичные технологии в соответствии с условиями {' '}
                    <Link to="/privacy">Политики конфиденциальности.</Link>
                </p>

                <div className="cookie-consent__actions">
                    <button type="button" className="cookie-consent__btn cookie-consent__btn--primary" onClick={() => handleChoice('accepted')}>
                        Принять
                    </button>
                </div>
            </div>
        </div>
    )
}

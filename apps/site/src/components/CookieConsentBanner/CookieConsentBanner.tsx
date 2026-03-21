import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './CookieConsentBanner.css'

type ConsentValue = 'accepted' | 'necessary'

const COOKIE_CONSENT_KEY = 'rosrest_cookie_consent'

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem(COOKIE_CONSENT_KEY)
    setIsVisible(!saved)
  }, [])

  const saveChoice = (value: ConsentValue) => {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value)
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
          {/* <button type="button" className="cookie-consent__btn cookie-consent__btn--ghost" onClick={() => saveChoice('necessary')}>
            Только необходимые
          </button> */}
          <button type="button" className="cookie-consent__btn cookie-consent__btn--primary" onClick={() => saveChoice('accepted')}>
            Принять
          </button>
          
        </div>
      </div>
    </div>
  )
}

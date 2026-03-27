import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import './UnsubscribePage.css'
import Seo from '../../components/Seo/Seo'

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const email = searchParams.get('email')

  useEffect(() => {
    const unsubscribe = async () => {
      if (!email) {
        setError('Email не указан')
        setIsLoading(false)
        return
      }

      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
        const response = await fetch(`${API_BASE}/subscriptions/news/unsubscribe?email=${encodeURIComponent(email)}`, {
          method: 'GET',
        })

        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.message || 'Ошибка при отписке')
        }

        setIsSuccess(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ошибка при отписке'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    unsubscribe()
  }, [email])

  return (
    <div className="unsubscribe-page">
      <Seo
        title={`Отписка от рассылки Российской ассоциации реставраторов`}
        description={`Страница подтверждения отписки от рассылки Российской ассоциации реставраторов.`}
        canonical={window.location.origin + '/unsubscribe'}
        url={window.location.origin + '/unsubscribe'}
      />
      <div className="unsubscribe-page__container">
        <div className="unsubscribe-page__content">
          {isLoading ? (
            <div className="unsubscribe-page__loading">
              <div className="spinner"></div>
              <p>Обработка вашего запроса...</p>
            </div>
          ) : isSuccess ? (
            <div className="unsubscribe-page__success">
              <div className="unsubscribe-page__icon">✓</div>
              <h1 className="unsubscribe-page__title">До новых встреч</h1>
              <p className="unsubscribe-page__message">
                Вы успешно отписаны от рассылки.
              </p>
              <p className="unsubscribe-page__submessage">
                Снова подписаться на неё можно <Link to="/subscribe">на сайте</Link>.
              </p>
            </div>
          ) : (
            <div className="unsubscribe-page__error">
              <div className="unsubscribe-page__error-icon">✕</div>
              <h1 className="unsubscribe-page__title">Ошибка</h1>
              <p className="unsubscribe-page__message">{error}</p>
              <Link to="/" className="unsubscribe-page__link">
                Вернуться на главную
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

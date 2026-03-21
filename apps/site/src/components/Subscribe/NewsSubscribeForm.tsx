import { useState } from 'react'
import { Link } from 'react-router-dom'
import './NewsSubscribeForm.css'

interface NewsSubscribeFormProps {
  onSuccess?: () => void
}

export default function NewsSubscribeForm({ onSuccess }: NewsSubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | false>(false)
  const [subscribedEmail, setSubscribedEmail] = useState<string | null>(null)

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!agreementAccepted) {
      setError('Вы должны согласиться на обработку персональных данных')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`${API_BASE}/subscriptions/news/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Ошибка при подписке')
      }

      if (data && data.status === 'already_active') {
        setSuccess(data.message || 'Данная почта уже подписана на новости')
      } else {
        setSubscribedEmail(email)
        setSuccess(data.message || `Ваша заявка принята. Мы отправили письмо на почту ${email} для подтверждения вашей эл. почты`)
        setEmail('')
        setName('')
        setAgreementAccepted(false)

        if (onSuccess) {
          onSuccess()
        }
      }

      setTimeout(() => setSuccess(false), 7000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при подписке'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="news-subscribe-form-container">

      {!subscribedEmail && (
        <form className="news-subscribe-form" onSubmit={handleSubmit}>
          <div className="news-subscribe-form__title">
            Будьте в курсе актуальных новостей
          </div>

          <p className="news-subscribe-form__description">
            Получайте дайджест новых публикаций на вашу почту
          </p>

          <div className="news-subscribe-form__input-group">
            <div className='news-subscribe-form__input-container'>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ваше имя"
                className="news-subscribe-form__input"
                required
                disabled={loading}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Эл. почта"
                className="news-subscribe-form__input"
                required
                disabled={loading}
              />
            </div>

            <div className="news-subscribe-form__agreement">
              <label className="news-subscribe-form__agreement-label">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  disabled={loading}
                  className="news-subscribe-form__agreement-checkbox"
                />
                <span className="news-subscribe-form__agreement-text">
                  Нажимая «Подписаться», соглашаюсь на обработку персональных данных. 
                  Подробнее в <Link to="/privacy">политике конфиденциальности</Link>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="news-subscribe-form__button"
              disabled={loading || !agreementAccepted}
            >
              {loading ? 'Подписываем...' : 'Подписаться'}
            </button>
          </div>

          {error && (
            <div className="news-subscribe-form__error">
              {error}
            </div>
          )}

          {success && (
            <div className="news-subscribe-form__success">
              ✓ {success}
            </div>
          )}

        </form>
      )}

      {subscribedEmail && (
        <div className="news-subscribe-form__thanks" role="status">
          <i className="bi bi-check-circle-fill news-subscribe-form__thanks-icon" aria-hidden="true"></i>
          <div className="news-subscribe-form__thanks-title">Ваша заявка принята</div>
          <div className="news-subscribe-form__thanks-text">Мы отправили приветственное письмо на почту {subscribedEmail}</div>
        </div>
      )}
      <div className="news-subscribe-form__image-container">
        <i className="bi bi-chevron-double-right"></i>
        <img src="/cropped-LOGO-TRANSPARENT-BLUE.png" alt="Subscribe" className="news-subscribe-form__image" />
      </div>
    </div>
  )
}

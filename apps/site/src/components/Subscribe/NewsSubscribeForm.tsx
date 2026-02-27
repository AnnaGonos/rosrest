import { useState } from 'react'
import './NewsSubscribeForm.css'

interface NewsSubscribeFormProps {
  onSuccess?: () => void
}

export default function NewsSubscribeForm({ onSuccess }: NewsSubscribeFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch(`${API_BASE}/subscriptions/news/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Ошибка при подписке')
      }

      setSuccess(true)
      setEmail('')

      if (onSuccess) {
        onSuccess()
      }

      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка при подписке'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="news-subscribe-form" onSubmit={handleSubmit}>
      <div className="news-subscribe-form__title">
        Подпишитесь на новости
      </div>

      <p className="news-subscribe-form__description">
        Получайте дайджест новых публикаций на вашу почту
      </p>

      <div className="news-subscribe-form__input-group">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="news-subscribe-form__input"
          required
          disabled={loading}
        />
        <button
          type="submit"
          className="news-subscribe-form__button"
          disabled={loading}
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
          ✓ Вы успешно подписались на новости
        </div>
      )}
    </form>
  )
}

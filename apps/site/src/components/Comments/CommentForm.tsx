import { useState, useEffect } from 'react'
import './CommentForm.css'

interface CommentFormProps {
  commentableType: 'news' | 'monitoring-zakon' | 'rar-member'
  commentableId: string
  onCommentAdded?: () => void
  parentCommentId?: number
  parentAuthorName?: string
  onCancelReply?: () => void
}

interface FormToken {
  token: string
  timestamp: number
}

export default function CommentForm({ commentableType, commentableId, onCommentAdded, parentCommentId, parentAuthorName, onCancelReply }: CommentFormProps) {
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [content, setContent] = useState('')
  const [formToken, setFormToken] = useState<FormToken | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

  const handleContentFocus = () => {
    if (!isExpanded) {
      setIsExpanded(true)
    }
  }

  useEffect(() => {
    fetchFormToken()
  }, [])

  const fetchFormToken = async () => {
    try {
      const response = await fetch(`${API_BASE}/comments/form-token`)
      if (!response.ok) throw new Error('Ошибка получения токена')
      const data = await response.json()
      setFormToken(data)
    } catch (err) {
      console.error('Error fetching form token:', err)
      setError('Не удалось загрузить форму. Попробуйте обновить страницу.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formToken) {
      setError('Форма не готова. Обновите страницу.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentableType,
          commentableId,
          parentCommentId,
          authorName,
          authorEmail,
          content,
          formToken: formToken.token,
          formTimestamp: formToken.timestamp,
          website: '',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Ошибка отправки комментария')
      }

      setSuccess(true)
      setAuthorName('')
      setAuthorEmail('')
      setContent('')

      await fetchFormToken()

      if (onCommentAdded) {
        onCommentAdded()
      }

      setTimeout(() => setSuccess(false), 5000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  if (!formToken) {
    return <div className="comment-form-loading">Загрузка формы...</div>
  }

  return (
    <div className="comment-form">
      {parentCommentId && parentAuthorName && (
        <div className="comment-form__reply-info">
          <span>Ответ на <strong>{parentAuthorName}</strong></span>
          <button
            type="button"
            className="comment-form__reply-cancel"
            onClick={onCancelReply}
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="comment-form__success">
          Ваш комментарий успешно опубликован!
        </div>
      )}

      {error && (
        <div className="comment-form__error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="comment-form__field">
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={handleContentFocus}
            required
            minLength={10}
            maxLength={2000}
            rows={isExpanded ? 5 : 3}
            placeholder="Напишите комментарий..."
            className="comment-form__textarea"
          />
        </div>

        {isExpanded && (
          <div className="comment-form__fields-expanded">
            <div className="comment-form__row">
              <div className="comment-form__field comment-form__field--half">
                <label htmlFor="authorName">Имя *</label>
                <input
                  type="text"
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Ваше имя"
                />
              </div>

              <div className="comment-form__field comment-form__field--half">
                <label htmlFor="authorEmail">Email *</label>
                <input
                  type="email"
                  id="authorEmail"
                  value={authorEmail}
                  onChange={(e) => setAuthorEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>
        )}

        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          style={{ position: 'absolute', left: '-9999px' }}
          aria-hidden="true"
        />

        <button
          type="submit"
          className="comment-form__submit"
          disabled={loading}
        >
          {loading ? 'Отправка...' : 'Отправить комментарий'}
        </button>
      </form>
    </div>
  )
}

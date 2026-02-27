import { useState, useEffect } from 'react'
import CommentForm from './CommentForm'
import './CommentList.css'

interface Comment {
  id: number
  authorName: string
  content: string
  createdAt: string
  parentCommentId?: number
  replies?: Comment[]
}

interface CommentListProps {
  commentableType: 'news' | 'monitoring-zakon' | 'rar-member'
  commentableId: string
  refreshTrigger?: number
  onCountChange?: (count: number) => void
}

export default function CommentList({ commentableType, commentableId, refreshTrigger, onCountChange }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyToCommentId, setReplyToCommentId] = useState<number | undefined>()
  const [replyToAuthorName, setReplyToAuthorName] = useState<string | undefined>()

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002'

  useEffect(() => {
    fetchComments()
  }, [commentableType, commentableId, refreshTrigger])

  const fetchComments = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE}/comments/${commentableType}/${commentableId}`)
      if (!response.ok) throw new Error('Ошибка загрузки комментариев')
      const data = await response.json()

      const sortRecursively = (items: Comment[] | undefined): Comment[] => {
        if (!items) return []
        const sorted = items.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        return sorted.map(it => ({ ...it, replies: sortRecursively(it.replies) }))
      }

      const sorted = sortRecursively(data)
      setComments(sorted)

      const total = countAllComments(sorted)
      if (onCountChange) {
        onCountChange(total)
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
      setError('Не удалось загрузить комментарии')
    } finally {
      setLoading(false)
    }
  }

  const handleReplyClick = (commentId: number, authorName: string) => {
    setReplyToCommentId(commentId)
    setReplyToAuthorName(authorName)
  }

  const handleCancelReply = () => {
    setReplyToCommentId(undefined)
    setReplyToAuthorName(undefined)
  }

  const handleCommentAdded = () => {
    fetchComments()
    setReplyToCommentId(undefined)
    setReplyToAuthorName(undefined)
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const year = date.getFullYear()

    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ]

    const monthName = months[date.getMonth()]

    return `${day} ${monthName} ${year}`
  }

  const countAllComments = (comments: Comment[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countAllComments(comment.replies) : 0)
    }, 0)
  }

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isReplyingToThis = replyToCommentId === comment.id

    return (
      <div key={comment.id} className={`comment-item comment-item--depth-${Math.min(depth, 3)}`}>
        <div className="comment-item__header">
          <span className="comment-item__author">{comment.authorName}</span>
          <span className="comment-item__date">{formatDate(comment.createdAt)}</span>
        </div>
        <div className="comment-item__content">
          {comment.content}
        </div>
        <button
          className="comment-item__reply-btn"
          onClick={() => handleReplyClick(comment.id, comment.authorName)}
        >
          <i className="bi bi-reply"></i>
          Ответить
        </button>

        {isReplyingToThis && (
          <div className="comment-item__reply-form">
            <CommentForm
              commentableType={commentableType}
              commentableId={commentableId}
              parentCommentId={comment.id}
              parentAuthorName={replyToAuthorName}
              onCommentAdded={handleCommentAdded}
              onCancelReply={handleCancelReply}
            />
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="comment-item__replies">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="comment-list-loading">Загрузка комментариев...</div>
  }

  if (error) {
    return <div className="comment-list-error">{error}</div>
  }

  if (comments.length === 0) {
    return (
      <div className="comment-list-empty">
        Пока нет комментариев. Будьте первым!
      </div>
    )
  }

  const totalComments = countAllComments(comments)

  return (
    <div className="comment-list">
      <h3 className="comment-list__title">
        Комментарии ({totalComments})
      </h3>

      <div className="comment-list__items">
        {comments.map((comment) => renderComment(comment))}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import CommentList from './CommentList'
import CommentForm from './CommentForm'
import './CommentsSection.css'

interface CommentsSectionProps {
  commentableType: 'news' | 'monitoring-zakon' | 'rar-member'
  commentableId: string
  onCommentCountChange?: (count: number) => void
}

export default function CommentsSection({ commentableType, commentableId, onCommentCountChange }: CommentsSectionProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    if (onCommentCountChange) {
      onCommentCountChange(commentCount)
    }
  }, [commentCount, onCommentCountChange])

  const handleCommentCountChange = (count: number) => {
    setCommentCount(count)
  }

  const handleCommentAdded = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="comments-section">
      <CommentForm 
        commentableType={commentableType}
        commentableId={commentableId}
        onCommentAdded={handleCommentAdded}
      />

      <CommentList 
        commentableType={commentableType}
        commentableId={commentableId}
        refreshTrigger={refreshTrigger}
        onCountChange={handleCommentCountChange}
      />
    </div>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { commentsApi } from '../api/commentsApi'
import { useInventoryHub } from '../hooks/useInventoryHub'
import type { Comment } from '../types/inventory'

interface Props {
  inventoryId: string
  isAuthenticated: boolean
  active: boolean
}

export default function DiscussionTab({ inventoryId, isAuthenticated, active }: Props) {
  const { t } = useTranslation()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const bottomRef               = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await commentsApi.getAll(inventoryId)
      setComments(res.data)
    } catch { /* non-fatal */ } finally {
      setLoading(false)
    }
  }, [inventoryId])

  useEffect(() => {
    if (active) load()
  }, [active, load])

  const handleNewComment = useCallback((comment: Comment) => {
    setComments(prev => {
      if (prev.some(c => c.id === comment.id)) return prev
      return [...prev, comment]
    })
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }, [])

  useInventoryHub(inventoryId, handleNewComment, active)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await commentsApi.create(inventoryId, { text: text.trim() })
      setText('')
    } catch {
      setError(t('discussionTab.failedToPost'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm" role="status" />
      </div>
    )
  }

  return (
    <div>
      {comments.length === 0 ? (
        <p className="text-muted">{t('discussionTab.noComments')}</p>
      ) : (
        <div className="mb-4">
          {comments.map(c => (
            <div key={c.id} className="mb-3 p-3 border rounded">
              <div className="d-flex align-items-center gap-2 mb-1">
                <Link to={`/profile/${c.authorId}`} className="fw-semibold text-decoration-none">
                  {c.authorDisplayName}
                </Link>
                <small className="text-muted">{new Date(c.createdAt).toLocaleString()}</small>
              </div>
              <div className="prose text-start">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}
          <div className="mb-2">
            <textarea
              className="form-control"
              rows={3}
              placeholder={t('discussionTab.placeholder')}
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={submitting || !text.trim()}
          >
            {submitting ? t('discussionTab.posting') : t('discussionTab.postComment')}
          </button>
        </form>
      ) : (
        <p className="text-muted small">
          <a href="/login">{t('discussionTab.signIn')}</a>{' '}
          {t('discussionTab.signInToComment')}
        </p>
      )}
    </div>
  )
}

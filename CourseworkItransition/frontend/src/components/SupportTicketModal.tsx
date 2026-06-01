import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SupportTicketResult } from '../api/supportApi'

interface Props {
  onClose: () => void
  onSubmit: (data: { summary: string; priority: string }) => Promise<SupportTicketResult>
}

export default function SupportTicketModal({ onClose, onSubmit }: Props) {
  const { t } = useTranslation()

  const [summary, setSummary]   = useState('')
  const [priority, setPriority] = useState('Average')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [result, setResult]     = useState<SupportTicketResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await onSubmit({ summary, priority })
      setResult(res)
    } catch {
      setError(t('support.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="modal show d-block"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content shadow">
          <div className="modal-header">
            <h5 className="modal-title">{t('support.title')}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {result ? (
            <>
              <div className="modal-body">
                <div className="alert alert-success mb-3">{t('support.success')}</div>
                <p className="mb-0">
                  <strong>{t('support.ticketId')}:</strong> {result.ticketId}
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={onClose}>{t('common.close')}</button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <p className="text-muted small mb-3">{t('support.hint')}</p>
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    {t('support.summary')} <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="mb-1">
                  <label className="form-label fw-semibold">
                    {t('support.priority')} <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="High">{t('support.priorityHigh')}</option>
                    <option value="Average">{t('support.priorityAverage')}</option>
                    <option value="Low">{t('support.priorityLow')}</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />{t('support.sending')}</>
                    : t('support.submit')
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

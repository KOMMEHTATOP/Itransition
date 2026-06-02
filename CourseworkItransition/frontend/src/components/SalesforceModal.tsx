import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { SalesforcePushRequest, SalesforcePushResult } from '../api/salesforceApi'

interface Props {
  onClose: () => void
  onSubmit: (data: SalesforcePushRequest) => Promise<SalesforcePushResult>
}

export default function SalesforceModal({ onClose, onSubmit }: Props) {
  const { t } = useTranslation()

  const [phone, setPhone]       = useState('')
  const [company, setCompany]   = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [result, setResult]     = useState<SalesforcePushResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await onSubmit({ phone, company, jobTitle })
      setResult(res)
    } catch {
      setError(t('salesforce.error'))
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
            <h5 className="modal-title">{t('salesforce.title')}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          {result ? (
            <>
              <div className="modal-body">
                <div className="alert alert-success mb-3">
                  {result.updated ? t('salesforce.successUpdated') : t('salesforce.success')}
                </div>
                <p className="mb-1">
                  <strong>{t('salesforce.account')}:</strong>{' '}
                  <a href={result.accountUrl} target="_blank" rel="noreferrer">{result.accountId}</a>
                </p>
                <p className="mb-0">
                  <strong>{t('salesforce.contact')}:</strong>{' '}
                  <a href={result.contactUrl} target="_blank" rel="noreferrer">{result.contactId}</a>
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={onClose}>{t('common.close')}</button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <p className="text-muted small mb-3">{t('salesforce.hint')}</p>
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    {t('salesforce.company')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    {t('salesforce.jobTitle')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-1">
                  <label className="form-label fw-semibold">
                    {t('salesforce.phone')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2" />{t('salesforce.sending')}</>
                    : t('salesforce.submit')
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

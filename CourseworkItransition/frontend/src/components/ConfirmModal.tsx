import { useTranslation } from 'react-i18next'

interface Props {
  message: string
  title?: string
  confirmLabel?: string
  variant?: 'danger' | 'warning'
  onConfirm: () => void
  onClose: () => void
}

export default function ConfirmModal({ message, title, confirmLabel, variant = 'danger', onConfirm, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <div
      className="modal show d-block"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered modal-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-content shadow">
          <div className="modal-header border-0 pb-0">
            <h6 className="modal-title fw-semibold">{title ?? t('common.confirmTitle')}</h6>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body pt-1 pb-2">
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{message}</p>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button className={`btn btn-sm btn-${variant}`} onClick={onConfirm} autoFocus>
              {confirmLabel ?? t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

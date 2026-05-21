import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  onClose: () => void
  onCreate: (data: { title: string; description: string; isPublic: boolean }) => Promise<void>
}

export default function CreateInventoryModal({ onClose, onCreate }: Props) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    setError(null)
    try {
      await onCreate({ title: title.trim(), description: description.trim(), isPublic })
    } catch {
      setError(t('inventoriesList.failedToCreate'))
      setCreating(false)
    }
  }

  return (
    <div
      className="modal show d-block"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">{t('inventoriesList.newInventory')}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <div className="mb-3">
                <label className="form-label">{t('inventoriesList.titleLabel')}</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="mb-3">
                <label className="form-label">{t('inventoriesList.descriptionLabel')}</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="modalInventoryPublic"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="modalInventoryPublic">
                  {t('inventoriesList.publicLabel')}
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('inventoriesList.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? t('inventoriesList.creating') : t('inventoriesList.create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

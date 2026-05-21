import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InventoryField, CreateItemRequest } from '../types/inventory'
import { getApiError } from '../utils/apiError'

interface Props {
  fields: InventoryField[]
  hasCustomIdFormat?: boolean
  onClose: () => void
  onCreate: (req: CreateItemRequest) => Promise<void>
}

export default function CreateItemModal({ fields, hasCustomIdFormat, onClose, onCreate }: Props) {
  const { t } = useTranslation()
  const [customId, setCustomId] = useState('')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setError(null)
    setCreating(true)
    try {
      const req: CreateItemRequest = {
        customId: customId.trim(),
        fieldValues: Object.entries(fieldValues)
          .filter(([, v]) => v.trim() !== '')
          .map(([fieldId, value]) => ({ fieldId, value: value.trim() })),
      }
      await onCreate(req)
    } catch (err: unknown) {
      setError(getApiError(err, t('itemsTab.failedToCreate')))
      setCreating(false)
    }
  }

  const setField = (id: string, value: string) =>
    setFieldValues(prev => ({ ...prev, [id]: value }))

  return (
    <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{t('itemsTab.addItemTitle')}</h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body p-0">
            {error && <div className="alert alert-danger py-2 mx-3 mt-3">{error}</div>}
            <table className="table table-borderless table-sm align-middle mb-0">
              <colgroup>
                <col style={{ width: '38%' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <td className="ps-4 fw-semibold text-start">{t('itemsTab.customIdLabel')}</td>
                  <td className="pe-4">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder={hasCustomIdFormat ? t('itemsTab.placeholderAutoGenerate') : t('itemsTab.placeholderOptional')}
                      value={customId}
                      onChange={e => setCustomId(e.target.value)}
                    />
                  </td>
                </tr>
                {fields.map(f => (
                  <tr key={f.id}>
                    <td className="ps-4 text-start">
                      <span className="fw-semibold">{f.title}</span>
                      <span className="badge bg-secondary fw-normal ms-2" style={{ fontSize: '0.7em' }}>{f.type}</span>
                      {f.description && <div className="text-muted small">{f.description}</div>}
                    </td>
                    <td className="pe-4">
                      {f.type === 'MultilineText' ? (
                        <textarea
                          className="form-control form-control-sm"
                          rows={3}
                          value={fieldValues[f.id] ?? ''}
                          onChange={e => setField(f.id, e.target.value)}
                        />
                      ) : f.type === 'Boolean' ? (
                        <div className="form-check form-switch mb-0">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            role="switch"
                            id={`nfv-${f.id}`}
                            checked={fieldValues[f.id] === 'true'}
                            onChange={e => setField(f.id, e.target.checked ? 'true' : 'false')}
                          />
                          <label className="form-check-label small" htmlFor={`nfv-${f.id}`}>
                            {fieldValues[f.id] === 'true' ? t('itemsTab.boolYes') : t('itemsTab.boolNo')}
                          </label>
                        </div>
                      ) : (
                        <input
                          type={f.type === 'Number' ? 'number' : f.type === 'Link' ? 'url' : 'text'}
                          className="form-control form-control-sm"
                          value={fieldValues[f.id] ?? ''}
                          onChange={e => setField(f.id, e.target.value)}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              {t('itemsTab.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? t('itemsTab.adding') : t('itemsTab.addButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

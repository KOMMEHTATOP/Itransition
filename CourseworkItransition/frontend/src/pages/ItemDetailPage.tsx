import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { itemsApi } from '../api/itemsApi'
import { useAutosave } from '../hooks/useAutosave'
import type { ItemDetail, UpdateItemRequest, ItemFieldValueRequest } from '../types/inventory'

export default function ItemDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [item, setItem]     = useState<ItemDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const [customId, setCustomId]   = useState('')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [formVersion, setFormVersion] = useState(1)

  const editData: UpdateItemRequest = {
    customId,
    fieldValues: Object.entries(fieldValues).map(([fieldId, value]) => ({ fieldId, value })),
    version: formVersion,
  }

  const saveFn = useCallback(
    async (data: UpdateItemRequest) => {
      if (!id) return
      const res = await itemsApi.update(id, data)
      setFormVersion(res.data.version)
      setItem(res.data)
    },
    [id],
  )

  const { saveStatus, saveNow } = useAutosave({
    data: editData,
    saveFn,
    delay: 8000,
    enabled: !!item?.canEdit,
  })

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await itemsApi.getById(id)
      setItem(res.data)
      setCustomId(res.data.customId)
      setFormVersion(res.data.version)
      const fvMap: Record<string, string> = {}
      for (const fv of res.data.fieldValues) {
        fvMap[fv.fieldId] = fv.value
      }
      setFieldValues(fvMap)
    } catch {
      setError('Item not found or access denied.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!id || !confirm('Delete this item?')) return
    try {
      await itemsApi.delete(id)
      navigate(-1)
    } catch {
      setError('Failed to delete item.')
    }
  }

  const saveLabel = () => {
    switch (saveStatus) {
      case 'saving':   return '⏳ Saving…'
      case 'saved':    return '✓ Saved'
      case 'conflict': return '⚠ Save conflict — please reload'
      case 'error':    return '✗ Save failed'
      default:         return null
    }
  }

  const renderFieldInput = (fieldId: string, fieldType: string) => {
    const value = fieldValues[fieldId] ?? ''
    const update = (v: string) => setFieldValues(prev => ({ ...prev, [fieldId]: v }))

    switch (fieldType) {
      case 'MultilineText':
        return (
          <textarea
            className="form-control"
            rows={4}
            value={value}
            onChange={e => update(e.target.value)}
          />
        )
      case 'Boolean':
        return (
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id={`fv-${fieldId}`}
              checked={value === 'true'}
              onChange={e => update(e.target.checked ? 'true' : 'false')}
            />
            <label className="form-check-label" htmlFor={`fv-${fieldId}`}>Yes</label>
          </div>
        )
      case 'Number':
        return (
          <input
            type="number"
            className="form-control"
            value={value}
            onChange={e => update(e.target.value)}
          />
        )
      case 'Link':
        return (
          <input
            type="url"
            className="form-control"
            value={value}
            onChange={e => update(e.target.value)}
          />
        )
      default:
        return (
          <input
            type="text"
            className="form-control"
            value={value}
            onChange={e => update(e.target.value)}
          />
        )
    }
  }

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error ?? 'Not found.'}</div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
      </div>
    )
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 720 }}>
      <button className="btn btn-link ps-0 text-muted mb-3" onClick={() => navigate(`/inventories/${item.inventoryId}`)}>
        ← Back to inventory
      </button>

      {item.canEdit ? (
        <>
          <div className="d-flex align-items-center mb-1 gap-2">
            <h4 className="mb-0 me-auto">
              {item.customId || <span className="text-muted fst-italic">no id</span>}
            </h4>
            {saveLabel() && (
              <small
                className={`text-${saveStatus === 'conflict' || saveStatus === 'error' ? 'danger' : saveStatus === 'saving' ? 'muted' : 'success'}`}
              >
                {saveLabel()}
              </small>
            )}
            <button className="btn btn-outline-primary btn-sm" onClick={saveNow}>
              Save now
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
              Delete
            </button>
          </div>
          <small className="text-muted d-block mb-4">
            By {item.authorDisplayName} · {new Date(item.createdAt).toLocaleDateString()}
          </small>

          {saveStatus === 'conflict' && (
            <div className="alert alert-warning">
              Save conflict: someone else modified this item. Please{' '}
              <button className="btn btn-link p-0 align-baseline" onClick={load}>
                reload
              </button>{' '}
              to get the latest version.
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold">Custom ID</label>
            <input
              type="text"
              className="form-control"
              value={customId}
              onChange={e => setCustomId(e.target.value)}
              placeholder="Leave blank for no ID"
            />
          </div>

          {item.fieldValues.map(fv => (
            <div key={fv.fieldId} className="mb-3">
              <label className="form-label fw-semibold">
                {fv.fieldTitle}
                <span className="text-muted fw-normal ms-1 small">({fv.fieldType})</span>
              </label>
              {renderFieldInput(fv.fieldId, fv.fieldType)}
            </div>
          ))}

          {item.fieldValues.length === 0 && (
            <p className="text-muted">This inventory has no custom fields yet.</p>
          )}
        </>
      ) : (
        // Read-only view
        <>
          <h4 className="mb-1">
            {item.customId || <span className="text-muted fst-italic">no id</span>}
          </h4>
          <small className="text-muted d-block mb-4">
            By {item.authorDisplayName} · {new Date(item.createdAt).toLocaleDateString()}
          </small>

          {item.fieldValues.length === 0 ? (
            <p className="text-muted">No fields defined for this inventory.</p>
          ) : (
            <dl className="row">
              {item.fieldValues.map(fv => (
                <div key={fv.fieldId} className="col-12 mb-2">
                  <dt className="fw-semibold">{fv.fieldTitle}</dt>
                  <dd className="ms-3">
                    {fv.fieldType === 'Boolean'
                      ? (fv.value === 'true' ? '✓ Yes' : '✗ No')
                      : fv.fieldType === 'Link'
                      ? <a href={fv.value} target="_blank" rel="noreferrer">{fv.value}</a>
                      : fv.value || <span className="text-muted">—</span>}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </>
      )}
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { itemsApi } from '../api/itemsApi'
import { likesApi } from '../api/likesApi'
import { useAutosave } from '../hooks/useAutosave'
import { useInventoryHub } from '../hooks/useInventoryHub'
import type { ItemDetail, UpdateItemRequest } from '../types/inventory'

export default function ItemDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [item, setItem]         = useState<ItemDetail | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [likeCount, setLikeCount]   = useState(0)
  const [isLikedByMe, setIsLiked]   = useState(false)
  const [liking, setLiking]         = useState(false)

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

  const handleLikeUpdated = useCallback((updatedItemId: string, count: number) => {
    if (updatedItemId === id) setLikeCount(count)
  }, [id])

  useInventoryHub(
    item?.inventoryId ?? '',
    () => {},
    !!item,
    handleLikeUpdated,
  )

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await itemsApi.getById(id)
      setItem(res.data)
      setCustomId(res.data.customId)
      setFormVersion(res.data.version)
      setLikeCount(res.data.likeCount)
      setIsLiked(res.data.isLikedByMe)
      const fvMap: Record<string, string> = {}
      for (const fv of res.data.fieldValues) {
        fvMap[fv.fieldId] = fv.value
      }
      setFieldValues(fvMap)
    } catch {
      setError(t('itemDetail.notFound'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => { load() }, [load])

  const handleLike = async () => {
    if (!id || liking) return
    setLiking(true)
    try {
      if (isLikedByMe) {
        const res = await likesApi.unlike(id)
        setLikeCount(res.data.likeCount)
        setIsLiked(false)
      } else {
        const res = await likesApi.like(id)
        if (res.status === 409) return
        setLikeCount(res.data.likeCount)
        setIsLiked(true)
      }
    } catch { /* ignore */ } finally {
      setLiking(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !confirm(t('itemDetail.confirmDelete'))) return
    try {
      await itemsApi.delete(id)
      navigate(-1)
    } catch {
      setError(t('itemDetail.failedToDelete'))
    }
  }

  const saveLabel = () => {
    switch (saveStatus) {
      case 'saving':   return t('itemDetail.savingStatus')
      case 'saved':    return t('itemDetail.savedStatus')
      case 'conflict': return t('itemDetail.conflictStatus')
      case 'error':    return t('itemDetail.errorStatus')
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
            <label className="form-check-label" htmlFor={`fv-${fieldId}`}>{t('itemDetail.boolYes')}</label>
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
        <div className="alert alert-danger">{error ?? t('itemDetail.notFound')}</div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          {t('itemDetail.backShort')}
        </button>
      </div>
    )
  }

  const LikeButton = () => (
    <button
      className={`btn btn-sm ${isLikedByMe ? 'btn-danger' : 'btn-outline-secondary'}`}
      onClick={handleLike}
      disabled={liking}
      title={isLikedByMe ? t('itemDetail.unlike') : t('itemDetail.like')}
    >
      ♥ {likeCount}
    </button>
  )

  return (
    <div className="container mt-4" style={{ maxWidth: 720 }}>
      <button className="btn btn-link ps-0 text-muted mb-3" onClick={() => navigate(`/inventories/${item.inventoryId}`)}>
        {t('itemDetail.backToInventory')}
      </button>

      {item.canEdit ? (
        <>
          <div className="d-flex align-items-center mb-1 gap-2">
            <h4 className="mb-0 me-auto">
              {item.customId || <span className="text-muted fst-italic">{t('itemDetail.noId')}</span>}
            </h4>
            {saveLabel() && (
              <small
                className={`text-${saveStatus === 'conflict' || saveStatus === 'error' ? 'danger' : saveStatus === 'saving' ? 'muted' : 'success'}`}
              >
                {saveLabel()}
              </small>
            )}
            <LikeButton />
            <button className="btn btn-outline-primary btn-sm" onClick={saveNow}>
              {t('itemDetail.saveNow')}
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
              {t('itemDetail.delete')}
            </button>
          </div>
          <small className="text-muted d-block mb-4">
            {t('inventory.by')} {item.authorDisplayName} · {new Date(item.createdAt).toLocaleDateString()}
          </small>

          {saveStatus === 'conflict' && (
            <div className="alert alert-warning">
              {t('itemDetail.saveConflictMsg')}{' '}
              <button className="btn btn-link p-0 align-baseline" onClick={load}>
                {t('itemDetail.reload')}
              </button>{' '}
              {t('itemDetail.saveConflictSuffix')}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold">{t('itemDetail.customIdLabel')}</label>
            <input
              type="text"
              className="form-control"
              value={customId}
              onChange={e => setCustomId(e.target.value)}
              placeholder={t('itemDetail.customIdPlaceholder')}
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
            <p className="text-muted">{t('itemDetail.noFieldsEdit')}</p>
          )}
        </>
      ) : (
        <>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="mb-0 me-auto">
              {item.customId || <span className="text-muted fst-italic">{t('itemDetail.noId')}</span>}
            </h4>
            <LikeButton />
          </div>
          <small className="text-muted d-block mb-4">
            {t('inventory.by')} {item.authorDisplayName} · {new Date(item.createdAt).toLocaleDateString()}
          </small>

          {item.fieldValues.length === 0 ? (
            <p className="text-muted">{t('itemDetail.noFieldsView')}</p>
          ) : (
            <dl className="row">
              {item.fieldValues.map(fv => (
                <div key={fv.fieldId} className="col-12 mb-2">
                  <dt className="fw-semibold">{fv.fieldTitle}</dt>
                  <dd className="ms-3">
                    {fv.fieldType === 'Boolean'
                      ? (fv.value === 'true' ? t('itemDetail.boolReadYes') : t('itemDetail.boolReadNo'))
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

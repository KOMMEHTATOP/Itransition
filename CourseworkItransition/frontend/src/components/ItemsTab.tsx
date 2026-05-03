import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { itemsApi } from '../api/itemsApi'
import type {
  InventoryField,
  ItemListItem,
  PagedResult,
  CreateItemRequest,
} from '../types/inventory'

interface Props {
  inventoryId: string
  fields: InventoryField[]
  canEdit: boolean
  isAuthenticated: boolean
  hasCustomIdFormat?: boolean
}

export default function ItemsTab({ inventoryId, fields, canEdit, isAuthenticated, hasCustomIdFormat }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [items, setItems]           = useState<PagedResult<ItemListItem> | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [selected, setSelected]     = useState<Set<string>>(new Set())
  const [page, setPage]             = useState(1)
  const [sort, setSort]             = useState('newest')
  const [deleting, setDeleting]     = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [newCustomId, setNewCustomId] = useState('')
  const [newFieldValues, setNewFieldValues] = useState<Record<string, string>>({})
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating]       = useState(false)

  const tableFields = fields.filter(f => f.showInTable)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await itemsApi.getAll(inventoryId, page, 20, sort)
      setItems(res.data.items)
    } catch {
      setError(t('itemsTab.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [inventoryId, page, sort, t])

  useEffect(() => { load() }, [load])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!items) return
    if (selected.size === items.items.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.items.map(i => i.id)))
    }
  }

  const handleDeleteSelected = async () => {
    if (!confirm(t('itemsTab.confirmDelete', { count: selected.size }))) return
    setDeleting(true)
    try {
      await itemsApi.deleteBatch(inventoryId, [...selected])
      setSelected(new Set())
      await load()
    } catch {
      setError(t('itemsTab.failedToLoad'))
    } finally {
      setDeleting(false)
    }
  }

  const handleCreate = async () => {
    setCreateError(null)
    setCreating(true)
    try {
      const req: CreateItemRequest = {
        customId: newCustomId.trim(),
        fieldValues: Object.entries(newFieldValues)
          .filter(([, v]) => v.trim() !== '')
          .map(([fieldId, value]) => ({ fieldId, value: value.trim() })),
      }
      await itemsApi.create(inventoryId, req)
      setShowCreate(false)
      setNewCustomId('')
      setNewFieldValues({})
      await load()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setCreateError(msg ?? t('itemsTab.failedToCreate'))
    } finally {
      setCreating(false)
    }
  }

  const renderFieldValue = (item: ItemListItem, field: InventoryField) => {
    const fv = item.fieldValues.find(v => v.fieldId === field.id)
    if (field.type === 'Boolean') return fv?.value === 'true'
      ? <span className="badge bg-success">{t('itemsTab.boolYes')}</span>
      : <span className="badge bg-secondary">{t('itemsTab.boolNo')}</span>
    if (!fv || fv.value === '') return <span className="text-muted">—</span>
    if (field.type === 'Link') {
      return (
        <a href={fv.value} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
          {fv.value.length > 30 ? fv.value.slice(0, 30) + '…' : fv.value}
        </a>
      )
    }
    return fv.value.length > 50 ? fv.value.slice(0, 50) + '…' : fv.value
  }

  const sortHeader = (key: string, label: string) => (
    <th
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={() => { setSort(key); setPage(1) }}
    >
      {label} {sort === key ? '↓' : ''}
    </th>
  )

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm" role="status" />
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex align-items-center gap-2 mb-3">
        {isAuthenticated && (
          <button className="btn btn-outline-primary btn-sm" onClick={() => setShowCreate(true)}>
            {t('itemsTab.addItem')}
          </button>
        )}
        {canEdit && selected.size > 0 && (
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleDeleteSelected}
            disabled={deleting}
          >
            {deleting ? t('itemsTab.deleting') : t('itemsTab.deleteSelected', { count: selected.size })}
          </button>
        )}
        {items && (
          <small className="text-muted ms-auto">{t('itemsTab.count', { count: items.total })}</small>
        )}
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {items && items.items.length === 0 ? (
        <p className="text-muted">
          {isAuthenticated ? t('itemsTab.noItemsAuth') : t('itemsTab.noItemsGuest')}
        </p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover table-sm align-middle">
              <thead>
                <tr>
                  {canEdit && (
                    <th style={{ width: 36 }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={!!items && selected.size === items.items.length && items.items.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  {sortHeader('customId', t('itemsTab.colId'))}
                  {tableFields.map(f => <th key={f.id}>{f.title}</th>)}
                  {sortHeader('oldest', t('itemsTab.colAdded'))}
                  <th>{t('itemsTab.colBy')}</th>
                </tr>
              </thead>
              <tbody>
                {items?.items.map(item => (
                  <tr
                    key={item.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/items/${item.id}`)}
                  >
                    {canEdit && (
                      <td onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                    )}
                    <td className="text-monospace fw-semibold">
                      {item.customId || <span className="text-muted fst-italic">{t('itemsTab.noId')}</span>}
                    </td>
                    {tableFields.map(f => (
                      <td key={f.id}>{renderFieldValue(item, f)}</td>
                    ))}
                    <td className="text-muted small">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="text-muted small">{item.authorDisplayName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items && items.totalPages > 1 && (
            <nav>
              <ul className="pagination pagination-sm justify-content-center">
                {Array.from({ length: items.totalPages }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </>
      )}

      {showCreate && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('itemsTab.addItemTitle')}</h5>
                <button
                  className="btn-close"
                  onClick={() => { setShowCreate(false); setCreateError(null) }}
                />
              </div>
              <div className="modal-body p-0">
                {createError && <div className="alert alert-danger py-2 mx-3 mt-3">{createError}</div>}
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
                          value={newCustomId}
                          onChange={e => setNewCustomId(e.target.value)}
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
                              value={newFieldValues[f.id] ?? ''}
                              onChange={e => setNewFieldValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                            />
                          ) : f.type === 'Boolean' ? (
                            <div className="form-check form-switch mb-0">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                role="switch"
                                id={`nfv-${f.id}`}
                                checked={newFieldValues[f.id] === 'true'}
                                onChange={e => setNewFieldValues(prev => ({ ...prev, [f.id]: e.target.checked ? 'true' : 'false' }))}
                              />
                              <label className="form-check-label small" htmlFor={`nfv-${f.id}`}>
                                {newFieldValues[f.id] === 'true' ? t('itemsTab.boolYes') : t('itemsTab.boolNo')}
                              </label>
                            </div>
                          ) : (
                            <input
                              type={f.type === 'Number' ? 'number' : f.type === 'Link' ? 'url' : 'text'}
                              className="form-control form-control-sm"
                              value={newFieldValues[f.id] ?? ''}
                              onChange={e => setNewFieldValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowCreate(false); setCreateError(null) }}
                >
                  {t('itemsTab.cancel')}
                </button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                  {creating ? t('itemsTab.adding') : t('itemsTab.addButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

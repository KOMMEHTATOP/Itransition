import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inventoriesApi } from '../api/inventoriesApi'
import { useAuth } from '../contexts/AuthContext'
import { stripMarkdown } from '../utils/stripMarkdown'
import type { InventoryListItem } from '../types/inventory'

type SortKey = 'newest' | 'oldest' | 'title'

const PAGE_SIZE = 20

export default function InventoriesPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [items, setItems]       = useState<InventoryListItem[]>([])
  const [total, setTotal]       = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]         = useState(1)
  const [sort, setSort]         = useState<SortKey>('newest')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle]     = useState('')
  const [newDesc, setNewDesc]       = useState('')
  const [newPublic, setNewPublic]   = useState(true)
  const [creating, setCreating]     = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await inventoriesApi.getAll(page, PAGE_SIZE, sort)
      setItems(res.data.items)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
      setSelected(new Set())
    } catch {
      setError(t('inventoriesList.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [page, sort, t])

  useEffect(() => { load() }, [load])

  const toggleSort = (key: SortKey) => {
    setSort(key)
    setPage(1)
  }

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(items.map(i => i.id)) : new Set())
  }

  const toggleOne = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev)
      checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return
    if (!confirm(t('inventoriesList.confirmDelete', { count: selected.size }))) return
    try {
      await inventoriesApi.deleteBatch([...selected])
      await load()
    } catch {
      setError(t('inventoriesList.failedToDelete'))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await inventoriesApi.create({
        title: newTitle.trim(),
        description: newDesc.trim(),
        isPublic: newPublic,
        categoryId: null,
      })
      setShowCreate(false)
      setNewTitle('')
      setNewDesc('')
      setNewPublic(true)
      navigate(`/inventories/${res.data.id}`)
    } catch {
      setCreateError(t('inventoriesList.failedToCreate'))
    } finally {
      setCreating(false)
    }
  }

  const sortIndicator = (key: SortKey) => sort === key ? ' ▲' : ''

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-3 gap-2 flex-wrap">
        <h2 className="me-auto mb-0">{t('inventoriesList.title')}</h2>

        {isAuthenticated && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
            {t('inventoriesList.createButton')}
          </button>
        )}
        {isAuthenticated && selected.size > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>
            {t('inventoriesList.deleteSelected', { count: selected.size })}
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted">{t('inventoriesList.noInventories')}</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selected.size === items.length && items.length > 0}
                      onChange={e => toggleAll(e.target.checked)}
                    />
                  </th>
                  <th
                    className="user-select-none"
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleSort('title')}
                  >
                    {t('inventoriesList.colName')}{sortIndicator('title')}
                  </th>
                  <th>{t('inventoriesList.colDescription')}</th>
                  <th>{t('inventoriesList.colOwner')}</th>
                  <th
                    className="user-select-none"
                    style={{ cursor: 'pointer' }}
                    onClick={() => toggleSort(sort === 'newest' ? 'oldest' : 'newest')}
                  >
                    {t('inventoriesList.colDate')}{sort === 'newest' ? ' ▼' : sort === 'oldest' ? ' ▲' : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map(inv => (
                  <tr
                    key={inv.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/inventories/${inv.id}`)}
                  >
                    <td onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selected.has(inv.id)}
                        onChange={e => toggleOne(inv.id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <Link
                        to={`/inventories/${inv.id}`}
                        className="text-decoration-none fw-semibold"
                        onClick={e => e.stopPropagation()}
                      >
                        {inv.title}
                      </Link>
                      {!inv.isPublic && (
                        <span className="badge bg-secondary ms-2 small">{t('inventoriesList.private')}</span>
                      )}
                    </td>
                    <td className="text-muted" style={{ maxWidth: 300 }}>
                      <span className="text-truncate d-block" style={{ maxWidth: 280 }}>
                        {inv.description ? stripMarkdown(inv.description) : '—'}
                      </span>
                    </td>
                    <td className="text-muted small">{inv.ownerDisplayName}</td>
                    <td className="text-muted small text-nowrap">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted">
              {t('inventoriesList.total', { count: total })}
            </small>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p - 1)}>‹</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                  </li>
                ))}
                <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p + 1)}>›</button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}

      {showCreate && (
        <div
          className="modal show d-block"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setShowCreate(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-content">
              <form onSubmit={handleCreate}>
                <div className="modal-header">
                  <h5 className="modal-title">{t('inventoriesList.newInventory')}</h5>
                  <button type="button" className="btn-close" onClick={() => setShowCreate(false)} />
                </div>
                <div className="modal-body">
                  {createError && (
                    <div className="alert alert-danger py-2">{createError}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">{t('inventoriesList.titleLabel')}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">{t('inventoriesList.descriptionLabel')}</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                    />
                  </div>
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="newPublic"
                      checked={newPublic}
                      onChange={e => setNewPublic(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="newPublic">
                      {t('inventoriesList.publicLabel')}
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreate(false)}
                  >
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
      )}
    </div>
  )
}

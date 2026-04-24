import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { inventoriesApi } from '../api/inventoriesApi'
import { useAuth } from '../contexts/AuthContext'
import type { InventoryListItem } from '../types/inventory'

type SortKey = 'newest' | 'oldest' | 'title'

const PAGE_SIZE = 10

interface InventoryTableProps {
  title: string
  items: InventoryListItem[]
  total: number
  page: number
  totalPages: number
  sort: SortKey
  loading: boolean
  error: string | null
  selected: Set<string>
  onPageChange: (p: number) => void
  onSortChange: (s: SortKey) => void
  onToggleAll: (checked: boolean) => void
  onToggleOne: (id: string, checked: boolean) => void
  onDeleteSelected: () => void
  showCreate?: boolean
  onCreateClick?: () => void
}

function InventoryTable({
  title,
  items,
  total,
  page,
  totalPages,
  sort,
  loading,
  error,
  selected,
  onPageChange,
  onSortChange,
  onToggleAll,
  onToggleOne,
  onDeleteSelected,
  showCreate,
  onCreateClick,
}: InventoryTableProps) {
  const navigate = useNavigate()

  return (
    <div className="mb-5">
      <div className="d-flex align-items-center mb-2 gap-2">
        <h5 className="mb-0 me-auto">{title}</h5>
        {showCreate && (
          <button className="btn btn-primary btn-sm" onClick={onCreateClick}>
            + Create
          </button>
        )}
        {selected.size > 0 && (
          <button className="btn btn-danger btn-sm" onClick={onDeleteSelected}>
            Delete selected ({selected.size})
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm" role="status" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted small">No inventories here yet.</p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover table-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selected.size === items.length && items.length > 0}
                      onChange={e => onToggleAll(e.target.checked)}
                    />
                  </th>
                  <th
                    style={{ cursor: 'pointer' }}
                    className="user-select-none"
                    onClick={() => onSortChange('title')}
                  >
                    Name{sort === 'title' ? ' ▲' : ''}
                  </th>
                  <th>Description</th>
                  <th>Owner</th>
                  <th
                    style={{ cursor: 'pointer' }}
                    className="user-select-none"
                    onClick={() => onSortChange(sort === 'newest' ? 'oldest' : 'newest')}
                  >
                    Date{sort === 'newest' ? ' ▼' : sort === 'oldest' ? ' ▲' : ''}
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
                        onChange={e => onToggleOne(inv.id, e.target.checked)}
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
                        <span className="badge bg-secondary ms-1 small">private</span>
                      )}
                    </td>
                    <td className="text-muted">
                      <span className="d-block text-truncate" style={{ maxWidth: 220 }}>
                        {inv.description || '—'}
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

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">{total} total</small>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => onPageChange(page - 1)}>
                    ‹
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => onPageChange(p)}>
                      {p}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => onPageChange(page + 1)}>
                    ›
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // --- My inventories state ---
  const [myItems, setMyItems]           = useState<InventoryListItem[]>([])
  const [myTotal, setMyTotal]           = useState(0)
  const [myTotalPages, setMyTotalPages] = useState(1)
  const [myPage, setMyPage]             = useState(1)
  const [mySort, setMySort]             = useState<SortKey>('newest')
  const [mySelected, setMySelected]     = useState<Set<string>>(new Set())
  const [myLoading, setMyLoading]       = useState(true)
  const [myError, setMyError]           = useState<string | null>(null)

  // --- Accessible inventories state ---
  const [accItems, setAccItems]           = useState<InventoryListItem[]>([])
  const [accTotal, setAccTotal]           = useState(0)
  const [accTotalPages, setAccTotalPages] = useState(1)
  const [accPage, setAccPage]             = useState(1)
  const [accSort, setAccSort]             = useState<SortKey>('newest')
  const [accLoading, setAccLoading]       = useState(true)
  const [accError, setAccError]           = useState<string | null>(null)

  // Create modal
  const [showCreate, setShowCreate]     = useState(false)
  const [newTitle, setNewTitle]         = useState('')
  const [newDesc, setNewDesc]           = useState('')
  const [newPublic, setNewPublic]       = useState(true)
  const [creating, setCreating]         = useState(false)
  const [createError, setCreateError]   = useState<string | null>(null)

  const loadMy = useCallback(async () => {
    setMyLoading(true)
    setMyError(null)
    try {
      const res = await inventoriesApi.getMy(myPage, PAGE_SIZE, mySort)
      setMyItems(res.data.items)
      setMyTotal(res.data.total)
      setMyTotalPages(res.data.totalPages)
      setMySelected(new Set())
    } catch {
      setMyError('Failed to load your inventories.')
    } finally {
      setMyLoading(false)
    }
  }, [myPage, mySort])

  const loadAcc = useCallback(async () => {
    setAccLoading(true)
    setAccError(null)
    try {
      const res = await inventoriesApi.getAccessible(accPage, PAGE_SIZE, accSort)
      setAccItems(res.data.items)
      setAccTotal(res.data.total)
      setAccTotalPages(res.data.totalPages)
    } catch {
      setAccError('Failed to load accessible inventories.')
    } finally {
      setAccLoading(false)
    }
  }, [accPage, accSort])

  useEffect(() => { loadMy() }, [loadMy])
  useEffect(() => { loadAcc() }, [loadAcc])

  const handleDeleteMySelected = async () => {
    if (mySelected.size === 0) return
    if (!confirm(`Delete ${mySelected.size} inventory(ies)?`)) return
    try {
      await inventoriesApi.deleteBatch([...mySelected])
      await loadMy()
    } catch {
      setMyError('Failed to delete selected inventories.')
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
      setCreateError('Failed to create inventory.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-1">{user?.displayName}</h2>
      <p className="text-muted mb-4">{user?.email}</p>

      <InventoryTable
        title="My Inventories"
        items={myItems}
        total={myTotal}
        page={myPage}
        totalPages={myTotalPages}
        sort={mySort}
        loading={myLoading}
        error={myError}
        selected={mySelected}
        onPageChange={setMyPage}
        onSortChange={s => { setMySort(s); setMyPage(1) }}
        onToggleAll={checked =>
          setMySelected(checked ? new Set(myItems.map(i => i.id)) : new Set())
        }
        onToggleOne={(id, checked) =>
          setMySelected(prev => {
            const next = new Set(prev)
            checked ? next.add(id) : next.delete(id)
            return next
          })
        }
        onDeleteSelected={handleDeleteMySelected}
        showCreate
        onCreateClick={() => setShowCreate(true)}
      />

      <InventoryTable
        title="Accessible to Me"
        items={accItems}
        total={accTotal}
        page={accPage}
        totalPages={accTotalPages}
        sort={accSort}
        loading={accLoading}
        error={accError}
        selected={new Set()}
        onPageChange={setAccPage}
        onSortChange={s => { setAccSort(s); setAccPage(1) }}
        onToggleAll={() => {}}
        onToggleOne={() => {}}
        onDeleteSelected={() => {}}
      />

      {/* Create modal */}
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
                  <h5 className="modal-title">New Inventory</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreate(false)}
                  />
                </div>
                <div className="modal-body">
                  {createError && (
                    <div className="alert alert-danger py-2">{createError}</div>
                  )}
                  <div className="mb-3">
                    <label className="form-label">Title *</label>
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
                    <label className="form-label">Description</label>
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
                      id="createPublic"
                      checked={newPublic}
                      onChange={e => setNewPublic(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="createPublic">
                      Public
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={creating}>
                    {creating ? 'Creating…' : 'Create'}
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

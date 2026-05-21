import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inventoriesApi } from '../api/inventoriesApi'
import { useAuth } from '../contexts/AuthContext'
import { stripMarkdown } from '../utils/stripMarkdown'
import type { InventoryListItem } from '../types/inventory'
import { PAGE_SIZE_PROFILE } from '../constants'
import { usePaginatedList } from '../hooks/usePaginatedList'
import { useSelection } from '../hooks/useSelection'

type SortKey = 'newest' | 'oldest' | 'title'

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
  const { t } = useTranslation()
  const [filter, setFilter] = useState('')
  const [ownerSortAsc, setOwnerSortAsc] = useState<boolean | null>(null)

  let displayed = filter
    ? items.filter(i => i.title.toLowerCase().includes(filter.toLowerCase()))
    : items

  if (ownerSortAsc !== null) {
    displayed = [...displayed].sort((a, b) =>
      ownerSortAsc
        ? a.ownerDisplayName.localeCompare(b.ownerDisplayName)
        : b.ownerDisplayName.localeCompare(a.ownerDisplayName)
    )
  }

  const handleOwnerSort = () => {
    setOwnerSortAsc(prev => prev === null ? true : prev ? false : null)
  }

  const ownerSortIndicator = ownerSortAsc === true ? ' ▲' : ownerSortAsc === false ? ' ▼' : ''

  return (
    <div className="mb-5">
      <div className="d-flex align-items-center mb-2 gap-2">
        <h5 className="mb-0 me-auto">{title}</h5>
        {showCreate && (
          <button className="btn btn-primary btn-sm" onClick={onCreateClick}>
            {t('inventoriesList.createButton')}
          </button>
        )}
        {selected.size > 0 && (
          <button className="btn btn-danger btn-sm" onClick={onDeleteSelected}>
            {t('inventoriesList.deleteSelected', { count: selected.size })}
          </button>
        )}
      </div>

      <input
        type="text"
        className="form-control form-control-sm mb-2"
        placeholder={t('inventoriesList.colName') + '...'}
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ maxWidth: 260 }}
      />

      {error && <div className="alert alert-danger py-2">{error}</div>}

      {loading ? (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm" role="status" />
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-muted small">{t('inventoriesList.noInventoriesHere')}</p>
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
                      checked={selected.size === displayed.length && displayed.length > 0}
                      onChange={e => onToggleAll(e.target.checked)}
                    />
                  </th>
                  <th
                    style={{ cursor: 'pointer' }}
                    className="user-select-none"
                    onClick={() => { onSortChange('title'); setOwnerSortAsc(null) }}
                  >
                    {t('inventoriesList.colName')}{sort === 'title' ? ' ▲' : ''}
                  </th>
                  <th>{t('inventoriesList.colDescription')}</th>
                  <th
                    style={{ cursor: 'pointer' }}
                    className="user-select-none"
                    onClick={handleOwnerSort}
                  >
                    {t('inventoriesList.colOwner')}{ownerSortIndicator}
                  </th>
                  <th
                    style={{ cursor: 'pointer' }}
                    className="user-select-none"
                    onClick={() => { onSortChange(sort === 'newest' ? 'oldest' : 'newest'); setOwnerSortAsc(null) }}
                  >
                    {t('inventoriesList.colDate')}{ownerSortAsc === null && (sort === 'newest' ? ' ▼' : sort === 'oldest' ? ' ▲' : '')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(inv => (
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
                        <span className="badge bg-secondary ms-1 small">{t('inventoriesList.private')}</span>
                      )}
                    </td>
                    <td className="text-muted">
                      <span className="d-block text-truncate" style={{ maxWidth: 220 }}>
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

          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">{total} total</small>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => onPageChange(page - 1)}>‹</button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
                  </li>
                ))}
                <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => onPageChange(page + 1)}>›</button>
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
  const { t } = useTranslation()

  const {
    items: myItems, total: myTotal, totalPages: myTotalPages,
    page: myPage, setPage: setMyPage, sort: mySort, setSort: setMySort,
    loading: myLoading, error: myError, reload: reloadMy,
  } = usePaginatedList<InventoryListItem>(
    (p, s) => inventoriesApi.getMy(p, PAGE_SIZE_PROFILE, s).then(r => r.data),
    [],
    { errorMessage: t('profile.failedToLoadMy') }
  )

  const {
    items: accItems, total: accTotal, totalPages: accTotalPages,
    page: accPage, setPage: setAccPage, sort: accSort, setSort: setAccSort,
    loading: accLoading, error: accError,
  } = usePaginatedList<InventoryListItem>(
    (p, s) => inventoriesApi.getAccessible(p, PAGE_SIZE_PROFILE, s).then(r => r.data),
    [],
    { errorMessage: t('profile.failedToLoadAccessible') }
  )

  const { selected: mySelected, toggleOne: toggleMyOne, toggleAll: toggleMyAll, clearSelection: clearMySelection } =
    useSelection(myItems.map(i => i.id))

  const [showCreate, setShowCreate]   = useState(false)
  const [newTitle, setNewTitle]       = useState('')
  const [newDesc, setNewDesc]         = useState('')
  const [newPublic, setNewPublic]     = useState(true)
  const [creating, setCreating]       = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteMySelected = async () => {
    if (mySelected.size === 0) return
    if (!confirm(t('profile.confirmDelete', { count: mySelected.size }))) return
    try {
      await inventoriesApi.deleteBatch([...mySelected])
      clearMySelection()
      reloadMy()
    } catch {
      setDeleteError(t('profile.failedToDeleteSelected'))
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
      setCreateError(t('profile.failedToCreate'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-1">{user?.displayName}</h2>
      <p className="text-muted mb-4">{user?.email}</p>

      {deleteError && <div className="alert alert-danger py-2">{deleteError}</div>}

      <InventoryTable
        title={t('profile.myInventories')}
        items={myItems}
        total={myTotal}
        page={myPage}
        totalPages={myTotalPages}
        sort={mySort as SortKey}
        loading={myLoading}
        error={myError}
        selected={mySelected}
        onPageChange={setMyPage}
        onSortChange={s => setMySort(s)}
        onToggleAll={checked => toggleMyAll(checked)}
        onToggleOne={(id, checked) => toggleMyOne(id, checked)}
        onDeleteSelected={handleDeleteMySelected}
        showCreate
        onCreateClick={() => setShowCreate(true)}
      />

      <InventoryTable
        title={t('profile.accessibleToMe')}
        items={accItems}
        total={accTotal}
        page={accPage}
        totalPages={accTotalPages}
        sort={accSort as SortKey}
        loading={accLoading}
        error={accError}
        selected={new Set()}
        onPageChange={setAccPage}
        onSortChange={s => setAccSort(s)}
        onToggleAll={() => {}}
        onToggleOne={() => {}}
        onDeleteSelected={() => {}}
      />

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
                      id="createPublic"
                      checked={newPublic}
                      onChange={e => setNewPublic(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="createPublic">
                      {t('inventoriesList.publicShort')}
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

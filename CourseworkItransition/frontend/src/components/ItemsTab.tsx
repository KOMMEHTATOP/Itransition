import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { itemsApi } from '../api/itemsApi'
import type { InventoryField, ItemListItem, PagedResult } from '../types/inventory'
import { PAGE_SIZE_ITEMS } from '../constants'
import { useSelection } from '../hooks/useSelection'
import Pagination from './Pagination'
import FieldValueCell from './FieldValueCell'
import CreateItemModal from './CreateItemModal'

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

  const [items, setItems]       = useState<PagedResult<ItemListItem> | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [page, setPage]         = useState(1)
  const [sort, setSort]         = useState('newest')
  const [deleting, setDeleting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const { selected, toggleOne, toggleAll, clearSelection } = useSelection(
    items?.items.map(i => i.id) ?? []
  )

  const tableFields = fields.filter(f => f.showInTable)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await itemsApi.getAll(inventoryId, page, PAGE_SIZE_ITEMS, sort)
      setItems(res.data.items)
    } catch {
      setError(t('itemsTab.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [inventoryId, page, sort, t])

  useEffect(() => { load() }, [load])

  const handleDeleteSelected = async () => {
    if (!confirm(t('itemsTab.confirmDelete', { count: selected.size }))) return
    setDeleting(true)
    try {
      await itemsApi.deleteBatch(inventoryId, [...selected])
      clearSelection()
      await load()
    } catch {
      setError(t('itemsTab.failedToLoad'))
    } finally {
      setDeleting(false)
    }
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
                        onChange={e => toggleAll(e.target.checked)}
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
                          onChange={e => toggleOne(item.id, e.target.checked)}
                        />
                      </td>
                    )}
                    <td className="text-monospace fw-semibold">
                      {item.customId || <span className="text-muted fst-italic">{t('itemsTab.noId')}</span>}
                    </td>
                    {tableFields.map(f => (
                      <td key={f.id}><FieldValueCell item={item} field={f} /></td>
                    ))}
                    <td className="text-muted small">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="text-muted small">{item.authorDisplayName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items && (
            <Pagination page={page} totalPages={items.totalPages} onPageChange={setPage} />
          )}
        </>
      )}

      {showCreate && (
        <CreateItemModal
          fields={fields}
          hasCustomIdFormat={hasCustomIdFormat}
          onClose={() => setShowCreate(false)}
          onCreate={async (req) => {
            await itemsApi.create(inventoryId, req)
            setShowCreate(false)
            await load()
          }}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inventoriesApi } from '../api/inventoriesApi'
import { useAuth } from '../contexts/AuthContext'
import type { InventoryListItem } from '../types/inventory'
import { PAGE_SIZE_INVENTORIES } from '../constants'
import { usePaginatedList } from '../hooks/usePaginatedList'
import { useSelection } from '../hooks/useSelection'
import InventoryTable from '../components/InventoryTable'
import CreateInventoryModal from '../components/CreateInventoryModal'

export default function InventoriesPage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { items, total, totalPages, page, setPage, sort, setSort, loading, error, reload } =
    usePaginatedList<InventoryListItem>(
      (p, s) => inventoriesApi.getAll(p, PAGE_SIZE_INVENTORIES, s).then(r => r.data),
      [],
      { errorMessage: t('inventoriesList.failedToLoad') }
    )
  const { selected, toggleOne, toggleAll, clearSelection } = useSelection(items.map(i => i.id))

  const [showCreate, setShowCreate] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return
    if (!confirm(t('inventoriesList.confirmDelete', { count: selected.size }))) return
    try {
      await inventoriesApi.deleteBatch([...selected])
      clearSelection()
      reload()
    } catch {
      setDeleteError(t('inventoriesList.failedToDelete'))
    }
  }

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

      {deleteError && <div className="alert alert-danger">{deleteError}</div>}

      <InventoryTable
        items={items}
        loading={loading}
        error={error}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        sort={sort}
        onSortChange={setSort}
        selected={selected}
        onToggleOne={toggleOne}
        onToggleAll={toggleAll}
      />

      {showCreate && (
        <CreateInventoryModal
          onClose={() => setShowCreate(false)}
          onCreate={async (data) => {
            const res = await inventoriesApi.create({ ...data, categoryId: null })
            setShowCreate(false)
            navigate(`/inventories/${res.data.id}`)
          }}
        />
      )}
    </div>
  )
}

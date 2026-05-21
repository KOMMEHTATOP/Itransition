import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inventoriesApi } from '../api/inventoriesApi'
import { useAuth } from '../contexts/AuthContext'
import type { InventoryListItem } from '../types/inventory'
import { PAGE_SIZE_PROFILE } from '../constants'
import { usePaginatedList } from '../hooks/usePaginatedList'
import { useSelection } from '../hooks/useSelection'
import InventoryTable from '../components/InventoryTable'
import CreateInventoryModal from '../components/CreateInventoryModal'

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

  const [showCreate, setShowCreate] = useState(false)
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
        sort={mySort}
        loading={myLoading}
        error={myError}
        selected={mySelected}
        onPageChange={setMyPage}
        onSortChange={setMySort}
        onToggleOne={toggleMyOne}
        onToggleAll={toggleMyAll}
        onDeleteSelected={handleDeleteMySelected}
        showCreate
        onCreateClick={() => setShowCreate(true)}
        showFilter
      />

      <InventoryTable
        title={t('profile.accessibleToMe')}
        items={accItems}
        total={accTotal}
        page={accPage}
        totalPages={accTotalPages}
        sort={accSort}
        loading={accLoading}
        error={accError}
        selected={new Set()}
        onPageChange={setAccPage}
        onSortChange={setAccSort}
        onToggleOne={() => {}}
        onToggleAll={() => {}}
        showFilter
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

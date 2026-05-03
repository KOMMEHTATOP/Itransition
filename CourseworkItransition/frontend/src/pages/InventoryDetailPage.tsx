import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inventoriesApi } from '../api/inventoriesApi'
import { fieldsApi } from '../api/fieldsApi'
import { useAuth } from '../contexts/AuthContext'
import FieldsTab from '../components/FieldsTab'
import ItemsTab from '../components/ItemsTab'
import CustomIdTab from '../components/CustomIdTab'
import SettingsTab from '../components/SettingsTab'
import AccessTab from '../components/AccessTab'
import DiscussionTab from '../components/DiscussionTab'
import StatsTab from '../components/StatsTab'
import { customIdApi } from '../api/customIdApi'
import type { Category, InventoryDetail, InventoryField, CustomIdElement } from '../types/inventory'

type Tab = 'items' | 'discussion' | 'stats' | 'fields' | 'customid' | 'settings' | 'access'

export default function InventoryDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

  const [inventory, setInventory] = useState<InventoryDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  const rawTab = searchParams.get('tab')
  const activeTab: Tab =
    rawTab === 'discussion' || rawTab === 'stats' || rawTab === 'fields' ||
    rawTab === 'customid' || rawTab === 'settings' || rawTab === 'access'
      ? rawTab
      : 'items'

  const setActiveTab = (tab: Tab) => {
    setSearchParams(tab === 'items' ? {} : { tab }, { replace: true })
  }

  const [fields, setFields]               = useState<InventoryField[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(false)

  const [customIdElements, setCustomIdElements] = useState<CustomIdElement[]>([])
  const [customIdLoading, setCustomIdLoading]   = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [invRes, catRes] = await Promise.all([
        inventoriesApi.getById(id),
        inventoriesApi.getCategories(),
      ])
      setInventory(invRes.data)
      setCategories(catRes.data)
    } catch {
      setError(t('inventory.notFoundError'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  const loadFields = useCallback(async () => {
    if (!id) return
    setFieldsLoading(true)
    try {
      const res = await fieldsApi.getAll(id)
      setFields(res.data)
    } catch { /* non-fatal */ } finally {
      setFieldsLoading(false)
    }
  }, [id])

  const loadCustomIdElements = useCallback(async () => {
    if (!id) return
    setCustomIdLoading(true)
    try {
      const res = await customIdApi.getAll(id)
      setCustomIdElements(res.data)
    } catch { /* non-fatal */ } finally {
      setCustomIdLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadFields() }, [loadFields])
  useEffect(() => { loadCustomIdElements() }, [loadCustomIdElements])

  const handleDelete = async () => {
    if (!id || !confirm(t('inventory.confirmDelete'))) return
    try {
      await inventoriesApi.delete(id)
      navigate('/inventories')
    } catch {
      setError(t('inventory.failedToDelete'))
    }
  }

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  if (error || !inventory) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error ?? t('inventory.notFound')}</div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          {t('inventory.backShort')}
        </button>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <button className="btn btn-link ps-0 text-muted mb-2 d-block text-start" onClick={() => navigate('/inventories')}>
        {t('inventory.back')}
      </button>

      <div className="d-flex align-items-start gap-2 mb-1 flex-wrap">
        <div className="me-auto">
          <h2 className="mb-0">{inventory.title}</h2>
          <small className="text-muted">
            {t('inventory.by')} {inventory.ownerDisplayName} · {new Date(inventory.createdAt).toLocaleDateString()}
            {inventory.categoryName && ` · ${inventory.categoryName}`}
            {!inventory.isPublic && <span className="badge bg-secondary ms-2">{t('inventoriesList.private')}</span>}
            {inventory.tags.length > 0 && (
              <span className="ms-2">
                {inventory.tags.map(tag => (
                  <span key={tag} className="badge bg-light text-secondary border me-1">{tag}</span>
                ))}
              </span>
            )}
          </small>
        </div>
        {inventory.canEdit && (
          <button className="btn btn-outline-danger btn-sm flex-shrink-0" onClick={handleDelete}>
            {t('inventory.deleteInventory')}
          </button>
        )}
      </div>

      <ul className="nav nav-tabs mt-3 mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'items' ? 'active' : ''}`} onClick={() => setActiveTab('items')}>
            {t('inventory.tabItems')}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'discussion' ? 'active' : ''}`} onClick={() => setActiveTab('discussion')}>
            {t('inventory.tabDiscussion')}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            {t('inventory.tabStats')}
          </button>
        </li>
        {inventory.canEdit && (
          <>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'fields' ? 'active' : ''}`} onClick={() => setActiveTab('fields')}>
                {t('inventory.tabFields')} {fieldsLoading ? '' : `(${fields.length})`}
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'customid' ? 'active' : ''}`} onClick={() => setActiveTab('customid')}>
                {t('inventory.tabCustomId')} {customIdLoading ? '' : customIdElements.length > 0 ? `(${customIdElements.length})` : ''}
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                {t('inventory.tabSettings')}
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'access' ? 'active' : ''}`} onClick={() => setActiveTab('access')}>
                {t('inventory.tabAccess')}
              </button>
            </li>
          </>
        )}
      </ul>

      {activeTab === 'discussion' && (
        <DiscussionTab
          inventoryId={inventory.id}
          isAuthenticated={isAuthenticated}
          active={activeTab === 'discussion'}
        />
      )}

      {activeTab === 'stats' && (
        <StatsTab inventoryId={inventory.id} active={activeTab === 'stats'} />
      )}

      {activeTab === 'items' && (
        <ItemsTab
          inventoryId={inventory.id}
          fields={fields}
          canEdit={inventory.canEdit}
          isAuthenticated={isAuthenticated}
          hasCustomIdFormat={customIdElements.length > 0}
        />
      )}

      {activeTab === 'fields' && inventory.canEdit && (
        <FieldsTab inventoryId={inventory.id} fields={fields} onChange={setFields} />
      )}

      {activeTab === 'customid' && inventory.canEdit && (
        <CustomIdTab
          inventoryId={inventory.id}
          elements={customIdElements}
          onChange={setCustomIdElements}
        />
      )}

      {activeTab === 'settings' && inventory.canEdit && (
        <SettingsTab
          inventory={inventory}
          categories={categories}
          onSaved={(updated) => setInventory(updated)}
          onReload={load}
        />
      )}

      {activeTab === 'access' && inventory.canEdit && (
        <AccessTab inventoryId={inventory.id} isPublic={inventory.isPublic} />
      )}
    </div>
  )
}

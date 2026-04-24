import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { inventoriesApi } from '../api/inventoriesApi'
import { fieldsApi } from '../api/fieldsApi'
import { useAuth } from '../contexts/AuthContext'
import { useAutosave } from '../hooks/useAutosave'
import FieldsTab from '../components/FieldsTab'
import ItemsTab from '../components/ItemsTab'
import type { InventoryDetail, UpdateInventoryRequest, InventoryField } from '../types/inventory'

type Tab = 'items' | 'fields' | 'settings'

export default function InventoryDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { isAuthenticated } = useAuth()

  const [inventory, setInventory] = useState<InventoryDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const rawTab = searchParams.get('tab')
  const activeTab: Tab = rawTab === 'fields' || rawTab === 'settings' ? rawTab : 'items'

  const setActiveTab = (tab: Tab) => {
    setSearchParams(tab === 'items' ? {} : { tab }, { replace: true })
  }

  // Fields state (owned at this level so both tabs share it)
  const [fields, setFields] = useState<InventoryField[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(false)

  // Settings form state
  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [formVersion, setFormVersion] = useState(1)

  const editData: UpdateInventoryRequest = {
    title,
    description,
    isPublic,
    categoryId: inventory?.categoryId ?? null,
    version: formVersion,
  }

  const saveFn = useCallback(
    async (data: UpdateInventoryRequest) => {
      if (!id) return
      const res = await inventoriesApi.update(id, data)
      setFormVersion(res.data.version)
      setInventory(res.data)
    },
    [id],
  )

  const { saveStatus, saveNow } = useAutosave({
    data: editData,
    saveFn,
    delay: 8000,
    enabled: !!inventory?.canEdit && activeTab === 'settings',
  })

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const res = await inventoriesApi.getById(id)
      setInventory(res.data)
      setTitle(res.data.title)
      setDesc(res.data.description)
      setIsPublic(res.data.isPublic)
      setFormVersion(res.data.version)
    } catch {
      setError('Inventory not found or access denied.')
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadFields = useCallback(async () => {
    if (!id) return
    setFieldsLoading(true)
    try {
      const res = await fieldsApi.getAll(id)
      setFields(res.data)
    } catch {
      // non-fatal
    } finally {
      setFieldsLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadFields() }, [loadFields])

  const handleDelete = async () => {
    if (!id || !confirm('Delete this inventory and all its items?')) return
    try {
      await inventoriesApi.delete(id)
      navigate('/inventories')
    } catch {
      setError('Failed to delete inventory.')
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
        <div className="alert alert-danger">{error ?? 'Not found.'}</div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>← Back</button>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <button className="btn btn-link ps-0 text-muted mb-2" onClick={() => navigate('/inventories')}>
        ← Inventories
      </button>

      <div className="d-flex align-items-start gap-2 mb-1 flex-wrap">
        <div className="me-auto">
          <h2 className="mb-0">{inventory.title}</h2>
          <small className="text-muted">
            By {inventory.ownerDisplayName} · {new Date(inventory.createdAt).toLocaleDateString()}
            {inventory.categoryName && ` · ${inventory.categoryName}`}
            {!inventory.isPublic && <span className="badge bg-secondary ms-2">private</span>}
          </small>
        </div>
        {inventory.canEdit && (
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {activeTab === 'settings' && saveLabel() && (
              <small
                className={`text-${saveStatus === 'conflict' || saveStatus === 'error' ? 'danger' : saveStatus === 'saving' ? 'muted' : 'success'}`}
              >
                {saveLabel()}
              </small>
            )}
            {activeTab === 'settings' && (
              <button className="btn btn-outline-primary btn-sm" onClick={saveNow}>
                Save now
              </button>
            )}
            <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
              Delete inventory
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <ul className="nav nav-tabs mt-3 mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'items' ? 'active' : ''}`}
            onClick={() => setActiveTab('items')}
          >
            Items
          </button>
        </li>
        {inventory.canEdit && (
          <>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'fields' ? 'active' : ''}`}
                onClick={() => setActiveTab('fields')}
              >
                Fields {fieldsLoading ? '' : `(${fields.length})`}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </li>
          </>
        )}
      </ul>

      {/* Tab content */}
      {activeTab === 'items' && (
        <ItemsTab
          inventoryId={inventory.id}
          fields={fields}
          canEdit={inventory.canEdit}
          isAuthenticated={isAuthenticated}
        />
      )}

      {activeTab === 'fields' && inventory.canEdit && (
        <FieldsTab
          inventoryId={inventory.id}
          fields={fields}
          onChange={setFields}
        />
      )}

      {activeTab === 'settings' && inventory.canEdit && (
        <div style={{ maxWidth: 640 }}>
          {saveStatus === 'conflict' && (
            <div className="alert alert-warning">
              Save conflict: someone else modified this inventory. Please{' '}
              <button className="btn btn-link p-0 align-baseline" onClick={load}>
                reload
              </button>{' '}
              to get the latest version.
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold">Title</label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Description</label>
            <textarea
              className="form-control"
              rows={5}
              value={description}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="isPublic"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="isPublic">
              Public inventory (any authenticated user can add items)
            </label>
          </div>

          <p className="text-muted small">
            Image upload, tags, and access management will be available in Phase 6.
          </p>
        </div>
      )}
    </div>
  )
}

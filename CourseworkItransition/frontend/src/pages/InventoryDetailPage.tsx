import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { inventoriesApi } from '../api/inventoriesApi'
import { useAuth } from '../contexts/AuthContext'
import { useAutosave } from '../hooks/useAutosave'
import type { InventoryDetail, UpdateInventoryRequest } from '../types/inventory'

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [inventory, setInventory] = useState<InventoryDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // Editable fields (only used when canEdit)
  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const [formVersion, setFormVersion] = useState(1)

  // The object passed to autosave — changes whenever a field changes
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
      // Update local version so next autosave uses the new version
      setFormVersion(res.data.version)
      setInventory(res.data)
    },
    [id],
  )

  const { saveStatus, saveNow } = useAutosave({
    data: editData,
    saveFn,
    delay: 8000,
    enabled: !!inventory?.canEdit,
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

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!id || !confirm('Delete this inventory?')) return
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
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 720 }}>
      <button className="btn btn-link ps-0 text-muted mb-3" onClick={() => navigate('/inventories')}>
        ← Inventories
      </button>

      {inventory.canEdit ? (
        // Edit form for owner / admin
        <>
          <div className="d-flex align-items-center mb-1 gap-2">
            <h2 className="mb-0 me-auto">{inventory.title}</h2>
            {saveLabel() && (
              <small
                className={`text-${saveStatus === 'conflict' || saveStatus === 'error' ? 'danger' : saveStatus === 'saving' ? 'muted' : 'success'}`}
              >
                {saveLabel()}
              </small>
            )}
            <button className="btn btn-outline-primary btn-sm" onClick={saveNow}>
              Save now
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={handleDelete}>
              Delete
            </button>
          </div>
          <small className="text-muted d-block mb-4">
            By {inventory.ownerDisplayName} · {new Date(inventory.createdAt).toLocaleDateString()}
            {inventory.categoryName && ` · ${inventory.categoryName}`}
          </small>

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

          <div className="form-check mb-4">
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

          <hr />
          <p className="text-muted small">
            Items, custom fields, and access settings will be available in the next phase.
          </p>
        </>
      ) : (
        // Read-only view
        <>
          <h2 className="mb-1">{inventory.title}</h2>
          <small className="text-muted d-block mb-3">
            By {inventory.ownerDisplayName} · {new Date(inventory.createdAt).toLocaleDateString()}
            {inventory.categoryName && ` · ${inventory.categoryName}`}
            {!inventory.isPublic && (
              <span className="badge bg-secondary ms-2">private</span>
            )}
          </small>
          <p className="text-body">{inventory.description || <em className="text-muted">No description.</em>}</p>
          {!isAuthenticated && (
            <p className="text-muted small">Sign in to add items to this inventory.</p>
          )}
        </>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { inventoriesApi } from '../api/inventoriesApi'
import type { InventoryListItem } from '../types/inventory'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const tag            = searchParams.get('tag') ?? ''
  const navigate       = useNavigate()

  const [items, setItems]   = useState<InventoryListItem[]>([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!tag) return
    setLoading(true)
    setError(null)
    inventoriesApi.getAll(1, 50, 'newest', tag)
      .then(res => {
        setItems(res.data.items)
        setTotal(res.data.total)
      })
      .catch(() => setError('Search failed.'))
      .finally(() => setLoading(false))
  }, [tag])

  return (
    <div className="container mt-4">
      <button className="btn btn-link ps-0 text-muted mb-3" onClick={() => navigate('/')}>
        ← Home
      </button>

      <h2 className="mb-1">
        Tag: <span className="badge bg-secondary">{tag}</span>
      </h2>
      <p className="text-muted small mb-3">{total} public inventor{total !== 1 ? 'ies' : 'y'} found</p>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted">No public inventories with this tag.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Owner</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map(inv => (
                <tr
                  key={inv.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/inventories/${inv.id}`)}
                >
                  <td>
                    <Link
                      to={`/inventories/${inv.id}`}
                      className="text-decoration-none fw-semibold"
                      onClick={e => e.stopPropagation()}
                    >
                      {inv.title}
                    </Link>
                  </td>
                  <td className="text-muted" style={{ maxWidth: 300 }}>
                    <span className="text-truncate d-block" style={{ maxWidth: 280 }}>
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
      )}
    </div>
  )
}

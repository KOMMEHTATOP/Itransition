import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { inventoriesApi } from '../api/inventoriesApi'
import { searchApi } from '../api/searchApi'
import type { InventoryListItem, SearchResult } from '../types/inventory'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const q   = searchParams.get('q') ?? ''
  const tag = searchParams.get('tag') ?? ''
  const navigate = useNavigate()

  // --- Full-text search state ---
  const [ftsResult, setFtsResult] = useState<SearchResult | null>(null)
  const [ftsLoading, setFtsLoading] = useState(false)
  const [ftsError, setFtsError] = useState<string | null>(null)

  // --- Tag filter state ---
  const [tagItems, setTagItems] = useState<InventoryListItem[]>([])
  const [tagTotal, setTagTotal] = useState(0)
  const [tagLoading, setTagLoading] = useState(false)
  const [tagError, setTagError] = useState<string | null>(null)

  useEffect(() => {
    if (!q) return
    setFtsLoading(true)
    setFtsError(null)
    setFtsResult(null)
    searchApi
      .search(q)
      .then(res => setFtsResult(res.data))
      .catch(() => setFtsError('Search failed. Please try again.'))
      .finally(() => setFtsLoading(false))
  }, [q])

  useEffect(() => {
    if (!tag) return
    setTagLoading(true)
    setTagError(null)
    inventoriesApi
      .getAll(1, 50, 'newest', tag)
      .then(res => {
        setTagItems(res.data.items)
        setTagTotal(res.data.total)
      })
      .catch(() => setTagError('Search failed.'))
      .finally(() => setTagLoading(false))
  }, [tag])

  const loading = q ? ftsLoading : tagLoading
  const error   = q ? ftsError  : tagError

  return (
    <div className="container mt-4">
      <button className="btn btn-link ps-0 text-muted mb-3" onClick={() => navigate('/')}>
        ← Home
      </button>

      {q && (
        <>
          <h2 className="mb-1">
            Results for: <span className="text-secondary">&ldquo;{q}&rdquo;</span>
          </h2>
          {ftsResult && (
            <p className="text-muted small mb-3">
              {ftsResult.inventories.length} inventor{ftsResult.inventories.length !== 1 ? 'ies' : 'y'},{' '}
              {ftsResult.items.length} item{ftsResult.items.length !== 1 ? 's' : ''}
            </p>
          )}
        </>
      )}

      {tag && (
        <>
          <h2 className="mb-1">
            Tag: <span className="badge bg-secondary">{tag}</span>
          </h2>
          <p className="text-muted small mb-3">
            {tagTotal} public inventor{tagTotal !== 1 ? 'ies' : 'y'} found
          </p>
        </>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      )}

      {/* Full-text search results */}
      {!loading && q && ftsResult && (
        <>
          <h5 className="text-muted mt-3 mb-2">Inventories</h5>
          {ftsResult.inventories.length === 0 ? (
            <p className="text-muted small">No inventories found.</p>
          ) : (
            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Owner</th>
                    <th>Category</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ftsResult.inventories.map(inv => (
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
                      <td className="text-muted" style={{ maxWidth: 260 }}>
                        <span className="text-truncate d-block" style={{ maxWidth: 240 }}>
                          {inv.description || '—'}
                        </span>
                      </td>
                      <td className="text-muted small">{inv.ownerDisplayName}</td>
                      <td className="text-muted small">{inv.categoryName ?? '—'}</td>
                      <td className="text-muted small text-nowrap">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h5 className="text-muted mb-2">Items</h5>
          {ftsResult.items.length === 0 ? (
            <p className="text-muted small">No items found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Custom ID</th>
                    <th>Inventory</th>
                    <th>Author</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {ftsResult.items.map(item => (
                    <tr
                      key={item.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/items/${item.id}`)}
                    >
                      <td>
                        <Link
                          to={`/items/${item.id}`}
                          className="text-decoration-none fw-semibold"
                          onClick={e => e.stopPropagation()}
                        >
                          {item.customId || item.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td>
                        <Link
                          to={`/inventories/${item.inventoryId}`}
                          className="text-decoration-none text-muted"
                          onClick={e => e.stopPropagation()}
                        >
                          {item.inventoryTitle}
                        </Link>
                      </td>
                      <td className="text-muted small">{item.authorDisplayName}</td>
                      <td className="text-muted small text-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tag filter results */}
      {!loading && tag && (
        <>
          {tagItems.length === 0 ? (
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
                  {tagItems.map(inv => (
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
        </>
      )}
    </div>
  )
}

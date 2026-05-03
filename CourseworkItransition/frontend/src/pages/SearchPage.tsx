import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { inventoriesApi } from '../api/inventoriesApi'
import { searchApi } from '../api/searchApi'
import type { InventoryListItem, SearchResult } from '../types/inventory'

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const q   = searchParams.get('q') ?? ''
  const tag = searchParams.get('tag') ?? ''
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [ftsResult, setFtsResult] = useState<SearchResult | null>(null)
  const [ftsLoading, setFtsLoading] = useState(false)
  const [ftsError, setFtsError] = useState<string | null>(null)

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
      .catch(() => setFtsError(t('searchPage.searchFailed')))
      .finally(() => setFtsLoading(false))
  }, [q, t])

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
      .catch(() => setTagError(t('searchPage.searchTagFailed')))
      .finally(() => setTagLoading(false))
  }, [tag, t])

  const loading = q ? ftsLoading : tagLoading
  const error   = q ? ftsError  : tagError

  return (
    <div className="container mt-4">
      <button className="btn btn-link ps-0 text-muted mb-3" onClick={() => navigate('/')}>
        {t('searchPage.home')}
      </button>

      {q && (
        <>
          <h2 className="mb-1">
            {t('searchPage.resultsFor')} <span className="text-secondary">&ldquo;{q}&rdquo;</span>
          </h2>
          {ftsResult && (
            <p className="text-muted small mb-3">
              {t('searchPage.inventoriesCount', { count: ftsResult.inventories.length })},{' '}
              {t('searchPage.itemsCount', { count: ftsResult.items.length })}
            </p>
          )}
        </>
      )}

      {tag && (
        <>
          <h2 className="mb-1">
            {t('searchPage.tag')} <span className="badge bg-secondary">{tag}</span>
          </h2>
          <p className="text-muted small mb-3">
            {t('searchPage.publicInventoriesFound', { count: tagTotal })}
          </p>
        </>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border" role="status" />
        </div>
      )}

      {!loading && q && ftsResult && (
        <>
          <h5 className="text-muted mt-3 mb-2">{t('searchPage.sectionInventories')}</h5>
          {ftsResult.inventories.length === 0 ? (
            <p className="text-muted small">{t('searchPage.noInventories')}</p>
          ) : (
            <div className="table-responsive mb-4">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>{t('searchPage.colName')}</th>
                    <th>{t('searchPage.colDescription')}</th>
                    <th>{t('searchPage.colOwner')}</th>
                    <th>{t('searchPage.colCategory')}</th>
                    <th>{t('searchPage.colDate')}</th>
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

          <h5 className="text-muted mb-2">{t('searchPage.sectionItems')}</h5>
          {ftsResult.items.length === 0 ? (
            <p className="text-muted small">{t('searchPage.noItems')}</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>{t('searchPage.colCustomId')}</th>
                    <th>{t('searchPage.colInventory')}</th>
                    <th>{t('searchPage.colAuthor')}</th>
                    <th>{t('searchPage.colDate')}</th>
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

      {!loading && tag && (
        <>
          {tagItems.length === 0 ? (
            <p className="text-muted">{t('searchPage.noTagInventories')}</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>{t('searchPage.colName')}</th>
                    <th>{t('searchPage.colDescription')}</th>
                    <th>{t('searchPage.colOwner')}</th>
                    <th>{t('searchPage.colDate')}</th>
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

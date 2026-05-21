import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TagCloud } from 'react-tagcloud'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { tagsApi } from '../api/tagsApi'
import { inventoriesApi } from '../api/inventoriesApi'
import type { InventoryListItem, TagCloudItem, TopInventory } from '../types/inventory'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [tagCloud, setTagCloud] = useState<TagCloudItem[]>([])
  const [latest, setLatest] = useState<InventoryListItem[]>([])
  const [top, setTop] = useState<TopInventory[]>([])

  useEffect(() => {
    tagsApi.cloud(60).then(res => setTagCloud(res.data)).catch(() => {})
    inventoriesApi.getAll(1, 10, 'newest')
      .then(res => setLatest(res.data.items))
      .catch(() => {})
    inventoriesApi.getTop(5)
      .then(res => setTop(res.data))
      .catch(() => {})
  }, [])

  return (
    <div className="container mt-4">
      <h1>{t('home.title')}</h1>
      <p className="text-muted lead mb-4">{t('home.lead')}</p>
      <Link className="btn btn-primary me-2" to="/inventories">
        {t('home.browseInventories')}
      </Link>
      {!isAuthenticated && (
        <Link className="btn btn-outline-primary" to="/register">
          {t('home.getStarted')}
        </Link>
      )}

      <div className="row mt-5 g-4">
        <div className="col-lg-7">
          <h5 className="text-muted mb-3">{t('home.latestInventories')}</h5>
          {latest.length === 0 ? (
            <p className="text-muted small">{t('home.noPublicInventories')}</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>{t('home.colName')}</th>
                    <th>{t('home.colOwner')}</th>
                    <th>{t('home.colDate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {latest.map(inv => (
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

        <div className="col-lg-5">
          <h5 className="text-muted mb-3">{t('home.topByItems')}</h5>
          {top.length === 0 ? (
            <p className="text-muted small">{t('home.noData')}</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>{t('home.colName')}</th>
                    <th>{t('home.colOwner')}</th>
                    <th className="text-end">{t('home.colItems')}</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map(inv => (
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
                      <td className="text-muted small">{inv.ownerDisplayName}</td>
                      <td className="text-muted small text-end">{inv.itemCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {tagCloud.length > 0 && (
        <div className="mt-4">
          <h5 className="text-muted mb-3">{t('home.popularTags')}</h5>
          <TagCloud
            minSize={13}
            maxSize={36}
            tags={tagCloud.map(t => ({ value: t.tag, count: t.count }))}
            onClick={(tag: { value: string }) => navigate(`/search?tag=${encodeURIComponent(tag.value)}`)}
          />
        </div>
      )}
    </div>
  )
}

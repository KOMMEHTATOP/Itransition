import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { inventoriesApi } from '../api/inventoriesApi'
import type { InventoryStats } from '../types/inventory'

interface Props {
  inventoryId: string
  active: boolean
}

export default function StatsTab({ inventoryId, active }: Props) {
  const { t } = useTranslation()
  const [stats, setStats]   = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    setLoading(true)
    setError(null)
    inventoriesApi.getStats(inventoryId)
      .then(res => setStats(res.data))
      .catch(() => setError(t('statsTab.failedToLoad')))
      .finally(() => setLoading(false))
  }, [active, inventoryId, t])

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm" role="status" />
      </div>
    )
  }

  if (error || !stats) {
    return <div className="alert alert-danger py-2">{error}</div>
  }

  const hasNumeric = stats.numericFields.length > 0
  const hasText    = stats.textFields.length > 0

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="mb-4">
        <span className="text-muted small">{t('statsTab.totalItems')}</span>
        <span className="fs-4 fw-semibold ms-2">{stats.totalItems}</span>
      </div>

      {hasNumeric && (
        <div className="mb-4">
          <h6 className="text-muted mb-2">{t('statsTab.numericFields')}</h6>
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>{t('statsTab.colField')}</th>
                <th className="text-end">{t('statsTab.colCount')}</th>
                <th className="text-end">{t('statsTab.colMin')}</th>
                <th className="text-end">{t('statsTab.colMax')}</th>
                <th className="text-end">{t('statsTab.colAvg')}</th>
              </tr>
            </thead>
            <tbody>
              {stats.numericFields.map(f => (
                <tr key={f.fieldId}>
                  <td className="fw-semibold">{f.fieldTitle}</td>
                  <td className="text-end text-muted">{f.count}</td>
                  <td className="text-end">{f.min}</td>
                  <td className="text-end">{f.max}</td>
                  <td className="text-end">{f.avg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasText && (
        <div>
          <h6 className="text-muted mb-2">{t('statsTab.textFields')}</h6>
          <div className="row g-3">
            {stats.textFields.map(f => (
              <div key={f.fieldId} className="col-sm-6">
                <div className="border rounded p-3">
                  <div className="fw-semibold mb-2">{f.fieldTitle}</div>
                  <ol className="mb-0 ps-3">
                    {f.topValues.map(tv => (
                      <li key={tv.value} className="small">
                        <span className="text-truncate d-inline-block" style={{ maxWidth: 180 }} title={tv.value}>
                          {tv.value}
                        </span>
                        <span className="text-muted ms-1">×{tv.count}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasNumeric && !hasText && stats.totalItems === 0 && (
        <p className="text-muted">{t('statsTab.noData')}</p>
      )}

      {!hasNumeric && !hasText && stats.totalItems > 0 && (
        <p className="text-muted small">{t('statsTab.noFields')}</p>
      )}
    </div>
  )
}

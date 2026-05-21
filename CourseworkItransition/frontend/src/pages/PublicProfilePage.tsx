import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { usersApi } from '../api/usersApi'
import { stripMarkdown } from '../utils/stripMarkdown'
import type { UserPublicProfile } from '../types/inventory'
import { useFetch } from '../hooks/useFetch'

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const { data: profile, loading, error } = useFetch<UserPublicProfile>(
    () => usersApi.getProfile(userId!).then(r => r.data),
    [userId],
    t('publicProfile.notFound')
  )

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error ?? t('publicProfile.notFound')}</div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          {t('publicProfile.back')}
        </button>
      </div>
    )
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 800 }}>
      <button className="btn btn-link ps-0 text-muted mb-3 d-block text-start" onClick={() => navigate(-1)}>
        {t('publicProfile.back')}
      </button>

      <h2 className="mb-1">{profile.displayName}</h2>
      <p className="text-muted mb-4">
        {t('publicProfile.publicInventoriesCount', { count: profile.inventories.length })}
      </p>

      {profile.inventories.length === 0 ? (
        <p className="text-muted">{t('publicProfile.noInventories')}</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>{t('publicProfile.colName')}</th>
                <th>{t('publicProfile.colDescription')}</th>
                <th>{t('publicProfile.colDate')}</th>
              </tr>
            </thead>
            <tbody>
              {profile.inventories.map(inv => (
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
                      {inv.description ? stripMarkdown(inv.description) : '—'}
                    </span>
                  </td>
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

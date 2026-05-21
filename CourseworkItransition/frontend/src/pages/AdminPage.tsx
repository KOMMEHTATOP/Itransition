import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { adminApi } from '../api/adminApi'
import type { AdminUser } from '../types/inventory'
import { useFetch } from '../hooks/useFetch'
import { useSelection } from '../hooks/useSelection'

export default function AdminPage() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, loading, error, reload } = useFetch(
    () => adminApi.getUsers().then(r => r.data),
    [],
    t('adminPage.failedToLoad')
  )
  const users = data ?? []
  const { selected, toggleOne, toggleAll, clearSelection } = useSelection(users.map((u: AdminUser) => u.id))

  const run = async (fn: () => Promise<unknown>, confirmMsg?: string) => {
    if (confirmMsg && !confirm(confirmMsg)) return
    setBusy(true)
    setActionError(null)
    try {
      await fn()
      clearSelection()
      reload()
    } catch {
      setActionError(t('adminPage.actionFailed'))
    } finally {
      setBusy(false)
    }
  }

  const ids = [...selected]

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border" role="status" />
      </div>
    )
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 900 }}>
      <h2 className="mb-4">{t('adminPage.title')}</h2>

      {(error || actionError) && (
        <div className="alert alert-danger py-2">{error || actionError}</div>
      )}

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          className="btn btn-outline-warning btn-sm"
          disabled={busy || selected.size === 0}
          onClick={() => run(() => adminApi.block(ids), t('adminPage.confirmBlock', { count: selected.size }))}
        >
          {t('adminPage.block', { count: selected.size })}
        </button>
        <button
          className="btn btn-outline-success btn-sm"
          disabled={busy || selected.size === 0}
          onClick={() => run(() => adminApi.unblock(ids))}
        >
          {t('adminPage.unblock', { count: selected.size })}
        </button>
        <button
          className="btn btn-outline-primary btn-sm"
          disabled={busy || selected.size === 0}
          onClick={() => run(() => adminApi.promote(ids))}
        >
          {t('adminPage.promote', { count: selected.size })}
        </button>
        <button
          className="btn btn-outline-secondary btn-sm"
          disabled={busy || selected.size === 0}
          onClick={() => run(() => adminApi.demote(ids))}
        >
          {t('adminPage.demote', { count: selected.size })}
        </button>
        <button
          className="btn btn-outline-danger btn-sm ms-auto"
          disabled={busy || selected.size === 0}
          onClick={() => run(() => adminApi.delete(ids), t('adminPage.confirmDelete', { count: selected.size }))}
        >
          {t('adminPage.delete', { count: selected.size })}
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selected.size === users.length && users.length > 0}
                  onChange={e => toggleAll(e.target.checked)}
                />
              </th>
              <th>{t('adminPage.colName')}</th>
              <th>{t('adminPage.colEmail')}</th>
              <th>{t('adminPage.colStatus')}</th>
              <th>{t('adminPage.colRole')}</th>
              <th className="text-end">{t('adminPage.colInventories')}</th>
              <th>{t('adminPage.colRegistered')}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u: AdminUser) => (
              <tr key={u.id} className={u.id === currentUser?.id ? 'table-active' : ''}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selected.has(u.id)}
                    onChange={e => toggleOne(u.id, e.target.checked)}
                  />
                </td>
                <td className="fw-semibold">{u.displayName}</td>
                <td className="text-muted small">{u.email}</td>
                <td>
                  {u.isBlocked
                    ? <span className="badge bg-danger">{t('adminPage.blocked')}</span>
                    : <span className="badge bg-success">{t('adminPage.active')}</span>}
                </td>
                <td>
                  {u.isAdmin && <span className="badge bg-warning text-dark">{t('adminPage.admin')}</span>}
                </td>
                <td className="text-end text-muted small">{u.inventoryCount}</td>
                <td className="text-muted small">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <small className="text-muted">{t('adminPage.total', { count: users.length })}</small>
    </div>
  )
}

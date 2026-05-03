import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { accessApi } from '../api/accessApi'
import { usersApi } from '../api/usersApi'
import type { AccessUser, UserSearchResult } from '../types/inventory'

interface Props {
  inventoryId: string
  isPublic: boolean
}

export default function AccessTab({ inventoryId, isPublic }: Props) {
  const { t } = useTranslation()
  const [users, setUsers]       = useState<AccessUser[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy]     = useState<'name' | 'email'>('name')
  const [removing, setRemoving] = useState(false)

  const [query, setQuery]               = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown]   = useState(false)
  const [addError, setAddError]           = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await accessApi.getAll(inventoryId)
      setUsers(res.data)
    } catch {
      setError(t('accessTab.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [inventoryId, t])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (query.trim().length < 2) { setSearchResults([]); setShowDropdown(false); return }
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await usersApi.search(query)
        setSearchResults(res.data)
        setShowDropdown(true)
      } catch { /* ignore */ } finally {
        setSearchLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const handleAdd = async (user: UserSearchResult) => {
    setAddError(null)
    setShowDropdown(false)
    setQuery('')
    const res = await accessApi.grant(inventoryId, user.id)
    if (res.status === 409) { setAddError(t('accessTab.alreadyHasAccess')); return }
    if (res.status === 400) {
      const body = res.data as unknown as { message?: string }
      setAddError(body.message ?? t('accessTab.cannotAdd'))
      return
    }
    await load()
  }

  const handleRemoveSelected = async () => {
    if (!confirm(t('accessTab.confirmRemove', { count: selected.size }))) return
    setRemoving(true)
    try {
      await accessApi.revokeBatch(inventoryId, [...selected])
      setSelected(new Set())
      await load()
    } catch {
      setError(t('accessTab.failedToRemove'))
    } finally {
      setRemoving(false)
    }
  }

  const toggleSelect = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const toggleAll = () =>
    setSelected(prev => prev.size === users.length ? new Set() : new Set(users.map(u => u.id)))

  const sorted = [...users].sort((a, b) =>
    sortBy === 'email'
      ? a.email.localeCompare(b.email)
      : a.displayName.localeCompare(b.displayName),
  )

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm" role="status" />
      </div>
    )
  }

  return (
    <div>
      {isPublic && (
        <div className="alert alert-info py-2 mb-3">
          {t('accessTab.publicInfo')}
        </div>
      )}

      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="mb-3 position-relative">
        <label className="form-label fw-semibold">{t('accessTab.addUserLabel')}</label>
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder={t('accessTab.searchPlaceholder')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            autoComplete="off"
          />
          {searchLoading && (
            <span className="input-group-text">
              <span className="spinner-border spinner-border-sm" />
            </span>
          )}
        </div>
        {addError && <div className="text-danger small mt-1">{addError}</div>}

        {showDropdown && searchResults.length > 0 && (
          <ul
            className="list-group position-absolute w-100 shadow-sm"
            style={{ zIndex: 1000, top: '100%' }}
          >
            {searchResults.map(u => (
              <li
                key={u.id}
                className="list-group-item list-group-item-action"
                style={{ cursor: 'pointer' }}
                onMouseDown={() => handleAdd(u)}
              >
                <span className="fw-semibold">{u.displayName}</span>{' '}
                <span className="text-muted small">{u.email}</span>
              </li>
            ))}
          </ul>
        )}
        {showDropdown && searchResults.length === 0 && !searchLoading && (
          <div className="border rounded p-2 text-muted small bg-white" style={{ position: 'absolute', width: '100%', zIndex: 1000 }}>
            {t('accessTab.noUsersFound')}
          </div>
        )}
      </div>

      <div className="d-flex align-items-center gap-2 mb-2">
        <span className="text-muted small">{t('accessTab.usersWithAccess', { count: users.length })}</span>
        <div className="ms-auto d-flex gap-2 align-items-center">
          <span className="text-muted small">{t('accessTab.sortBy')}</span>
          <button
            className={`btn btn-sm ${sortBy === 'name' ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setSortBy('name')}
          >
            {t('accessTab.sortName')}
          </button>
          <button
            className={`btn btn-sm ${sortBy === 'email' ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setSortBy('email')}
          >
            {t('accessTab.sortEmail')}
          </button>
          {selected.size > 0 && (
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleRemoveSelected}
              disabled={removing}
            >
              {removing ? t('accessTab.removing') : t('accessTab.removeSelected', { count: selected.size })}
            </button>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <p className="text-muted">{t('accessTab.noUsers')}</p>
      ) : (
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selected.size === users.length && users.length > 0}
                  onChange={toggleAll}
                />
              </th>
              <th>{t('accessTab.colName')}</th>
              <th>{t('accessTab.colEmail')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(u => (
              <tr key={u.id}>
                <td>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selected.has(u.id)}
                    onChange={() => toggleSelect(u.id)}
                  />
                </td>
                <td>{u.displayName}</td>
                <td className="text-muted small">{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

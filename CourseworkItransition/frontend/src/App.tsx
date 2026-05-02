import 'bootstrap/dist/css/bootstrap.min.css'
import { useEffect, useRef, useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { TagCloud } from 'react-tagcloud'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import InventoriesPage from './pages/InventoriesPage'
import InventoryDetailPage from './pages/InventoryDetailPage'
import ItemDetailPage from './pages/ItemDetailPage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import { tagsApi } from './api/tagsApi'
import { inventoriesApi } from './api/inventoriesApi'
import type { InventoryListItem, TagCloudItem, TopInventory } from './types/inventory'

function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQ(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (val.trim().length >= 2) {
        navigate(`/search?q=${encodeURIComponent(val.trim())}`)
      }
    }, 300)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <Link className="navbar-brand" to="/">
        Inventories
      </Link>
      <button
        className="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span className="navbar-toggler-icon" />
      </button>
      <div className="collapse navbar-collapse" id="navbarNav">
        <ul className="navbar-nav me-auto">
          <li className="nav-item">
            <Link className="nav-link" to="/inventories">
              Browse
            </Link>
          </li>
        </ul>
        <form className="d-flex me-2" onSubmit={handleSearchSubmit}>
          <input
            className="form-control form-control-sm"
            type="search"
            placeholder="Search inventories &amp; items..."
            style={{ width: 260 }}
            value={q}
            onChange={handleSearchChange}
          />
        </form>
        <div className="d-flex align-items-center gap-2">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link className="btn btn-outline-warning btn-sm" to="/admin">
                  Admin
                </Link>
              )}
              <Link className="btn btn-outline-light btn-sm" to="/profile">
                {user?.displayName}
              </Link>
              <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-light btn-sm" to="/login">
                Sign in
              </Link>
              <Link className="btn btn-primary btn-sm" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

function HomePage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
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
      <h1>Inventory Management</h1>
      <p className="text-muted lead mb-4">
        Create inventories, define custom fields, and let others fill them with items.
      </p>
      <Link className="btn btn-primary me-2" to="/inventories">
        Browse Inventories
      </Link>
      {!isAuthenticated && (
        <Link className="btn btn-outline-primary" to="/register">
          Get started
        </Link>
      )}

      <div className="row mt-5 g-4">
        <div className="col-lg-7">
          <h5 className="text-muted mb-3">Latest inventories</h5>
          {latest.length === 0 ? (
            <p className="text-muted small">No public inventories yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Owner</th>
                    <th>Date</th>
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
          <h5 className="text-muted mb-3">Top 5 by items</h5>
          {top.length === 0 ? (
            <p className="text-muted small">No data yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Owner</th>
                    <th className="text-end">Items</th>
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
          <h5 className="text-muted mb-3">Popular tags</h5>
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

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/inventories" element={<InventoriesPage />} />
        <Route path="/inventories/:id" element={<InventoryDetailPage />} />
        <Route path="/items/:id" element={<ItemDetailPage />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </>
  )
}

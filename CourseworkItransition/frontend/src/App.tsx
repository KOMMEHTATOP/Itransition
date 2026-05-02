import 'bootstrap/dist/css/bootstrap.min.css'
import { useEffect, useState } from 'react'
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
import type { TagCloudItem } from './types/inventory'

function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()

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

  useEffect(() => {
    tagsApi.cloud(60).then(res => setTagCloud(res.data)).catch(() => {})
  }, [])

  return (
    <div className="container mt-5">
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

      {tagCloud.length > 0 && (
        <div className="mt-5">
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

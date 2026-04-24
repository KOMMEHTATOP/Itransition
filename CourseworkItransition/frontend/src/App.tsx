import 'bootstrap/dist/css/bootstrap.min.css'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import InventoriesPage from './pages/InventoriesPage'
import InventoryDetailPage from './pages/InventoryDetailPage'
import ProfilePage from './pages/ProfilePage'

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
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

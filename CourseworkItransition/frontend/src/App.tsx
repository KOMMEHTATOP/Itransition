import 'bootstrap/dist/css/bootstrap.min.css'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
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
      <div className="ms-auto d-flex align-items-center gap-2">
        {isAuthenticated ? (
          <>
            <span className="text-light small">{user?.displayName}</span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Sign out
            </button>
          </>
        ) : (
          <Link className="btn btn-outline-light btn-sm" to="/login">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}

function HomePage() {
  const { isAuthenticated, user } = useAuth()
  return (
    <div className="container mt-5">
      <h1>Inventory Management</h1>
      {isAuthenticated ? (
        <p className="text-muted">Welcome, {user?.displayName}!</p>
      ) : (
        <p className="text-muted">
          <Link to="/login">Sign in</Link> to create and manage inventories.
        </p>
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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div className="container mt-5">
                <h2>Dashboard</h2>
                <p>Protected content here.</p>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  )
}

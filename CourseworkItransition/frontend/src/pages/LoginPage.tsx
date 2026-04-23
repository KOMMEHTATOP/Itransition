import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'
import type { AuthUser } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const urlError = new URLSearchParams(location.search).get('error')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
        email,
        password,
      })
      login(res.data.token, res.data.user)
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Login failed'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const oauthError: Record<string, string> = {
    oauth_failed: 'OAuth authentication failed. Please try again.',
    no_email: 'Could not retrieve email from OAuth provider.',
    create_failed: 'Failed to create account. Please try again.',
    blocked: 'Your account has been blocked.',
  }

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <h4 className="card-title mb-4 text-center">Sign in</h4>

          {(urlError || error) && (
            <div className="alert alert-danger py-2">
              {urlError ? (oauthError[urlError] ?? 'Authentication error') : error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <hr />

          <div className="d-grid gap-2">
            <a href="/api/auth/google" className="btn btn-outline-danger">
              Continue with Google
            </a>
            <a href="/api/auth/facebook" className="btn btn-outline-primary">
              Continue with Facebook
            </a>
          </div>

          <p className="text-center mt-3 mb-0 small">
            No account?{' '}
            <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

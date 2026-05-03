import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'
import type { AuthUser } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
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
          ?.message ?? t('auth.loginFailed')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const oauthError: Record<string, string> = {
    oauth_failed: t('auth.oauthFailed'),
    no_email: t('auth.noEmail'),
    create_failed: t('auth.createFailed'),
    blocked: t('auth.blocked'),
  }

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="card shadow-sm" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body p-4">
          <h4 className="card-title mb-4 text-center">{t('auth.signIn')}</h4>

          {(urlError || error) && (
            <div className="alert alert-danger py-2">
              {urlError ? (oauthError[urlError] ?? t('auth.authError')) : error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">{t('auth.emailLabel')}</label>
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
              <label className="form-label">{t('auth.passwordLabel')}</label>
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
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          <hr />

          <div className="d-grid gap-2">
            <a href="https://api.basharov.org/api/auth/google" className="btn btn-outline-danger">
              {t('auth.continueWithGoogle')}
            </a>
            <a href="https://api.basharov.org/api/auth/github" className="btn btn-outline-secondary">
              {t('auth.continueWithGithub')}
            </a>
          </div>

          <p className="text-center mt-3 mb-0 small">
            {t('auth.noAccount')}{' '}
            <Link to="/register">{t('nav.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

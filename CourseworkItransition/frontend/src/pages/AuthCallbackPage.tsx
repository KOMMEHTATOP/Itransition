import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../api/axios'
import type { AuthUser } from '../contexts/AuthContext'

export default function AuthCallbackPage() {
  const [params] = useSearchParams()
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      navigate('/login?error=oauth_failed', { replace: true })
      return
    }

    // Fetch user profile with the new token
    localStorage.setItem('token', token)
    api
      .get<AuthUser>('/auth/me')
      .then((res) => {
        login(token, res.data)
        navigate('/', { replace: true })
      })
      .catch(() => {
        localStorage.removeItem('token')
        navigate('/login?error=oauth_failed', { replace: true })
      })
  }, [])

  return (
    <div className="container d-flex justify-content-center mt-5">
      <div className="text-center">
        <div className="spinner-border text-primary" role="status" />
        <p className="mt-3 text-muted">Completing sign in…</p>
      </div>
    </div>
  )
}

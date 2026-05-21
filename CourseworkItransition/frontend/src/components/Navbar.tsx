import { useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { DEBOUNCE_MS } from '../constants'

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { theme, toggleTheme } = useTheme()
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
    }, DEBOUNCE_MS)
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

  const switchLang = () => {
    const next = i18n.language === 'en' ? 'ru' : 'en'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  return (
    <nav className={`navbar navbar-expand-lg px-3 ${theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-light border-bottom'}`}>
      <Link className="navbar-brand" to="/">
        {t('nav.brand')}
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
            <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/inventories">
              {t('nav.browse')}
            </NavLink>
          </li>
        </ul>
        <form className="d-flex me-2" onSubmit={handleSearchSubmit}>
          <input
            className="form-control form-control-sm"
            type="search"
            placeholder={t('nav.searchPlaceholder')}
            style={{ width: 'clamp(140px, 20vw, 260px)' }}
            value={q}
            onChange={handleSearchChange}
          />
        </form>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={toggleTheme}
            title={theme === 'light' ? t('nav.switchToDark') : t('nav.switchToLight')}
            aria-label={theme === 'light' ? t('nav.switchToDark') : t('nav.switchToLight')}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={switchLang}
            title={i18n.language === 'en' ? 'Switch to Russian' : 'Switch to English'}
          >
            {i18n.language === 'en' ? 'RU' : 'EN'}
          </button>
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link className="btn btn-outline-warning btn-sm" to="/admin">
                  {t('nav.admin')}
                </Link>
              )}
              <Link className="btn btn-outline-secondary btn-sm" to="/profile">
                {user?.displayName}
              </Link>
              <button className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-secondary btn-sm" to="/login">
                {t('nav.signIn')}
              </Link>
              <Link className="btn btn-primary btn-sm" to="/register">
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

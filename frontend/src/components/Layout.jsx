import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/global.css'

const NAV = [
  { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { path: '/chat',      icon: '💬', label: 'Chat' },
  { path: '/progress',  icon: '📊', label: 'Progress' },
  { path: '/profile',   icon: '👤', label: 'Profile' },
  { path: '/settings',  icon: '⚙️', label: 'Settings' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const go = (path) => { navigate(path); setSidebarOpen(false) }
  const active = (path) => location.pathname === path

  const avatarSrc = user?.avatar ? `/uploads/${user.avatar}` : null
  const initials  = user?.name?.charAt(0).toUpperCase() || '?'

  return (
    <div className="app-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🧠</div>
          <span className="sidebar-logo-text">CalmBot</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button
              key={n.path}
              className={`nav-item ${active(n.path) ? 'active' : ''}`}
              onClick={() => go(n.path)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => go('/profile')}>
            <div className="sidebar-avatar">
              {avatarSrc ? <img src={avatarSrc} alt="avatar" /> : initials}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-full btn-sm"
            style={{ marginTop: 8 }}
            onClick={async () => { await logout(); navigate('/auth') }}
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          <button
            style={{ background:'none', border:'none', fontSize:24, color:'var(--text1)' }}
            onClick={() => setSidebarOpen(true)}
          >☰</button>
          <span style={{ fontFamily:'var(--font-disp)', fontWeight:700, fontSize:18, color:'var(--text1)' }}>CalmBot</span>
          <div className="sidebar-avatar" style={{ cursor:'pointer' }} onClick={() => go('/profile')}>
            {avatarSrc ? <img src={avatarSrc} alt="avatar" /> : initials}
          </div>
        </div>

        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map(n => (
            <button
              key={n.path}
              className={`mobile-nav-item ${active(n.path) ? 'active' : ''}`}
              onClick={() => go(n.path)}
            >
              <span className="mn-icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

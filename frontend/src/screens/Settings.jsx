import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/settings.css'

export default function Settings() {
  const { user, theme, toggleTheme, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [delConfirm, setDelConfirm] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/auth')
  }

  return (
    <div className="page settings-page">
      <div className="page-header animate-up">
        <h1 className="page-title">Settings ⚙️</h1>
        <p className="page-subtitle">Customize your CalmBot experience</p>
      </div>

      {/* Appearance */}
      <div className="card animate-up" style={{ animationDelay:'0.05s' }}>
        <h3 className="settings-section-title">Appearance</h3>
        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">{theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}</span>
            <span className="settings-row-sub">Switch between dark and light theme</span>
          </div>
          <button
            className={`toggle-btn ${theme === 'light' ? 'toggled' : ''}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <span className="toggle-knob" />
          </button>
        </div>

        {/* Theme preview cards */}
        <div className="theme-preview-row">
          <div
            className={`theme-preview dark-prev ${theme==='dark'?'active':''}`}
            onClick={() => theme!=='dark' && toggleTheme()}
          >
            <div className="tp-bar"/><div className="tp-content"/>
            <span>Dark</span>
          </div>
          <div
            className={`theme-preview light-prev ${theme==='light'?'active':''}`}
            onClick={() => theme!=='light' && toggleTheme()}
          >
            <div className="tp-bar"/><div className="tp-content"/>
            <span>Light</span>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="card animate-up" style={{ animationDelay:'0.1s' }}>
        <h3 className="settings-section-title">Account</h3>
        <div className="settings-list">
          <button className="settings-row settings-btn" onClick={() => navigate('/profile')}>
            <div className="settings-row-info">
              <span className="settings-row-label">👤 Edit Profile</span>
              <span className="settings-row-sub">Update your name, photo and bio</span>
            </div>
            <span className="settings-row-arrow">›</span>
          </button>
          <button className="settings-row settings-btn" onClick={() => navigate('/progress')}>
            <div className="settings-row-info">
              <span className="settings-row-label">📊 View Progress</span>
              <span className="settings-row-sub">See your mood history and insights</span>
            </div>
            <span className="settings-row-arrow">›</span>
          </button>
          <button className="settings-row settings-btn" onClick={() => navigate('/onboarding')}>
            <div className="settings-row-info">
              <span className="settings-row-label">🧭 Change Focus Area</span>
              <span className="settings-row-sub">Currently: <em style={{ textTransform:'capitalize' }}>{user?.topic?.replace('_',' ') || 'Not set'}</em></span>
            </div>
            <span className="settings-row-arrow">›</span>
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card animate-up" style={{ animationDelay:'0.15s' }}>
        <h3 className="settings-section-title">About</h3>
        <div className="settings-list">
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">🧠 CalmBot</span>
              <span className="settings-row-sub">Version 1.0 — Student Mental Health Companion</span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">🤖 AI Model</span>
              <span className="settings-row-sub">LLaMA 3.3 70B via Groq</span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">⚠️ Disclaimer</span>
              <span className="settings-row-sub">CalmBot is not a substitute for professional mental health care. In a crisis, call 112.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Crisis resources */}
      <div className="card crisis-card animate-up" style={{ animationDelay:'0.2s' }}>
        <h3 className="settings-section-title" style={{ color:'var(--red)' }}>🆘 Crisis Resources</h3>
        <div className="crisis-resources">
          <div className="crisis-res-row">
            <span>📞 NSPI Hotline</span>
            <strong>+234 806 210 6493</strong>
          </div>
          <div className="crisis-res-row">
            <span>🌐 Website</span>
            <strong>nigeriasuicideprevention.org</strong>
          </div>
          <div className="crisis-res-row">
            <span>🚨 Emergency</span>
            <strong>112</strong>
          </div>
        </div>
      </div>

      {/* Sign out */}
      <div className="card animate-up" style={{ animationDelay:'0.25s' }}>
        <h3 className="settings-section-title">Session</h3>
        <button className="btn btn-danger btn-full" onClick={handleLogout}>
          🚪 Sign Out
        </button>
      </div>
    </div>
  )
}

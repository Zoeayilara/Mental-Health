import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/dashboard.css'

const MOODS = [
  { id: 'happy',   emoji: '😊', label: 'Happy',   color: '#4ade80' },
  { id: 'calm',    emoji: '😌', label: 'Calm',    color: '#60a5fa' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#fbbf24' },
  { id: 'tired',   emoji: '😴', label: 'Tired',   color: '#a78bfa' },
  { id: 'sad',     emoji: '😢', label: 'Sad',     color: '#818cf8' },
  { id: 'angry',   emoji: '😠', label: 'Angry',   color: '#f87171' },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function WaveChart({ data }) {
  if (!data.length) return null
  const max = 100
  const w = 480, h = 120
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (d.score / max) * h
    return `${x},${y}`
  })
  const path = `M ${pts.join(' L ')}`
  const fill = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`

  return (
    <div className="wave-chart">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={fill} fill="url(#wg)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * w
          const y = h - (d.score / max) * h
          return d.score > 0
            ? <circle key={i} cx={x} cy={y} r="4" fill="var(--accent)" stroke="var(--bg2)" strokeWidth="2" />
            : null
        })}
      </svg>
      <div className="wave-days">
        {data.map((d, i) => <span key={i}>{d.day}</span>)}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [weekData, setWeekData]     = useState([])
  const [todayMood, setTodayMood]   = useState(null)
  const [stats, setStats]           = useState(null)
  const [moodNote, setMoodNote]     = useState('')
  const [logging, setLogging]       = useState(false)
  const [logSuccess, setLogSuccess] = useState(false)
  const avatarSrc = user?.avatar ? `/uploads/${user.avatar}` : null

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    const [w, t, s] = await Promise.all([
      fetch('/api/mood/week', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/mood/today', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/mood/stats', { credentials: 'include' }).then(r => r.json()),
    ])
    setWeekData(Array.isArray(w) ? w : [])
    setTodayMood(t.mood || null)
    setStats(s)
  }

  async function logMood(moodId) {
    if (logging) return
    setLogging(true)
    setTodayMood(moodId)
    try {
      await fetch('/api/mood/log', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood: moodId, note: moodNote })
      })
      setLogSuccess(true)
      setTimeout(() => setLogSuccess(false), 2500)
      fetchAll()
    } finally {
      setLogging(false)
    }
  }

  const avgScore   = stats?.average_score || 0
  const streak     = stats?.streak || 0
  const totalEntries = stats?.total_entries || 0
  const topMood    = stats?.breakdown?.[0]?.mood || '—'
  const circumference = 2 * Math.PI * 40
  const ringOffset = circumference - (avgScore / 100) * circumference

  return (
    <div className="page dash-page">
      {/* Header */}
      <div className="dash-header animate-up">
        <div>
          <p className="dash-greet">{greeting()},</p>
          <h1 className="dash-name">{user?.name} 👋</h1>
        </div>
        <div className="dash-avatar-wrap" onClick={() => navigate('/profile')}>
          <div className="dash-avatar">
            {avatarSrc ? <img src={avatarSrc} alt="avatar" /> : user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="dash-stats animate-up" style={{ animationDelay: '0.05s' }}>
        <div className="stat-card">
          <div className="stat-ring">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="var(--border2)" strokeWidth="8"/>
              <circle cx="48" cy="48" r="40" fill="none" stroke="var(--accent)" strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={ringOffset}
                strokeLinecap="round" transform="rotate(-90 48 48)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}/>
            </svg>
            <span className="stat-ring-pct">{avgScore}%</span>
          </div>
          <div className="stat-info">
            <p className="stat-label">Wellness Score</p>
            <p className="stat-val">{avgScore >= 70 ? 'Great' : avgScore >= 50 ? 'Okay' : 'Needs care'}</p>
          </div>
        </div>
        <div className="stat-mini-grid">
          <div className="stat-mini">
            <span className="stat-mini-val">{streak}</span>
            <span className="stat-mini-label">Day streak 🔥</span>
          </div>
          <div className="stat-mini">
            <span className="stat-mini-val">{totalEntries}</span>
            <span className="stat-mini-label">Check-ins</span>
          </div>
          <div className="stat-mini" style={{ gridColumn: '1/-1' }}>
            <span className="stat-mini-val" style={{ fontSize: 22 }}>
              {MOODS.find(m => m.id === topMood)?.emoji || '—'}
            </span>
            <span className="stat-mini-label">Most felt: {topMood}</span>
          </div>
        </div>
      </div>

      {/* Mood check-in */}
      <div className="card dash-mood animate-up" style={{ animationDelay: '0.1s' }}>
        <div className="card-head">
          <h3 className="card-title">How are you feeling today?</h3>
          {todayMood && <span className="tag">Logged ✓</span>}
        </div>
        <div className="mood-row">
          {MOODS.map(m => (
            <button
              key={m.id}
              className={`mood-btn ${todayMood === m.id ? 'selected' : ''}`}
              onClick={() => logMood(m.id)}
              style={{ '--mc': m.color }}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span className="mood-lbl">{m.label}</span>
            </button>
          ))}
        </div>
        {logSuccess && (
          <div className="mood-success animate-up">✅ Mood logged! Keep checking in daily.</div>
        )}
      </div>

      {/* Week chart */}
      <div className="card animate-up" style={{ animationDelay: '0.15s' }}>
        <div className="card-head">
          <h3 className="card-title">Mood this week</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/progress')}>View all →</button>
        </div>
        {weekData.some(d => d.score > 0)
          ? <WaveChart data={weekData} />
          : <p className="empty-msg">Start logging moods to see your weekly chart 📊</p>
        }
      </div>

      {/* Quick actions */}
      <div className="dash-actions animate-up" style={{ animationDelay: '0.2s' }}>
        <h3 className="section-title">Quick actions</h3>
        <div className="action-grid">
          {[
            { icon: '💬', label: 'Talk to CalmBot', sub: 'AI-powered support', path: '/chat', color: '#7b76e8' },
            { icon: '📊', label: 'View Progress',   sub: 'Charts & insights',  path: '/progress', color: '#60a5fa' },
            { icon: '👤', label: 'My Profile',      sub: 'Edit your info',     path: '/profile', color: '#4ade80' },
            { icon: '⚙️', label: 'Settings',        sub: 'Theme & preferences', path: '/settings', color: '#fbbf24' },
          ].map((a, i) => (
            <button
              key={a.path}
              className="action-card"
              onClick={() => navigate(a.path)}
              style={{ '--ac': a.color, animationDelay: `${0.2 + i * 0.06}s` }}
            >
              <div className="action-icon">{a.icon}</div>
              <div>
                <p className="action-label">{a.label}</p>
                <p className="action-sub">{a.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat CTA */}
      <div className="dash-cta animate-up" style={{ animationDelay: '0.28s' }}>
        <div className="cta-inner">
          <div>
            <p className="cta-title">Need to talk? 💙</p>
            <p className="cta-sub">CalmBot is here for you, anytime.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/chat')}>Start Chat →</button>
        </div>
      </div>
    </div>
  )
}

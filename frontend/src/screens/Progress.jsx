import { useState, useEffect } from 'react'
import '../styles/progress.css'

const MOOD_META = {
  happy:   { emoji: '😊', color: '#4ade80', label: 'Happy' },
  calm:    { emoji: '😌', color: '#60a5fa', label: 'Calm' },
  anxious: { emoji: '😰', color: '#fbbf24', label: 'Anxious' },
  tired:   { emoji: '😴', color: '#a78bfa', label: 'Tired' },
  sad:     { emoji: '😢', color: '#818cf8', label: 'Sad' },
  angry:   { emoji: '😠', color: '#f87171', label: 'Angry' },
}

export default function Progress() {
  const [weekData, setWeekData] = useState([])
  const [history, setHistory]   = useState([])
  const [stats, setStats]       = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/mood/week',    { credentials:'include' }).then(r=>r.json()),
      fetch('/api/mood/history', { credentials:'include' }).then(r=>r.json()),
      fetch('/api/mood/stats',   { credentials:'include' }).then(r=>r.json()),
    ]).then(([w, h, s]) => {
      setWeekData(Array.isArray(w) ? w : [])
      setHistory(Array.isArray(h) ? h : [])
      setStats(s)
    })
  }, [])

  const breakdown = stats?.breakdown || []
  const maxCount  = Math.max(...breakdown.map(b => b.count), 1)

  return (
    <div className="page prog-page">
      <div className="page-header animate-up">
        <h1 className="page-title">Your Progress 📊</h1>
        <p className="page-subtitle">Track how you've been feeling over time</p>
      </div>

      {/* Summary cards */}
      <div className="prog-summary animate-up" style={{ animationDelay:'0.05s' }}>
        {[
          { label: 'Wellness Score', val: `${stats?.average_score || 0}%`, icon: '💚' },
          { label: 'Day Streak',     val: `${stats?.streak || 0} days`,    icon: '🔥' },
          { label: 'Total Check-ins',val: stats?.total_entries || 0,       icon: '📝' },
        ].map((s, i) => (
          <div key={i} className="prog-stat card">
            <span className="prog-stat-icon">{s.icon}</span>
            <span className="prog-stat-val">{s.val}</span>
            <span className="prog-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Week bar chart */}
      <div className="card animate-up" style={{ animationDelay:'0.1s' }}>
        <h3 className="card-title" style={{ marginBottom:20 }}>This Week</h3>
        <div className="bar-chart">
          {weekData.map((d, i) => (
            <div key={i} className="bar-col">
              <span className="bar-score">{d.score > 0 ? d.score : ''}</span>
              <div className="bar-wrap">
                <div
                  className="bar-fill"
                  style={{ height: `${d.score}%`, animationDelay: `${i*0.08}s` }}
                />
              </div>
              <span className="bar-day">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mood breakdown */}
      {breakdown.length > 0 && (
        <div className="card animate-up" style={{ animationDelay:'0.15s' }}>
          <h3 className="card-title" style={{ marginBottom:20 }}>Mood Breakdown</h3>
          <div className="breakdown-list">
            {breakdown.map((b, i) => {
              const meta = MOOD_META[b.mood] || { emoji:'🙂', color:'var(--accent)', label: b.mood }
              const pct  = Math.round((b.count / maxCount) * 100)
              return (
                <div key={i} className="breakdown-row">
                  <span className="bd-emoji">{meta.emoji}</span>
                  <span className="bd-label">{meta.label}</span>
                  <div className="bd-bar-wrap">
                    <div className="bd-bar-fill" style={{ width:`${pct}%`, background: meta.color }} />
                  </div>
                  <span className="bd-count">{b.count}x</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent history */}
      <div className="card animate-up" style={{ animationDelay:'0.2s' }}>
        <h3 className="card-title" style={{ marginBottom:16 }}>Recent Check-ins</h3>
        {history.length === 0
          ? <p style={{ color:'var(--text3)', fontSize:14 }}>No mood entries yet. Start logging from the dashboard! 😊</p>
          : (
            <div className="history-list">
              {history.slice(0,15).map((h, i) => {
                const meta = MOOD_META[h.mood] || { emoji:'🙂', color:'var(--accent)', label: h.mood }
                const date = new Date(h.created_at)
                return (
                  <div key={i} className="history-row">
                    <div className="history-emoji">{meta.emoji}</div>
                    <div className="history-info">
                      <span className="history-mood" style={{ color: meta.color }}>{meta.label}</span>
                      {h.note && <span className="history-note">"{h.note}"</span>}
                    </div>
                    <div className="history-meta">
                      <span className="history-score">{h.score}%</span>
                      <span className="history-date">{date.toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  )
}

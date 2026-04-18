import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/onboarding.css'

const TOPICS = [
  { id: 'stress',        icon: '🌪️', title: 'Managing stress & anxiety',     desc: 'Build tools to calm your mind and face pressure with ease' },
  { id: 'relationships', icon: '🤝', title: 'Understanding my relationships', desc: 'See your connections more clearly and understand your reactions' },
  { id: 'emotions',      icon: '💭', title: 'Expressing my emotions',         desc: 'Develop clarity, explore feelings, and gain perspective' },
  { id: 'change',        icon: '🌱', title: 'Handling change',                desc: "Notice what's shifting in your life and make sense of it" },
  { id: 'motivation',    icon: '🔥', title: 'Finding motivation',             desc: 'Rediscover your drive and reconnect with your purpose' },
  { id: 'sleep',         icon: '🌙', title: 'Sleep & rest',                   desc: 'Improve your sleep habits and wake up feeling restored' },
]

export default function Onboarding() {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(false)
  const { updateUser }          = useAuth()
  const navigate                = useNavigate()

  const handleContinue = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selected })
      })
      const data = await res.json()
      updateUser({ topic: selected })
      navigate('/dashboard')
    } catch {
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboard-page">
      <div className="onboard-bg">
        <div className="ob-blob ob-blob-1" />
        <div className="ob-blob ob-blob-2" />
      </div>

      <div className="onboard-content animate-up">
        <div className="onboard-header">
          <div className="ob-logo">🧠 <span>CalmBot</span></div>
          <h1 className="ob-title">What would you like to explore first?</h1>
          <p className="ob-sub">Pick one to start — you can always change this later</p>
        </div>

        <div className="ob-grid">
          {TOPICS.map((t, i) => (
            <button
              key={t.id}
              className={`ob-card ${selected === t.id ? 'selected' : ''}`}
              onClick={() => setSelected(t.id)}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <span className="ob-card-icon">{t.icon}</span>
              <div className="ob-card-text">
                <span className="ob-card-title">{t.title}</span>
                <span className="ob-card-desc">{t.desc}</span>
              </div>
              <div className="ob-card-check">{selected === t.id ? '✓' : ''}</div>
            </button>
          ))}
        </div>

        <button
          className={`btn btn-primary btn-lg ob-continue ${selected ? 'ready' : ''}`}
          onClick={handleContinue}
          disabled={!selected || loading}
        >
          {loading ? <span className="btn-spinner" /> : 'Continue →'}
        </button>
      </div>
    </div>
  )
}

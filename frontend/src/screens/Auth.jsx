import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

export default function Auth() {
  const [mode, setMode]     = useState('login')
  const [form, setForm]     = useState({ name:'', email:'', password:'', confirm:'' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup }   = useAuth()
  const navigate            = useNavigate()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const submit = async () => {
    setError('')
    if (mode === 'signup') {
      if (!form.name.trim()) return setError('Please enter your name')
      if (!form.email.trim()) return setError('Please enter your email')
      if (form.password.length < 6) return setError('Password must be at least 6 characters')
      if (form.password !== form.confirm) return setError('Passwords do not match')
    } else {
      if (!form.email.trim() || !form.password) return setError('Please fill in all fields')
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        const user = await signup(form.name, form.email, form.password)
        navigate('/onboarding')
      } else {
        const user = await login(form.email, form.password)
        navigate(user.topic ? '/dashboard' : '/onboarding')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-brand">
            <div className="auth-brand-icon">🧠</div>
            <span className="auth-brand-name">CalmBot</span>
          </div>
          <h1 className="auth-hero">Your mental<br/>health<br/><em>companion</em></h1>
          <p className="auth-hero-sub">A safe, judgment-free space to talk, track your mood, and grow — built for students.</p>
          <div className="auth-features">
            {['AI-powered emotional support', 'Mood tracking & insights', 'Private & secure'].map(f => (
              <div key={f} className="auth-feature">
                <span className="auth-feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="auth-blobs">
          <div className="auth-blob auth-blob-1" />
          <div className="auth-blob auth-blob-2" />
          <div className="auth-blob auth-blob-3" />
        </div>
      </div>

      {/* Right panel - form */}
      <div className="auth-right">
        <div className="auth-form-wrap animate-scale">
          <div className="auth-tabs">
            <button className={`auth-tab ${mode==='login'?'active':''}`} onClick={() => { setMode('login'); setError('') }}>Log In</button>
            <button className={`auth-tab ${mode==='signup'?'active':''}`} onClick={() => { setMode('signup'); setError('') }}>Sign Up</button>
          </div>

          <h2 className="auth-form-title">
            {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
          </h2>
          <p className="auth-form-sub">
            {mode === 'login' ? 'Sign in to continue your journey' : 'Join CalmBot and start feeling better'}
          </p>

          <div className="auth-fields">
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="input-field" type="text" placeholder="Your name" value={form.name} onChange={e => set('name', e.target.value)} onKeyDown={e => e.key==='Enter' && submit()} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="input-field" type="email" placeholder="you@email.com" value={form.email} onChange={e => set('email', e.target.value)} onKeyDown={e => e.key==='Enter' && submit()} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input-field" type="password" placeholder={mode==='signup'?'At least 6 characters':'Your password'} value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key==='Enter' && submit()} />
            </div>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input className="input-field" type="password" placeholder="Repeat your password" value={form.confirm} onChange={e => set('confirm', e.target.value)} onKeyDown={e => e.key==='Enter' && submit()} />
              </div>
            )}
          </div>

          {error && <div className="auth-error">⚠️ {error}</div>}

          <button className="btn btn-primary btn-full btn-lg" onClick={submit} disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <span className="btn-spinner" /> : (mode === 'login' ? 'Sign In →' : 'Create Account →')}
          </button>

          <p className="auth-switch">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span onClick={() => { setMode(mode==='login'?'signup':'login'); setError('') }}>
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

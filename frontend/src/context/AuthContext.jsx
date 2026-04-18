import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme]     = useState('dark')

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && data.id) {
          setUser(data)
          applyTheme(data.theme || 'dark')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function applyTheme(t) {
    setTheme(t)
    document.documentElement.setAttribute('data-theme', t)
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    if (user) {
      fetch('/api/user/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: next })
      })
    }
  }

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setUser(data.user)
    applyTheme(data.user.theme || 'dark')
    return data.user
  }

  async function signup(name, email, password) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    setUser(data.user)
    applyTheme('dark')
    return data.user
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }

  function updateUser(updates) {
    setUser(u => ({ ...u, ...updates }))
    if (updates.theme) applyTheme(updates.theme)
  }

  return (
    <AuthContext.Provider value={{ user, loading, theme, login, signup, logout, updateUser, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

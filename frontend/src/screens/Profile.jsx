import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import '../styles/profile.css'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm]      = useState({ name: user?.name||'', bio: user?.bio||'', age: user?.age||'' })
  const [pwForm, setPwForm]  = useState({ current:'', new:'', confirm:'' })
  const [saving, setSaving]  = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [msg, setMsg]        = useState('')
  const [pwMsg, setPwMsg]    = useState('')
  const [uploading, setUploading] = useState(false)
  const fileRef              = useRef(null)
  const avatarSrc            = user?.avatar ? `/uploads/${user.avatar}` : null

  const set  = (k,v) => setForm(f => ({...f,[k]:v}))
  const setPw = (k,v) => setPwForm(f=>({...f,[k]:v}))

  async function saveProfile() {
    setSaving(true); setMsg('')
    try {
      const res  = await fetch('/api/user/profile', {
        method:'PUT', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name:form.name, bio:form.bio, age:form.age ? parseInt(form.age) : null })
      })
      const data = await res.json()
      if (!res.ok) { setMsg('❌ ' + data.error); return }
      updateUser(data)
      setMsg('✅ Profile updated!')
    } catch { setMsg('❌ Something went wrong') }
    finally { setSaving(false) }
  }

  async function savePassword() {
    if (!pwForm.current || !pwForm.new) return setPwMsg('❌ All fields are required')
    if (pwForm.new.length < 6) return setPwMsg('❌ Password must be at least 6 characters')
    if (pwForm.new !== pwForm.confirm) return setPwMsg('❌ Passwords do not match')
    setPwSaving(true); setPwMsg('')
    try {
      const res  = await fetch('/api/user/password', {
        method:'PUT', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ current:pwForm.current, new:pwForm.new })
      })
      const data = await res.json()
      if (!res.ok) { setPwMsg('❌ ' + data.error); return }
      setPwMsg('✅ Password changed!')
      setPwForm({ current:'', new:'', confirm:'' })
    } catch { setPwMsg('❌ Something went wrong') }
    finally { setPwSaving(false) }
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const res  = await fetch('/api/user/avatar', { method:'POST', credentials:'include', body:fd })
      const data = await res.json()
      if (res.ok) updateUser({ avatar: data.avatar })
    } catch {}
    finally { setUploading(false) }
  }

  return (
    <div className="page profile-page">
      <div className="page-header animate-up">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information</p>
      </div>

      {/* Avatar */}
      <div className="card prof-avatar-card animate-up" style={{ animationDelay:'0.05s' }}>
        <div className="prof-av-wrap">
          <div className="prof-avatar" onClick={() => fileRef.current?.click()}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" />
              : <span>{user?.name?.charAt(0)?.toUpperCase()}</span>
            }
            <div className="prof-av-overlay">{uploading ? '⏳' : '📷'}</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadAvatar} style={{ display:'none' }} />
        </div>
        <div className="prof-av-info">
          <p className="prof-av-name">{user?.name}</p>
          <p className="prof-av-email">{user?.email}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
            {uploading ? 'Uploading…' : '📷 Change photo'}
          </button>
        </div>
      </div>

      {/* Edit info */}
      <div className="card animate-up" style={{ animationDelay:'0.1s' }}>
        <h3 className="card-title" style={{ marginBottom:20 }}>Personal Information</h3>
        <div className="prof-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="input-field" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Your name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="input-field" value={user?.email||''} disabled style={{ opacity:0.5, cursor:'not-allowed' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Age</label>
            <input className="input-field" type="number" value={form.age} onChange={e=>set('age',e.target.value)} placeholder="Your age" min={10} max={100} />
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="input-field" value={form.bio} onChange={e=>set('bio',e.target.value)} placeholder="Tell us a bit about yourself…" rows={3} style={{ resize:'vertical' }} />
          </div>
        </div>
        {msg && <p className={`form-feedback ${msg.startsWith('✅')?'success':'error'}`}>{msg}</p>}
        <button className="btn btn-primary" onClick={saveProfile} disabled={saving} style={{ marginTop:16 }}>
          {saving ? <span className="btn-spinner"/> : 'Save Changes'}
        </button>
      </div>

      {/* Change password */}
      <div className="card animate-up" style={{ animationDelay:'0.15s' }}>
        <h3 className="card-title" style={{ marginBottom:20 }}>Change Password</h3>
        <div className="prof-form">
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="input-field" type="password" value={pwForm.current} onChange={e=>setPw('current',e.target.value)} placeholder="Your current password" />
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="input-field" type="password" value={pwForm.new} onChange={e=>setPw('new',e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="input-field" type="password" value={pwForm.confirm} onChange={e=>setPw('confirm',e.target.value)} placeholder="Repeat new password" />
          </div>
        </div>
        {pwMsg && <p className={`form-feedback ${pwMsg.startsWith('✅')?'success':'error'}`}>{pwMsg}</p>}
        <button className="btn btn-primary" onClick={savePassword} disabled={pwSaving} style={{ marginTop:16 }}>
          {pwSaving ? <span className="btn-spinner"/> : 'Update Password'}
        </button>
      </div>

      {/* Account info */}
      <div className="card animate-up" style={{ animationDelay:'0.2s' }}>
        <h3 className="card-title" style={{ marginBottom:16 }}>Account Details</h3>
        <div className="account-info">
          <div className="account-row"><span>Member since</span><span>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-GB',{month:'long',year:'numeric'}) : '—'}</span></div>
          <div className="account-row"><span>Focus area</span><span style={{ textTransform:'capitalize' }}>{user?.topic?.replace('_',' ') || 'Not set'}</span></div>
        </div>
      </div>
    </div>
  )
}

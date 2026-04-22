import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { fetchProfiles, adminCreateUser } from '../lib/db'
import { C, PLX, MON } from '../lib/tokens'

export default function Admin() {
  const { isAdmin, signOut, profile } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ email: '', password: '', display_name: '', role: 'PM' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => { loadUsers() }, [])

  async function loadUsers() {
    const data = await fetchProfiles()
    setUsers(data)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setMsg(''); setErr('')
    const { error } = await adminCreateUser(form.email, form.password, form.display_name, form.role)
    if (error) { setErr(typeof error === 'string' ? error : error.message); return }
    setMsg(`User ${form.email} created`)
    setForm({ email: '', password: '', display_name: '', role: 'PM' })
    loadUsers()
  }

  const inp = {
    height: 40, padding: '0 16px', border: 'none',
    borderBottom: `1px solid ${C.borderStr}`, background: C.layer01,
    fontSize: 14, fontFamily: PLX, color: C.textPri,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily: PLX, minHeight: '100vh', background: C.layer01 }}>
      {/* Header */}
      <div style={{ height: 48, background: C.g100bg, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: C.g100text }}>Games Delivery</span>
        <span style={{ fontSize: 14, color: C.g100textSc, marginLeft: 8 }}>/ Admin</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: C.g100textSc, fontSize: 14, cursor: 'pointer', fontFamily: PLX }}>← Back to Tracker</button>
        <button onClick={signOut} style={{ background: 'none', border: 'none', color: C.g100textSc, fontSize: 14, cursor: 'pointer', fontFamily: PLX }}>Sign out</button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        {!isAdmin && (
          <div style={{ padding: 24, background: '#fff1f1', borderLeft: `3px solid ${C.danger}`, marginBottom: 24 }}>
            <p style={{ fontSize: 14, color: '#750e13' }}>You need admin privileges to manage users. Contact your administrator.</p>
          </div>
        )}

        {/* Create user form */}
        <div style={{ background: C.bgUi, border: `1px solid ${C.borderSub}`, marginBottom: 32 }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.borderSub}` }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 400, color: C.textPri }}>Create user</h2>
          </div>
          <form onSubmit={handleCreate} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: C.textSec, letterSpacing: '0.32px', display: 'block', marginBottom: 4 }}>Display name</label>
                <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="e.g. Jialing" required style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textSec, letterSpacing: '0.32px', display: 'block', marginBottom: 4 }}>Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inp, cursor: 'pointer' }}>
                  <option value="PM">PM</option>
                  <option value="Client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: C.textSec, letterSpacing: '0.32px', display: 'block', marginBottom: 4 }}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: C.textSec, letterSpacing: '0.32px', display: 'block', marginBottom: 4 }}>Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} style={inp} />
              </div>
            </div>

            {msg && <div style={{ padding: '12px 16px', background: '#defbe6', borderLeft: '3px solid #198038', fontSize: 14, color: '#0e6027' }}>{msg}</div>}
            {err && <div style={{ padding: '12px 16px', background: '#fff1f1', borderLeft: `3px solid ${C.danger}`, fontSize: 14, color: '#750e13' }}>{err}</div>}

            <button type="submit" disabled={!isAdmin} style={{
              height: 40, border: 'none', padding: '0 24px',
              background: isAdmin ? C.interactive : '#c6c6c6',
              color: C.textOnCol, fontSize: 14, fontFamily: PLX,
              cursor: isAdmin ? 'pointer' : 'not-allowed', alignSelf: 'flex-start',
            }}>Create user</button>
          </form>
        </div>

        {/* User list */}
        <div style={{ background: C.bgUi, border: `1px solid ${C.borderSub}` }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.borderSub}` }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 400, color: C.textPri }}>Users ({users.length})</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, fontFamily: PLX }}>
            <thead>
              <tr style={{ background: C.layer01 }}>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontWeight: 600, borderBottom: `1px solid ${C.borderSub}` }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontWeight: 600, borderBottom: `1px solid ${C.borderSub}` }}>Role</th>
                <th style={{ textAlign: 'left', padding: '12px 24px', fontWeight: 600, borderBottom: `1px solid ${C.borderSub}` }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.borderSub}` }}>
                  <td style={{ padding: '12px 24px' }}>{u.display_name}</td>
                  <td style={{ padding: '12px 24px' }}>
                    <span style={{
                      display: 'inline-flex', height: 24, padding: '0 8px', borderRadius: 24,
                      background: u.role === 'admin' ? '#e8daff' : '#e0e0e0',
                      color: u.role === 'admin' ? '#6929c4' : '#525252',
                      fontSize: 12, alignItems: 'center',
                    }}>{u.role}</span>
                  </td>
                  <td style={{ padding: '12px 24px', color: C.textSec, fontFamily: MON, fontSize: 12 }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: C.textPlc }}>No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

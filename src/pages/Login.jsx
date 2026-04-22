import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { C, PLX, MON } from '../lib/tokens'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) setError(err.message)
    setLoading(false)
  }

  const inputStyle = {
    height: 40, padding: '0 16px', border: 'none',
    borderBottom: `1px solid ${C.borderStr}`, background: C.layer01,
    fontSize: 14, fontFamily: PLX, color: C.textPri,
    outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily: PLX, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.layer01 }}>
      <div style={{ background: C.bgUi, width: 400, border: `1px solid ${C.borderSub}` }}>
        {/* Dark header */}
        <div style={{ background: C.g100bg, padding: '32px 32px 24px' }}>
          <div style={{
            width: 40, height: 40, background: C.interactive,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 18, fontWeight: 600, fontFamily: PLX, marginBottom: 16,
          }}>G</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 300, color: C.g100text, fontFamily: PLX, lineHeight: '36px' }}>
            Games Delivery<br />Tracker
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: C.g100textPl }}>
            Sign in with your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: C.textSec, letterSpacing: '0.32px' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" required autoFocus
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, color: C.textSec, letterSpacing: '0.32px' }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password" required
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', background: '#fff1f1',
              borderLeft: `3px solid ${C.danger}`,
              fontSize: 14, color: '#750e13',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading || !email || !password}
            style={{
              height: 48, border: 'none',
              background: (loading || !email || !password) ? '#c6c6c6' : C.interactive,
              color: C.textOnCol, fontSize: 14, fontWeight: 400,
              fontFamily: PLX, cursor: loading ? 'wait' : 'pointer',
              letterSpacing: '0.16px',
            }}
          >
            {loading ? 'Signing in…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

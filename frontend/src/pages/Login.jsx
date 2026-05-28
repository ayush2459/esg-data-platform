import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Leaf, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try { await login(username, password); navigate('/') }
    catch { setError('Invalid credentials') }
    finally { setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)',
      backgroundImage: `
        radial-gradient(ellipse at 15% 50%, rgba(79,142,247,0.08) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 30%, rgba(139,92,246,0.06) 0%, transparent 55%),
        radial-gradient(ellipse at 50% 100%, rgba(16,185,129,0.04) 0%, transparent 50%)
      `,
    }}>
      {/* Grid background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div style={{ width: 400, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 8px 24px rgba(79,142,247,0.3)',
          }}>
            <Leaf size={22} color="#fff" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>Breathe ESG</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>Sign in to your analyst dashboard</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          borderRadius: 16, padding: 28,
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 7 }}>Username</label>
              <input
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="analyst" autoFocus
                style={{
                  width: '100%', padding: '11px 14px',
                  background: 'var(--bg3)', border: '1px solid var(--border2)',
                  borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 7 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '11px 42px 11px 14px',
                    background: 'var(--bg3)', border: '1px solid var(--border2)',
                    borderRadius: 10, color: 'var(--text)', fontSize: 14, outline: 'none',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,142,247,0.12)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border2)'; e.target.style.boxShadow = 'none' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text3)', padding: 0,
                }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 9, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 16 }}>⚠</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading || !username || !password} style={{
              width: '100%', padding: '12px',
              background: loading ? 'var(--bg4)' : 'var(--gradient)',
              border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: 14,
              opacity: (!username || !password) ? 0.5 : 1,
              boxShadow: (!loading && username && password) ? '0 4px 16px rgba(79,142,247,0.3)' : 'none',
            }}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18, padding: '12px', background: 'var(--bg3)', borderRadius: 9, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Demo credentials</div>
            <code style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'JetBrains Mono' }}>analyst</code>
            <span style={{ color: 'var(--text3)', margin: '0 6px' }}>/</span>
            <code style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'JetBrains Mono' }}>demo1234</code>
          </div>
        </div>
      </div>
    </div>
  )
}

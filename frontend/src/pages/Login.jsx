import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try { await login(username, password); navigate('/') }
    catch { setError('Invalid credentials. Try analyst / demo1234') }
    finally { setLoading(false) }
  }
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.06) 0%, transparent 60%)' }}>
      <div style={{ width:400 }}>
        <div style={{ marginBottom:40, textAlign:'center' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#3b82f6,#a78bfa)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:600, color:'#fff' }}>B</div>
            <span style={{ fontSize:18, fontWeight:600 }}>Breathe ESG</span>
          </div>
          <p style={{ color:'var(--text2)', fontSize:13 }}>Sign in to the analyst dashboard</p>
        </div>
        <form onSubmit={handleSubmit} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:28 }}>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, color:'var(--text2)', marginBottom:6, fontWeight:500 }}>Username</label>
            <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="analyst"
              style={{ width:'100%', padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:14, outline:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:12, color:'var(--text2)', marginBottom:6, fontWeight:500 }}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"
              style={{ width:'100%', padding:'10px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:14, outline:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--accent)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
          </div>
          {error && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'10px 12px', marginBottom:16, fontSize:13, color:'#fca5a5' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:11, background:'var(--accent)', border:'none', borderRadius:8, color:'#fff', fontWeight:600, fontSize:14, opacity:loading?0.7:1 }}>
            {loading?'Signing in…':'Sign in'}
          </button>
          <p style={{ textAlign:'center', marginTop:16, fontSize:12, color:'var(--text3)' }}>
            Demo: <code style={{ color:'var(--text2)', fontFamily:'monospace' }}>analyst</code> / <code style={{ color:'var(--text2)', fontFamily:'monospace' }}>demo1234</code>
          </p>
        </form>
      </div>
    </div>
  )
}

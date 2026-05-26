import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Upload, FileText, Activity, LogOut, Leaf } from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/records', icon: FileText, label: 'Records' },
  { to: '/ingest', icon: Upload, label: 'Ingest Data' },
  { to: '/audit', icon: Activity, label: 'Audit Log' },
]

export default function Layout({ children }) {
  const { user, org, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, flexShrink: 0, background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg, #3b82f6, #a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={14} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Breathe ESG</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Data Platform</div>
            </div>
          </div>
        </div>
        {org && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Organization</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{org.name}</div>
          </div>
        )}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px',
              borderRadius: 8, marginBottom: 2, color: isActive ? 'var(--text)' : 'var(--text2)',
              background: isActive ? 'var(--bg4)' : 'transparent', fontSize: 13,
              fontWeight: isActive ? 500 : 400, transition: 'all 0.15s',
            })}>
              <Icon size={15} />{label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{user?.username}</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text3)', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'} title="Sign out">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>{children}</main>
    </div>
  )
}

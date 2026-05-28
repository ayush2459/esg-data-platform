import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Upload, FileText, Activity, LogOut, Leaf, ChevronRight } from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', desc: 'Overview & metrics' },
  { to: '/records', icon: FileText, label: 'Records', desc: 'Review emission data' },
  { to: '/ingest', icon: Upload, label: 'Ingest', desc: 'Upload source files' },
  { to: '/audit', icon: Activity, label: 'Audit Log', desc: 'Immutable history' },
]

export default function Layout({ children }) {
  const { user, org, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'var(--gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79,142,247,0.3)',
            }}>
              <Leaf size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.3px' }}>Breathe ESG</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Data Platform</div>
            </div>
          </div>
        </div>

        {/* Org badge */}
        {org && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 8,
              background: 'var(--bg3)', border: '1px solid var(--border)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 1 }}>Organization</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px' }}>
          {nav.map(({ to, icon: Icon, label, desc }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 10px', borderRadius: 10, marginBottom: 2,
              color: isActive ? 'var(--text)' : 'var(--text2)',
              background: isActive ? 'var(--bg4)' : 'transparent',
              border: `1px solid ${isActive ? 'var(--border2)' : 'transparent'}`,
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.15s',
            })}>
              {({ isActive }) => (
                <>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: isActive ? 'var(--accent-glow)' : 'var(--bg3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${isActive ? 'rgba(79,142,247,0.2)' : 'var(--border)'}`,
                  }}>
                    <Icon size={14} color={isActive ? 'var(--accent)' : 'var(--text3)'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{label}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{desc}</div>
                  </div>
                  {isActive && <ChevronRight size={12} color="var(--text3)" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px', borderRadius: 10,
            background: 'var(--bg3)', border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: 'var(--gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.first_name} {user?.last_name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Analyst</div>
            </div>
            <button onClick={async () => { await logout(); navigate('/login') }}
              style={{
                background: 'var(--bg4)', border: '1px solid var(--border)',
                color: 'var(--text3)', width: 28, height: 28, borderRadius: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              title="Sign out">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {children}
      </main>
    </div>
  )
}

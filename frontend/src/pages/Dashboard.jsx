import { useEffect, useState } from 'react'
import { records, runs } from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { CheckCircle, Clock, AlertTriangle, Lock, Database, TrendingUp, Zap, ArrowUpRight } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, glow, sub, trend }) {
  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 22px',
      position: 'relative', overflow: 'hidden',
      transition: 'border-color 0.2s, transform 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 0 0 80px', background: glow, opacity: 0.5 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ padding: 8, borderRadius: 9, background: glow, border: `1px solid ${color}25` }}>
          <Icon size={16} color={color} />
        </div>
        {trend !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: 'var(--green)', background: 'var(--green-glow)', padding: '3px 7px', borderRadius: 20 }}>
            <ArrowUpRight size={10} /> {trend}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-1px', color, marginBottom: 4 }}>{value ?? '—'}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{payload[0]?.value}</div>
      <div style={{ color: 'var(--text3)', fontSize: 11 }}>records</div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentRuns, setRecentRuns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([records.stats(), runs.list()])
      .then(([s, r]) => { setStats(s.data); setRecentRuns(r.data.results || r.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 32, height: 32, border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <div style={{ color: 'var(--text3)', fontSize: 13 }}>Loading dashboard…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  const scopeData = [
    { name: 'Scope 1', value: stats?.by_scope?.scope1 || 0, color: '#ef4444' },
    { name: 'Scope 2', value: stats?.by_scope?.scope2 || 0, color: '#4f8ef7' },
    { name: 'Scope 3', value: stats?.by_scope?.scope3 || 0, color: '#8b5cf6' },
  ]
  const categoryData = (stats?.by_category || []).map(c => ({
    name: c.category.replace('FUEL_', 'Fuel ').replace('BUSINESS_', 'Biz ').replace('_', ' '),
    value: c.count,
  }))
  const statusData = [
    { name: 'Pending', value: stats?.pending || 0, color: '#f59e0b' },
    { name: 'Approved', value: stats?.approved || 0, color: '#10b981' },
    { name: 'Flagged', value: stats?.flagged || 0, color: '#ef4444' },
    { name: 'Locked', value: stats?.locked || 0, color: '#8b5cf6' },
  ]

  return (
    <div style={{ padding: 32, maxWidth: 1400 }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>Dashboard</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Real-time overview of your emission data pipeline</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--green-glow)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, fontSize: 12, color: 'var(--green)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
          System operational
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Records" value={stats?.total} icon={Database} color="var(--accent)" glow="var(--accent-glow)" />
        <StatCard label="Pending Review" value={stats?.pending} icon={Clock} color="var(--amber)" glow="var(--amber-glow)" sub="Needs attention" />
        <StatCard label="Approved" value={stats?.approved} icon={CheckCircle} color="var(--green)" glow="var(--green-glow)" />
        <StatCard label="Flagged" value={stats?.flagged} icon={AlertTriangle} color="var(--red)" glow="var(--red-glow)" sub="Investigate" />
        <StatCard label="Locked" value={stats?.locked} icon={Lock} color="var(--purple)" glow="var(--purple-glow)" sub="Audit ready" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 0.8fr', gap: 16, marginBottom: 24 }}>
        {/* Scope bar chart */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Records by Scope</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20 }}>GHG Protocol classification</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={scopeData} barSize={36}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {scopeData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.9} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category bar chart */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>By Category</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20 }}>Emission source breakdown</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={categoryData} layout="vertical" barSize={12}>
              <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" fill="var(--accent)" radius={[0, 4, 4, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Status Mix</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>Review progress</div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                {statusData.map((e, i) => <Cell key={i} fill={e.color} fillOpacity={0.85} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {statusData.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
                {s.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent runs */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={14} color="var(--accent)" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Recent Ingestion Runs</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>{recentRuns.length} total</span>
        </div>
        {recentRuns.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No ingestion runs yet. Upload data from the Ingest page.</div>
        ) : (
          recentRuns.slice(0, 6).map((run, i) => (
            <div key={run.id} style={{
              display: 'flex', alignItems: 'center', padding: '14px 22px',
              borderBottom: i < Math.min(recentRuns.length, 6) - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{run.data_source_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {new Date(run.started_at).toLocaleString()} · {run.row_count} records · {run.error_count} errors
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text3)' }}>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 700, color: run.error_count > 0 ? 'var(--amber)' : 'var(--green)' }}>{run.row_count}</div>
                  records
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                  background: run.status === 'DONE' ? 'var(--green-glow)' : 'var(--red-glow)',
                  color: run.status === 'DONE' ? 'var(--green)' : 'var(--red)',
                  border: `1px solid ${run.status === 'DONE' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  {run.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { records, runs } from '../utils/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CheckCircle, Clock, AlertTriangle, Lock, Database } from 'lucide-react'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontWeight: 500 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.5px', color }}>{value ?? '—'}</div>
          {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ padding: 8, borderRadius: 8, background: `${color}18` }}><Icon size={18} color={color} /></div>
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{payload[0]?.value} records</div>
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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text2)' }}>Loading…</div>

  const scopeData = stats ? [
    { name: 'Scope 1', value: stats.by_scope.scope1, color: '#ef4444' },
    { name: 'Scope 2', value: stats.by_scope.scope2, color: '#3b82f6' },
    { name: 'Scope 3', value: stats.by_scope.scope3, color: '#a78bfa' },
  ] : []

  const categoryData = (stats?.by_category || []).map(c => ({ name: c.category.replace(/_/g,' '), value: c.count }))

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.4px', marginBottom: 4 }}>Dashboard</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Overview of all emission data and review status</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total Records" value={stats?.total} icon={Database} color="var(--accent)" />
        <StatCard label="Pending Review" value={stats?.pending} icon={Clock} color="var(--amber)" sub="Awaiting analyst action" />
        <StatCard label="Approved" value={stats?.approved} icon={CheckCircle} color="var(--green)" />
        <StatCard label="Flagged" value={stats?.flagged} icon={AlertTriangle} color="var(--red)" sub="Need investigation" />
        <StatCard label="Locked" value={stats?.locked} icon={Lock} color="var(--purple)" sub="Sent to audit" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Records by Scope</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 18 }}>GHG Protocol classification</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={scopeData} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8b909a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8b909a' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4,4,0,0]}>{scopeData.map((e,i) => <Cell key={i} fill={e.color} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Records by Category</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 18 }}>Emission source categories</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryData} layout="vertical" barSize={14}>
              <XAxis type="number" tick={{ fontSize: 10, fill: '#8b909a' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#8b909a' }} axisLine={false} tickLine={false} width={120} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="var(--accent)" radius={[0,3,3,0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 16 }}>Recent Ingestion Runs</div>
        {recentRuns.length === 0 ? <div style={{ color: 'var(--text3)', fontSize: 13 }}>No runs yet.</div> : recentRuns.slice(0,6).map(run => (
          <div key={run.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{run.data_source_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{new Date(run.started_at).toLocaleString()} · {run.row_count} records · {run.error_count} errors</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: run.status==='DONE'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)', color: run.status==='DONE'?'var(--green)':'var(--red)' }}>{run.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

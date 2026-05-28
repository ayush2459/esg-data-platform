import { useEffect, useState } from 'react'
import { auditLog } from '../utils/api'
import { Activity, User, Zap, Shield } from 'lucide-react'

const EC = {
  RECORD_CREATED:    { color: '#4f8ef7', bg: 'rgba(79,142,247,0.1)',   border: 'rgba(79,142,247,0.15)' },
  RECORD_EDITED:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.15)' },
  RECORD_APPROVED:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)',   border: 'rgba(16,185,129,0.15)' },
  RECORD_LOCKED:     { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   border: 'rgba(139,92,246,0.15)' },
  INGESTION_STARTED: { color: '#14b8a6', bg: 'rgba(20,184,166,0.1)',   border: 'rgba(20,184,166,0.15)' },
  INGESTION_DONE:    { color: '#14b8a6', bg: 'rgba(20,184,166,0.1)',   border: 'rgba(20,184,166,0.15)' },
  FLAG_AUTO:         { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.15)' },
}
const EL = {
  RECORD_CREATED: 'Record Created', RECORD_EDITED: 'Record Edited',
  RECORD_APPROVED: 'Record Approved', RECORD_LOCKED: 'Record Locked',
  INGESTION_STARTED: 'Ingestion Started', INGESTION_DONE: 'Ingestion Done',
  FLAG_AUTO: 'Auto Flag Raised',
}

export default function AuditLogPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { auditLog.list().then(r => setEvents(r.data.results || r.data)).finally(() => setLoading(false)) }, [])

  const filtered = filter ? events.filter(e => e.event_type === filter) : events

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>Audit Log</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>Immutable, append-only history of all system and analyst actions</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--purple-glow)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, fontSize: 12, color: 'var(--purple)' }}>
          <Shield size={12} /> {events.length} events recorded
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {[['', 'All Events'], ...Object.entries(EL)].map(([k, label]) => {
          const { color, bg, border } = EC[k] || { color: 'var(--text2)', bg: 'var(--bg2)', border: 'var(--border2)' }
          const active = filter === k
          return (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: active ? 600 : 400, cursor: 'pointer',
              background: active ? bg : 'var(--bg2)',
              border: `1px solid ${active ? border : 'var(--border)'}`,
              color: active ? color : 'var(--text2)',
              transition: 'all 0.15s',
            }}>
              {label}
            </button>
          )
        })}
      </div>

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading events…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, fontWeight: 500 }}>No events found</div>
          </div>
        ) : filtered.map((event, i) => {
          const { color, bg, border } = EC[event.event_type] || { color: 'var(--text2)', bg: 'var(--bg3)', border: 'var(--border)' }
          const isSystem = !event.actor
          return (
            <div key={event.id} style={{
              display: 'flex', gap: 16, padding: '16px 22px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 34, height: 34, borderRadius: 10, background: bg, border: `1px solid ${border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
              }}>
                {isSystem ? <Zap size={14} color={color} /> : <User size={14} color={color} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: bg, color, border: `1px solid ${border}` }}>
                    {EL[event.event_type] || event.event_type}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>
                    {isSystem ? '⚡ System' : event.actor_username}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto', fontFamily: 'JetBrains Mono' }}>
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>

                {event.payload && Object.keys(event.payload).length > 0 && (
                  <div style={{
                    fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text3)',
                    background: 'var(--bg3)', borderRadius: 8, padding: '8px 12px',
                    display: 'flex', gap: 16, flexWrap: 'wrap', border: '1px solid var(--border)',
                  }}>
                    {Object.entries(event.payload).map(([k, v]) => (
                      <span key={k}>
                        <span style={{ color: 'var(--text2)' }}>{k}</span>
                        <span style={{ color: 'var(--text3)' }}>: </span>
                        <span style={{ color: 'var(--text)' }}>{String(v)}</span>
                      </span>
                    ))}
                  </div>
                )}

                {event.target_id && (
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 5, fontFamily: 'JetBrains Mono' }}>
                    {event.target_type} · {event.target_id}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text3)' }}>
        <Activity size={12} />
        {filtered.length} events shown · Audit log is append-only and cannot be modified
      </div>
    </div>
  )
}

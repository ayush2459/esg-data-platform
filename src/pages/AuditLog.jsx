import { useEffect, useState } from 'react'
import { auditLog } from '../utils/api'
import { Activity, User, Zap } from 'lucide-react'

const EVENT_COLORS = {
  RECORD_CREATED:    { color:'#3b82f6', bg:'rgba(59,130,246,0.1)' },
  RECORD_EDITED:     { color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
  RECORD_APPROVED:   { color:'#22c55e', bg:'rgba(34,197,94,0.1)' },
  RECORD_LOCKED:     { color:'#a78bfa', bg:'rgba(167,139,250,0.1)' },
  INGESTION_STARTED: { color:'#2dd4bf', bg:'rgba(45,212,191,0.1)' },
  INGESTION_DONE:    { color:'#2dd4bf', bg:'rgba(45,212,191,0.1)' },
  FLAG_AUTO:         { color:'#ef4444', bg:'rgba(239,68,68,0.1)' },
}
const EVENT_LABELS = {
  RECORD_CREATED:'Record Created', RECORD_EDITED:'Record Edited',
  RECORD_APPROVED:'Record Approved', RECORD_LOCKED:'Record Locked',
  INGESTION_STARTED:'Ingestion Started', INGESTION_DONE:'Ingestion Done',
  FLAG_AUTO:'Auto Flag Raised',
}

export default function AuditLogPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => { auditLog.list().then(r=>setEvents(r.data.results||r.data)).finally(()=>setLoading(false)) }, [])

  const filtered = filter ? events.filter(e=>e.event_type===filter) : events

  return (
    <div style={{ padding:32 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:600, letterSpacing:'-0.4px', marginBottom:4 }}>Audit Log</h1>
        <p style={{ color:'var(--text2)', fontSize:13 }}>Immutable history of all system and user actions</p>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[['', 'All'], ...Object.entries(EVENT_LABELS)].map(([k,label]) => {
          const {color} = EVENT_COLORS[k]||{color:'var(--text2)'}; const active=filter===k
          return <button key={k} onClick={()=>setFilter(k)} style={{ padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:500, cursor:'pointer', background:active?(k?`${color}20`:'var(--accent)'):'var(--bg2)', border:active?(k?`1px solid ${color}50`:'1px solid var(--accent)'):'1px solid var(--border)', color:active?(k?color:'#fff'):'var(--text2)' }}>{label}</button>
        })}
      </div>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        {loading ? <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>Loading…</div>
        : filtered.length===0 ? <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>No events found.</div>
        : filtered.map((event,i) => {
          const {color,bg}=EVENT_COLORS[event.event_type]||{color:'var(--text2)',bg:'var(--bg3)'}
          return (
            <div key={event.id} style={{ display:'flex', gap:14, padding:'14px 20px', borderBottom:i<filtered.length-1?'1px solid var(--border)':'none', alignItems:'flex-start' }}>
              <div style={{ width:30, height:30, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                {!event.actor?<Zap size={13} color={color}/>:<User size={13} color={color}/>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, fontWeight:600, padding:'2px 7px', borderRadius:4, background:bg, color }}>{EVENT_LABELS[event.event_type]||event.event_type}</span>
                  <span style={{ fontSize:12, color:'var(--text2)' }}>{!event.actor?'System':event.actor_username}</span>
                  <span style={{ fontSize:11, color:'var(--text3)', marginLeft:'auto', fontFamily:'DM Mono' }}>{new Date(event.created_at).toLocaleString()}</span>
                </div>
                {event.payload&&Object.keys(event.payload).length>0&&(
                  <div style={{ marginTop:6, fontSize:11, fontFamily:'DM Mono', color:'var(--text3)', background:'var(--bg3)', borderRadius:6, padding:'6px 10px', display:'flex', gap:12, flexWrap:'wrap' }}>
                    {Object.entries(event.payload).map(([k,v])=><span key={k}><span style={{color:'var(--text2)'}}>{k}:</span> <span style={{color:'var(--text)'}}>{String(v)}</span></span>)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ marginTop:14, fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:6 }}>
        <Activity size={12}/>{filtered.length} events · Append-only, cannot be modified
      </div>
    </div>
  )
}

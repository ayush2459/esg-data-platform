import { useEffect, useState, useCallback } from 'react'
import { records } from '../utils/api'
import { CheckCircle, XCircle, Flag, Lock, ChevronDown, AlertTriangle, Filter } from 'lucide-react'

const STATUS_BADGE = {
  PENDING:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b',  label: 'Pending' },
  APPROVED: { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e',  label: 'Approved' },
  REJECTED: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af',  label: 'Rejected' },
  FLAGGED:  { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444',  label: 'Flagged' },
  LOCKED:   { bg: 'rgba(167,139,250,0.12)', color: '#a78bfa',  label: 'Locked' },
}
const SCOPE_COLOR = { 1: '#ef4444', 2: '#3b82f6', 3: '#a78bfa' }

function Badge({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.PENDING
  return <span style={{ fontSize: 11, fontWeight: 500, padding: '3px 8px', borderRadius: 4, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
}

function ActionBtn({ onClick, icon: Icon, label, color, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} title={label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: `1px solid ${color}30`, background: `${color}12`, color, fontSize: 12, fontWeight: 500, cursor: disabled?'not-allowed':'pointer', opacity: disabled?0.4:1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = `${color}22` }}
      onMouseLeave={e => e.currentTarget.style.background = `${color}12`}>
      <Icon size={12} />{label}
    </button>
  )
}

function RecordRow({ record, selected, onSelect, onAction }) {
  const [expanded, setExpanded] = useState(false)
  const [note, setNote] = useState('')
  const [acting, setActing] = useState(false)
  const isLocked = record.status === 'LOCKED'

  const doAction = async (action) => {
    setActing(true); await onAction(record.id, action, note); setActing(false); setExpanded(false)
  }

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border)', background: selected?'rgba(59,130,246,0.05)':expanded?'var(--bg3)':'transparent', cursor: 'pointer' }}>
        <td style={{ padding: '12px 10px' }}><input type="checkbox" checked={selected} onChange={() => onSelect(record.id)} onClick={e => e.stopPropagation()} style={{ cursor:'pointer', accentColor:'var(--accent)' }} /></td>
        <td style={{ padding: '12px 10px' }} onClick={() => setExpanded(!expanded)}>
          <span style={{ fontSize: 11, fontWeight: 600, color: SCOPE_COLOR[record.scope], background: `${SCOPE_COLOR[record.scope]}15`, padding: '2px 7px', borderRadius: 4 }}>S{record.scope}</span>
        </td>
        <td style={{ padding: '12px 10px' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ fontSize: 13 }}>{record.category_display}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{record.description?.slice(0,55)}</div>
        </td>
        <td style={{ padding: '12px 10px', fontFamily: 'DM Mono', fontSize: 12 }} onClick={() => setExpanded(!expanded)}>
          {parseFloat(record.activity_value).toLocaleString(undefined,{maximumFractionDigits:2})} {record.activity_unit}
        </td>
        <td style={{ padding: '12px 10px', color: 'var(--text2)', fontSize: 12 }} onClick={() => setExpanded(!expanded)}>
          <div>{record.facility || '—'}</div>
          <div style={{ color: 'var(--text3)', fontSize: 11 }}>{record.period_start}</div>
        </td>
        <td style={{ padding: '12px 10px' }} onClick={() => setExpanded(!expanded)}><Badge status={record.status} /></td>
        <td style={{ padding: '12px 10px' }} onClick={() => setExpanded(!expanded)}>
          <ChevronDown size={14} color="var(--text3)" style={{ transform: expanded?'rotate(180deg)':'rotate(0)', transition:'transform 0.2s' }} />
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: 'var(--bg3)' }}>
          <td colSpan={7} style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            {record.flag_reason && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                <AlertTriangle size={13} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: '#fca5a5' }}>{record.flag_reason}</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>
              {[['Original Value',`${parseFloat(record.original_value).toLocaleString()} ${record.original_unit}`],['Normalized',`${parseFloat(record.activity_value).toLocaleString(undefined,{maximumFractionDigits:2})} ${record.activity_unit}`],['Period',`${record.period_start} → ${record.period_end}`],['Source',record.data_source_name||'—'],['Country',record.country_code||'—'],['Currency',record.currency||'—'],['Supplier',record.supplier||'—'],['Scope',record.scope_display]].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'DM Mono' }}>{v}</div>
                </div>
              ))}
            </div>
            {!isLocked ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)…"
                  style={{ flex:1, minWidth:200, padding:'7px 10px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:7, color:'var(--text)', fontSize:12, outline:'none' }} />
                <ActionBtn onClick={() => doAction('APPROVE')} icon={CheckCircle} label="Approve" color="#22c55e" disabled={acting||record.status==='APPROVED'} />
                <ActionBtn onClick={() => doAction('REJECT')} icon={XCircle} label="Reject" color="#9ca3af" disabled={acting||record.status==='REJECTED'} />
                <ActionBtn onClick={() => doAction('FLAG')} icon={Flag} label="Flag" color="#ef4444" disabled={acting||record.status==='FLAGGED'} />
                {record.status==='APPROVED' && <ActionBtn onClick={() => doAction('LOCK')} icon={Lock} label="Lock for Audit" color="#a78bfa" disabled={acting} />}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6 }}><Lock size={12} /> Locked for audit — cannot be modified.</div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function Records() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ status:'', scope:'', category:'' })
  const [selected, setSelected] = useState(new Set())
  const [bulkNote, setBulkNote] = useState('')
  const [bulkActing, setBulkActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = {}
    if (filters.status) params.status = filters.status
    if (filters.scope) params.scope = filters.scope
    if (filters.category) params.category = filters.category
    const r = await records.list(params)
    setData(r.data.results || r.data); setLoading(false)
  }, [filters])

  useEffect(() => { load() }, [load])

  const handleAction = async (id, action, note) => { await records.review(id, action, note); load() }
  const handleBulk = async (action) => {
    if (!selected.size) return
    setBulkActing(true)
    await records.bulkReview([...selected], action, bulkNote)
    setSelected(new Set()); setBulkNote(''); setBulkActing(false); load()
  }
  const toggleSelect = id => { const s = new Set(selected); s.has(id)?s.delete(id):s.add(id); setSelected(s) }
  const toggleAll = () => setSelected(selected.size===data.length ? new Set() : new Set(data.map(r=>r.id)))

  const FilterSelect = ({ field, label, options }) => (
    <select value={filters[field]} onChange={e => setFilters(f => ({...f,[field]:e.target.value}))}
      style={{ padding:'7px 10px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, color:filters[field]?'var(--text)':'var(--text2)', fontSize:12, outline:'none', cursor:'pointer' }}>
      <option value="">{label}</option>
      {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.4px', marginBottom: 4 }}>Emission Records</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Review, approve, flag, and lock emission data before audit submission</p>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={14} color="var(--text3)" />
        <FilterSelect field="status" label="All statuses" options={[['PENDING','Pending'],['APPROVED','Approved'],['FLAGGED','Flagged'],['REJECTED','Rejected'],['LOCKED','Locked']]} />
        <FilterSelect field="scope" label="All scopes" options={[['1','Scope 1'],['2','Scope 2'],['3','Scope 3']]} />
        <FilterSelect field="category" label="All categories" options={[['FUEL_STATIONARY','Fuel Stationary'],['FUEL_MOBILE','Fuel Mobile'],['ELECTRICITY','Electricity'],['BUSINESS_TRAVEL','Business Travel'],['PROCUREMENT','Procurement']]} />
        {(filters.status||filters.scope||filters.category) && <button onClick={() => setFilters({status:'',scope:'',category:''})} style={{ padding:'6px 10px', background:'none', border:'1px solid var(--border)', borderRadius:7, color:'var(--text2)', fontSize:12, cursor:'pointer' }}>Clear</button>}
        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)' }}>{data.length} records</span>
      </div>
      {selected.size > 0 && (
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12, padding:'10px 14px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:9, flexWrap:'wrap' }}>
          <span style={{ fontSize:12, color:'var(--accent)', fontWeight:500 }}>{selected.size} selected</span>
          <input value={bulkNote} onChange={e => setBulkNote(e.target.value)} placeholder="Add note…" style={{ padding:'5px 9px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', fontSize:12, outline:'none' }} />
          <ActionBtn onClick={() => handleBulk('APPROVE')} icon={CheckCircle} label="Approve all" color="#22c55e" disabled={bulkActing} />
          <ActionBtn onClick={() => handleBulk('REJECT')} icon={XCircle} label="Reject all" color="#9ca3af" disabled={bulkActing} />
          <ActionBtn onClick={() => handleBulk('FLAG')} icon={Flag} label="Flag all" color="#ef4444" disabled={bulkActing} />
          <button onClick={() => setSelected(new Set())} style={{ padding:'5px 9px', background:'none', border:'1px solid var(--border)', borderRadius:6, color:'var(--text3)', fontSize:12, cursor:'pointer', marginLeft:'auto' }}>Cancel</button>
        </div>
      )}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        {loading ? <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>Loading…</div>
        : data.length===0 ? <div style={{ padding:40, textAlign:'center', color:'var(--text3)' }}>No records found. Upload data from the Ingest page.</div>
        : <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  <th style={{ padding:'10px 10px', textAlign:'left' }}><input type="checkbox" checked={selected.size===data.length&&data.length>0} onChange={toggleAll} style={{ cursor:'pointer', accentColor:'var(--accent)' }} /></th>
                  {['Scope','Category / Description','Activity','Facility / Date','Status',''].map(h => (
                    <th key={h} style={{ padding:'10px 10px', textAlign:'left', fontSize:11, color:'var(--text3)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{data.map(r => <RecordRow key={r.id} record={r} selected={selected.has(r.id)} onSelect={toggleSelect} onAction={handleAction} />)}</tbody>
            </table>
          </div>}
      </div>
    </div>
  )
}

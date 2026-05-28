import { useEffect, useState, useCallback } from 'react'
import { records } from '../utils/api'
import { CheckCircle, XCircle, Flag, Lock, ChevronDown, AlertTriangle, Filter, Search } from 'lucide-react'

const STATUS = {
  PENDING:  { bg: 'var(--amber-glow)',  color: '#f59e0b', border: 'rgba(245,158,11,0.2)',  label: 'Pending' },
  APPROVED: { bg: 'var(--green-glow)',  color: '#10b981', border: 'rgba(16,185,129,0.2)',  label: 'Approved' },
  REJECTED: { bg: 'rgba(100,116,139,0.1)', color: '#64748b', border: 'rgba(100,116,139,0.2)', label: 'Rejected' },
  FLAGGED:  { bg: 'var(--red-glow)',    color: '#ef4444', border: 'rgba(239,68,68,0.2)',   label: 'Flagged' },
  LOCKED:   { bg: 'var(--purple-glow)', color: '#8b5cf6', border: 'rgba(139,92,246,0.2)',  label: 'Locked' },
}
const SCOPE_COLOR = { 1: '#ef4444', 2: '#4f8ef7', 3: '#8b5cf6' }

function Badge({ status }) {
  const s = STATUS[status] || STATUS.PENDING
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}`, whiteSpace: 'nowrap' }}>{s.label}</span>
}

function ActionBtn({ onClick, icon: Icon, label, color, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
      borderRadius: 8, border: `1px solid ${color}25`, background: `${color}10`,
      color, fontSize: 12, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
    }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = `${color}20`; e.currentTarget.style.borderColor = `${color}40` } }}
      onMouseLeave={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}25` }}
    >
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
      <tr style={{
        borderBottom: '1px solid var(--border)',
        background: selected ? 'rgba(79,142,247,0.05)' : expanded ? 'var(--bg3)' : 'transparent',
        transition: 'background 0.1s',
      }}>
        <td style={{ padding: '13px 16px' }}>
          <input type="checkbox" checked={selected} onChange={() => onSelect(record.id)} onClick={e => e.stopPropagation()}
            style={{ cursor: 'pointer', accentColor: 'var(--accent)', width: 14, height: 14 }} />
        </td>
        <td style={{ padding: '13px 12px' }} onClick={() => setExpanded(!expanded)}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            color: SCOPE_COLOR[record.scope], background: `${SCOPE_COLOR[record.scope]}15`,
            border: `1px solid ${SCOPE_COLOR[record.scope]}25`,
          }}>S{record.scope}</span>
        </td>
        <td style={{ padding: '13px 12px', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{record.category_display}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{record.description?.slice(0, 50)}{record.description?.length > 50 ? '…' : ''}</div>
        </td>
        <td style={{ padding: '13px 12px', cursor: 'pointer', fontFamily: 'JetBrains Mono', fontSize: 12 }} onClick={() => setExpanded(!expanded)}>
          <span style={{ color: 'var(--text)' }}>{parseFloat(record.activity_value).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          <span style={{ color: 'var(--text3)', marginLeft: 4 }}>{record.activity_unit}</span>
        </td>
        <td style={{ padding: '13px 12px', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>{record.facility || '—'}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{record.period_start}</div>
        </td>
        <td style={{ padding: '13px 12px' }} onClick={() => setExpanded(!expanded)}><Badge status={record.status} /></td>
        <td style={{ padding: '13px 16px', cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
          <ChevronDown size={14} color="var(--text3)" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
        </td>
      </tr>

      {expanded && (
        <tr style={{ background: 'var(--bg3)' }}>
          <td colSpan={7} style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            {record.flag_reason && (
              <div style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 10, padding: '12px 14px', marginBottom: 16,
              }}>
                <AlertTriangle size={14} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>{record.flag_reason}</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
              {[
                ['Original Value', `${parseFloat(record.original_value).toLocaleString()} ${record.original_unit}`],
                ['Normalized', `${parseFloat(record.activity_value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${record.activity_unit}`],
                ['Period', `${record.period_start} → ${record.period_end}`],
                ['Source', record.data_source_name || '—'],
                ['Country', record.country_code || '—'],
                ['Currency', record.currency || '—'],
                ['Supplier', record.supplier || '—'],
                ['Scope', record.scope_display],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--bg4)', borderRadius: 9, padding: '10px 12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{k}</div>
                  <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--text)' }}>{v}</div>
                </div>
              ))}
            </div>

            {!isLocked ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note (optional)…"
                  style={{
                    flex: 1, minWidth: 220, padding: '8px 12px',
                    background: 'var(--bg4)', border: '1px solid var(--border2)',
                    borderRadius: 9, color: 'var(--text)', fontSize: 12, outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border2)'}
                />
                <ActionBtn onClick={() => doAction('APPROVE')} icon={CheckCircle} label="Approve" color="#10b981" disabled={acting || record.status === 'APPROVED'} />
                <ActionBtn onClick={() => doAction('REJECT')} icon={XCircle} label="Reject" color="#64748b" disabled={acting || record.status === 'REJECTED'} />
                <ActionBtn onClick={() => doAction('FLAG')} icon={Flag} label="Flag" color="#ef4444" disabled={acting || record.status === 'FLAGGED'} />
                {record.status === 'APPROVED' && <ActionBtn onClick={() => doAction('LOCK')} icon={Lock} label="Lock for Audit" color="#8b5cf6" disabled={acting} />}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
                <Lock size={12} color="var(--purple)" /> This record is locked for audit and cannot be modified.
              </div>
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
  const [filters, setFilters] = useState({ status: '', scope: '', category: '' })
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
    if (!selected.size) return; setBulkActing(true)
    await records.bulkReview([...selected], action, bulkNote)
    setSelected(new Set()); setBulkNote(''); setBulkActing(false); load()
  }
  const toggleSelect = id => { const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s) }
  const toggleAll = () => setSelected(selected.size === data.length ? new Set() : new Set(data.map(r => r.id)))

  const FS = ({ field, label, options }) => (
    <select value={filters[field]} onChange={e => setFilters(f => ({ ...f, [field]: e.target.value }))}
      style={{
        padding: '7px 12px', background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 9, color: filters[field] ? 'var(--text)' : 'var(--text2)',
        fontSize: 12, outline: 'none', cursor: 'pointer',
      }}>
      <option value="">{label}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>Emission Records</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Review, approve, flag and lock emission data before audit submission</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 9 }}>
          <Filter size={12} color="var(--text3)" />
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>Filter</span>
        </div>
        <FS field="status" label="All statuses" options={[['PENDING', 'Pending'], ['APPROVED', 'Approved'], ['FLAGGED', 'Flagged'], ['REJECTED', 'Rejected'], ['LOCKED', 'Locked']]} />
        <FS field="scope" label="All scopes" options={[['1', 'Scope 1'], ['2', 'Scope 2'], ['3', 'Scope 3']]} />
        <FS field="category" label="All categories" options={[['FUEL_STATIONARY', 'Fuel Stationary'], ['FUEL_MOBILE', 'Fuel Mobile'], ['ELECTRICITY', 'Electricity'], ['BUSINESS_TRAVEL', 'Business Travel'], ['PROCUREMENT', 'Procurement']]} />
        {(filters.status || filters.scope || filters.category) && (
          <button onClick={() => setFilters({ status: '', scope: '', category: '' })} style={{
            padding: '7px 12px', background: 'none', border: '1px solid var(--border2)',
            borderRadius: 9, color: 'var(--text2)', fontSize: 12, cursor: 'pointer',
          }}>Clear filters</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text3)' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{data.length}</span> records
        </div>
      </div>

      {selected.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          padding: '12px 16px', background: 'rgba(79,142,247,0.06)',
          border: '1px solid rgba(79,142,247,0.15)', borderRadius: 11, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{selected.size} selected</span>
          <input value={bulkNote} onChange={e => setBulkNote(e.target.value)} placeholder="Add bulk note…"
            style={{ padding: '6px 10px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--text)', fontSize: 12, outline: 'none' }} />
          <ActionBtn onClick={() => handleBulk('APPROVE')} icon={CheckCircle} label="Approve all" color="#10b981" disabled={bulkActing} />
          <ActionBtn onClick={() => handleBulk('REJECT')} icon={XCircle} label="Reject all" color="#64748b" disabled={bulkActing} />
          <ActionBtn onClick={() => handleBulk('FLAG')} icon={Flag} label="Flag all" color="#ef4444" disabled={bulkActing} />
          <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', padding: '6px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text3)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        </div>
      )}

      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>Loading records…</div>
        ) : data.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No records found</div>
            <div style={{ color: 'var(--text3)', fontSize: 12 }}>Upload data from the Ingest page to get started</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
                  <th style={{ padding: '11px 16px', textAlign: 'left' }}>
                    <input type="checkbox" checked={selected.size === data.length && data.length > 0} onChange={toggleAll}
                      style={{ cursor: 'pointer', accentColor: 'var(--accent)', width: 14, height: 14 }} />
                  </th>
                  {['Scope', 'Category / Description', 'Activity', 'Facility / Date', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '11px 12px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map(r => <RecordRow key={r.id} record={r} selected={selected.has(r.id)} onSelect={toggleSelect} onAction={handleAction} />)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

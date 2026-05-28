import { useEffect, useState, useRef } from 'react'
import { sources, ingest, runs } from '../utils/api'
import { Upload, CheckCircle, AlertTriangle, FileText, Plus, X, CloudUpload } from 'lucide-react'

const TYPE_INFO = {
  SAP_FLAT_FILE: { label: 'SAP Flat File', desc: 'FAGLL03 tab-delimited export from SAP FI', color: '#4f8ef7', accent: 'rgba(79,142,247,0.1)', accept: '.txt,.csv,.tsv' },
  UTILITY_CSV:   { label: 'Utility CSV',   desc: 'Portal CSV export from electricity provider', color: '#10b981', accent: 'rgba(16,185,129,0.1)', accept: '.csv' },
  TRAVEL_CSV:    { label: 'Travel CSV',    desc: 'Concur/Navan corporate travel expense export', color: '#8b5cf6', accent: 'rgba(139,92,246,0.1)', accept: '.csv' },
}

export default function Ingest() {
  const [sourceList, setSourceList] = useState([])
  const [sel, setSel] = useState('')
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [recentRuns, setRecentRuns] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [newSrc, setNewSrc] = useState({ name: '', source_type: 'SAP_FLAT_FILE' })
  const [adding, setAdding] = useState(false)
  const fileRef = useRef()

  const load = () => {
    sources.list().then(r => setSourceList(r.data.results || r.data))
    runs.list().then(r => setRecentRuns((r.data.results || r.data).slice(0, 8)))
  }
  useEffect(() => { load() }, [])

  const handleUpload = async () => {
    if (!sel || !file) return
    setUploading(true); setResult(null)
    const fd = new FormData(); fd.append('data_source_id', sel); fd.append('file', file)
    try { const r = await ingest.upload(fd); setResult({ ok: true, ...r.data }); setFile(null); load() }
    catch (e) { setResult({ ok: false, error: e.response?.data?.error || 'Upload failed' }) }
    finally { setUploading(false) }
  }

  const handleAdd = async () => {
    setAdding(true)
    try {
      const orgId = sourceList[0]?.organization
      await sources.create({ ...newSrc, organization: orgId, config: {} })
      setShowAdd(false); setNewSrc({ name: '', source_type: 'SAP_FLAT_FILE' }); load()
    } catch (e) { alert('Error: ' + (e.response?.data?.name?.[0] || 'Unknown')) }
    finally { setAdding(false) }
  }

  const cur = sourceList.find(s => s.id === sel)
  const ti = cur ? TYPE_INFO[cur.source_type] : null

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>Ingest Data</h1>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Upload emission source files for normalization and review</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20, marginBottom: 28 }}>
        {/* Upload card */}
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CloudUpload size={16} color="var(--accent)" /> Upload File
          </div>

          {/* Source selector */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8 }}>Data Source</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={sel} onChange={e => setSel(e.target.value)} style={{
                flex: 1, padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)',
                borderRadius: 10, color: sel ? 'var(--text)' : 'var(--text2)', fontSize: 13, outline: 'none',
              }}>
                <option value="">Select a data source…</option>
                {sourceList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={() => setShowAdd(!showAdd)} style={{
                padding: '10px 12px', background: 'var(--bg3)', border: '1px solid var(--border2)',
                borderRadius: 10, color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text2)' }}
              >
                {showAdd ? <X size={15} /> : <Plus size={15} />}
              </button>
            </div>
          </div>

          {showAdd && (
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 12, padding: 16, marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 12 }}>Add New Source</div>
              <input value={newSrc.name} onChange={e => setNewSrc(n => ({ ...n, name: e.target.value }))} placeholder="e.g. UK Electricity — EDF Portal"
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 9, color: 'var(--text)', fontSize: 12, outline: 'none', marginBottom: 10 }} />
              <select value={newSrc.source_type} onChange={e => setNewSrc(n => ({ ...n, source_type: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 9, color: 'var(--text)', fontSize: 12, outline: 'none', marginBottom: 12 }}>
                {Object.entries(TYPE_INFO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={handleAdd} disabled={!newSrc.name || adding} style={{
                padding: '8px 16px', background: 'var(--gradient)', border: 'none', borderRadius: 9,
                color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: adding ? 0.7 : 1,
              }}>{adding ? 'Adding…' : 'Add Source'}</button>
            </div>
          )}

          {ti && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 18, padding: '10px 14px', background: ti.accent, border: `1px solid ${ti.color}25`, borderRadius: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ti.color, boxShadow: `0 0 8px ${ti.color}`, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: ti.color }}>{ti.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{ti.desc}</div>
              </div>
            </div>
          )}

          {/* Drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f) }}
            style={{
              border: `2px dashed ${file ? 'var(--green)' : dragging ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: 12, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', marginBottom: 18,
              background: file ? 'var(--green-glow)' : dragging ? 'var(--accent-glow)' : 'var(--bg3)',
              transition: 'all 0.2s',
            }}
          >
            <input ref={fileRef} type="file" style={{ display: 'none' }} accept={ti?.accept || '.csv,.txt,.tsv'} onChange={e => setFile(e.target.files[0])} />
            {file ? (
              <>
                <FileText size={28} color="var(--green)" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
              </>
            ) : (
              <>
                <Upload size={28} color={dragging ? 'var(--accent)' : 'var(--text3)'} style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: dragging ? 'var(--accent)' : 'var(--text2)', marginBottom: 4 }}>
                  {dragging ? 'Drop to upload' : 'Drop file here or click to browse'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>CSV, TXT, TSV supported</div>
              </>
            )}
          </div>

          <button onClick={handleUpload} disabled={!sel || !file || uploading} style={{
            width: '100%', padding: '13px', background: (!sel || !file || uploading) ? 'var(--bg4)' : 'var(--gradient)',
            border: `1px solid ${(!sel || !file) ? 'var(--border)' : 'transparent'}`,
            borderRadius: 11, color: (!sel || !file) ? 'var(--text3)' : '#fff',
            fontWeight: 600, fontSize: 14, cursor: (!sel || !file || uploading) ? 'not-allowed' : 'pointer',
            boxShadow: (!sel || !file || uploading) ? 'none' : '0 4px 16px rgba(79,142,247,0.3)',
            transition: 'all 0.2s',
          }}>
            {uploading ? 'Processing…' : 'Ingest File'}
          </button>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {result && (
            <div style={{
              background: result.ok ? 'var(--green-glow)' : 'var(--red-glow)',
              border: `1px solid ${result.ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 14, padding: 22,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                {result.ok ? <CheckCircle size={18} color="var(--green)" /> : <AlertTriangle size={18} color="var(--red)" />}
                <span style={{ fontSize: 15, fontWeight: 700, color: result.ok ? 'var(--green)' : 'var(--red)' }}>
                  {result.ok ? 'Ingestion complete' : 'Ingestion failed'}
                </span>
              </div>
              {result.ok && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Records created', result.created, 'var(--green)'], ['Parse errors', result.errors, result.errors > 0 ? 'var(--amber)' : 'var(--text3)']].map(([l, v, c]) => (
                    <div key={l} style={{ background: 'var(--bg2)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{l}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: c, letterSpacing: '-1px' }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
              {!result.ok && <div style={{ fontSize: 13, color: '#fca5a5' }}>{result.error}</div>}
            </div>
          )}

          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, padding: 22, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Supported Formats</div>
            {Object.entries(TYPE_INFO).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, boxShadow: `0 0 6px ${v.color}` }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{v.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono', marginLeft: 'auto' }}>{v.accept}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', paddingLeft: 16 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent runs table */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>Recent Runs</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)' }}>
              {['Source', 'Started', 'Records', 'Errors', 'Status'].map(h => (
                <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentRuns.map((run, i) => (
              <tr key={run.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 500 }}>{run.data_source_name}</td>
                <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text2)', fontFamily: 'JetBrains Mono' }}>{new Date(run.started_at).toLocaleString()}</td>
                <td style={{ padding: '12px 18px', fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 700 }}>{run.row_count}</td>
                <td style={{ padding: '12px 18px', fontSize: 13, fontFamily: 'JetBrains Mono', color: run.error_count > 0 ? 'var(--amber)' : 'var(--text3)', fontWeight: run.error_count > 0 ? 700 : 400 }}>{run.error_count}</td>
                <td style={{ padding: '12px 18px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                    background: run.status === 'DONE' ? 'var(--green-glow)' : 'var(--red-glow)',
                    color: run.status === 'DONE' ? 'var(--green)' : 'var(--red)',
                    border: `1px solid ${run.status === 'DONE' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>{run.status}</span>
                </td>
              </tr>
            ))}
            {recentRuns.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No ingestion runs yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

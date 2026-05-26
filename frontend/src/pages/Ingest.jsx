import { useEffect, useState, useRef } from 'react'
import { sources, ingest, runs } from '../utils/api'
import { Upload, CheckCircle, AlertTriangle, FileText, Plus, X } from 'lucide-react'
const TI = {
  SAP_FLAT_FILE:{label:'SAP Flat File',desc:'FAGLL03 tab-delimited export',color:'#3b82f6',accept:'.txt,.csv,.tsv'},
  UTILITY_CSV:{label:'Utility CSV',desc:'Portal CSV from electricity provider',color:'#22c55e',accept:'.csv'},
  TRAVEL_CSV:{label:'Travel CSV',desc:'Concur/Navan expense report',color:'#a78bfa',accept:'.csv'},
}
export default function Ingest(){
  const [sourceList,setSourceList]=useState([]);const [sel,setSel]=useState('');const [file,setFile]=useState(null)
  const [uploading,setUploading]=useState(false);const [result,setResult]=useState(null);const [recentRuns,setRecentRuns]=useState([])
  const [showAdd,setShowAdd]=useState(false);const [newSrc,setNewSrc]=useState({name:'',source_type:'SAP_FLAT_FILE'});const [adding,setAdding]=useState(false)
  const fileRef=useRef()
  const load=()=>{sources.list().then(r=>setSourceList(r.data.results||r.data));runs.list().then(r=>setRecentRuns((r.data.results||r.data).slice(0,8)))}
  useEffect(()=>{load()},[])
  const handleUpload=async()=>{
    if(!sel||!file)return;setUploading(true);setResult(null)
    const fd=new FormData();fd.append('data_source_id',sel);fd.append('file',file)
    try{const r=await ingest.upload(fd);setResult({ok:true,...r.data});setFile(null);load()}
    catch(e){setResult({ok:false,error:e.response?.data?.error||'Upload failed'})}
    finally{setUploading(false)}
  }
  const handleAdd=async()=>{
    setAdding(true)
    try{const orgId=sourceList[0]?.organization;await sources.create({...newSrc,organization:orgId,config:{}});setShowAdd(false);setNewSrc({name:'',source_type:'SAP_FLAT_FILE'});load()}
    catch(e){alert('Error: '+(e.response?.data?.name?.[0]||'Unknown'))}
    finally{setAdding(false)}
  }
  const cur=sourceList.find(s=>s.id===sel);const ti=cur?TI[cur.source_type]:null
  return(
    <div style={{padding:32}}>
      <div style={{marginBottom:28}}><h1 style={{fontSize:22,fontWeight:600,letterSpacing:'-0.4px',marginBottom:4}}>Ingest Data</h1><p style={{color:'var(--text2)',fontSize:13}}>Upload emission source files for normalization and review</p></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,marginBottom:24}}>
        <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:24}}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:20}}>Upload File</div>
          <div style={{marginBottom:16}}>
            <label style={{display:'block',fontSize:12,color:'var(--text2)',marginBottom:6,fontWeight:500}}>Data Source</label>
            <div style={{display:'flex',gap:8}}>
              <select value={sel} onChange={e=>setSel(e.target.value)} style={{flex:1,padding:'9px 10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text)',fontSize:13,outline:'none'}}>
                <option value="">Select a data source…</option>
                {sourceList.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button onClick={()=>setShowAdd(!showAdd)} style={{padding:'8px 10px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:8,color:'var(--text2)',cursor:'pointer',display:'flex',alignItems:'center'}}>{showAdd?<X size={14}/>:<Plus size={14}/>}</button>
            </div>
          </div>
          {showAdd&&<div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:9,padding:14,marginBottom:16}}>
            <input value={newSrc.name} onChange={e=>setNewSrc(n=>({...n,name:e.target.value}))} placeholder="e.g. UK Electricity — EDF"
              style={{width:'100%',padding:'8px 10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:7,color:'var(--text)',fontSize:12,outline:'none',marginBottom:8}}/>
            <select value={newSrc.source_type} onChange={e=>setNewSrc(n=>({...n,source_type:e.target.value}))}
              style={{width:'100%',padding:'8px 10px',background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:7,color:'var(--text)',fontSize:12,outline:'none',marginBottom:10}}>
              {Object.entries(TI).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={handleAdd} disabled={!newSrc.name||adding} style={{padding:'7px 14px',background:'var(--accent)',border:'none',borderRadius:7,color:'#fff',fontSize:12,fontWeight:500,cursor:'pointer',opacity:adding?0.7:1}}>{adding?'Adding…':'Add Source'}</button>
          </div>}
          {ti&&<div style={{display:'flex',gap:8,alignItems:'center',marginBottom:16,padding:'8px 10px',background:`${ti.color}12`,border:`1px solid ${ti.color}25`,borderRadius:8}}>
            <div style={{width:6,height:6,borderRadius:'50%',background:ti.color,flexShrink:0}}/>
            <div><div style={{fontSize:12,fontWeight:500,color:ti.color}}>{ti.label}</div><div style={{fontSize:11,color:'var(--text3)'}}>{ti.desc}</div></div>
          </div>}
          <div onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)setFile(f)}}
            style={{border:`2px dashed ${file?'var(--green)':'var(--border2)'}`,borderRadius:10,padding:'28px 20px',textAlign:'center',cursor:'pointer',marginBottom:16,background:file?'rgba(34,197,94,0.04)':'var(--bg3)'}}>
            <input ref={fileRef} type="file" style={{display:'none'}} accept={ti?.accept||'.csv,.txt,.tsv'} onChange={e=>setFile(e.target.files[0])}/>
            {file?<><FileText size={22} color="var(--green)" style={{margin:'0 auto 8px'}}/><div style={{fontSize:13,fontWeight:500,color:'var(--green)'}}>{file.name}</div><div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>{(file.size/1024).toFixed(1)} KB</div></>
            :<><Upload size={22} color="var(--text3)" style={{margin:'0 auto 8px'}}/><div style={{fontSize:13,color:'var(--text2)'}}>Drop file or click to browse</div><div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>CSV, TXT, TSV supported</div></>}
          </div>
          <button onClick={handleUpload} disabled={!sel||!file||uploading} style={{width:'100%',padding:11,background:'var(--accent)',border:'none',borderRadius:8,color:'#fff',fontWeight:600,fontSize:14,cursor:'pointer',opacity:(!sel||!file||uploading)?0.5:1}}>
            {uploading?'Processing…':'Ingest File'}
          </button>
        </div>
        <div>
          {result&&<div style={{background:result.ok?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)',border:`1px solid ${result.ok?'rgba(34,197,94,0.25)':'rgba(239,68,68,0.25)'}`,borderRadius:12,padding:20,marginBottom:16}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              {result.ok?<CheckCircle size={16} color="var(--green)"/>:<AlertTriangle size={16} color="var(--red)"/>}
              <span style={{fontSize:14,fontWeight:500,color:result.ok?'var(--green)':'var(--red)'}}>{result.ok?'Ingestion complete':'Failed'}</span>
            </div>
            {result.ok&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[['Records created',result.created],['Parse errors',result.errors]].map(([l,v])=><div key={l} style={{background:'var(--bg2)',borderRadius:8,padding:'10px 12px'}}><div style={{fontSize:11,color:'var(--text3)',marginBottom:4}}>{l}</div><div style={{fontSize:20,fontWeight:600}}>{v}</div></div>)}
            </div>}
            {!result.ok&&<div style={{fontSize:13,color:'#fca5a5'}}>{result.error}</div>}
          </div>}
          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:500,marginBottom:14}}>Supported formats</div>
            {Object.entries(TI).map(([k,v])=><div key={k} style={{marginBottom:12,paddingBottom:12,borderBottom:'1px solid var(--border)'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><div style={{width:6,height:6,borderRadius:'50%',background:v.color}}/><span style={{fontSize:12,fontWeight:500}}>{v.label}</span></div>
              <div style={{fontSize:11,color:'var(--text3)'}}>{v.desc} · {v.accept}</div>
            </div>)}
            <div style={{fontSize:11,color:'var(--text3)',marginTop:4}}>Sample files in <code style={{color:'var(--text2)'}}>sample-data/</code> in the repo.</div>
          </div>
        </div>
      </div>
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:12,overflow:'hidden'}}>
        <div style={{padding:'14px 20px',borderBottom:'1px solid var(--border)',fontSize:13,fontWeight:500}}>Recent Runs</div>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>{['Source','Started','Records','Errors','Status'].map(h=><th key={h} style={{padding:'9px 16px',textAlign:'left',fontSize:11,color:'var(--text3)',fontWeight:500,borderBottom:'1px solid var(--border)'}}>{h}</th>)}</tr></thead>
          <tbody>
            {recentRuns.map(run=><tr key={run.id} style={{borderBottom:'1px solid var(--border)'}}>
              <td style={{padding:'10px 16px',fontSize:13}}>{run.data_source_name}</td>
              <td style={{padding:'10px 16px',fontSize:12,color:'var(--text2)'}}>{new Date(run.started_at).toLocaleString()}</td>
              <td style={{padding:'10px 16px',fontSize:12}}>{run.row_count}</td>
              <td style={{padding:'10px 16px',fontSize:12,color:run.error_count>0?'var(--amber)':'var(--text3)'}}>{run.error_count}</td>
              <td style={{padding:'10px 16px'}}><span style={{fontSize:11,fontWeight:500,padding:'3px 8px',borderRadius:4,background:run.status==='DONE'?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)',color:run.status==='DONE'?'var(--green)':'var(--red)'}}>{run.status}</span></td>
            </tr>)}
            {recentRuns.length===0&&<tr><td colSpan={5} style={{padding:24,textAlign:'center',color:'var(--text3)',fontSize:13}}>No runs yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useState, useRef } from 'react'
import { useSync } from '../context/SyncContext'
import BottomSheet from '../components/BottomSheet'
import Icon from '../components/Icon'

const DOC_CATEGORIES = ['全部','機票','住宿','票券','收據','其他']

function AddDocSheet({ isOpen, onClose, onSave, members }) {
  const fileRef = useRef()
  const [form, setForm] = useState({
    title:'', category:'其他', contentType:'link',
    url:'', uploadedBy:members[0]||'YL', note:'',
    fileData:null, fileName:'',
  })
  const reset = () => setForm({ title:'', category:'其他', contentType:'link', url:'', uploadedBy:members[0]||'YL', note:'', fileData:null, fileName:'' })

  const handleFile = (e) => {
    const file = e.target.files[0]; if(!file) return
    if(file.size > 4*1024*1024){ alert('檔案過大（>4MB），請壓縮或改用連結'); return }
    const reader = new FileReader()
    reader.onload = ev => setForm(f=>({...f,fileData:ev.target.result,fileName:file.name}))
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if(!form.title.trim()) return
    if(form.contentType==='link' && !form.url.trim()) return
    if(form.contentType==='file' && !form.fileData) return
    onSave({
      id:`doc_${Date.now()}`, title:form.title, category:form.category,
      type: form.contentType==='link'?'link':'image',
      value: form.contentType==='link'?form.url:form.fileData,
      fileName:form.fileName, uploadedBy:form.uploadedBy,
      date:new Date().toISOString().slice(0,10), note:form.note,
    })
    reset(); onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="86vh">
      <div style={{ padding:'0 16px 32px' }}>
        <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:20, fontWeight:600, color:'var(--ink)', marginBottom:20 }}>
          新增文件
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={lbl}>標題</label>
            <input className="input-field" placeholder="文件標題"
              value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
          </div>
          <div>
            <label style={lbl}>類別</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {['機票','住宿','票券','收據','其他'].map(cat=>(
                <button key={cat} onClick={()=>setForm(f=>({...f,category:cat}))} style={pillStyle(form.category===cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>內容類型</label>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setForm(f=>({...f,contentType:'link'}))} style={pillStyle(form.contentType==='link')}>
                <Icon name="link" size={13}/> 網址連結
              </button>
              <button onClick={()=>setForm(f=>({...f,contentType:'file'}))} style={pillStyle(form.contentType==='file')}>
                <Icon name="image" size={13}/> 上傳圖片/PDF
              </button>
            </div>
          </div>
          {form.contentType==='link' && (
            <div>
              <label style={lbl}>網址</label>
              <input className="input-field" placeholder="https://…"
                value={form.url} onChange={e=>setForm(f=>({...f,url:e.target.value}))} type="url" inputMode="url"/>
            </div>
          )}
          {form.contentType==='file' && (
            <div>
              <label style={lbl}>選擇檔案</label>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" capture="environment"
                onChange={handleFile} style={{ display:'none' }}/>
              <button onClick={()=>fileRef.current?.click()} style={{
                width:'100%', padding:'12px', background:'var(--bg)',
                border:'1.5px dashed rgba(212,144,154,0.4)', borderRadius:10,
                fontSize:13, color:'var(--ink-mid)', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}>
                <Icon name="camera" size={16} color="var(--rose)"/>
                {form.fileData ? `✓ ${form.fileName}` : '拍照或選擇檔案'}
              </button>
              <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:4 }}>限制 4MB 以內</div>
            </div>
          )}
          <div>
            <label style={lbl}>上傳者</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {members.map(m=>(
                <button key={m} onClick={()=>setForm(f=>({...f,uploadedBy:m}))} style={pillStyle(form.uploadedBy===m)}>{m}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>備註（選填）</label>
            <input className="input-field" value={form.note}
              onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>
          </div>
          <button className="btn-primary" onClick={handleSave}>確認新增</button>
          <button className="btn-secondary" onClick={onClose}>取消</button>
        </div>
      </div>
    </BottomSheet>
  )
}

function DocDetailSheet({ doc, isOpen, onClose }) {
  if(!doc) return null
  const isImg = doc.type==='image' && doc.value?.startsWith('data:image')
  const isPDF = doc.type==='image' && doc.value?.startsWith('data:application/pdf')
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="80vh">
      <div style={{ padding:'0 16px 32px' }}>
        <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:20, fontWeight:700, color:'var(--ink)', marginBottom:6 }}>
          {doc.title}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:16 }}>
          <span style={{ fontSize:11, background:'var(--rose-pale)', color:'var(--rose)', padding:'2px 8px', borderRadius:6, fontWeight:600 }}>
            {doc.category}
          </span>
          <span style={{ fontSize:11, color:'var(--ink-soft)' }}>by {doc.uploadedBy} · {doc.date}</span>
        </div>
        {doc.note && (
          <div style={{ padding:'10px 12px', background:'var(--bg)', borderRadius:10, marginBottom:16, fontSize:13, color:'var(--ink-mid)' }}>
            {doc.note}
          </div>
        )}
        {doc.type==='link' && (
          <a href={doc.value} target="_blank" rel="noopener noreferrer" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'12px 16px', background:'linear-gradient(135deg,var(--teal),#5E8FA0)',
            color:'white', borderRadius:12, textDecoration:'none',
            fontSize:14, fontWeight:600, marginBottom:16,
          }}>
            <Icon name="link" size={15} color="white"/> 開啟連結
          </a>
        )}
        {isImg && (
          <img src={doc.value} alt={doc.title}
            style={{ width:'100%', borderRadius:12, marginBottom:16, border:'1px solid rgba(212,144,154,0.15)' }}/>
        )}
        {isPDF && (
          <a href={doc.value} target="_blank" rel="noopener noreferrer" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'12px', background:'var(--bg)',
            border:'1.5px dashed rgba(212,144,154,0.4)',
            color:'var(--ink-mid)', borderRadius:12, textDecoration:'none',
            fontSize:14, fontWeight:600, marginBottom:16,
          }}>
            <Icon name="document" size={15} color="var(--rose)"/> 開啟 PDF
          </a>
        )}
        <button className="btn-secondary" onClick={onClose}>關閉</button>
      </div>
    </BottomSheet>
  )
}

const lbl = { display:'block', fontSize:12, fontWeight:600, color:'var(--ink-mid)', marginBottom:5 }
const pillStyle = (active) => ({
  padding:'5px 13px', borderRadius:20, cursor:'pointer',
  border: active?'none':'1.5px solid rgba(212,144,154,0.3)',
  background: active?'var(--rose)':'white',
  color: active?'white':'var(--ink-mid)',
  fontSize:13, transition:'all 0.15s', flexShrink:0,
  display:'flex', alignItems:'center', gap:5,
})

export default function DocumentsTab() {
  const sync = useSync()
  const [activeCategory, setActiveCategory] = useState('全部')
  const [showAdd, setShowAdd]               = useState(false)
  const [selectedDoc, setSelectedDoc]       = useState(null)

  const docs     = sync.documents
  const members  = sync.members
  const filtered = activeCategory==='全部' ? docs : docs.filter(d=>d.category===activeCategory)

  return (
    <div>
      {/* Category filter */}
      <div className="tabs-scroll" style={{
        padding:'12px 16px', background:'white', borderBottom:'1px solid rgba(212,144,154,0.15)',
      }}>
        {DOC_CATEGORIES.map(cat=>(
          <button key={cat} onClick={()=>setActiveCategory(cat)} style={{ ...pillStyle(activeCategory===cat), whiteSpace:'nowrap' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Doc list */}
      <div style={{ padding:16 }}>
        {filtered.length===0 && (
          <div style={{ textAlign:'center', padding:'52px 0', color:'var(--ink-faint)' }}>
            <Icon name="document" size={36} color="var(--rose-light)" style={{ marginBottom:12 }}/>
            <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:16, color:'var(--ink-soft)', marginTop:12 }}>
              尚無文件
            </div>
            <div style={{ fontSize:12, marginTop:4 }}>點右下角 ＋ 新增文件</div>
          </div>
        )}

        {filtered.map(doc=>(
          <div key={doc.id} style={{
            marginBottom:10, background:'white', borderRadius:'var(--radius)',
            border:'1px solid rgba(212,144,154,0.15)',
            boxShadow:'var(--shadow-card)', overflow:'hidden',
          }}>
            <button onClick={()=>setSelectedDoc(doc)} style={{
              width:'100%', textAlign:'left', background:'none',
              border:'none', padding:'14px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:12,
            }}>
              <div style={{
                width:42, height:42, borderRadius:10, flexShrink:0,
                background:'var(--rose-pale)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Icon name={doc.type==='link'?'link':(doc.value?.startsWith('data:application/pdf')?'document':'image')}
                  size={18} color="var(--rose)"/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {doc.title}
                </div>
                <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:2, display:'flex', gap:8 }}>
                  <span style={{ background:'var(--rose-pale)', color:'var(--rose)', padding:'1px 6px', borderRadius:4, fontSize:10, fontWeight:600 }}>
                    {doc.category}
                  </span>
                  <span>{doc.uploadedBy} · {doc.date}</span>
                </div>
                {doc.note && (
                  <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {doc.note}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <Icon name="chevronRight" size={14} color="var(--ink-faint)"/>
                <button onClick={e=>{ e.stopPropagation(); sync.deleteDocument(doc.id) }} style={{
                  background:'none', border:'none', cursor:'pointer', color:'rgba(212,144,154,0.5)', padding:'2px',
                }}>
                  <Icon name="x" size={14}/>
                </button>
              </div>
            </button>
          </div>
        ))}
      </div>

      <button className="fab" onClick={()=>setShowAdd(true)}>
        <Icon name="plus" size={22} color="white"/>
      </button>

      <AddDocSheet isOpen={showAdd} onClose={()=>setShowAdd(false)}
        onSave={sync.addDocument} members={members}/>
      <DocDetailSheet doc={selectedDoc} isOpen={!!selectedDoc}
        onClose={()=>setSelectedDoc(null)}/>
    </div>
  )
}

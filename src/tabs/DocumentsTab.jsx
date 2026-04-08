import { useState, useRef } from 'react'
import { useSync } from '../context/SyncContext'
import { useGoogleDrive } from '../hooks/useGoogleDrive'
import BottomSheet from '../components/BottomSheet'
import Icon from '../components/Icon'

const DOC_CATEGORIES = ['全部','機票','住宿','票券','收據','其他']

// ── Add Document Sheet ────────────────────────────────────────
function AddDocSheet({ isOpen, onClose, onSave, members }) {
  const drive   = useGoogleDrive()
  const fileRef = useRef()

  const [form, setForm] = useState({
    title:'', category:'其他', mode:'link',
    url:'', uploadedBy: members[0] || 'YL', note:'',
  })
  const [pickedFile, setPickedFile] = useState(null)

  const reset = () => {
    setForm({ title:'', category:'其他', mode:'link', url:'', uploadedBy:members[0]||'YL', note:'' })
    setPickedFile(null)
  }

  const handleFilePick = (e) => {
    const f = e.target.files[0]
    if (f) setPickedFile(f)
    e.target.value = ''   // allow re-pick of same file
  }

  const canSave =
    form.title.trim() &&
    ((form.mode === 'link' && form.url.trim()) ||
     (form.mode === 'drive' && pickedFile))

  const handleSave = async () => {
    if (!canSave) return

    if (form.mode === 'link') {
      onSave({
        id: `doc_${Date.now()}`, title: form.title, category: form.category,
        type: 'link', value: form.url,
        uploadedBy: form.uploadedBy, date: new Date().toISOString().slice(0, 10), note: form.note,
      })
      reset(); onClose()
      return
    }

    // Google Drive upload
    if (!drive.user) {
      try { await drive.signIn() } catch (_) { return }
    }
    try {
      const result = await drive.uploadFile(pickedFile)
      onSave({
        id: `doc_${Date.now()}`, title: form.title, category: form.category,
        type: 'drive',
        driveId:    result.driveId,
        value:      result.viewLink,    // view link stored as main value
        previewUrl: result.previewUrl,
        fileName:   result.name,
        uploadedBy: form.uploadedBy,
        date: new Date().toISOString().slice(0, 10), note: form.note,
      })
      reset(); onClose()
    } catch (_) {
      // error already set in drive.error
    }
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="88vh">
      <div style={{ padding:'0 16px 36px' }}>
        <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:20, fontWeight:600, color:'var(--ink)', marginBottom:20 }}>
          新增文件
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {/* Title */}
          <div>
            <label style={lbl}>標題</label>
            <input className="input-field" placeholder="文件標題"
              value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}/>
          </div>

          {/* Category */}
          <div>
            <label style={lbl}>類別</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {['機票','住宿','票券','收據','其他'].map(cat => (
                <button key={cat} onClick={() => setForm(f => ({...f, category: cat}))} style={pill(form.category === cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label style={lbl}>儲存方式</label>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setForm(f => ({...f, mode:'link'}))} style={pill(form.mode === 'link')}>
                <Icon name="link" size={13}/> 貼上網址
              </button>
              <button onClick={() => setForm(f => ({...f, mode:'drive'}))} style={pill(form.mode === 'drive')}>
                <Icon name="image" size={13}/> 上傳至 Google Drive
              </button>
            </div>
          </div>

          {/* Link mode */}
          {form.mode === 'link' && (
            <div>
              <label style={lbl}>網址</label>
              <input className="input-field" placeholder="https://…" type="url" inputMode="url"
                value={form.url} onChange={e => setForm(f => ({...f, url: e.target.value}))}/>
            </div>
          )}

          {/* Drive mode */}
          {form.mode === 'drive' && (
            <div>
              {/* Google account status */}
              {drive.user ? (
                <div style={{
                  display:'flex', alignItems:'center', gap:8, padding:'8px 12px',
                  background:'var(--sage-pale)', borderRadius:10, marginBottom:10,
                  border:'1px solid var(--sage-light)',
                }}>
                  {drive.user.picture && (
                    <img src={drive.user.picture} alt="" style={{ width:24, height:24, borderRadius:'50%' }}/>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {drive.user.email}
                    </div>
                    <div style={{ fontSize:10, color:'var(--ink-soft)' }}>已連結 Google Drive</div>
                  </div>
                  <button onClick={drive.signOut} style={{
                    background:'none', border:'none', fontSize:11, color:'var(--ink-soft)', cursor:'pointer',
                  }}>登出</button>
                </div>
              ) : (
                <button onClick={drive.signIn} disabled={drive.loading} style={{
                  width:'100%', padding:'11px', marginBottom:10,
                  background:'white', borderRadius:10, cursor:'pointer',
                  border:'1.5px solid rgba(212,132,154,0.3)',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  fontSize:13, fontWeight:600, color:'var(--ink-mid)',
                  opacity: drive.loading ? 0.6 : 1,
                }}>
                  <svg width="16" height="16" viewBox="0 0 48 48">
                    <path fill="#4285F4" d="M44.5 20H24v8h11.7C34.3 33.1 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l6-6C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.2-4z"/>
                  </svg>
                  {drive.loading ? '登入中…' : '使用 Google 帳號登入'}
                </button>
              )}

              {/* File picker */}
              <label style={lbl}>選擇檔案（任何類型）</label>
              <input ref={fileRef} type="file" accept="*/*"
                onChange={handleFilePick} style={{ display:'none' }}/>
              <button onClick={() => fileRef.current?.click()} style={{
                width:'100%', padding:'12px', background:'var(--bg)',
                border:`1.5px dashed ${pickedFile ? 'var(--rose)' : 'rgba(212,132,154,0.4)'}`,
                borderRadius:10, fontSize:13,
                color: pickedFile ? 'var(--rose)' : 'var(--ink-mid)',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                fontWeight: pickedFile ? 600 : 400,
              }}>
                <Icon name="document" size={16} color={pickedFile ? 'var(--rose)' : 'var(--ink-soft)'}/>
                {pickedFile
                  ? `${pickedFile.name} (${(pickedFile.size / 1024 / 1024).toFixed(1)} MB)`
                  : '點此選擇或拖入檔案'}
              </button>
              <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:4 }}>
                支援所有格式，無大小限制
              </div>

              {/* Upload progress */}
              {drive.loading && drive.progress > 0 && (
                <div style={{ marginTop:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--ink-soft)', marginBottom:4 }}>
                    <span>上傳中…</span><span>{drive.progress}%</span>
                  </div>
                  <div style={{ height:5, background:'var(--rose-pale)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${drive.progress}%`, background:'var(--rose)', borderRadius:3, transition:'width 0.2s' }}/>
                  </div>
                </div>
              )}

              {/* Error */}
              {drive.error && (
                <div style={{ marginTop:6, fontSize:12, color:'#C0392B', padding:'6px 10px', background:'#FDECEA', borderRadius:8 }}>
                  {drive.error}
                </div>
              )}
            </div>
          )}

          {/* Uploader */}
          <div>
            <label style={lbl}>上傳者</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {members.map(m => (
                <button key={m} onClick={() => setForm(f => ({...f, uploadedBy: m}))} style={pill(form.uploadedBy === m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label style={lbl}>備註（選填）</label>
            <input className="input-field" value={form.note}
              onChange={e => setForm(f => ({...f, note: e.target.value}))}/>
          </div>

          <button className="btn-primary" onClick={handleSave}
            disabled={!canSave || drive.loading}
            style={{ opacity: (!canSave || drive.loading) ? 0.5 : 1 }}>
            {drive.loading && form.mode === 'drive' ? '上傳中…' : '確認新增'}
          </button>
          <button className="btn-secondary" onClick={() => { reset(); onClose() }}>取消</button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ── Doc Detail Sheet ──────────────────────────────────────────
function DocDetailSheet({ doc, isOpen, onClose }) {
  if (!doc) return null

  const isDrive = doc.type === 'drive'
  const isLink  = doc.type === 'link'
  const isImage = doc.type === 'image' && doc.value?.startsWith('data:image')
  const isPDF   = doc.type === 'image' && doc.value?.startsWith('data:application/pdf')

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
          <span style={{ fontSize:11, color:'var(--ink-soft)' }}>
            by {doc.uploadedBy} · {doc.date}
          </span>
        </div>

        {doc.note && (
          <div style={{ padding:'10px 12px', background:'var(--bg)', borderRadius:10, marginBottom:16, fontSize:13, color:'var(--ink-mid)' }}>
            {doc.note}
          </div>
        )}

        {/* Drive preview */}
        {isDrive && doc.previewUrl && (
          <img src={doc.previewUrl} alt={doc.title}
            style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:10, marginBottom:12, border:'1px solid rgba(212,132,154,0.15)' }}
            onError={e => { e.target.style.display = 'none' }}/>
        )}

        {/* Open buttons */}
        {(isDrive || isLink) && (
          <a href={doc.value} target="_blank" rel="noopener noreferrer" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'12px 16px',
            background: isDrive
              ? 'linear-gradient(135deg,#4285F4,#34A853)'
              : 'linear-gradient(135deg,var(--teal),#5E8FA0)',
            color:'white', borderRadius:12, textDecoration:'none',
            fontSize:14, fontWeight:600, marginBottom:16,
          }}>
            <Icon name={isDrive ? 'document' : 'link'} size={15} color="white"/>
            {isDrive ? '在 Google Drive 開啟' : '開啟連結'}
          </a>
        )}

        {/* Legacy base64 image */}
        {isImage && (
          <img src={doc.value} alt={doc.title}
            style={{ width:'100%', borderRadius:12, marginBottom:16, border:'1px solid rgba(212,132,154,0.15)' }}/>
        )}
        {isPDF && (
          <a href={doc.value} target="_blank" rel="noopener noreferrer" style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            padding:'12px', background:'var(--bg)', border:'1.5px dashed rgba(212,132,154,0.4)',
            color:'var(--ink-mid)', borderRadius:12, textDecoration:'none', fontSize:14, fontWeight:600, marginBottom:16,
          }}>
            <Icon name="document" size={15} color="var(--rose)"/> 開啟 PDF
          </a>
        )}

        <button className="btn-secondary" onClick={onClose}>關閉</button>
      </div>
    </BottomSheet>
  )
}

// ── Style helpers ────────────────────────────────────────────
const lbl = { display:'block', fontSize:12, fontWeight:600, color:'var(--ink-mid)', marginBottom:5 }
const pill = (active) => ({
  padding:'5px 13px', borderRadius:20, cursor:'pointer',
  border: active ? 'none' : '1.5px solid rgba(212,132,154,0.3)',
  background: active ? 'var(--rose)' : 'white',
  color: active ? 'white' : 'var(--ink-mid)',
  fontSize:13, transition:'all 0.15s', flexShrink:0,
  display:'flex', alignItems:'center', gap:5,
})

// ── Main ─────────────────────────────────────────────────────
export default function DocumentsTab() {
  const sync   = useSync()
  const [activeCategory, setActiveCategory] = useState('全部')
  const [showAdd,        setShowAdd]        = useState(false)
  const [selectedDoc,    setSelectedDoc]    = useState(null)

  const docs     = sync.documents
  const members  = sync.members
  const filtered = activeCategory === '全部' ? docs : docs.filter(d => d.category === activeCategory)

  function docIcon(doc) {
    if (doc.type === 'drive') return 'document'
    if (doc.type === 'link')  return 'link'
    if (doc.value?.startsWith('data:application/pdf')) return 'document'
    return 'image'
  }

  return (
    <div>
      {/* Category filter */}
      <div className="tabs-scroll" style={{ padding:'12px 16px', background:'white', borderBottom:'1px solid rgba(212,132,154,0.15)' }}>
        {DOC_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{ ...pill(activeCategory === cat), whiteSpace:'nowrap' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Doc list */}
      <div style={{ padding:16 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'52px 0', color:'var(--ink-faint)' }}>
            <Icon name="document" size={36} color="var(--rose-light)" style={{ marginBottom:12 }}/>
            <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:16, color:'var(--ink-soft)', marginTop:12 }}>
              尚無文件
            </div>
            <div style={{ fontSize:12, marginTop:4 }}>點右下角 ＋ 新增文件</div>
          </div>
        )}

        {filtered.map(doc => (
          <div key={doc.id} style={{
            marginBottom:10, background:'white', borderRadius:'var(--radius)',
            border:'1px solid rgba(212,132,154,0.15)',
            boxShadow:'var(--shadow-card)', overflow:'hidden',
          }}>
            <button onClick={() => setSelectedDoc(doc)} style={{
              width:'100%', textAlign:'left', background:'none',
              border:'none', padding:'14px', cursor:'pointer',
              display:'flex', alignItems:'center', gap:12,
            }}>
              {/* Thumbnail or icon */}
              <div style={{
                width:42, height:42, borderRadius:10, flexShrink:0, overflow:'hidden',
                background:'var(--rose-pale)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {doc.type === 'drive' && doc.previewUrl ? (
                  <img src={doc.previewUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}
                    onError={e => { e.target.style.display='none' }}/>
                ) : (
                  <Icon name={docIcon(doc)} size={18} color="var(--rose)"/>
                )}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, color:'var(--ink)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {doc.title}
                </div>
                <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:2, display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ background:'var(--rose-pale)', color:'var(--rose)', padding:'1px 6px', borderRadius:4, fontSize:10, fontWeight:600 }}>
                    {doc.category}
                  </span>
                  {doc.type === 'drive' && (
                    <span style={{ fontSize:10, color:'#4285F4', fontWeight:500 }}>Drive</span>
                  )}
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
                <button onClick={e => { e.stopPropagation(); sync.deleteDocument(doc.id) }} style={{
                  background:'none', border:'none', cursor:'pointer', color:'rgba(212,132,154,0.5)', padding:'2px',
                }}>
                  <Icon name="x" size={14}/>
                </button>
              </div>
            </button>
          </div>
        ))}
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        <Icon name="plus" size={22} color="white"/>
      </button>

      <AddDocSheet isOpen={showAdd} onClose={() => setShowAdd(false)}
        onSave={sync.addDocument} members={members}/>
      <DocDetailSheet doc={selectedDoc} isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}/>
    </div>
  )
}

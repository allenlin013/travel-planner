import { useState, useRef } from 'react'
import { getDocuments, saveDocuments, getMembers } from '../utils/storage'
import BottomSheet from '../components/BottomSheet'

const DOC_CATEGORIES = ['全部', '機票', '住宿', '票券', '收據', '其他']
const CAT_ICONS = { '機票': '✈️', '住宿': '🏠', '票券': '🎟', '收據': '🧾', '其他': '📌' }

function AddDocSheet({ isOpen, onClose, onSave, members }) {
  const fileRef = useRef()
  const [form, setForm] = useState({
    title: '', category: '其他',
    contentType: 'link', url: '',
    uploadedBy: members[0] || 'YL', note: '',
    fileData: null, fileName: '',
  })

  const reset = () => setForm({
    title: '', category: '其他',
    contentType: 'link', url: '',
    uploadedBy: members[0] || 'YL', note: '',
    fileData: null, fileName: '',
  })

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      alert('檔案過大（> 4MB），請壓縮後再上傳或改用連結')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm(f => ({ ...f, fileData: ev.target.result, fileName: file.name }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!form.title.trim()) return
    if (form.contentType === 'link' && !form.url.trim()) return
    if (form.contentType === 'file' && !form.fileData) return

    onSave({
      id: `doc_${Date.now()}`,
      title: form.title,
      category: form.category,
      type: form.contentType === 'link' ? 'link' : 'image',
      value: form.contentType === 'link' ? form.url : form.fileData,
      fileName: form.fileName,
      uploadedBy: form.uploadedBy,
      date: new Date().toISOString().slice(0, 10),
      note: form.note,
    })
    reset()
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="85vh">
      <div style={{ padding: '0 16px 32px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#2C2C2C', marginBottom: 20 }}>
          📄 新增文件
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>標題</label>
            <input className="input-field" placeholder="文件標題" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>類別</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['機票', '住宿', '票券', '收據', '其他'].map(cat => (
                <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                  style={pillStyle(form.category === cat)}>
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>內容類型</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setForm(f => ({ ...f, contentType: 'link' }))}
                style={pillStyle(form.contentType === 'link')}>
                🔗 網址連結
              </button>
              <button onClick={() => setForm(f => ({ ...f, contentType: 'file' }))}
                style={pillStyle(form.contentType === 'file')}>
                🖼 上傳圖片/PDF
              </button>
            </div>
          </div>

          {form.contentType === 'link' && (
            <div>
              <label style={labelStyle}>網址</label>
              <input className="input-field" placeholder="https://..." value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                type="url" inputMode="url" />
            </div>
          )}

          {form.contentType === 'file' && (
            <div>
              <label style={labelStyle}>選擇檔案</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                onChange={handleFile}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', padding: '12px',
                  background: '#FDF0F5', border: '1px dashed rgba(242,167,195,0.6)',
                  borderRadius: 10, fontSize: 14, color: '#8B5E72',
                  cursor: 'pointer', fontWeight: 500,
                }}
              >
                {form.fileData ? `✓ ${form.fileName}` : '📷 拍照或選擇檔案'}
              </button>
              <div style={{ fontSize: 11, color: '#BDC3C7', marginTop: 4 }}>
                限制 4MB 以內，超過請用連結
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>上傳者</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {members.map(m => (
                <button key={m} onClick={() => setForm(f => ({ ...f, uploadedBy: m }))}
                  style={pillStyle(form.uploadedBy === m)}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>備註（選填）</label>
            <input className="input-field" placeholder="" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>

          <button onClick={handleSave} style={saveButtonStyle}>確認新增</button>
        </div>
      </div>
    </BottomSheet>
  )
}

function DocDetailSheet({ doc, isOpen, onClose }) {
  if (!doc) return null
  const isImage = doc.type === 'image' && doc.value?.startsWith('data:image')
  const isPDF = doc.type === 'image' && doc.value?.startsWith('data:application/pdf')

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="80vh">
      <div style={{ padding: '0 16px 32px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#2C2C2C', marginBottom: 4 }}>
          {doc.title}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 12, background: '#FDF0F5', color: '#8B5E72', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>
            {CAT_ICONS[doc.category] || '📌'} {doc.category}
          </span>
          <span style={{ fontSize: 12, color: '#95A5A6' }}>by {doc.uploadedBy}</span>
        </div>

        {doc.note && (
          <div style={{ padding: '10px 12px', background: '#FDF0F5', borderRadius: 10, marginBottom: 16, fontSize: 13, color: '#666' }}>
            {doc.note}
          </div>
        )}

        {doc.type === 'link' && (
          <a
            href={doc.value}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', padding: '12px 16px',
              background: 'linear-gradient(135deg, #A8D8EA, #7ABFD4)',
              color: 'white', borderRadius: 12, textDecoration: 'none',
              fontSize: 14, fontWeight: 600, textAlign: 'center',
              marginBottom: 16,
            }}
          >
            🔗 開啟連結
          </a>
        )}

        {isImage && (
          <img
            src={doc.value}
            alt={doc.title}
            style={{ width: '100%', borderRadius: 12, marginBottom: 16, border: '1px solid rgba(242,167,195,0.2)' }}
          />
        )}

        {isPDF && (
          <a
            href={doc.value}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', padding: '12px 16px',
              background: '#FDF0F5',
              color: '#8B5E72', borderRadius: 12, textDecoration: 'none',
              fontSize: 14, fontWeight: 600, textAlign: 'center',
              border: '1px dashed rgba(242,167,195,0.4)',
              marginBottom: 16,
            }}
          >
            📄 開啟 PDF
          </a>
        )}

        <button onClick={onClose} style={{
          width: '100%', padding: '11px', background: 'white',
          border: '1px solid rgba(242,167,195,0.4)', borderRadius: 10,
          fontSize: 14, color: '#8B5E72', cursor: 'pointer', fontWeight: 500,
        }}>
          關閉
        </button>
      </div>
    </BottomSheet>
  )
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#8B5E72', marginBottom: 6 }
const pillStyle = (active) => ({
  padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
  border: active ? 'none' : '1px solid rgba(242,167,195,0.4)',
  background: active ? '#F2A7C3' : 'white',
  color: active ? 'white' : '#2C2C2C',
  fontSize: 13, transition: 'all 0.15s', flexShrink: 0,
})
const saveButtonStyle = {
  width: '100%', padding: '13px',
  background: 'linear-gradient(135deg, #F2A7C3, #ED89AB)',
  color: 'white', border: 'none', borderRadius: 12,
  fontSize: 15, fontWeight: 700, cursor: 'pointer',
}

export default function DocumentsTab() {
  const members = getMembers()
  const [docs, setDocs] = useState(getDocuments)
  const [activeCategory, setActiveCategory] = useState('全部')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState(null)

  const filtered = activeCategory === '全部'
    ? docs
    : docs.filter(d => d.category === activeCategory)

  const handleSave = (doc) => {
    const updated = [doc, ...docs]
    setDocs(updated)
    saveDocuments(updated)
  }

  const handleDelete = (id) => {
    const updated = docs.filter(d => d.id !== id)
    setDocs(updated)
    saveDocuments(updated)
  }

  return (
    <div>
      {/* Category filter */}
      <div className="tabs-scroll" style={{ padding: '12px 16px', background: 'white', borderBottom: '1px solid rgba(242,167,195,0.2)' }}>
        {DOC_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{
              ...pillStyle(activeCategory === cat),
              whiteSpace: 'nowrap',
            }}>
            {CAT_ICONS[cat] ? `${CAT_ICONS[cat]} ` : ''}{cat}
          </button>
        ))}
      </div>

      {/* Doc list */}
      <div style={{ padding: 16 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#BDC3C7' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            <div style={{ fontSize: 14 }}>尚無文件</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>點右下角 ＋ 新增文件</div>
          </div>
        )}

        {filtered.map(doc => (
          <div key={doc.id} style={{
            marginBottom: 10, background: 'white', borderRadius: 14,
            border: '1px solid rgba(242,167,195,0.2)',
            boxShadow: '2px 4px 8px rgba(242,167,195,0.12)',
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setSelectedDoc(doc)}
              style={{
                width: '100%', textAlign: 'left', background: 'none',
                border: 'none', padding: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: '#FDF0F5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>
                {doc.type === 'link' ? '🔗' : (doc.value?.startsWith('data:application/pdf') ? '📄' : '🖼')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600, color: '#2C2C2C',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {doc.title}
                </div>
                <div style={{ fontSize: 11, color: '#95A5A6', marginTop: 2, display: 'flex', gap: 8 }}>
                  <span style={{
                    background: '#FDF0F5', color: '#8B5E72',
                    padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                  }}>
                    {CAT_ICONS[doc.category] || '📌'} {doc.category}
                  </span>
                  <span>{doc.uploadedBy} · {doc.date}</span>
                </div>
                {doc.note && (
                  <div style={{ fontSize: 11, color: '#BDC3C7', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.note}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14, color: '#D0A0B0' }}>›</span>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(doc.id) }}
                  style={{
                    background: 'none', border: 'none', color: '#F2A7C3',
                    fontSize: 16, cursor: 'pointer', padding: '2px 4px', lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAdd(true)}>＋</button>

      <AddDocSheet
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleSave}
        members={members}
      />

      <DocDetailSheet
        doc={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
      />
    </div>
  )
}

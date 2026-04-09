import { useState, useRef } from 'react'
import { useSync } from '../context/SyncContext'
import Icon from '../components/Icon'
import BottomSheet from '../components/BottomSheet'

// ── Image helpers (device-local, not synced to Firestore) ──────
const IMG_KEY = (id) => `shop_img_${id}`

function loadImg(id) {
  try { return localStorage.getItem(IMG_KEY(id)) || null } catch (_) { return null }
}
function saveImg(id, dataUrl) {
  try { localStorage.setItem(IMG_KEY(id), dataUrl) } catch (_) {}
}
function deleteImg(id) {
  try { localStorage.removeItem(IMG_KEY(id)) } catch (_) {}
}

/** Compress image to JPEG ≤ 800px wide / tall, quality 0.75 */
function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else                { width  = Math.round(width  * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.75))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ── Full-screen image preview ─────────────────────────────────
function ImagePreview({ src, onClose }) {
  if (!src) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <img
        src={src}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '96vw', maxHeight: '88vh', borderRadius: 12, objectFit: 'contain' }}
      />
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 20, right: 20,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Icon name="x" size={18} color="white"/>
      </button>
    </div>
  )
}

const CATEGORIES = ['零食', '飲料', '伴手禮', '日用品', '電子', '其他']

// ── Add Item Sheet ────────────────────────────────────────────
function AddItemSheet({ isOpen, onClose, onAdd }) {
  const [name, setName]     = useState('')
  const [qty,  setQty]      = useState('')
  const [cat,  setCat]      = useState('')
  const [note, setNote]     = useState('')

  const reset = () => { setName(''); setQty(''); setCat(''); setNote('') }

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({
      id:      `shop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name:    name.trim(),
      qty:     qty.trim(),
      note:    note.trim(),
      category: cat,
      checked: false,
    })
    reset(); onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={() => { reset(); onClose() }} height="auto">
      <div style={{ padding: '0 20px 40px' }}>
        <div style={{ fontFamily: 'Cormorant Garant,serif', fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginBottom: 18 }}>
          新增購物項目
        </div>

        <label style={lbl}>品項名稱</label>
        <input className="input-field" placeholder="例：草莓大福" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 14 }}/>

        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>數量（選填）</label>
            <input className="input-field" placeholder="例：2個" value={qty} onChange={e => setQty(e.target.value)}/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>備註（選填）</label>
            <input className="input-field" placeholder="例：難波限定" value={note} onChange={e => setNote(e.target.value)}/>
          </div>
        </div>

        <label style={lbl}>分類（選填）</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(cat === c ? '' : c)} style={{
              padding: '5px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              background: cat === c ? 'var(--rose)' : 'var(--rose-pale)',
              color: cat === c ? 'white' : 'var(--rose)',
            }}>{c}</button>
          ))}
        </div>

        <button onClick={handleAdd} disabled={!name.trim()} className="btn-primary" style={{ width: '100%', opacity: name.trim() ? 1 : 0.5 }}>
          新增
        </button>
      </div>
    </BottomSheet>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 5 }

// ── Shopping Item Row ─────────────────────────────────────────
function ShoppingRow({ item, onToggle, onDelete, onImgChange }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [imgSrc,        setImgSrc]        = useState(() => loadImg(item.id))
  const [previewOpen,   setPreviewOpen]   = useState(false)
  const fileRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await compressImage(file)
    saveImg(item.id, dataUrl)
    setImgSrc(dataUrl)
    onImgChange?.()
    // reset so same file can be selected again
    e.target.value = ''
  }

  const handleDeleteImg = (e) => {
    e.stopPropagation()
    deleteImg(item.id)
    setImgSrc(null)
  }

  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: item.checked ? 'rgba(212,132,154,0.04)' : 'white',
        borderRadius: 12,
        border: `1px solid ${item.checked ? 'rgba(212,132,154,0.1)' : 'rgba(212,132,154,0.18)'}`,
        marginBottom: 6,
        transition: 'all 0.2s',
      }}>
        {/* Checkbox */}
        <button onClick={() => onToggle(item)} style={{
          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
          border: item.checked ? 'none' : '2px solid rgba(212,132,154,0.4)',
          background: item.checked ? 'linear-gradient(135deg,var(--rose-vivid),var(--rose-dark))' : 'white',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          {item.checked && <Icon name="check" size={12} color="white" strokeWidth={2.5}/>}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 500, color: item.checked ? 'var(--ink-faint)' : 'var(--ink)',
            textDecoration: item.checked ? 'line-through' : 'none',
            lineHeight: 1.3,
          }}>
            {item.name}
            {item.qty && <span style={{ fontSize: 12, color: 'var(--ink-soft)', marginLeft: 6, fontWeight: 400 }}>× {item.qty}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
            {item.category && (
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--rose)', background: 'var(--rose-pale)', padding: '1px 6px', borderRadius: 6 }}>
                {item.category}
              </span>
            )}
            {item.note && <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{item.note}</span>}
          </div>
        </div>

        {/* Thumbnail or camera button */}
        {imgSrc ? (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={imgSrc}
              alt=""
              onClick={() => setPreviewOpen(true)}
              style={{
                width: 52, height: 52, borderRadius: 8, objectFit: 'cover',
                border: '1.5px solid rgba(212,132,154,0.25)',
                cursor: 'pointer',
                opacity: item.checked ? 0.5 : 1,
              }}
            />
            {/* Remove image × */}
            <button
              onClick={handleDeleteImg}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 18, height: 18, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="x" size={10} color="white" strokeWidth={2.5}/>
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            title="新增參考圖片"
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              border: '1.5px dashed rgba(212,132,154,0.35)',
              background: 'var(--rose-pale)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="camera" size={15} color="var(--rose)" strokeWidth={1.5}/>
          </button>
        )}

        {/* Hidden file input — no capture so user can choose gallery or camera */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Delete item */}
        <button onClick={() => {
          if (confirmDelete) { deleteImg(item.id); onDelete(item.id); setConfirmDelete(false) }
          else { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 2000) }
        }} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Icon name="trash" size={15} color={confirmDelete ? '#e05555' : 'rgba(212,132,154,0.4)'}/>
          {confirmDelete && <span style={{ fontSize: 9, color: '#e05555', fontWeight: 700, lineHeight: 1 }}>確認</span>}
        </button>
      </div>

      {/* Full-screen preview */}
      {previewOpen && <ImagePreview src={imgSrc} onClose={() => setPreviewOpen(false)}/>}
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function ShoppingTab() {
  const sync = useSync()
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter]   = useState('all') // 'all' | 'pending' | 'checked'

  const items    = sync.shopping || []
  const total    = items.length
  const checked  = items.filter(i => i.checked).length
  const progress = total > 0 ? (checked / total) * 100 : 0

  // Filter + sort: unchecked first
  const visible = items
    .filter(i => filter === 'all' ? true : filter === 'pending' ? !i.checked : i.checked)
    .sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1
      return (a.category || '').localeCompare(b.category || '')
    })

  // Group by category (for unchecked)
  const unchecked = visible.filter(i => !i.checked)
  const checkedItems = visible.filter(i => i.checked)

  // Group unchecked by category
  const groups = {}
  unchecked.forEach(item => {
    const key = item.category || '未分類'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })
  // Sort categories: 未分類 last
  const sortedGroups = Object.keys(groups).sort((a, b) => {
    if (a === '未分類') return 1
    if (b === '未分類') return -1
    return a.localeCompare(b)
  })

  const handleToggle = (item) => sync.updateShoppingItem({ ...item, checked: !item.checked })
  const handleDelete = (id) => sync.deleteShoppingItem(id)
  const handleAdd    = (item) => sync.addShoppingItem(item)

  return (
    <div>
      {/* Header card */}
      <div style={{ margin: 16 }}>
        <div style={{
          padding: '18px', borderRadius: 16,
          background: 'linear-gradient(135deg, #8BA88A, #7A9879)',
          boxShadow: '0 6px 24px rgba(139,168,138,0.35)', color: 'white',
        }}>
          <div style={{ fontSize: 9, opacity: 0.8, letterSpacing: '0.14em', fontFamily: 'Cormorant Garant,serif', textTransform: 'uppercase', marginBottom: 4 }}>
            Shopping List
          </div>
          <div style={{ fontSize: 28, fontWeight: 300, fontFamily: 'Cormorant Garant,serif', letterSpacing: '0.02em' }}>
            {checked} / {total} <span style={{ fontSize: 14, opacity: 0.8, fontWeight: 400 }}>項已完成</span>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 12, height: 4, background: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: 'white', borderRadius: 2, transition: 'width 0.4s ease' }}/>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        {[['all', '全部'], ['pending', '未購'], ['checked', '已購']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            background: filter === key ? 'var(--rose)' : 'var(--rose-pale)',
            color: filter === key ? 'white' : 'var(--rose)',
          }}>{label}</button>
        ))}
      </div>

      {/* Empty state */}
      {total === 0 && (
        <div style={{ textAlign: 'center', padding: '52px 0', color: 'var(--ink-faint)' }}>
          <Icon name="shoppingCart" size={36} color="rgba(212,132,154,0.35)" style={{ marginBottom: 12 }}/>
          <div style={{ fontFamily: 'Cormorant Garant,serif', fontSize: 16, color: 'var(--ink-soft)', marginTop: 12 }}>購物清單空空如也</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>點右下角 ＋ 開始新增</div>
        </div>
      )}

      {/* Items */}
      <div style={{ padding: '0 16px 100px' }}>
        {/* Grouped unchecked items */}
        {sortedGroups.map(group => (
          <div key={group}>
            {sortedGroups.length > 1 || group !== '未分類' ? (
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-mid)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, marginTop: 6 }}>
                {group}
              </div>
            ) : null}
            {groups[group].map(item => (
              <ShoppingRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onImgChange={()=>{}}/>
            ))}
          </div>
        ))}

        {/* Checked items section */}
        {checkedItems.length > 0 && (
          <>
            {unchecked.length > 0 && (
              <div style={{ height: 1, background: 'rgba(212,132,154,0.1)', margin: '12px 0' }}/>
            )}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
              已購買 · {checkedItems.length} 項
            </div>
            {checkedItems.map(item => (
              <ShoppingRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} onImgChange={()=>{}}/>
            ))}
          </>
        )}
      </div>

      <button className="fab" onClick={() => setShowAdd(true)}>
        <Icon name="plus" size={22} color="white"/>
      </button>

      <AddItemSheet isOpen={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd}/>
    </div>
  )
}

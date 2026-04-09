import { useState } from 'react'
import {
  DndContext, closestCenter,
  PointerSensor, TouchSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSync } from '../context/SyncContext'
import Icon from '../components/Icon'

const MEMBER_COLORS = {
  YL:'#D4849A', CC:'#7AA8B8', Fu:'#8FAB9A',
  Wen:'#B8A9C9', Dad:'#C8A87A', Sister:'#D4A8B8',
}
const getMC = (m) => MEMBER_COLORS[m] || '#A99890'

const CAT_ICONS = ['🧳','👗','💊','📸','🎒','🛁','🎎','📚','🍱','🔑','✈️','💴','🌸','🗺️','👟','🎁']

// ── Add Item Modal ─────────────────────────────────────────────
function AddItemModal({ catId, isOpen, onClose, onAdd, allMembers }) {
  const [text, setText]               = useState('')
  const [selectedMembers, setSelected] = useState(allMembers)

  const toggle = (m) => setSelected(prev =>
    prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
  )

  const handleAdd = () => {
    if (!text.trim()) return
    onAdd(catId, text.trim(), selectedMembers)
    setText(''); setSelected(allMembers); onClose()
  }

  if (!isOpen) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(61,48,40,0.4)', backdropFilter:'blur(2px)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', background:'var(--bg-card)', borderRadius:'20px 20px 0 0', padding:'20px 16px 44px', boxShadow:'0 -4px 30px rgba(212,132,154,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <div style={{ width:32, height:4, borderRadius:2, background:'var(--rose-light)' }}/>
        </div>
        <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:18, fontWeight:700, color:'var(--ink)', marginBottom:14 }}>新增清單項目</div>
        <input className="input-field" placeholder="項目名稱…" value={text} onChange={e=>setText(e.target.value)} autoFocus onKeyDown={e=>{ if(e.key==='Enter') handleAdd() }} style={{ marginBottom:14 }}/>
        <div style={{ marginBottom:16 }}>
          <div style={lbl}>此項目適用成員</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {allMembers.map(m => {
              const on = selectedMembers.includes(m)
              return <button key={m} onClick={()=>toggle(m)} style={{ padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.15s', background: on?getMC(m):'transparent', color: on?'white':'var(--ink-soft)', border:`2px solid ${on?getMC(m):'rgba(212,132,154,0.25)'}` }}>{m}</button>
            })}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-primary" style={{ flex:1 }} onClick={handleAdd}>新增</button>
          <button className="btn-secondary" style={{ flex:1 }} onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

// ── Edit Item Members Modal ────────────────────────────────────
function EditMembersModal({ item, catId, isOpen, onClose, onSave, allMembers }) {
  const [selected, setSelected] = useState(item?.members ?? allMembers)
  const toggle = (m) => setSelected(prev => prev.includes(m) ? prev.filter(x=>x!==m) : [...prev,m])

  if (!isOpen || !item) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(61,48,40,0.35)', backdropFilter:'blur(2px)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', background:'var(--bg-card)', borderRadius:'20px 20px 0 0', padding:'20px 16px 44px', boxShadow:'0 -4px 30px rgba(212,132,154,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:14 }}>
          <div style={{ width:32, height:4, borderRadius:2, background:'var(--rose-light)' }}/>
        </div>
        <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:16, fontWeight:700, color:'var(--ink)', marginBottom:8 }}>編輯適用成員</div>
        <div style={{ fontSize:13, color:'var(--ink-soft)', marginBottom:14 }}>{item.text}</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
          {allMembers.map(m => {
            const on = selected.includes(m)
            return <button key={m} onClick={()=>toggle(m)} style={{ padding:'6px 14px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.15s', background: on?getMC(m):'transparent', color: on?'white':'var(--ink-soft)', border:`2px solid ${on?getMC(m):'rgba(212,132,154,0.25)'}` }}>{m}</button>
          })}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-primary" style={{ flex:1 }} onClick={()=>{ onSave(catId, item.id, selected); onClose() }}>儲存</button>
          <button className="btn-secondary" style={{ flex:1 }} onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

// ── Add Category Modal ────────────────────────────────────────
function AddCategoryModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🧳')

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd(name.trim(), icon)
    setName(''); setIcon('🧳'); onClose()
  }

  if (!isOpen) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(61,48,40,0.4)', backdropFilter:'blur(2px)', display:'flex', alignItems:'flex-end' }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'100%', background:'var(--bg-card)', borderRadius:'20px 20px 0 0', padding:'20px 16px 44px', boxShadow:'0 -4px 30px rgba(212,132,154,0.15)' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
          <div style={{ width:32, height:4, borderRadius:2, background:'var(--rose-light)' }}/>
        </div>
        <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:18, fontWeight:700, color:'var(--ink)', marginBottom:14 }}>新增清單分類</div>

        <label style={lbl}>分類名稱</label>
        <input className="input-field" placeholder="例：行李打包" value={name} onChange={e=>setName(e.target.value)} autoFocus onKeyDown={e=>{ if(e.key==='Enter') handleAdd() }} style={{ marginBottom:14 }}/>

        <label style={lbl}>圖示</label>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:20 }}>
          {CAT_ICONS.map(em => (
            <button key={em} onClick={()=>setIcon(em)} style={{
              width:36, height:36, borderRadius:10, border:'none', cursor:'pointer', fontSize:18,
              background: icon===em ? 'var(--rose-pale)' : 'transparent',
              outline: icon===em ? '2px solid var(--rose)' : 'none',
              transition:'all 0.15s',
            }}>{em}</button>
          ))}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-primary" style={{ flex:1, opacity: name.trim()?1:0.5 }} disabled={!name.trim()} onClick={handleAdd}>新增</button>
          <button className="btn-secondary" style={{ flex:1 }} onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

const lbl = { display:'block', fontSize:11, fontWeight:600, color:'var(--ink-mid)', marginBottom:6 }

// ── Sortable Category Card ─────────────────────────────────────
function SortableCategoryCard({
  cat, isOpen, onToggle, onAddItem, onDeleteCat,
  checklist, members, getItemMembers, toggleCheck, deleteItem, setEditingItem,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat.id })
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, marginBottom:10 }}>
      <div style={{ background:'white', borderRadius:'var(--radius)', border:'1px solid rgba(212,132,154,0.15)', boxShadow:'var(--shadow-card)', overflow:'hidden' }}>
        {/* Category header */}
        <div style={{ display:'flex', alignItems:'center' }}>
          {/* Drag handle */}
          <button {...attributes} {...listeners} style={{ padding:'0 8px 0 12px', touchAction:'none', background:'none', border:'none', cursor:'grab', height:48, display:'flex', alignItems:'center' }}>
            <Icon name="gripVertical" size={14} color="var(--ink-faint)" strokeWidth={2}/>
          </button>

          <button onClick={onToggle} style={{ flex:1, textAlign:'left', background:'none', border:'none', padding:'12px 8px 12px 0', cursor:'pointer', display:'flex', alignItems:'center', gap:9 }}>
            <span style={{ fontSize:18 }}>{cat.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:15, fontWeight:600, color:'var(--ink)' }}>{cat.name}</div>
              <div style={{ fontSize:11, color:'var(--ink-soft)' }}>{cat.items.length} 項</div>
            </div>
            <Icon name={isOpen ? 'chevronDown' : 'chevronRight'} size={14} color="var(--ink-faint)"/>
          </button>

          {/* Add item */}
          <button onClick={onAddItem} style={{ padding:'0 8px', background:'none', border:'none', cursor:'pointer', color:'var(--rose)', display:'flex', alignItems:'center', height:48 }}>
            <Icon name="plus" size={17}/>
          </button>

          {/* Delete category */}
          <button onClick={() => {
            if (confirmDelete) { onDeleteCat(cat.id); setConfirmDelete(false) }
            else { setConfirmDelete(true); setTimeout(()=>setConfirmDelete(false),2500) }
          }} style={{ padding:'0 12px 0 4px', background:'none', border:'none', cursor:'pointer', height:48, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:2 }}>
            <Icon name="trash" size={14} color={confirmDelete ? '#e05555' : 'rgba(212,132,154,0.35)'}/>
            {confirmDelete && <span style={{ fontSize:9, color:'#e05555', fontWeight:700, lineHeight:1 }}>確認</span>}
          </button>
        </div>

        {/* Items */}
        {isOpen && (
          <div style={{ borderTop:'1px solid rgba(212,132,154,0.1)' }}>
            {cat.items.map(item => {
              const itemMembers = getItemMembers(item)
              return (
                <div key={item.id} style={{ padding:'10px 14px', borderBottom:'1px solid rgba(212,132,154,0.07)', display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, color:'var(--ink)', lineHeight:1.4 }}>{item.text}</div>
                    {itemMembers.length < members.length && (
                      <div style={{ display:'flex', gap:3, marginTop:3 }}>
                        {itemMembers.map(m => <div key={m} style={{ width:6, height:6, borderRadius:'50%', background:getMC(m) }}/>)}
                        <span style={{ fontSize:9, color:'var(--ink-faint)', marginLeft:2 }}>{itemMembers.join('、')}</span>
                      </div>
                    )}
                  </div>

                  {/* Per-member circle buttons */}
                  <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                    {itemMembers.map(m => {
                      const checked = !!(checklist.checkedByMember[m]?.[item.id])
                      const color = getMC(m)
                      return (
                        <button key={m} onClick={()=>toggleCheck(m, item.id)} title={m} style={{ width:26, height:26, borderRadius:'50%', background: checked?color:'transparent', border:`2px solid ${checked?color:'rgba(212,132,154,0.22)'}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color: checked?'white':'var(--ink-faint)', transition:'all 0.15s', flexShrink:0 }}>
                          {checked ? <Icon name="check" size={10} color="white" strokeWidth={2.5}/> : <span>{m[0]}</span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* Edit members */}
                  <button onClick={()=>setEditingItem({ item, catId: cat.id })} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(212,132,154,0.5)', padding:'0 2px', flexShrink:0 }}>
                    <Icon name="users" size={13}/>
                  </button>

                  {/* Delete item */}
                  <button onClick={()=>deleteItem(cat.id, item.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(212,132,154,0.4)', padding:'0 2px', flexShrink:0 }}>
                    <Icon name="x" size={14}/>
                  </button>
                </div>
              )
            })}
            {cat.items.length === 0 && (
              <div style={{ padding:'14px', textAlign:'center', color:'var(--ink-faint)', fontSize:13 }}>尚無項目，點 ＋ 新增</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function ChecklistTab() {
  const sync = useSync()
  const { checklist, members, updateChecklist } = sync

  const [openCats,     setOpenCats]     = useState(() =>
    Object.fromEntries((checklist?.categories||[]).map(c=>[c.id,true]))
  )
  const [addingTo,     setAddingTo]     = useState(null)
  const [editingItem,  setEditingItem]  = useState(null)
  const [showAddCat,   setShowAddCat]   = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } })
  )

  if (!checklist) return <div style={{ padding:32, textAlign:'center', color:'var(--ink-soft)' }}>載入中…</div>

  const save = (updated) => updateChecklist(updated)

  const toggleCheck = (member, itemId) => {
    save({
      ...checklist,
      checkedByMember: {
        ...checklist.checkedByMember,
        [member]: {
          ...(checklist.checkedByMember[member]||{}),
          [itemId]: !(checklist.checkedByMember[member]?.[itemId]),
        },
      },
    })
  }

  const addItem = (catId, text, itemMembers) => {
    save({
      ...checklist,
      categories: checklist.categories.map(c =>
        c.id !== catId ? c : { ...c, items: [...c.items, { id:`item_${Date.now()}`, text, members: itemMembers }] }
      ),
    })
  }

  const deleteItem = (catId, itemId) => {
    save({
      ...checklist,
      categories: checklist.categories.map(c =>
        c.id !== catId ? c : { ...c, items: c.items.filter(x=>x.id!==itemId) }
      ),
    })
  }

  const saveItemMembers = (catId, itemId, itemMembers) => {
    save({
      ...checklist,
      categories: checklist.categories.map(c =>
        c.id !== catId ? c : { ...c, items: c.items.map(it=>it.id===itemId?{...it,members:itemMembers}:it) }
      ),
    })
  }

  const addCategory = (name, icon) => {
    const id = `cat_${Date.now()}`
    const newCat = { id, name, icon, items: [] }
    save({ ...checklist, categories: [...checklist.categories, newCat] })
    setOpenCats(p => ({ ...p, [id]: true }))
  }

  const deleteCategory = (catId) => {
    save({ ...checklist, categories: checklist.categories.filter(c=>c.id!==catId) })
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const cats   = checklist.categories
    const oldIdx = cats.findIndex(c=>c.id===active.id)
    const newIdx = cats.findIndex(c=>c.id===over.id)
    if (oldIdx === -1 || newIdx === -1) return
    save({ ...checklist, categories: arrayMove(cats, oldIdx, newIdx) })
  }

  const getItemMembers = (item) => item.members && item.members.length > 0 ? item.members : members

  const totalItems  = checklist.categories.reduce((s,c)=>s+c.items.length,0)
  const allDoneItems = checklist.categories.reduce((s,c)=>
    s + c.items.filter(item=>getItemMembers(item).every(m=>checklist.checkedByMember[m]?.[item.id])).length, 0)

  return (
    <div>
      {/* Progress card */}
      <div style={{ margin:16, padding:'14px 16px', background:'white', borderRadius:'var(--radius)', boxShadow:'var(--shadow-card)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:15, fontWeight:600, color:'var(--ink)' }}>整體進度</div>
          <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:14, color:'var(--rose)', fontWeight:700 }}>
            {allDoneItems} / {totalItems} 全員完成
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width:`${totalItems>0?(allDoneItems/totalItems)*100:0}%` }}/>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:10 }}>
          {members.map(m => {
            const done  = checklist.categories.reduce((s,c)=>s+c.items.filter(i=>checklist.checkedByMember[m]?.[i.id]).length,0)
            const total = checklist.categories.reduce((s,c)=>s+c.items.filter(i=>getItemMembers(i).includes(m)).length,0)
            return (
              <div key={m} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:9, height:9, borderRadius:'50%', background:getMC(m), flexShrink:0 }}/>
                <span style={{ fontSize:11, color:'var(--ink-mid)' }}>{m} {done}/{total}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Categories with dnd */}
      <div style={{ padding:'0 16px' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={checklist.categories.map(c=>c.id)} strategy={verticalListSortingStrategy}>
            {checklist.categories.map(cat => (
              <SortableCategoryCard
                key={cat.id}
                cat={cat}
                isOpen={!!openCats[cat.id]}
                onToggle={() => setOpenCats(p=>({...p,[cat.id]:!p[cat.id]}))}
                onAddItem={() => setAddingTo(cat.id)}
                onDeleteCat={deleteCategory}
                checklist={checklist}
                members={members}
                getItemMembers={getItemMembers}
                toggleCheck={toggleCheck}
                deleteItem={deleteItem}
                setEditingItem={setEditingItem}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add category button */}
        <button onClick={() => setShowAddCat(true)} style={{
          width:'100%', padding:'12px', marginBottom:20,
          background:'var(--rose-pale)', border:'1.5px dashed rgba(212,132,154,0.4)',
          borderRadius:12, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          color:'var(--rose)', fontSize:14, fontWeight:600,
        }}>
          <Icon name="plus" size={16} color="var(--rose)"/>
          新增分類
        </button>
      </div>

      <AddItemModal catId={addingTo} isOpen={!!addingTo} onClose={()=>setAddingTo(null)} onAdd={addItem} allMembers={members}/>
      <EditMembersModal item={editingItem?.item} catId={editingItem?.catId} isOpen={!!editingItem} onClose={()=>setEditingItem(null)} onSave={saveItemMembers} allMembers={members}/>
      <AddCategoryModal isOpen={showAddCat} onClose={()=>setShowAddCat(false)} onAdd={addCategory}/>
    </div>
  )
}

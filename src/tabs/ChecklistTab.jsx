import { useState } from 'react'
import { getChecklist, saveChecklist, getMembers } from '../utils/storage'

const MEMBER_COLORS = {
  YL:'#C4968C', CC:'#7AA8B8', Fu:'#8FAB9A',
  Wen:'#B8A9C9', Dad:'#C8A87A', Sister:'#C9A8B8',
}

function getMemberColor(m) { return MEMBER_COLORS[m] || '#A99890' }

// ─── Add Item Modal ──────────────────────────────────────────
function AddItemSheet({ catId, isOpen, onClose, onAdd }) {
  const [text, setText] = useState('')
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:60,
      display: isOpen ? 'flex' : 'none',
      alignItems:'flex-end',
      background:'rgba(61,48,40,0.4)', backdropFilter:'blur(2px)',
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'100%', background:'var(--bg-card)',
        borderRadius:'20px 20px 0 0', padding:'20px 16px 40px',
        boxShadow:'0 -4px 30px rgba(61,48,40,0.12)',
      }}>
        <div style={{
          fontFamily:'Cormorant Garant,serif', fontSize:17, fontWeight:600,
          color:'var(--ink)', marginBottom:14,
        }}>＋ 新增清單項目</div>
        <input className="input-field" placeholder="項目名稱…"
          value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&text.trim()){ onAdd(catId,text.trim()); setText(''); onClose() }}}
          autoFocus
        />
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <button className="btn-primary" style={{ flex:1 }}
            onClick={()=>{ if(text.trim()){ onAdd(catId,text.trim()); setText(''); onClose() }}}>
            新增
          </button>
          <button className="btn-secondary" style={{ flex:1 }} onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────
export default function ChecklistTab() {
  const members = getMembers()
  const [checklist, setChecklist] = useState(getChecklist)
  const [openCats, setOpenCats] = useState(() => {
    const cl = getChecklist()
    return Object.fromEntries(cl.categories.map(c => [c.id, true]))
  })
  const [addingTo, setAddingTo] = useState(null)

  const save = (updated) => { setChecklist(updated); saveChecklist(updated) }

  const toggleCheck = (member, itemId) => {
    const updated = { ...checklist }
    if (!updated.checkedByMember[member]) updated.checkedByMember[member] = {}
    updated.checkedByMember[member] = {
      ...updated.checkedByMember[member],
      [itemId]: !updated.checkedByMember[member][itemId],
    }
    save(updated)
  }

  const addItem = (catId, text) => {
    const updated = { ...checklist }
    updated.categories = updated.categories.map(c => {
      if (c.id !== catId) return c
      return { ...c, items: [...c.items, { id:`item_custom_${Date.now()}`, text }] }
    })
    save(updated)
  }

  const deleteItem = (catId, itemId) => {
    const updated = { ...checklist }
    updated.categories = updated.categories.map(c =>
      c.id !== catId ? c : { ...c, items: c.items.filter(x=>x.id!==itemId) }
    )
    save(updated)
  }

  const totalItems = checklist.categories.reduce((s,c)=>s+c.items.length, 0)
  // Overall: how many items have ALL members checked
  const allDoneItems = checklist.categories.reduce((s,c)=>
    s + c.items.filter(item => members.every(m=>checklist.checkedByMember[m]?.[item.id])).length, 0)

  return (
    <div>
      {/* Overall progress */}
      <div style={{ margin:16, padding:'14px 16px', background:'var(--bg-card)', borderRadius:'var(--radius)', boxShadow:'var(--shadow-card)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:15, fontWeight:600, color:'var(--ink)' }}>
            整體進度
          </div>
          <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:14, color:'var(--rose)', fontWeight:600 }}>
            {allDoneItems} / {totalItems} 全員完成
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width:`${totalItems>0?(allDoneItems/totalItems)*100:0}%` }}/>
        </div>
        {/* Member legend */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:10 }}>
          {members.map(m => {
            const myDone = checklist.categories.reduce((s,c)=>
              s+c.items.filter(i=>checklist.checkedByMember[m]?.[i.id]).length, 0)
            return (
              <div key={m} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{
                  width:14, height:14, borderRadius:'50%',
                  background: getMemberColor(m),
                }}/>
                <span style={{ fontSize:11, color:'var(--ink-mid)' }}>
                  {m} {myDone}/{totalItems}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding:'0 16px' }}>
        {checklist.categories.map(cat => {
          const isOpen = openCats[cat.id]
          const membersDone = members.filter(m=>
            cat.items.every(i=>checklist.checkedByMember[m]?.[i.id])
          ).length

          return (
            <div key={cat.id} style={{
              marginBottom:10, background:'var(--bg-card)',
              borderRadius:'var(--radius)',
              border:'1px solid var(--border)',
              boxShadow:'var(--shadow-card)', overflow:'hidden',
            }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center' }}>
                <button onClick={()=>setOpenCats(p=>({...p,[cat.id]:!p[cat.id]}))} style={{
                  flex:1, textAlign:'left', background:'none', border:'none',
                  padding:'12px 14px', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:9,
                }}>
                  <span style={{ fontSize:18 }}>{cat.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:15, fontWeight:600, color:'var(--ink)' }}>
                      {cat.name}
                    </div>
                    <div style={{ fontSize:11, color:'var(--ink-soft)' }}>
                      {membersDone}/{members.length} 人全部完成 · {cat.items.length} 項
                    </div>
                  </div>
                  <span style={{
                    fontSize:14, color:'var(--ink-faint)',
                    transform: isOpen ? 'rotate(90deg)' : 'none',
                    transition:'transform 0.2s', display:'inline-block',
                  }}>›</span>
                </button>
                {/* Add item button */}
                <button onClick={()=>setAddingTo(cat.id)} style={{
                  padding:'0 14px 0 4px', background:'none', border:'none',
                  cursor:'pointer', fontSize:18, color:'var(--rose)', opacity:0.7,
                  lineHeight:'48px',
                }}>＋</button>
              </div>

              {/* Items */}
              {isOpen && (
                <div style={{ borderTop:'1px solid var(--border)' }}>
                  {cat.items.map(item => (
                    <div key={item.id} style={{
                      padding:'9px 12px',
                      borderBottom:'1px solid rgba(196,150,140,0.07)',
                      display:'flex', alignItems:'center', gap:10,
                    }}>
                      {/* Item text */}
                      <div style={{ flex:1, fontSize:13, color:'var(--ink)', lineHeight:1.4 }}>
                        {item.text}
                      </div>

                      {/* Per-member circle buttons */}
                      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                        {members.map(m => {
                          const checked = !!(checklist.checkedByMember[m]?.[item.id])
                          const color = getMemberColor(m)
                          return (
                            <button
                              key={m}
                              onClick={() => toggleCheck(m, item.id)}
                              title={m}
                              style={{
                                width:26, height:26, borderRadius:'50%',
                                background: checked ? color : 'transparent',
                                border: `2px solid ${checked ? color : 'var(--border)'}`,
                                cursor:'pointer', display:'flex',
                                alignItems:'center', justifyContent:'center',
                                fontSize:9, fontWeight:700,
                                color: checked ? 'white' : 'var(--ink-faint)',
                                transition:'all 0.15s', flexShrink:0,
                              }}
                            >
                              {checked ? '✓' : m[0]}
                            </button>
                          )
                        })}
                      </div>

                      {/* Delete */}
                      <button onClick={()=>deleteItem(cat.id,item.id)} style={{
                        background:'none', border:'none', color:'var(--rose-light)',
                        fontSize:16, cursor:'pointer', padding:'0 2px', lineHeight:1, flexShrink:0,
                      }}>×</button>
                    </div>
                  ))}

                  {cat.items.length === 0 && (
                    <div style={{ padding:'16px', textAlign:'center', color:'var(--ink-faint)', fontSize:13 }}>
                      尚無項目，點 ＋ 新增
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ height:20 }}/>

      {/* Add item sheet */}
      <AddItemSheet
        catId={addingTo}
        isOpen={!!addingTo}
        onClose={()=>setAddingTo(null)}
        onAdd={addItem}
      />
    </div>
  )
}

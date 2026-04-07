import { useState } from 'react'
import { useSync } from '../context/SyncContext'
import Icon from '../components/Icon'

const MEMBER_COLORS = {
  YL:'#C4968C', CC:'#7AA8B8', Fu:'#8FAB9A',
  Wen:'#B8A9C9', Dad:'#C8A87A', Sister:'#C9A8B8',
}
const getMC = (m) => MEMBER_COLORS[m] || '#A99890'

function AddItemModal({ catId, isOpen, onClose, onAdd }) {
  const [text, setText] = useState('')
  if (!isOpen) return null
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:60,
      background:'rgba(61,48,40,0.4)', backdropFilter:'blur(2px)',
      display:'flex', alignItems:'flex-end',
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:'100%', background:'white',
        borderRadius:'20px 20px 0 0', padding:'20px 16px 40px',
        boxShadow:'0 -4px 30px rgba(61,48,40,0.1)',
      }}>
        <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:17, fontWeight:600, color:'var(--ink)', marginBottom:14 }}>
          新增清單項目
        </div>
        <input className="input-field" placeholder="項目名稱…"
          value={text} onChange={e=>setText(e.target.value)} autoFocus
          onKeyDown={e=>{ if(e.key==='Enter'&&text.trim()){ onAdd(catId,text.trim()); setText(''); onClose() }}}/>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <button className="btn-primary" style={{ flex:1 }}
            onClick={()=>{ if(text.trim()){ onAdd(catId,text.trim()); setText(''); onClose() }}}>新增</button>
          <button className="btn-secondary" style={{ flex:1 }} onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}

export default function ChecklistTab() {
  const sync = useSync()
  const { checklist, members, updateChecklist } = sync

  const [openCats, setOpenCats] = useState(() =>
    Object.fromEntries((checklist?.categories||[]).map(c=>[c.id,true]))
  )
  const [addingTo, setAddingTo] = useState(null)

  if (!checklist) return <div style={{ padding:32, textAlign:'center', color:'var(--ink-soft)' }}>載入中…</div>

  const save = (updated) => updateChecklist(updated)

  const toggleCheck = (member, itemId) => {
    const updated = {
      ...checklist,
      checkedByMember: {
        ...checklist.checkedByMember,
        [member]: {
          ...(checklist.checkedByMember[member]||{}),
          [itemId]: !(checklist.checkedByMember[member]?.[itemId]),
        },
      },
    }
    save(updated)
  }

  const addItem = (catId, text) => {
    const updated = {
      ...checklist,
      categories: checklist.categories.map(c =>
        c.id!==catId ? c : { ...c, items:[...c.items,{id:`item_${Date.now()}`,text}] }
      ),
    }
    save(updated)
  }

  const deleteItem = (catId, itemId) => {
    const updated = {
      ...checklist,
      categories: checklist.categories.map(c =>
        c.id!==catId ? c : { ...c, items:c.items.filter(x=>x.id!==itemId) }
      ),
    }
    save(updated)
  }

  const totalItems  = checklist.categories.reduce((s,c)=>s+c.items.length, 0)
  const allDoneItems = checklist.categories.reduce((s,c)=>
    s+c.items.filter(item=>members.every(m=>checklist.checkedByMember[m]?.[item.id])).length, 0)

  return (
    <div>
      {/* Progress card */}
      <div style={{ margin:16, padding:'14px 16px', background:'white', borderRadius:'var(--radius)', boxShadow:'var(--shadow-card)' }}>
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
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginTop:10 }}>
          {members.map(m=>{
            const done = checklist.categories.reduce((s,c)=>
              s+c.items.filter(i=>checklist.checkedByMember[m]?.[i.id]).length, 0)
            return (
              <div key={m} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:getMC(m), flexShrink:0 }}/>
                <span style={{ fontSize:11, color:'var(--ink-mid)' }}>{m} {done}/{totalItems}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding:'0 16px' }}>
        {checklist.categories.map(cat=>{
          const isOpen = openCats[cat.id]
          const membersDone = members.filter(m=>cat.items.every(i=>checklist.checkedByMember[m]?.[i.id])).length

          return (
            <div key={cat.id} style={{
              marginBottom:10, background:'white',
              borderRadius:'var(--radius)',
              border:'1px solid rgba(212,144,154,0.15)',
              boxShadow:'var(--shadow-card)', overflow:'hidden',
            }}>
              {/* Category header */}
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
                  <Icon name={isOpen?'chevronDown':'chevronRight'} size={14} color="var(--ink-faint)"/>
                </button>
                <button onClick={()=>setAddingTo(cat.id)} style={{
                  padding:'0 14px', background:'none', border:'none',
                  cursor:'pointer', color:'var(--rose)', opacity:0.7,
                  display:'flex', alignItems:'center', height:48,
                }}>
                  <Icon name="plus" size={17}/>
                </button>
              </div>

              {/* Items */}
              {isOpen && (
                <div style={{ borderTop:'1px solid rgba(212,144,154,0.1)' }}>
                  {cat.items.map(item=>(
                    <div key={item.id} style={{
                      padding:'10px 14px',
                      borderBottom:'1px solid rgba(212,144,154,0.07)',
                      display:'flex', alignItems:'center', gap:8,
                    }}>
                      {/* Text */}
                      <div style={{ flex:1, fontSize:13, color:'var(--ink)', lineHeight:1.4 }}>
                        {item.text}
                      </div>

                      {/* Per-member circle buttons */}
                      <div style={{ display:'flex', gap:4, flexShrink:0 }}>
                        {members.map(m=>{
                          const checked = !!(checklist.checkedByMember[m]?.[item.id])
                          const color = getMC(m)
                          return (
                            <button key={m} onClick={()=>toggleCheck(m,item.id)} title={m} style={{
                              width:26, height:26, borderRadius:'50%',
                              background: checked ? color : 'transparent',
                              border:`2px solid ${checked?color:'rgba(212,144,154,0.25)'}`,
                              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:8, fontWeight:700,
                              color: checked ? 'white' : 'var(--ink-faint)',
                              transition:'all 0.15s', flexShrink:0,
                            }}>
                              {checked
                                ? <Icon name="check" size={10} color="white" strokeWidth={2.5}/>
                                : <span>{m[0]}</span>}
                            </button>
                          )
                        })}
                      </div>

                      {/* Delete */}
                      <button onClick={()=>deleteItem(cat.id,item.id)} style={{
                        background:'none', border:'none', cursor:'pointer',
                        color:'rgba(212,144,154,0.4)', padding:'0 2px', flexShrink:0,
                      }}>
                        <Icon name="x" size={14}/>
                      </button>
                    </div>
                  ))}
                  {cat.items.length===0 && (
                    <div style={{ padding:'14px', textAlign:'center', color:'var(--ink-faint)', fontSize:13 }}>
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

      <AddItemModal catId={addingTo} isOpen={!!addingTo}
        onClose={()=>setAddingTo(null)} onAdd={addItem}/>
    </div>
  )
}

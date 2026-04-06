import { useState } from 'react'
import { getChecklist, saveChecklist, getMembers, getCurrentMember, setCurrentMember } from '../utils/storage'

const MEMBER_COLORS = {
  YL: '#F2A7C3', CC: '#A8D8EA', Fu: '#98D8C8',
  Wen: '#C8A8D8', Dad: '#D8C8A8', Sister: '#D8A8A8',
}

export default function ChecklistTab() {
  const members = getMembers()
  const [currentMember, setMember] = useState(getCurrentMember)
  const [checklist, setChecklist] = useState(getChecklist)
  const [openCategories, setOpenCategories] = useState(() =>
    Object.fromEntries(getChecklist().categories.map(c => [c.id, true]))
  )

  const handleMemberChange = (m) => {
    setMember(m)
    setCurrentMember(m)
  }

  const toggleCheck = (itemId) => {
    const updated = { ...checklist }
    if (!updated.checkedByMember[currentMember]) {
      updated.checkedByMember[currentMember] = {}
    }
    const current = updated.checkedByMember[currentMember][itemId]
    updated.checkedByMember[currentMember] = {
      ...updated.checkedByMember[currentMember],
      [itemId]: !current,
    }
    setChecklist(updated)
    saveChecklist(updated)
  }

  const toggleCategory = (catId) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  const isCheckedByMe = (itemId) =>
    !!(checklist.checkedByMember[currentMember]?.[itemId])

  const isCheckedByMember = (member, itemId) =>
    !!(checklist.checkedByMember[member]?.[itemId])

  const getCategoryProgress = (cat) => {
    const checked = cat.items.filter(item =>
      members.some(m => checklist.checkedByMember[m]?.[item.id])
    ).length
    const membersDone = members.filter(m =>
      cat.items.every(item => checklist.checkedByMember[m]?.[item.id])
    ).length
    return { checked, total: cat.items.length, membersDone }
  }

  const totalItems = checklist.categories.reduce((s, c) => s + c.items.length, 0)
  const myChecked = checklist.categories.reduce((s, c) =>
    s + c.items.filter(item => isCheckedByMe(item.id)).length, 0)

  return (
    <div>
      {/* My progress summary */}
      <div style={{ margin: 16, padding: '14px 16px', background: 'white', borderRadius: 14, boxShadow: '2px 4px 12px rgba(242,167,195,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2C' }}>
            {currentMember} 的進度
          </div>
          <div style={{ fontSize: 13, color: '#F2A7C3', fontWeight: 700 }}>
            {myChecked} / {totalItems}
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${totalItems > 0 ? (myChecked / totalItems) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Member selector */}
      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ fontSize: 12, color: '#95A5A6', fontWeight: 600, marginBottom: 8 }}>
          選擇成員（查看/更新我的打包狀態）
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {members.map(m => (
            <button
              key={m}
              onClick={() => handleMemberChange(m)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                border: 'none',
                background: currentMember === m ? (MEMBER_COLORS[m] || '#F2A7C3') : '#F5F5F5',
                color: currentMember === m ? 'white' : '#666',
                fontSize: 13, fontWeight: currentMember === m ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding: '0 16px' }}>
        {checklist.categories.map(cat => {
          const { checked, total, membersDone } = getCategoryProgress(cat)
          const isOpen = openCategories[cat.id]
          const allDoneByMe = cat.items.every(item => isCheckedByMe(item.id))

          return (
            <div key={cat.id} style={{
              marginBottom: 10,
              background: 'white',
              borderRadius: 14,
              border: '1px solid rgba(242,167,195,0.2)',
              boxShadow: '2px 4px 8px rgba(242,167,195,0.1)',
              overflow: 'hidden',
            }}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat.id)}
                style={{
                  width: '100%', textAlign: 'left', background: 'none',
                  border: 'none', padding: '12px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2C' }}>
                    {cat.name}
                    {allDoneByMe && <span style={{ marginLeft: 6, fontSize: 12, color: '#27AE60' }}>✓ 全打包</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#95A5A6', marginTop: 2 }}>
                    {membersDone}/{members.length} 人已全部完成 · {checked}/{total} 項有人勾選
                  </div>
                </div>
                {/* Mini progress */}
                <div style={{ width: 40, height: 4, background: '#FCE4EE', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${total > 0 ? (checked / total) * 100 : 0}%`,
                    height: '100%',
                    background: '#F2A7C3',
                    borderRadius: 2,
                  }} />
                </div>
                <span style={{ fontSize: 14, color: '#D0A0B0', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  ›
                </span>
              </button>

              {/* Items */}
              {isOpen && (
                <div style={{ borderTop: '1px solid rgba(242,167,195,0.15)' }}>
                  {cat.items.map(item => {
                    const myCheck = isCheckedByMe(item.id)
                    return (
                      <div key={item.id} style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid rgba(242,167,195,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: myCheck ? '#FDFFFE' : 'white',
                      }}>
                        {/* My checkbox */}
                        <button
                          onClick={() => toggleCheck(item.id)}
                          style={{
                            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                            border: myCheck ? 'none' : '2px solid #F2A7C3',
                            background: myCheck ? '#F2A7C3' : 'white',
                            color: 'white', fontSize: 13, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                        >
                          {myCheck ? '✓' : ''}
                        </button>

                        {/* Item text */}
                        <div style={{
                          flex: 1, fontSize: 13, color: myCheck ? '#95A5A6' : '#2C2C2C',
                          textDecoration: myCheck ? 'line-through' : 'none',
                          transition: 'all 0.2s',
                        }}>
                          {item.text}
                        </div>

                        {/* Member badges */}
                        <div style={{ display: 'flex', gap: 3 }}>
                          {members.map(m => {
                            const done = isCheckedByMember(m, item.id)
                            const color = MEMBER_COLORS[m] || '#F2A7C3'
                            return (
                              <div key={m} title={m} style={{
                                width: 20, height: 20, borderRadius: '50%',
                                background: done ? color : 'transparent',
                                border: `1.5px solid ${done ? color : '#E0E0E0'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 8, color: done ? 'white' : '#CCC',
                                fontWeight: 700, flexShrink: 0,
                              }}>
                                {done ? m[0] : ''}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ height: 16 }} />
    </div>
  )
}

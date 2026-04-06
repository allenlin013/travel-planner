import { useState, useEffect } from 'react'
import { getExpenses, saveExpenses, getMembers, getExchangeRate } from '../utils/storage'
import { calculateSettlement } from '../utils/settlement'
import { TRIP_DATA } from '../data/tripData'
import BottomSheet from '../components/BottomSheet'

const CATEGORIES = ['餐廳', '交通', '購物', '住宿', '門票', '其他']
const CATEGORY_ICONS = { '餐廳': '🍱', '交通': '🚃', '購物': '🛍️', '住宿': '🏠', '門票': '🎟', '其他': '📌' }

function MemberPill({ name, selected, onToggle, color }) {
  return (
    <button
      onClick={() => onToggle(name)}
      style={{
        padding: '5px 12px',
        borderRadius: 20,
        border: selected ? 'none' : '1px solid rgba(242,167,195,0.4)',
        background: selected ? (color || '#F2A7C3') : 'white',
        color: selected ? 'white' : '#2C2C2C',
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
    >
      {name}
    </button>
  )
}

function AddExpenseSheet({ isOpen, onClose, onSave, members }) {
  const [form, setForm] = useState({
    name: '', amount: '', paidBy: members[0] || 'YL',
    splitWith: [...members], category: '餐廳', note: ''
  })

  const reset = () => setForm({
    name: '', amount: '', paidBy: members[0] || 'YL',
    splitWith: [...members], category: '餐廳', note: ''
  })

  const toggleSplit = (m) => {
    setForm(f => ({
      ...f,
      splitWith: f.splitWith.includes(m)
        ? f.splitWith.filter(x => x !== m)
        : [...f.splitWith, m]
    }))
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.amount) return
    onSave({
      id: `exp_${Date.now()}`,
      ...form,
      amount: Number(form.amount),
      date: new Date().toISOString().slice(0, 10),
    })
    reset()
    onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="85vh">
      <div style={{ padding: '0 16px 32px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#2C2C2C', marginBottom: 20 }}>
          💰 新增費用
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>名稱</label>
            <input className="input-field" placeholder="費用名稱" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>金額（¥）</label>
            <input className="input-field" placeholder="0" type="number" inputMode="numeric"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>

          <div>
            <label style={labelStyle}>付款人</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {members.map(m => (
                <MemberPill key={m} name={m} selected={form.paidBy === m}
                  onToggle={() => setForm(f => ({ ...f, paidBy: m }))}
                  color="#C0392B"
                />
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>分帳成員</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {members.map(m => (
                <MemberPill key={m} name={m} selected={form.splitWith.includes(m)}
                  onToggle={toggleSplit}
                />
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#95A5A6', marginTop: 4 }}>
              每人 ¥{form.splitWith.length > 0 ? Math.round(Number(form.amount || 0) / form.splitWith.length) : 0}
            </div>
          </div>

          <div>
            <label style={labelStyle}>類別</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                  style={{
                    padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
                    border: form.category === cat ? 'none' : '1px solid rgba(242,167,195,0.4)',
                    background: form.category === cat ? '#F2A7C3' : 'white',
                    color: form.category === cat ? 'white' : '#2C2C2C',
                    fontSize: 13, transition: 'all 0.15s',
                  }}>
                  {CATEGORY_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>備註（選填）</label>
            <input className="input-field" placeholder="" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>

          <button onClick={handleSave} style={saveButtonStyle}>
            確認新增
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

function SettlementSheet({ isOpen, onClose, expenses, members }) {
  const rate = getExchangeRate()
  const { paid, shouldPay, balance, transfers } = calculateSettlement(expenses, members)

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="80vh">
      <div style={{ padding: '0 16px 32px' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#2C2C2C', marginBottom: 16 }}>
          📊 結帳結算
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8B5E72', marginBottom: 10 }}>
            個人費用明細
          </div>
          {members.map(m => {
            const b = balance[m] || 0
            return (
              <div key={m} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', marginBottom: 6,
                background: b > 0 ? '#EAFAF1' : b < 0 ? '#FDECEA' : '#F8F9FA',
                borderRadius: 10, border: `1px solid ${b > 0 ? '#27AE60' : b < 0 ? '#C0392B' : '#DEE2E6'}22`,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{m}</div>
                  <div style={{ fontSize: 11, color: '#95A5A6' }}>
                    已付 ¥{Math.round(paid[m] || 0).toLocaleString()} · 應付 ¥{Math.round(shouldPay[m] || 0).toLocaleString()}
                  </div>
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: b > 0 ? '#27AE60' : b < 0 ? '#C0392B' : '#95A5A6',
                }}>
                  {b > 0 ? '＋' : ''}¥{Math.round(b).toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>

        {transfers.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#8B5E72', marginBottom: 10 }}>
              轉帳清單
            </div>
            {transfers.map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', marginBottom: 6,
                background: 'white',
                borderRadius: 10,
                border: '1px solid rgba(242,167,195,0.3)',
                boxShadow: '2px 4px 8px rgba(242,167,195,0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#C0392B' }}>{t.from}</span>
                  <span style={{ fontSize: 13, color: '#95A5A6' }}>→</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#27AE60' }}>{t.to}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2C' }}>
                    ¥{t.amount.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: '#95A5A6' }}>
                    ≈ NT${Math.round(t.amount * (rate.JPY_TWD || 0.218)).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {transfers.length === 0 && (
          <div style={{ textAlign: 'center', color: '#27AE60', padding: 20, fontSize: 14 }}>
            ✅ 已結清，無需轉帳！
          </div>
        )}
      </div>
    </BottomSheet>
  )
}

const labelStyle = {
  display: 'block', fontSize: 13, fontWeight: 600,
  color: '#8B5E72', marginBottom: 6,
}

const saveButtonStyle = {
  width: '100%', padding: '13px',
  background: 'linear-gradient(135deg, #F2A7C3, #ED89AB)',
  color: 'white', border: 'none', borderRadius: 12,
  fontSize: 15, fontWeight: 700, cursor: 'pointer',
}

export default function ExpensesTab() {
  const [expenses, setExpenses] = useState(getExpenses)
  const [members] = useState(getMembers)
  const [showAdd, setShowAdd] = useState(false)
  const [showSettlement, setShowSettlement] = useState(false)
  const [showJPY, setShowJPY] = useState(true)
  const rate = getExchangeRate()

  const total = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  const totalTWD = Math.round(total * (rate.JPY_TWD || 0.218))

  const handleSave = (exp) => {
    const updated = [...expenses, exp]
    setExpenses(updated)
    saveExpenses(updated)
  }

  const handleDelete = (id) => {
    const updated = expenses.filter(e => e.id !== id)
    setExpenses(updated)
    saveExpenses(updated)
  }

  // Group by date
  const grouped = {}
  expenses.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = []
    grouped[e.date].push(e)
  })

  return (
    <div>
      {/* Summary header */}
      <div style={{
        margin: 16,
        padding: '16px',
        background: 'linear-gradient(135deg, #F2A7C3, #ED89AB)',
        borderRadius: 16,
        boxShadow: '2px 4px 16px rgba(242,167,195,0.4)',
        color: 'white',
      }}>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>總花費</div>
        <div style={{ fontSize: 28, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {showJPY ? `¥${total.toLocaleString()}` : `NT$${totalTWD.toLocaleString()}`}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {showJPY ? `≈ NT$${totalTWD.toLocaleString()}` : `¥${total.toLocaleString()}`}
          </div>
          <button
            onClick={() => setShowJPY(v => !v)}
            style={{
              background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: 12,
              padding: '4px 10px', color: 'white', fontSize: 12, cursor: 'pointer', fontWeight: 600,
            }}
          >
            切換 {showJPY ? 'NT$' : '¥'}
          </button>
        </div>
      </div>

      {/* Settlement button */}
      <div style={{ padding: '0 16px 12px' }}>
        <button
          onClick={() => setShowSettlement(true)}
          style={{
            width: '100%', padding: '11px',
            background: 'white', border: '1.5px solid rgba(242,167,195,0.5)',
            borderRadius: 12, fontSize: 14, color: '#8B5E72',
            cursor: 'pointer', fontWeight: 600,
            boxShadow: '2px 4px 8px rgba(242,167,195,0.15)',
          }}
        >
          📊 查看結帳結算
        </button>
      </div>

      {/* Expense list */}
      <div style={{ padding: '0 16px' }}>
        {Object.keys(grouped).sort().map(date => (
          <div key={date} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#95A5A6', fontWeight: 600, marginBottom: 8, paddingLeft: 4 }}>
              {new Date(date).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
            </div>
            {grouped[date].map(exp => (
              <div key={exp.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '11px 14px', marginBottom: 6,
                background: 'white', borderRadius: 12,
                border: '1px solid rgba(242,167,195,0.2)',
                boxShadow: '2px 4px 8px rgba(242,167,195,0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[exp.category] || '📌'}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2C' }}>{exp.name}</div>
                    <div style={{ fontSize: 11, color: '#95A5A6' }}>
                      {exp.paidBy} 付 · 分 {exp.splitWith?.length || 0} 人
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2C' }}>
                      ¥{Number(exp.amount).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#95A5A6' }}>
                      NT${Math.round(Number(exp.amount) * (rate.JPY_TWD || 0.218)).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(exp.id)}
                    style={{
                      background: 'none', border: 'none', color: '#F2A7C3',
                      fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {expenses.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#BDC3C7' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💰</div>
            <div style={{ fontSize: 14 }}>尚無費用記錄</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>點右下角 ＋ 開始記帳</div>
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setShowAdd(true)}>＋</button>

      <AddExpenseSheet
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleSave}
        members={members}
      />

      <SettlementSheet
        isOpen={showSettlement}
        onClose={() => setShowSettlement(false)}
        expenses={expenses}
        members={members}
      />
    </div>
  )
}

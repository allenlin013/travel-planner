import { useState } from 'react'
import { useSync } from '../context/SyncContext'
import { calculateSettlement } from '../utils/settlement'
import { useExchangeRate } from '../hooks/useExchangeRate'
import BottomSheet from '../components/BottomSheet'
import Icon from '../components/Icon'

const CATEGORIES = ['餐廳','交通','購物','住宿','門票','其他']
const CAT_ICON   = { '餐廳':'utensils','交通':'train','購物':'shoppingBag','住宿':'home','門票':'document','其他':'receipt' }

function MemberPill({ name, selected, onToggle, activeColor }) {
  return (
    <button onClick={() => onToggle(name)} style={{
      padding:'5px 13px', borderRadius:20, flexShrink:0, cursor:'pointer',
      border: selected ? 'none' : '1.5px solid rgba(212,144,154,0.3)',
      background: selected ? (activeColor||'var(--rose)') : 'white',
      color: selected ? 'white' : 'var(--ink-mid)',
      fontSize:13, fontWeight: selected ? 600 : 400, transition:'all 0.15s',
    }}>{name}</button>
  )
}

// ── Add Expense Sheet ─────────────────────────────────────────
function AddExpenseSheet({ isOpen, onClose, onSave, members, jpyToTwd, twdToJpy }) {
  const [form, setForm] = useState({
    name:'', amount:'', currency:'JPY',
    paidBy: members[0]||'YL', splitWith:[...members],
    category:'餐廳', note:'',
  })

  const reset = () => setForm({
    name:'', amount:'', currency:'JPY',
    paidBy:members[0]||'YL', splitWith:[...members],
    category:'餐廳', note:'',
  })

  const jpyAmt   = form.currency==='JPY' ? Number(form.amount)||0 : twdToJpy(Number(form.amount)||0)
  const perJPY   = form.splitWith.length > 0 ? Math.round(jpyAmt / form.splitWith.length) : 0

  const handleSave = () => {
    if (!form.name.trim() || !form.amount) return
    onSave({
      id:`exp_${Date.now()}`, name:form.name,
      amount:jpyAmt, currency:'JPY',
      paidBy:form.paidBy, splitWith:form.splitWith,
      category:form.category, date:new Date().toISOString().slice(0,10), note:form.note,
    })
    reset(); onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="88vh">
      <div style={{ padding:'0 16px 32px' }}>
        <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:20, fontWeight:600, color:'var(--ink)', marginBottom:20 }}>
          新增費用
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={lbl}>名稱</label>
            <input className="input-field" placeholder="費用名稱"
              value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
          </div>

          <div>
            <label style={lbl}>幣別與金額</label>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <button onClick={()=>setForm(f=>({...f,currency:'JPY'}))} style={currBtn(form.currency==='JPY')}>¥ 日幣</button>
              <button onClick={()=>setForm(f=>({...f,currency:'TWD'}))} style={currBtn(form.currency==='TWD')}>NT$ 台幣</button>
            </div>
            <input className="input-field" type="number" inputMode="decimal"
              placeholder={form.currency==='JPY'?'¥ 金額':'NT$ 金額'}
              value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
            {Number(form.amount) > 0 && (
              <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:4 }}>
                {form.currency==='JPY'
                  ? `≈ NT$${jpyToTwd(Number(form.amount)).toLocaleString()}`
                  : `≈ ¥${twdToJpy(Number(form.amount)).toLocaleString()}`}
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>付款人</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {members.map(m=>(
                <MemberPill key={m} name={m} selected={form.paidBy===m}
                  onToggle={()=>setForm(f=>({...f,paidBy:m}))} activeColor="var(--amber)"/>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>分帳成員</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {members.map(m=>(
                <MemberPill key={m} name={m} selected={form.splitWith.includes(m)}
                  onToggle={m=>setForm(f=>({...f,
                    splitWith:f.splitWith.includes(m)?f.splitWith.filter(x=>x!==m):[...f.splitWith,m]
                  }))}/>
              ))}
            </div>
            {Number(form.amount)>0 && form.splitWith.length>0 && (
              <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:5 }}>
                每人 ¥{perJPY.toLocaleString()} ≈ NT${jpyToTwd(perJPY).toLocaleString()}
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>類別</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {CATEGORIES.map(cat=>(
                <button key={cat} onClick={()=>setForm(f=>({...f,category:cat}))} style={{
                  padding:'5px 12px', borderRadius:20, cursor:'pointer', fontSize:13,
                  border: form.category===cat ? 'none' : '1.5px solid rgba(212,144,154,0.3)',
                  background: form.category===cat ? 'var(--rose)' : 'white',
                  color: form.category===cat ? 'white' : 'var(--ink-mid)', transition:'all 0.15s',
                }}>
                  {cat}
                </button>
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

// ── Settlement Sheet ──────────────────────────────────────────
function SettlementSheet({ isOpen, onClose, expenses, members, jpyToTwd }) {
  const { paid, shouldPay, balance, transfers } = calculateSettlement(expenses, members)
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="82vh">
      <div style={{ padding:'0 16px 32px' }}>
        <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:20, fontWeight:600, color:'var(--ink)', marginBottom:18 }}>
          結帳結算
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={sectionLabel}>個人明細</div>
          {members.map(m => {
            const b = balance[m]||0
            return (
              <div key={m} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 13px', marginBottom:6,
                background: b>0.5?'var(--sage-pale)':b<-0.5?'var(--rose-pale)':'var(--bg)',
                borderRadius:10,
                border:`1px solid ${b>0.5?'var(--sage-light)':b<-0.5?'var(--rose-light)':'var(--border)'}`,
              }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--ink)' }}>{m}</div>
                  <div style={{ fontSize:11, color:'var(--ink-soft)' }}>
                    已付 ¥{Math.round(paid[m]||0).toLocaleString()} · 應付 ¥{Math.round(shouldPay[m]||0).toLocaleString()}
                  </div>
                </div>
                <div style={{ fontSize:15, fontWeight:700, fontFamily:'Cormorant Garant,serif',
                  color:b>0.5?'var(--sage)':b<-0.5?'var(--rose)':'var(--ink-soft)' }}>
                  {b>0?'＋':''}¥{Math.round(b).toLocaleString()}
                </div>
              </div>
            )
          })}
        </div>

        {transfers.length > 0 && (
          <div>
            <div style={sectionLabel}>轉帳清單</div>
            {transfers.map((t,i)=>(
              <div key={i} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'12px 14px', marginBottom:6,
                background:'white', borderRadius:'var(--radius)',
                border:'1px solid rgba(212,144,154,0.2)',
                boxShadow:'var(--shadow-card)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:700, color:'var(--rose)', fontSize:14 }}>{t.from}</span>
                  <Icon name="arrowRight" size={14} color="var(--ink-faint)"/>
                  <span style={{ fontWeight:700, color:'var(--sage)', fontSize:14 }}>{t.to}</span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:16, fontWeight:700, fontFamily:'Cormorant Garant,serif', color:'var(--ink)' }}>
                    ¥{t.amount.toLocaleString()}
                  </div>
                  <div style={{ fontSize:11, color:'var(--ink-soft)' }}>
                    ≈ NT${jpyToTwd(t.amount).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {transfers.length === 0 && (
          <div style={{ textAlign:'center', padding:'24px 0', color:'var(--sage)', fontSize:14, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <Icon name="check" size={16} color="var(--sage)"/> 已結清，無需轉帳
          </div>
        )}
      </div>
    </BottomSheet>
  )
}

const lbl = { display:'block', fontSize:12, fontWeight:600, color:'var(--ink-mid)', marginBottom:5 }
const currBtn = (active) => ({
  flex:1, padding:'9px 8px', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:13, fontWeight:600,
  border: active ? 'none' : '1.5px solid rgba(212,144,154,0.3)',
  background: active ? 'var(--amber)' : 'white',
  color: active ? 'white' : 'var(--ink-mid)', transition:'all 0.15s',
})
const sectionLabel = {
  fontSize:13, fontWeight:600, color:'var(--ink-soft)', letterSpacing:'0.08em',
  textTransform:'uppercase', marginBottom:10, fontFamily:'Cormorant Garant,serif',
}

// ── Main ──────────────────────────────────────────────────────
export default function ExpensesTab() {
  const sync = useSync()
  const { rate, jpyToTwd, twdToJpy, lastUpdated, loading, fetchRate } = useExchangeRate()
  const [showAdd, setShowAdd]             = useState(false)
  const [showSettlement, setShowSettlement] = useState(false)
  const [displayCurrency, setDisplayCurrency] = useState('JPY')

  const expenses = sync.expenses
  const members  = sync.members

  const totalJPY = expenses.reduce((s,e)=>s+(Number(e.amount)||0), 0)
  const totalTWD = jpyToTwd(totalJPY)

  const fmtAmt = (jpy) => displayCurrency==='JPY'
    ? `¥${Number(jpy).toLocaleString()}`
    : `NT$${jpyToTwd(jpy).toLocaleString()}`

  // Group by date
  const grouped = {}
  expenses.forEach(e=>{ if(!grouped[e.date]) grouped[e.date]=[]; grouped[e.date].push(e) })

  return (
    <div>
      {/* Summary */}
      <div style={{ margin:16 }}>
        <div style={{
          padding:'18px', background:'linear-gradient(135deg,#C4968C,#9B7068)',
          borderRadius:'var(--radius-lg)', boxShadow:'0 6px 24px rgba(196,150,140,0.35)',
          color:'white',
        }}>
          <div style={{ fontSize:9, opacity:0.8, letterSpacing:'0.14em', fontFamily:'Cormorant Garant,serif', textTransform:'uppercase', marginBottom:4 }}>
            Total Expenses
          </div>
          <div style={{ fontSize:32, fontWeight:300, fontFamily:'Cormorant Garant,serif', letterSpacing:'0.02em' }}>
            {displayCurrency==='JPY' ? `¥${totalJPY.toLocaleString()}` : `NT$${totalTWD.toLocaleString()}`}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
            <div>
              <div style={{ fontSize:12, opacity:0.75 }}>
                {displayCurrency==='JPY'?`≈ NT$${totalTWD.toLocaleString()}`:`¥${totalJPY.toLocaleString()}`}
              </div>
              <div style={{ fontSize:10, opacity:0.55, marginTop:2 }}>
                {loading ? '匯率更新中…' : `1¥ = NT$${rate.toFixed(4)}${lastUpdated?` · ${lastUpdated}`:''}`}
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={()=>setDisplayCurrency(v=>v==='JPY'?'TWD':'JPY')} style={headerBtn}>
                {displayCurrency==='JPY'?'顯示 NT$':'顯示 ¥'}
              </button>
              <button onClick={fetchRate} style={headerBtn}>
                <Icon name="arrowRight" size={12} color="white" style={{ transform:'rotate(-45deg)' }}/>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settlement */}
      <div style={{ padding:'0 16px 10px' }}>
        <button onClick={()=>setShowSettlement(true)} style={{
          width:'100%', padding:'11px', background:'white',
          border:'1.5px solid rgba(212,144,154,0.25)', borderRadius:'var(--radius-sm)',
          fontSize:13, color:'var(--ink-mid)', cursor:'pointer', fontWeight:600,
          boxShadow:'var(--shadow-card)', fontFamily:'Cormorant Garant,serif',
          display:'flex', alignItems:'center', justifyContent:'center', gap:6,
        }}>
          <Icon name="receipt" size={15} color="var(--rose)"/> 結帳結算
        </button>
      </div>

      {/* Expense list */}
      <div style={{ padding:'0 16px' }}>
        {Object.keys(grouped).sort().map(date=>(
          <div key={date} style={{ marginBottom:14 }}>
            <div style={{ fontSize:13, color:'var(--ink-soft)', fontWeight:600, marginBottom:6, paddingLeft:4, fontFamily:'Cormorant Garant,serif', letterSpacing:'0.03em' }}>
              {new Date(date).toLocaleDateString('zh-TW',{month:'long',day:'numeric',weekday:'short'})}
            </div>
            {grouped[date].map(exp=>(
              <div key={exp.id} style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'11px 14px', marginBottom:6,
                background:'white', borderRadius:'var(--radius)',
                border:'1px solid rgba(212,144,154,0.15)', boxShadow:'var(--shadow-card)',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{
                    width:34, height:34, borderRadius:'50%',
                    background:'var(--rose-pale)',
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  }}>
                    <Icon name={CAT_ICON[exp.category]||'receipt'} size={15} color="var(--rose)"/>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:500, color:'var(--ink)' }}>{exp.name}</div>
                    <div style={{ fontSize:11, color:'var(--ink-soft)' }}>
                      {exp.paidBy} 付 · {exp.splitWith?.length||0} 人分
                    </div>
                  </div>
                </div>
                <div style={{ textAlign:'right', display:'flex', alignItems:'center', gap:8 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, fontFamily:'Cormorant Garant,serif', color:'var(--ink)' }}>
                      {fmtAmt(exp.amount)}
                    </div>
                    <div style={{ fontSize:10, color:'var(--ink-soft)' }}>
                      {displayCurrency==='JPY'?`NT$${jpyToTwd(exp.amount).toLocaleString()}`:`¥${Number(exp.amount).toLocaleString()}`}
                    </div>
                  </div>
                  <button onClick={()=>sync.deleteExpense(exp.id)} style={{
                    background:'none', border:'none', cursor:'pointer', color:'rgba(212,144,154,0.5)', padding:'2px',
                  }}>
                    <Icon name="x" size={16}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {expenses.length===0 && (
          <div style={{ textAlign:'center', padding:'52px 0', color:'var(--ink-faint)' }}>
            <Icon name="wallet" size={36} color="var(--rose-light)" style={{ marginBottom:12 }}/>
            <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:16, color:'var(--ink-soft)', marginTop:12 }}>
              尚無消費紀錄
            </div>
            <div style={{ fontSize:12, marginTop:4 }}>點右下角 ＋ 開始記帳</div>
          </div>
        )}
      </div>

      <button className="fab" onClick={()=>setShowAdd(true)}>
        <Icon name="plus" size={22} color="white"/>
      </button>

      <AddExpenseSheet isOpen={showAdd} onClose={()=>setShowAdd(false)}
        onSave={sync.addExpense} members={members} jpyToTwd={jpyToTwd} twdToJpy={twdToJpy}/>
      <SettlementSheet isOpen={showSettlement} onClose={()=>setShowSettlement(false)}
        expenses={expenses} members={members} jpyToTwd={jpyToTwd}/>
    </div>
  )
}

const headerBtn = {
  background:'rgba(255,255,255,0.2)', border:'none', borderRadius:12,
  padding:'5px 10px', color:'white', fontSize:12, cursor:'pointer', fontWeight:600,
  display:'flex', alignItems:'center', gap:4,
}

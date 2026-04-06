import { useState, useCallback, useMemo } from 'react'
import { getTripData, saveTripData, getStopNote, setStopNote, getExpenses, saveExpenses } from '../utils/storage'
import { TYPE_CONFIG, TRANSIT_TYPES } from '../data/tripData'
import TypeBadge from '../components/TypeBadge'
import BottomSheet from '../components/BottomSheet'
import { useWeather } from '../hooks/useWeather'

// ─── Weather Widget ─────────────────────────────────────────
function WeatherWidget({ date, weather, isTypical }) {
  if (!weather) return null
  const w = weather.find(x => x.date === date)
  if (!w) return null
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <span style={{ fontSize:18 }}>{w.icon}</span>
      <span style={{ fontFamily:'Cormorant Garant,serif', fontSize:14, color:'var(--teal)', fontWeight:600 }}>
        {w.min}° ~ {w.max}°C
      </span>
      <span style={{ fontSize:11, color:'var(--ink-soft)' }}>{w.label}</span>
      {isTypical && (
        <span style={{ fontSize:10, color:'var(--ink-faint)', fontStyle:'italic' }}>（參考往年）</span>
      )}
    </div>
  )
}

// ─── Day Selector ────────────────────────────────────────────
function DaySelector({ days, selectedDay, setSelectedDay }) {
  return (
    <div className="day-selector-scroll" style={{
      background:'var(--bg-card)', borderBottom:'1px solid var(--border)',
    }}>
      {days.map(d => {
        const date = new Date(d.date)
        const mmdd = `${date.getMonth()+1}/${date.getDate()}`
        const active = d.day === selectedDay
        return (
          <button key={d.day} onClick={() => setSelectedDay(d.day)} style={{
            flexShrink:0, display:'flex', flexDirection:'column',
            alignItems:'center', padding:'6px 14px', borderRadius:20,
            border: active ? 'none' : '1.5px solid var(--border)',
            background: active ? 'var(--rose)' : 'transparent',
            color: active ? 'white' : 'var(--ink-mid)',
            cursor:'pointer', transition:'all 0.2s',
          }}>
            <span style={{ fontSize:12, fontFamily:'Cormorant Garant,serif', fontWeight:600 }}>
              Day {d.day}
            </span>
            <span style={{ fontSize:10, opacity:0.85 }}>{mmdd}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Stop Card ───────────────────────────────────────────────
function StopCard({ stop, isLast, onTap }) {
  const cfg = TYPE_CONFIG[stop.type] || TYPE_CONFIG.other
  const isTransit = TRANSIT_TYPES.has(stop.type)
  return (
    <div style={{ position:'relative', paddingLeft:50, paddingRight:0, paddingBottom:0 }}>
      {/* Timeline line */}
      {!isLast && (
        <div style={{
          position:'absolute', left:16, top:42, bottom:0, width:2,
          background: isTransit
            ? 'repeating-linear-gradient(to bottom,var(--teal-light) 0,var(--teal-light) 5px,transparent 5px,transparent 10px)'
            : 'linear-gradient(to bottom,var(--rose-light),var(--sage-light))',
        }}/>
      )}
      {/* Icon */}
      <div style={{ position:'absolute', left:0, top:9 }}>
        <TypeBadge type={stop.type} size="md"/>
      </div>
      {/* Card */}
      <button onClick={() => onTap(stop)} style={{
        width:'100%', textAlign:'left',
        background: isTransit ? 'rgba(168,216,234,0.06)' : 'var(--bg-card)',
        border: isTransit ? '1.5px dashed var(--teal-light)' : '1px solid var(--border)',
        borderRadius:'var(--radius-sm)',
        padding:'9px 12px', marginBottom:8, cursor:'pointer',
        boxShadow: isTransit ? 'none' : 'var(--shadow-card)',
        display:'flex', alignItems:'center', gap:8,
        transition:'transform 0.12s',
      }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
            <span style={{
              fontFamily:'Cormorant Garant,serif', fontSize:12, fontWeight:600,
              color:'var(--rose)', flexShrink:0, letterSpacing:'0.02em',
            }}>{stop.time}</span>
            <span style={{
              fontSize: isTransit ? 13 : 14,
              fontWeight: isTransit ? 400 : 500,
              color: isTransit ? 'var(--teal)' : 'var(--ink)',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>{stop.name}</span>
          </div>
          {stop.duration && stop.duration !== '0h00m' && (
            <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:2, display:'flex', gap:5, alignItems:'center' }}>
              <span style={{
                background:cfg.bg||'#F5F5F5', color:cfg.color,
                borderRadius:4, padding:'1px 6px', fontSize:10, fontWeight:600,
              }}>{cfg.label}</span>
              <span>⏱ {stop.duration.replace('h','hr ').replace('m','min')}</span>
            </div>
          )}
        </div>
        <span style={{ fontSize:13, color:'var(--ink-faint)', flexShrink:0 }}>›</span>
      </button>
    </div>
  )
}

// ─── Edit Stop Sheet ─────────────────────────────────────────
function EditStopSheet({ stop, isOpen, onClose, onSave }) {
  const [name, setName] = useState(stop?.name || '')
  const [time, setTime] = useState(stop?.time || '')
  const [duration, setDuration] = useState(stop?.duration || '0h00m')
  const [type, setType] = useState(stop?.type || 'attraction')

  if (!stop) return null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="80vh">
      <div style={{ padding:'0 16px 32px' }}>
        <div className="section-label" style={{ fontSize:17, marginBottom:18 }}>
          ✏️ 編輯景點
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={lbl}>景點名稱</label>
            <input className="input-field" value={name} onChange={e=>setName(e.target.value)}/>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <div style={{ flex:1 }}>
              <label style={lbl}>時間</label>
              <input className="input-field" type="time" value={time} onChange={e=>setTime(e.target.value)}/>
            </div>
            <div style={{ flex:1 }}>
              <label style={lbl}>停留時間</label>
              <input className="input-field" placeholder="1h30m" value={duration} onChange={e=>setDuration(e.target.value)}/>
            </div>
          </div>
          <div>
            <label style={lbl}>類型</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {Object.entries(TYPE_CONFIG).map(([k,v]) => (
                <button key={k} onClick={()=>setType(k)} style={{
                  padding:'4px 11px', borderRadius:16, cursor:'pointer', fontSize:12,
                  border: type===k ? 'none' : '1.5px solid var(--border)',
                  background: type===k ? v.color : 'var(--bg-card)',
                  color: type===k ? 'white' : 'var(--ink-mid)',
                  transition:'all 0.15s',
                }}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={()=>{ onSave({...stop,name,time,duration,type}); onClose() }}>
            儲存修改
          </button>
          <button className="btn-secondary" onClick={onClose}>取消</button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Stop Detail Sheet ───────────────────────────────────────
function StopDetailSheet({ stop, stops, isOpen, onClose, onEdit, onAddExpense }) {
  const [note, setNote] = useState(() => stop ? getStopNote(stop.id) : '')
  const [saved, setSaved] = useState(false)
  const cfg = stop ? (TYPE_CONFIG[stop.type] || TYPE_CONFIG.other) : null

  const handleNoteBlur = () => {
    if (stop) { setStopNote(stop.id, note); setSaved(true) }
  }

  const openGeo = () => {
    if (!stop) return
    const dest = encodeURIComponent(stop.name + ' Japan')
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const origin = `${pos.coords.latitude},${pos.coords.longitude}`
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`,'_blank')
      }, () => window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`,'_blank'))
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`,'_blank')
    }
  }

  const openRoute = () => {
    if (!stop || !stops) return
    const idx = stops.findIndex(s => s.id === stop.id)
    const prev = idx > 0 ? stops[idx-1] : null
    const dest = encodeURIComponent(stop.name + ' Japan')
    if (prev) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(prev.name+' Japan')}&destination=${dest}&travelmode=transit`,'_blank')
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`,'_blank')
    }
  }

  if (!stop) return null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="78vh">
      <div style={{ padding:'0 16px 32px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{
            width:44,height:44,borderRadius:'50%',
            background:cfg.bg||'#F5F5F5',
            border:`2px solid ${cfg.color}33`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:22,flexShrink:0,
          }}>{cfg.icon}</div>
          <div style={{ flex:1 }}>
            <div style={{
              background:cfg.bg||'#F5F5F5', color:cfg.color,
              borderRadius:6, padding:'1px 8px', fontSize:10, fontWeight:700,
              display:'inline-block', marginBottom:4, letterSpacing:'0.04em',
            }}>{cfg.label}</div>
            <div style={{
              fontFamily:'Cormorant Garant,serif',
              fontSize:18, fontWeight:600, color:'var(--ink)', lineHeight:1.2,
            }}>{stop.name}</div>
          </div>
          <button onClick={()=>{ onClose(); setTimeout(()=>onEdit(stop), 350) }} style={{
            background:'var(--rose-pale)', border:'none', borderRadius:8,
            padding:'6px 10px', color:'var(--rose)', fontSize:12, cursor:'pointer', fontWeight:600,
          }}>✏️ 編輯</button>
        </div>

        {/* Time */}
        <div style={{
          display:'flex', gap:16, marginBottom:14, padding:'9px 13px',
          background:'var(--bg)', borderRadius:'var(--radius-sm)',
          border:'1.5px dashed var(--rose-light)',
        }}>
          <span style={{ fontSize:15, fontFamily:'Cormorant Garant,serif', fontWeight:600, color:'var(--rose)' }}>
            🕐 {stop.time}
          </span>
          {stop.duration && stop.duration !== '0h00m' && (
            <span style={{ fontSize:13, color:'var(--ink-soft)' }}>
              ⏳ {stop.duration.replace('h','hr ').replace('m','min')}
            </span>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--ink-mid)', marginBottom:6, display:'flex', gap:5, alignItems:'center' }}>
            📝 備註
            {saved && <span style={{ fontSize:11, color:'var(--sage)' }}>✓ 已儲存</span>}
          </div>
          <textarea className="input-field" placeholder="輸入備註…"
            value={note}
            onChange={e=>{ setNote(e.target.value); setSaved(false) }}
            onBlur={handleNoteBlur} rows={3}/>
        </div>

        {/* Map */}
        <div style={{ display:'flex', gap:8, marginBottom:14 }}>
          <button onClick={openGeo} style={{
            flex:1, padding:'10px 6px',
            background:'linear-gradient(135deg,var(--teal),#5E8FA0)',
            color:'white', border:'none', borderRadius:'var(--radius-sm)',
            fontSize:12, fontWeight:600, cursor:'pointer',
          }}>📍 從現在位置</button>
          <button onClick={openRoute} style={{
            flex:1, padding:'10px 6px',
            background:'linear-gradient(135deg,var(--rose),#B07870)',
            color:'white', border:'none', borderRadius:'var(--radius-sm)',
            fontSize:12, fontWeight:600, cursor:'pointer',
          }}>🚃 此站路線</button>
        </div>

        {/* Quick expense */}
        <button onClick={()=>{ onClose(); setTimeout(()=>onAddExpense(stop), 350) }} style={{
          width:'100%', padding:'11px',
          background:'var(--amber-pale)', color:'var(--amber)',
          border:'1.5px solid var(--amber-light)',
          borderRadius:'var(--radius-sm)',
          fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:10,
        }}>
          💴 在此景點新增消費
        </button>

        <button className="btn-secondary" onClick={onClose}>關閉</button>
      </div>
    </BottomSheet>
  )
}

// ─── Quick Expense Sheet (from stop) ─────────────────────────
function QuickExpenseSheet({ stop, isOpen, onClose }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('JPY')
  const [note, setNote] = useState('')

  const handleSave = () => {
    if (!amount) return
    const expenses = JSON.parse(localStorage.getItem('expenses') || '[]')
    const rate = JSON.parse(localStorage.getItem('exchange_rate') || '{"JPY_TWD":0.218}').JPY_TWD
    const jpyAmount = currency === 'JPY' ? Number(amount) : Math.round(Number(amount) / rate)
    expenses.push({
      id: `exp_${Date.now()}`,
      name: stop?.name || '',
      amount: jpyAmount,
      currency: 'JPY',
      paidBy: localStorage.getItem('current_member') || 'YL',
      splitWith: JSON.parse(localStorage.getItem('members') || '[]'),
      category: TYPE_CONFIG[stop?.type]?.label === '餐廳' ? '餐廳' : '其他',
      date: new Date().toISOString().slice(0,10),
      note: note,
      stopId: stop?.id,
    })
    saveExpenses(expenses)
    setAmount(''); setNote(''); onClose()
    alert('✓ 已新增到記帳')
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="60vh">
      <div style={{ padding:'0 16px 32px' }}>
        <div className="section-label" style={{ fontSize:16, marginBottom:16 }}>
          💴 新增消費 · {stop?.name}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setCurrency('JPY')} style={currBtn(currency==='JPY')}>¥ 日幣</button>
            <button onClick={()=>setCurrency('TWD')} style={currBtn(currency==='TWD')}>NT$ 台幣</button>
          </div>
          <input className="input-field" type="number" inputMode="decimal"
            placeholder={currency==='JPY'?'金額 ¥':'金額 NT$'}
            value={amount} onChange={e=>setAmount(e.target.value)}/>
          <input className="input-field" placeholder="備註（選填）"
            value={note} onChange={e=>setNote(e.target.value)}/>
          <button className="btn-primary" onClick={handleSave}>確認新增</button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ─── Main ────────────────────────────────────────────────────
const lbl = { display:'block', fontSize:12, fontWeight:600, color:'var(--ink-mid)', marginBottom:5 }
const currBtn = (active) => ({
  flex:1, padding:'8px', borderRadius:'var(--radius-sm)', cursor:'pointer', fontSize:13, fontWeight:600,
  border: active ? 'none' : '1.5px solid var(--border)',
  background: active ? 'var(--amber)' : 'var(--bg-card)',
  color: active ? 'white' : 'var(--ink-mid)', transition:'all 0.15s',
})

export default function ItineraryTab({ selectedDay, setSelectedDay }) {
  const [tripData, setTripData] = useState(getTripData)
  const [selectedStop, setSelectedStop] = useState(null)
  const [editStop, setEditStop] = useState(null)
  const [quickExpenseStop, setQuickExpenseStop] = useState(null)

  const dates = useMemo(() => tripData.days.map(d => d.date), [tripData])
  const { weather, isTypical } = useWeather(dates)

  const currentDayData = tripData.days.find(d => d.day === selectedDay)

  const handleSaveStop = useCallback((updatedStop) => {
    const updated = { ...tripData }
    updated.days = updated.days.map(day => ({
      ...day,
      stops: day.stops.map(s => s.id === updatedStop.id ? updatedStop : s),
    }))
    setTripData(updated)
    saveTripData(updated)
  }, [tripData])

  return (
    <div>
      <DaySelector days={tripData.days} selectedDay={selectedDay} setSelectedDay={setSelectedDay}/>

      <div style={{ padding:'14px 16px 0' }}>
        {/* Day header with weather */}
        {currentDayData && (
          <>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:12, paddingBottom:10,
              borderBottom:'1.5px dashed var(--border)',
            }}>
              <div>
                <div style={{
                  fontFamily:'Cormorant Garant,serif', fontSize:15, fontWeight:600, color:'var(--ink)',
                }}>
                  {new Date(currentDayData.date).toLocaleDateString('zh-TW', {
                    month:'long', day:'numeric', weekday:'long',
                  })}
                </div>
                <WeatherWidget
                  date={currentDayData.date}
                  weather={weather}
                  isTypical={isTypical}
                />
              </div>
              <div style={{ fontSize:11, color:'var(--ink-faint)' }}>
                {currentDayData.stops.length} 站
              </div>
            </div>

            {currentDayData.stops.map((stop, i) => (
              <StopCard
                key={stop.id}
                stop={stop}
                isLast={i === currentDayData.stops.length - 1}
                onTap={setSelectedStop}
              />
            ))}
          </>
        )}
      </div>

      {/* Stop detail sheet */}
      <StopDetailSheet
        stop={selectedStop}
        stops={currentDayData?.stops}
        isOpen={!!selectedStop}
        onClose={() => setSelectedStop(null)}
        onEdit={(s) => setEditStop(s)}
        onAddExpense={(s) => setQuickExpenseStop(s)}
      />

      {/* Edit stop sheet */}
      <EditStopSheet
        stop={editStop}
        isOpen={!!editStop}
        onClose={() => setEditStop(null)}
        onSave={handleSaveStop}
      />

      {/* Quick expense sheet */}
      <QuickExpenseSheet
        stop={quickExpenseStop}
        isOpen={!!quickExpenseStop}
        onClose={() => setQuickExpenseStop(null)}
      />
    </div>
  )
}

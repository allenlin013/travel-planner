import { useState, useMemo, useEffect, useCallback } from 'react'
import { useSync } from '../context/SyncContext'
import { useWeather } from '../hooks/useWeather'
import { useExchangeRate } from '../hooks/useExchangeRate'
import { MEMBERS } from '../data/tripData'
import BottomSheet from '../components/BottomSheet'
import Icon from '../components/Icon'

// ── Constants ─────────────────────────────────────────────────
// These types become transit connectors, not full cards
const CONNECTOR_TYPES = new Set(['train', 'walk', 'taxi'])

const TYPE_LABEL = {
  attraction: '景點', restaurant: '美食', shopping: '購物',
  hotel: '住宿', boat: '遊覽', flight: '航班', other: '其他',
  train: '交通', walk: '步行', taxi: '交通',
}

const TRANSIT_ICON = { train: 'train', walk: 'walk', taxi: 'taxi', flight: 'plane' }
const WEATHER_ICON = { '☀️':'sun', '🌤':'cloud', '☁️':'cloud', '🌦':'cloudRain', '🌧':'cloudRain', '🌨':'cloudSnow', '⛈':'cloudRain', '🌫':'wind' }

function parseMins(dur = '0h00m') {
  const m = dur.match(/(\d+)h(\d+)m/)
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0
}
function fmtDur(dur = '0h00m') {
  const m = dur.match(/(\d+)h(\d+)m/)
  if (!m) return ''
  const h = parseInt(m[1]), min = parseInt(m[2])
  if (h === 0) return `${min} 分鐘`
  if (min === 0) return `${h} 小時`
  return `${h} 小時 ${min} 分鐘`
}

// Group flat stops into activity cards + transit connectors
function groupStops(stops) {
  const out = []
  let transit = []
  for (const s of stops) {
    if (CONNECTOR_TYPES.has(s.type)) {
      transit.push(s)
    } else {
      if (transit.length) { out.push({ kind: 'transit', stops: transit }); transit = [] }
      out.push({ kind: 'activity', stop: s })
    }
  }
  if (transit.length) out.push({ kind: 'transit', stops: transit })
  return out
}

// ── Day Selector ─────────────────────────────────────────────
function DaySelector({ days, selectedDay, setSelectedDay }) {
  return (
    <div className="day-selector-scroll" style={{
      background: 'white', borderBottom: '1px solid rgba(212,144,154,0.15)',
    }}>
      {days.map(d => {
        const dt = new Date(d.date)
        const active = d.day === selectedDay
        return (
          <button key={d.day} onClick={() => setSelectedDay(d.day)} style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '6px 15px', borderRadius: 20,
            border: active ? 'none' : '1.5px solid rgba(212,144,154,0.3)',
            background: active ? 'var(--rose)' : 'transparent',
            color: active ? 'white' : 'var(--ink-mid)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 12, fontFamily: 'Cormorant Garant,serif', fontWeight: 600 }}>
              Day {d.day}
            </span>
            <span style={{ fontSize: 10, opacity: 0.8 }}>
              {(dt.getMonth()+1)}/{dt.getDate()}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Activity Card ─────────────────────────────────────────────
function ActivityCard({ stop, expenses, onTap }) {
  const stopExp = expenses.filter(e => e.stopId === stop.id)
  const totalJPY = stopExp.reduce((s, e) => s + (Number(e.amount)||0), 0)
  const { jpyToTwd } = useExchangeRate()

  return (
    <div
      onClick={() => onTap(stop)}
      style={{
        background: 'white',
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 0,
        border: '1px solid rgba(212,144,154,0.15)',
        boxShadow: '0 2px 16px rgba(212,144,154,0.12)',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Top row: time + category */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{
          fontFamily: 'Cormorant Garant,serif', fontSize: 14,
          fontWeight: 600, color: 'var(--rose)', letterSpacing: '0.04em',
        }}>
          {stop.time}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 500, color: 'var(--rose)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {TYPE_LABEL[stop.type] || '其他'}
        </span>
      </div>

      {/* Stop name */}
      <div style={{
        fontFamily: 'Cormorant Garant,serif',
        fontSize: 20, fontWeight: 700,
        color: 'var(--ink)', lineHeight: 1.2, marginBottom: 6,
      }}>
        {stop.name}
      </div>

      {/* Description preview */}
      {stop.description && (
        <div style={{
          fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6,
          marginBottom: 6,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {stop.description}
        </div>
      )}

      {/* Expense total */}
      {totalJPY > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontFamily: 'Cormorant Garant,serif', fontSize: 18,
              fontWeight: 600, color: 'var(--ink)',
            }}>
              NT$ {jpyToTwd(totalJPY).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-soft)' }}>
              (¥{totalJPY.toLocaleString()})
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Transit Connector ─────────────────────────────────────────
function TransitConnector({ stops }) {
  const [expanded, setExpanded] = useState(false)
  const totalMins = stops.reduce((s, st) => s + parseMins(st.duration), 0)
  const primaryType = stops[0]?.type || 'train'
  const iconName = TRANSIT_ICON[primaryType] || 'train'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2px 0' }}>
      {/* Top dashed line */}
      <div style={{ width: 1.5, height: 14, background: 'repeating-linear-gradient(to bottom,rgba(212,144,154,0.4) 0,rgba(212,144,154,0.4) 4px,transparent 4px,transparent 8px)' }}/>

      {/* Clickable connector circle */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'white',
          border: '1.5px solid rgba(212,144,154,0.35)',
          boxShadow: '0 2px 8px rgba(212,144,154,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={iconName} size={17} color="var(--rose)" strokeWidth={1.5}/>
        </div>
        {totalMins > 0 && (
          <span style={{ fontSize: 10, color: 'var(--ink-soft)', fontWeight: 500 }}>
            {totalMins} min
          </span>
        )}
      </button>

      {/* Expanded transit stops */}
      {expanded && (
        <div style={{
          width: '80%', background: 'white',
          border: '1px solid rgba(212,144,154,0.2)',
          borderRadius: 10, padding: '10px 14px',
          boxShadow: '0 2px 12px rgba(212,144,154,0.12)',
          marginBottom: 4,
        }}>
          {stops.map((st, i) => (
            <div key={st.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              paddingBottom: i < stops.length - 1 ? 8 : 0,
              borderBottom: i < stops.length - 1 ? '1px solid rgba(212,144,154,0.1)' : 'none',
              marginBottom: i < stops.length - 1 ? 8 : 0,
            }}>
              <Icon name={TRANSIT_ICON[st.type] || 'train'} size={14} color="var(--ink-soft)"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{st.name}</div>
                {parseMins(st.duration) > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{fmtDur(st.duration)}</div>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--rose)', fontFamily: 'Cormorant Garant,serif', fontWeight: 600 }}>
                {st.time}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom dashed line */}
      <div style={{ width: 1.5, height: 14, background: 'repeating-linear-gradient(to bottom,rgba(212,144,154,0.4) 0,rgba(212,144,154,0.4) 4px,transparent 4px,transparent 8px)' }}/>
    </div>
  )
}

// ── Stop Detail Sheet ─────────────────────────────────────────
function StopDetailSheet({ stop, isOpen, onClose, sync }) {
  const { jpyToTwd, twdToJpy } = useExchangeRate()
  const members = sync.members || MEMBERS

  // Basic info edit
  const [editBasic, setEditBasic] = useState(false)
  const [draftTime, setDraftTime] = useState('')
  const [draftDur, setDraftDur] = useState('')

  // Description edit
  const [editDesc, setEditDesc] = useState(false)
  const [draftDesc, setDraftDesc] = useState('')

  // Expense drafts
  const [draftExp, setDraftExp] = useState([])
  const [expSaving, setExpSaving] = useState(false)

  // Sync draft state whenever stop changes
  useEffect(() => {
    if (!stop) return
    setDraftTime(stop.time || '')
    setDraftDur(stop.duration || '0h00m')
    setDraftDesc(stop.description || '')
    setEditBasic(false)
    setEditDesc(false)
    // Load expenses for this stop
    const stopExps = sync.expenses.filter(e => e.stopId === stop.id)
    setDraftExp(stopExps.map(e => ({ ...e, _currency: 'JPY' })))
  }, [stop?.id, sync.expenses])

  if (!stop) return null

  // ── Helpers ─────────────────────────────────────────────
  const updateStop = useCallback((patch) => {
    const updated = {
      ...sync.tripData,
      days: sync.tripData.days.map(day => ({
        ...day,
        stops: day.stops.map(s => s.id === stop.id ? { ...s, ...patch } : s),
      })),
    }
    sync.updateTripData(updated)
  }, [sync, stop])

  const saveBasic = () => { updateStop({ time: draftTime, duration: draftDur }); setEditBasic(false) }
  const saveDesc  = () => { updateStop({ description: draftDesc }); setEditDesc(false) }

  const addExpRow = () => {
    setDraftExp(prev => [...prev, {
      id: `exp_new_${Date.now()}`,
      name: '', amount: 0, _currency: 'JPY',
      paidBy: members[0], splitWith: [...members],
      stopId: stop.id, date: new Date().toISOString().slice(0,10),
      category: '其他', note: '', isNew: true,
    }])
  }

  const updateRow = (idx, patch) => {
    setDraftExp(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e))
  }

  const removeRow = (idx) => setDraftExp(prev => prev.filter((_, i) => i !== idx))

  const saveExpenses = async () => {
    setExpSaving(true)
    // Remove all original stop expenses
    for (const e of sync.expenses.filter(e => e.stopId === stop.id)) {
      await sync.deleteExpense(e.id)
    }
    // Add non-empty drafts
    for (const d of draftExp) {
      if (!d.name.trim() || !Number(d.amount)) continue
      const amtJPY = d._currency === 'JPY' ? Number(d.amount) : twdToJpy(Number(d.amount))
      const { isNew, _currency, ...rest } = d
      await sync.addExpense({
        ...rest,
        id: d.isNew ? `exp_${Date.now()}_${Math.random().toString(36).slice(2,7)}` : d.id,
        amount: amtJPY,
      })
    }
    setExpSaving(false)
  }

  const openGeo = () => {
    const dest = encodeURIComponent(stop.name + ' Japan')
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => window.open(`https://www.google.com/maps/dir/?api=1&origin=${pos.coords.latitude},${pos.coords.longitude}&destination=${dest}&travelmode=transit`, '_blank'),
        ()  => window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`, '_blank')
      )
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`, '_blank')
    }
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="92vh">
      <div style={{ padding: '0 20px 48px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div style={{ flex:1, paddingRight:12 }}>
            <div style={{
              fontSize:9, letterSpacing:'0.18em', color:'var(--ink-soft)',
              textTransform:'uppercase', fontFamily:'Cormorant Garant,serif',
              marginBottom:4,
            }}>Details</div>
            <div style={{
              fontFamily:'Cormorant Garant,serif',
              fontSize:24, fontWeight:700, color:'var(--ink)', lineHeight:1.15,
            }}>{stop.name}</div>
          </div>
          <button onClick={onClose} style={{
            width:32, height:32, borderRadius:'50%', border:'1.5px solid rgba(212,144,154,0.3)',
            background:'white', display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', flexShrink:0,
          }}>
            <Icon name="x" size={14} color="var(--ink-soft)"/>
          </button>
        </div>

        {/* Divider */}
        <div style={{ height:1, background:'rgba(212,144,154,0.15)', marginBottom:20 }}/>

        {/* ── Section 1: Basic Info ── */}
        <section style={{ marginBottom:20 }}>
          <div style={secHeader}>
            <Icon name="info" size={14} color="var(--rose)"/>
            <span>基本資訊</span>
            <button onClick={() => setEditBasic(v => !v)} style={editBtn}>
              <Icon name="pencil" size={13} color="var(--ink-soft)"/>
            </button>
          </div>
          {editBasic ? (
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:10 }}>
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ flex:1 }}>
                  <label style={lbl}>時間</label>
                  <input className="input-field" type="time" value={draftTime} onChange={e=>setDraftTime(e.target.value)}/>
                </div>
                <div style={{ flex:1 }}>
                  <label style={lbl}>停留時間</label>
                  <input className="input-field" placeholder="1h30m" value={draftDur} onChange={e=>setDraftDur(e.target.value)}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button className="btn-primary" style={{ flex:1 }} onClick={saveBasic}>儲存</button>
                <button className="btn-secondary" style={{ flex:1 }} onClick={()=>setEditBasic(false)}>取消</button>
              </div>
            </div>
          ) : (
            <div style={{ display:'flex', gap:20, marginTop:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Icon name="clock" size={14} color="var(--ink-soft)"/>
                <span style={{ fontFamily:'Cormorant Garant,serif', fontSize:15, fontWeight:600, color:'var(--ink)' }}>
                  {stop.time}
                </span>
              </div>
              {stop.duration && stop.duration !== '0h00m' && (
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Icon name="timer" size={14} color="var(--ink-soft)"/>
                  <span style={{ fontSize:13, color:'var(--ink-mid)' }}>
                    預計停留 {fmtDur(stop.duration)}
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        <div style={{ height:1, background:'rgba(212,144,154,0.1)', marginBottom:20 }}/>

        {/* ── Section 2: Description / Notes ── */}
        <section style={{ marginBottom:20 }}>
          <div style={secHeader}>
            <Icon name="info" size={14} color="var(--rose)"/>
            <span>介紹 / 備註</span>
            <button onClick={() => setEditDesc(v => !v)} style={editBtn}>
              <Icon name="pencil" size={13} color="var(--ink-soft)"/>
            </button>
          </div>
          {editDesc ? (
            <div style={{ marginTop:10 }}>
              <textarea className="input-field" rows={5}
                value={draftDesc}
                onChange={e=>setDraftDesc(e.target.value)}
                placeholder="加入景點介紹或備註…"/>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button className="btn-primary" style={{ flex:1 }} onClick={saveDesc}>儲存</button>
                <button className="btn-secondary" style={{ flex:1 }} onClick={()=>setEditDesc(false)}>取消</button>
              </div>
            </div>
          ) : (
            <div style={{
              fontSize:13, color: stop.description ? 'var(--ink)' : 'var(--ink-faint)',
              lineHeight:1.7, marginTop:10,
              fontStyle: stop.description ? 'normal' : 'italic',
            }}>
              {stop.description || '點右側筆圖示加入介紹或備註'}
            </div>
          )}
        </section>

        <div style={{ height:1, background:'rgba(212,144,154,0.1)', marginBottom:20 }}/>

        {/* ── Section 3: Expense Items ── */}
        <section style={{ marginBottom:20 }}>
          <div style={secHeader}>
            <Icon name="receipt" size={14} color="var(--rose)"/>
            <span>支出細項（可編輯）</span>
            <button onClick={addExpRow} style={{ ...editBtn, marginLeft:'auto' }}>
              <Icon name="plus" size={16} color="var(--rose)"/>
            </button>
          </div>

          {draftExp.length === 0 && (
            <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:8, fontStyle:'italic' }}>
              尚無消費記錄，點 ＋ 新增
            </div>
          )}

          {draftExp.map((exp, idx) => (
            <div key={exp.id} style={{
              background:'var(--bg)', borderRadius:10,
              padding:'12px', marginTop:10,
              border:'1px solid rgba(212,144,154,0.15)',
            }}>
              {/* Name */}
              <input className="input-field" placeholder="費用名稱"
                value={exp.name} style={{ marginBottom:8 }}
                onChange={e => updateRow(idx, { name: e.target.value })}/>

              {/* Currency + Amount row */}
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <select
                  value={exp._currency || 'JPY'}
                  onChange={e => updateRow(idx, { _currency: e.target.value })}
                  style={{
                    padding:'8px 10px', borderRadius:8, fontSize:13,
                    border:'1.5px solid rgba(212,144,154,0.3)',
                    background:'white', color:'var(--ink)', cursor:'pointer',
                    minWidth:72,
                  }}
                >
                  <option value="JPY">JPY</option>
                  <option value="TWD">TWD</option>
                </select>
                <input className="input-field" type="number" inputMode="decimal"
                  placeholder="0"
                  style={{ flex:1 }}
                  value={exp.amount || ''}
                  onChange={e => updateRow(idx, { amount: e.target.value })}/>
              </div>

              {/* Payer pills + conversion + delete */}
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                {members.map(m => (
                  <button key={m}
                    onClick={() => updateRow(idx, { paidBy: m })}
                    style={{
                      padding:'3px 9px', borderRadius:12, fontSize:11, fontWeight:600,
                      cursor:'pointer', border:'none', transition:'all 0.15s',
                      background: exp.paidBy === m ? 'var(--ink)' : 'rgba(212,144,154,0.12)',
                      color: exp.paidBy === m ? 'white' : 'var(--ink-soft)',
                    }}>{m}</button>
                ))}
                {Number(exp.amount) > 0 && (
                  <span style={{ fontSize:11, color:'var(--ink-soft)', marginLeft:4 }}>
                    ≈ NT${(exp._currency==='TWD' ? Number(exp.amount) : jpyToTwd(Number(exp.amount))).toLocaleString()}
                  </span>
                )}
                <button onClick={() => removeRow(idx)} style={{
                  marginLeft:'auto', background:'none', border:'none',
                  cursor:'pointer', color:'rgba(212,144,154,0.6)', padding:'2px',
                }}>
                  <Icon name="trash" size={14}/>
                </button>
              </div>
            </div>
          ))}

          {draftExp.length > 0 && (
            <button
              onClick={saveExpenses}
              disabled={expSaving}
              style={{
                width:'100%', marginTop:12, padding:'12px',
                background:'linear-gradient(135deg,var(--rose),#B07878)',
                color:'white', border:'none', borderRadius:10,
                fontSize:14, fontWeight:600, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                opacity: expSaving ? 0.7 : 1,
              }}
            >
              <Icon name="save" size={15} color="white"/>
              {expSaving ? '儲存中…' : '儲存支出變更'}
            </button>
          )}
        </section>

        <div style={{ height:1, background:'rgba(212,144,154,0.1)', marginBottom:16 }}/>

        {/* Map buttons */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={openGeo} style={mapBtn('#7AA8B8')}>
            <Icon name="navigation" size={14} color="white"/>
            從現在位置導航
          </button>
          <button onClick={() => {
            const stops = sync.tripData?.days.flatMap(d => d.stops) || []
            const idx = stops.findIndex(s => s.id === stop.id)
            const prev = idx > 0 ? stops[idx-1] : null
            const dest = encodeURIComponent(stop.name + ' Japan')
            const origin = prev ? encodeURIComponent(prev.name + ' Japan') : ''
            window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`, '_blank')
          }} style={mapBtn('#C4968C')}>
            <Icon name="train" size={14} color="white"/>
            此站路線
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ── Style constants ───────────────────────────────────────────
const secHeader = {
  display:'flex', alignItems:'center', gap:7,
  fontSize:12, fontWeight:600, color:'var(--ink-mid)', letterSpacing:'0.04em',
}
const editBtn = {
  marginLeft:'auto', background:'none', border:'none',
  cursor:'pointer', padding:'2px 4px', borderRadius:6, color:'var(--ink-soft)',
  display:'flex', alignItems:'center',
}
const lbl = { display:'block', fontSize:11, fontWeight:600, color:'var(--ink-soft)', marginBottom:5 }
const mapBtn = (bg) => ({
  flex:1, padding:'10px 6px', background:bg,
  color:'white', border:'none', borderRadius:10,
  fontSize:12, fontWeight:600, cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center', gap:5,
})

// ── Main ──────────────────────────────────────────────────────
export default function ItineraryTab({ selectedDay, setSelectedDay }) {
  const sync = useSync()
  const [selectedStop, setSelectedStop] = useState(null)

  const tripData  = sync.tripData
  const expenses  = sync.expenses
  const dates     = useMemo(() => (tripData?.days || []).map(d => d.date), [tripData])
  const { weather, isTypical } = useWeather(dates)

  const currentDay = tripData?.days.find(d => d.day === selectedDay)
  const segments   = useMemo(() => groupStops(currentDay?.stops || []), [currentDay])

  // Re-open updated stop from sync if sheet is open
  useEffect(() => {
    if (selectedStop && tripData) {
      const updated = tripData.days.flatMap(d => d.stops).find(s => s.id === selectedStop.id)
      if (updated) setSelectedStop(updated)
    }
  }, [tripData])

  if (!tripData) return <div style={{ padding:32, textAlign:'center', color:'var(--ink-soft)' }}>載入中…</div>

  const dayWeather = weather?.find(w => w.date === currentDay?.date)
  const weatherIcon = dayWeather ? (WEATHER_ICON[dayWeather.icon] || 'cloud') : null

  return (
    <div>
      <DaySelector days={tripData.days} selectedDay={selectedDay} setSelectedDay={setSelectedDay}/>

      {/* Day header */}
      <div style={{ padding:'14px 18px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:15, fontWeight:600, color:'var(--ink)' }}>
            {currentDay && new Date(currentDay.date).toLocaleDateString('zh-TW', { month:'long', day:'numeric', weekday:'long' })}
          </div>
          {dayWeather && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
              {weatherIcon && <Icon name={weatherIcon} size={14} color="var(--teal)"/>}
              <span style={{ fontSize:12, color:'var(--teal)', fontWeight:500 }}>
                {dayWeather.min}° ~ {dayWeather.max}°C · {dayWeather.label}
              </span>
              {isTypical && (
                <span style={{ fontSize:10, color:'var(--ink-faint)', fontStyle:'italic' }}>往年參考</span>
              )}
            </div>
          )}
        </div>
        <div style={{ fontSize:11, color:'var(--ink-faint)' }}>{currentDay?.stops?.length} 站</div>
      </div>

      {/* Segments */}
      <div style={{ padding:'8px 16px 24px' }}>
        {segments.map((seg, i) =>
          seg.kind === 'activity'
            ? <ActivityCard key={seg.stop.id} stop={seg.stop} expenses={expenses} onTap={setSelectedStop}/>
            : <TransitConnector key={`t-${i}`} stops={seg.stops}/>
        )}
      </div>

      {/* Detail sheet */}
      <StopDetailSheet
        stop={selectedStop}
        isOpen={!!selectedStop}
        onClose={() => setSelectedStop(null)}
        sync={sync}
      />
    </div>
  )
}

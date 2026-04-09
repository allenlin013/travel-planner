import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  DndContext, closestCenter,
  PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSync } from '../context/SyncContext'
import { useWeather } from '../hooks/useWeather'
import { useExchangeRate } from '../hooks/useExchangeRate'
import { MEMBERS } from '../data/tripData'
import BottomSheet from '../components/BottomSheet'
import Icon from '../components/Icon'

// ── Constants ─────────────────────────────────────────────────
const CONNECTOR_TYPES = new Set(['train', 'walk', 'taxi', 'bus'])
const TRANSIT_TYPES   = ['walk', 'train', 'bus', 'taxi']

const STOP_ICON = {
  attraction: 'temple', restaurant: 'utensils', shopping: 'shoppingBag',
  hotel: 'home', flight: 'plane', boat: 'anchor', other: 'mapPin',
}

const TYPE_LABEL = {
  attraction: '景點', restaurant: '美食', shopping: '購物',
  hotel: '住宿', boat: '遊覽', flight: '航班', other: '其他',
  train: '電車', walk: '步行', taxi: '汽車', bus: '巴士',
}

const TRANSIT_ICON  = { train: 'train', walk: 'walk', taxi: 'taxi', bus: 'bus', flight: 'plane' }
const WEATHER_ICON  = { '☀️':'sun', '🌤':'cloud', '☁️':'cloud', '🌦':'cloudRain', '🌧':'cloudRain', '🌨':'cloudSnow', '⛈':'cloudRain', '🌫':'wind' }

// ── Time helpers ──────────────────────────────────────────────
function timeToMins(t = '00:00') {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
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
function minsToHm(mins) {
  if (mins <= 0) return ''
  if (mins < 60) return `${mins} 分鐘`
  const h = Math.floor(mins / 60), m = mins % 60
  return m === 0 ? `${h} 小時` : `${h} 小時 ${m} 分鐘`
}

// ── buildSegments (view mode only) ───────────────────────────
function buildSegments(stops) {
  const raw = []
  let transit = []
  for (const s of stops) {
    if (CONNECTOR_TYPES.has(s.type)) {
      transit.push(s)
    } else {
      if (transit.length) { raw.push({ kind: 'transit', stops: transit }); transit = [] }
      raw.push({ kind: 'activity', stop: s })
    }
  }
  if (transit.length) raw.push({ kind: 'transit', stops: transit })

  const out = []
  for (let i = 0; i < raw.length; i++) {
    out.push(raw[i])
    if (i < raw.length - 1 && raw[i].kind === 'activity' && raw[i+1].kind === 'activity') {
      const curr = raw[i].stop, next = raw[i+1].stop
      // Don't insert walkHint between two flight stops (airports)
      if (curr.type === 'flight' && next.type === 'flight') continue
      const walkMins = timeToMins(next.time) - (timeToMins(curr.time) + parseMins(curr.duration))
      if (walkMins > 0 && walkMins <= 90) out.push({ kind: 'walkHint', mins: walkMins })
    }
  }
  return out
}

// ── Day Selector ──────────────────────────────────────────────
function DaySelector({ days, selectedDay, setSelectedDay }) {
  return (
    <div style={{
      display:'flex', gap:8, overflowX:'auto', padding:'10px 16px',
      background:'white', borderBottom:'1px solid rgba(212,132,154,0.15)',
      scrollbarWidth:'none',
    }}>
      {days.map(d => {
        const dt = new Date(d.date)
        const active = d.day === selectedDay
        return (
          <button key={d.day} onClick={() => setSelectedDay(d.day)} style={{
            flexShrink:0, display:'flex', flexDirection:'column',
            alignItems:'center', padding:'6px 14px', borderRadius:20,
            border: active ? 'none' : '1.5px solid rgba(212,132,154,0.3)',
            background: active ? 'linear-gradient(135deg,var(--rose-vivid),var(--rose-dark))' : 'transparent',
            color: active ? 'white' : 'var(--ink-mid)',
            cursor:'pointer', transition:'all 0.2s',
            boxShadow: active ? '0 2px 10px rgba(212,132,154,0.4)' : 'none',
          }}>
            <span style={{ fontSize:12, fontFamily:'Cormorant Garant,serif', fontWeight:700 }}>Day {d.day}</span>
            <span style={{ fontSize:10, opacity:0.8 }}>{(dt.getMonth()+1)}/{dt.getDate()}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Hourly Weather Strip (tenki.jp style) ────────────────────
// ── Stop Type Icon Badge ───────────────────────────────────────
function StopTypeBadge({ type }) {
  return (
    <div style={{
      width:36, height:36, borderRadius:10, flexShrink:0,
      background:'var(--rose-pale)', border:'1.5px solid rgba(212,132,154,0.2)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <Icon name={STOP_ICON[type] || 'mapPin'} size={16} color="var(--rose)" strokeWidth={1.8}/>
    </div>
  )
}

// ── Activity Card (view mode) ─────────────────────────────────
function ActivityCard({ stop, expenses, onTap }) {
  const stopExp  = expenses.filter(e => e.stopId === stop.id)
  const totalJPY = stopExp.reduce((s, e) => s + (Number(e.amount)||0), 0)
  const { jpyToTwd } = useExchangeRate()

  return (
    <div
      onClick={() => onTap && onTap(stop)}
      style={{
        background:'white', borderRadius:14, padding:'14px 16px',
        border:'1px solid rgba(212,132,154,0.15)',
        boxShadow:'0 2px 16px rgba(212,132,154,0.10)',
        cursor: onTap ? 'pointer' : 'default',
        transition:'box-shadow 0.15s, transform 0.1s',
        WebkitTapHighlightColor:'transparent',
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
        <StopTypeBadge type={stop.type}/>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'Cormorant Garant,serif', fontSize:13, fontWeight:700, color:'var(--rose)', letterSpacing:'0.04em' }}>
              {stop.time}
            </span>
            <span style={{ fontSize:10, fontWeight:600, color:'var(--rose)', letterSpacing:'0.08em', textTransform:'uppercase', background:'var(--rose-pale)', padding:'2px 7px', borderRadius:6 }}>
              {TYPE_LABEL[stop.type] || '其他'}
            </span>
          </div>
          <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:18, fontWeight:700, color:'var(--ink)', lineHeight:1.2, marginTop:2 }}>
            {stop.name}
          </div>
        </div>
      </div>

      {stop.description && (
        <div style={{ fontSize:12, color:'var(--ink-soft)', lineHeight:1.6, marginBottom:6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {stop.description}
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
        {stop.duration && stop.duration !== '0h00m' ? (
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <Icon name="clock" size={11} color="var(--ink-faint)"/>
            <span style={{ fontSize:11, color:'var(--ink-faint)' }}>{fmtDur(stop.duration)}</span>
          </div>
        ) : <div/>}
        {totalJPY > 0 && (
          <div style={{ textAlign:'right' }}>
            <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:15, fontWeight:700, color:'var(--rose)' }}>NT$ {jpyToTwd(totalJPY).toLocaleString()}</div>
            <div style={{ fontSize:10, color:'var(--ink-soft)' }}>¥{totalJPY.toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Walk Hint ─────────────────────────────────────────────────
function WalkHint({ mins }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'2px 0' }}>
      <div style={{ width:1.5, height:12, background:'repeating-linear-gradient(to bottom,rgba(212,132,154,0.35) 0,rgba(212,132,154,0.35) 3px,transparent 3px,transparent 7px)' }}/>
      <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 0' }}>
        <div style={{ width:30, height:30, borderRadius:'50%', background:'var(--rose-pale)', border:'1.5px solid rgba(212,132,154,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name="walk" size={14} color="var(--rose)" strokeWidth={1.5}/>
        </div>
        <span style={{ fontSize:10, color:'var(--ink-soft)', fontWeight:500 }}>步行 約 {minsToHm(mins)}</span>
      </div>
      <div style={{ width:1.5, height:12, background:'repeating-linear-gradient(to bottom,rgba(212,132,154,0.35) 0,rgba(212,132,154,0.35) 3px,transparent 3px,transparent 7px)' }}/>
    </div>
  )
}

// ── Transit Connector (view mode) ─────────────────────────────
function TransitConnector({ stops, onTypeChange }) {
  const [expanded, setExpanded] = useState(false)
  const totalMins   = stops.reduce((s, st) => s + parseMins(st.duration), 0)
  const primaryType = stops[0]?.type || 'train'
  const dashedLine  = { width:1.5, height:14, background:'repeating-linear-gradient(to bottom,rgba(212,132,154,0.4) 0,rgba(212,132,154,0.4) 4px,transparent 4px,transparent 8px)' }

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'2px 0' }}>
      <div style={dashedLine}/>

      <button type="button" onClick={() => setExpanded(v => !v)} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>
        <div style={{ width:40, height:40, borderRadius:'50%', background:'white', border:'2px solid rgba(212,132,154,0.35)', boxShadow:'0 2px 10px rgba(212,132,154,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon name={TRANSIT_ICON[primaryType] || 'train'} size={17} color="var(--rose)" strokeWidth={1.5}/>
        </div>
        {totalMins > 0 && <span style={{ fontSize:10, color:'var(--ink-soft)', fontWeight:600 }}>{minsToHm(totalMins)}</span>}
      </button>

      {expanded && (
        <div style={{ width:'88%', background:'white', border:'1px solid rgba(212,132,154,0.2)', borderRadius:12, padding:'12px 14px', boxShadow:'0 4px 16px rgba(212,132,154,0.12)', marginBottom:4 }}>
          {stops.map((st, i) => (
            <div key={st.id} style={{ paddingBottom: i < stops.length-1 ? 12 : 0, borderBottom: i < stops.length-1 ? '1px solid rgba(212,132,154,0.08)' : 'none', marginBottom: i < stops.length-1 ? 12 : 0 }}>
              {/* Stop name + time */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <Icon name={TRANSIT_ICON[st.type] || 'train'} size={14} color="var(--rose-dark)"/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{st.name}</div>
                  {parseMins(st.duration) > 0 && <div style={{ fontSize:10, color:'var(--ink-soft)' }}>{fmtDur(st.duration)}</div>}
                </div>
                <span style={{ fontSize:11, color:'var(--rose)', fontFamily:'Cormorant Garant,serif', fontWeight:700 }}>{st.time}</span>
              </div>
              {/* Flight details inline */}
              {st.type === 'flight' && st.flightNo && (
                <div style={{ background:'rgba(41,128,185,0.06)', borderRadius:8, padding:'7px 10px', marginBottom:8, fontSize:11, color:'var(--ink-soft)', lineHeight:1.7 }}>
                  <div><span style={{ fontWeight:700, color:'var(--ink)' }}>班機：</span>{st.flightNo}</div>
                  <div><span style={{ fontWeight:700, color:'var(--ink)' }}>出發：</span>{st.fromAirport}</div>
                  <div><span style={{ fontWeight:700, color:'var(--ink)' }}>抵達：</span>{st.toAirport}</div>
                </div>
              )}
              {/* Type selector — visible directly, no need for edit mode */}
              {onTypeChange && (
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {TRANSIT_TYPES.map(t => {
                    const active = st.type === t
                    return (
                      <button
                        type="button"
                        key={t}
                        onClick={() => onTypeChange(st.id, t)}
                        style={{
                          padding:'4px 10px', borderRadius:10, fontSize:11, fontWeight:600,
                          border: active ? 'none' : '1.5px solid rgba(212,132,154,0.3)',
                          cursor:'pointer', transition:'all 0.15s',
                          background: active ? 'var(--rose)' : 'white',
                          color: active ? 'white' : 'var(--rose)',
                        }}
                      >
                        {TYPE_LABEL[t]}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={dashedLine}/>
    </div>
  )
}

// ── Sortable Activity Card (edit mode) ────────────────────────
function SortableActivityCard({ stop, onDelete, expenses }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id })
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!confirmDelete) return
    const t = setTimeout(() => setConfirmDelete(false), 2000)
    return () => clearTimeout(t)
  }, [confirmDelete])

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, display:'flex', alignItems:'flex-start', gap:6, marginBottom:10 }}>
      {/* Drag handle */}
      <button {...attributes} {...listeners} style={{ padding:'14px 4px', touchAction:'none', background:'none', border:'none', cursor:'grab', flexShrink:0, display:'flex', alignItems:'center' }}>
        <Icon name="gripVertical" size={16} color="var(--ink-faint)" strokeWidth={2}/>
      </button>

      <div style={{ flex:1, minWidth:0 }}>
        <ActivityCard stop={stop} expenses={expenses} onTap={null}/>
      </div>

      {/* Delete button — stopPropagation prevents dnd sensors from intercepting tap */}
      <button
        type="button"
        onPointerDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onClick={() => { if (confirmDelete) { onDelete(stop.id) } else { setConfirmDelete(true) } }}
        style={{ padding:'14px 4px', background:'none', border:'none', cursor:'pointer', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}
      >
        <Icon name="trash" size={16} color={confirmDelete ? '#e05555' : 'rgba(212,132,154,0.5)'}/>
        {confirmDelete && <span style={{ fontSize:9, color:'#e05555', fontWeight:700, lineHeight:1 }}>確認</span>}
      </button>
    </div>
  )
}

// ── Sortable Transit Item (edit mode) ─────────────────────────
function SortableTransitItem({ stop, onTypeChange, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id })

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, marginBottom:8 }}>
      <div style={{
        background:'white', borderRadius:12, padding:'10px 12px',
        border:'1px solid rgba(212,132,154,0.2)',
        boxShadow:'0 1px 8px rgba(212,132,154,0.08)',
        display:'flex', alignItems:'center', gap:8,
      }}>
        {/* Drag handle — only element with dnd listeners */}
        <button type="button" {...attributes} {...listeners} style={{ padding:'8px 4px', touchAction:'none', background:'none', border:'none', cursor:'grab', flexShrink:0, display:'flex', alignItems:'center' }}>
          <Icon name="gripVertical" size={16} color="var(--ink-faint)" strokeWidth={2}/>
        </button>

        <div style={{ flex:1 }}>
          {/* Stop name */}
          <div style={{ fontSize:12, color:'var(--ink-soft)', marginBottom:7 }}>{stop.name}</div>
          {/* Type selector pills — stopPropagation prevents dnd sensors from grabbing these taps */}
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
            {TRANSIT_TYPES.map(t => {
              const active = stop.type === t
              return (
                <button
                  type="button"
                  key={t}
                  onPointerDown={e => e.stopPropagation()}
                  onTouchStart={e => e.stopPropagation()}
                  onClick={() => onTypeChange(stop.id, t)}
                  style={{
                    padding:'5px 12px', borderRadius:10, fontSize:12, fontWeight:600,
                    border: active ? 'none' : '1.5px solid rgba(212,132,154,0.3)',
                    cursor:'pointer', transition:'all 0.15s',
                    background: active ? 'var(--rose)' : 'white',
                    color: active ? 'white' : 'var(--rose)',
                    boxShadow: active ? '0 2px 8px rgba(212,132,154,0.3)' : 'none',
                  }}
                >
                  {TYPE_LABEL[t]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Delete */}
        <button
          type="button"
          onPointerDown={e => e.stopPropagation()}
          onClick={() => onDelete(stop.id)}
          style={{ padding:'8px 4px', background:'none', border:'none', cursor:'pointer', flexShrink:0 }}
        >
          <Icon name="trash" size={15} color="rgba(212,132,154,0.5)"/>
        </button>
      </div>
    </div>
  )
}

// ── Add Stop Modal ────────────────────────────────────────────
function AddStopModal({ isOpen, onClose, onAdd }) {
  const [name,        setName]        = useState('')
  const [type,        setType]        = useState('attraction')
  const [time,        setTime]        = useState('09:00')
  const [duration,    setDuration]    = useState('')
  const [isTransit,   setIsTransit]   = useState(false)
  const [transitType, setTransitType] = useState('walk')

  const reset = () => { setName(''); setType('attraction'); setTime('09:00'); setDuration(''); setIsTransit(false); setTransitType('walk') }

  const handleAdd = () => {
    if (!name.trim()) return
    onAdd({
      id: `stop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      type: isTransit ? transitType : type,
      time,
      duration: duration || '0h00m',
      description: '',
    })
    reset(); onClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={() => { reset(); onClose() }} height="auto">
      <div style={{ padding:'0 20px 40px' }}>
        <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:20, fontWeight:700, color:'var(--ink)', marginBottom:18 }}>
          新增行程
        </div>

        {/* Activity vs Transit toggle */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[false, true].map(isT => (
            <button key={String(isT)} onClick={() => setIsTransit(isT)} style={{
              flex:1, padding:'9px', borderRadius:10, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:600,
              background: isTransit === isT ? 'var(--rose)' : 'var(--rose-pale)',
              color: isTransit === isT ? 'white' : 'var(--rose)',
            }}>{isT ? '交通段落' : '景點 / 活動'}</button>
          ))}
        </div>

        <label style={lbl}>名稱</label>
        <input className="input-field" placeholder={isTransit ? '例：搭乘近鐵' : '例：道頓堀'} value={name} onChange={e => setName(e.target.value)} style={{ marginBottom:14 }}/>

        {!isTransit ? (
          <>
            <label style={lbl}>類型</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
              {['attraction','restaurant','shopping','hotel','other'].map(t => (
                <button key={t} onClick={() => setType(t)} style={{ padding:'5px 12px', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background: type === t ? 'var(--rose)' : 'var(--rose-pale)', color: type === t ? 'white' : 'var(--rose)' }}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <label style={lbl}>交通方式</label>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:14 }}>
              {TRANSIT_TYPES.map(t => (
                <button key={t} onClick={() => setTransitType(t)} style={{ padding:'5px 12px', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, background: transitType === t ? 'var(--rose)' : 'var(--rose-pale)', color: transitType === t ? 'white' : 'var(--rose)' }}>
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </>
        )}

        <div style={{ display:'flex', gap:12, marginBottom:20 }}>
          <div style={{ flex:1 }}>
            <label style={lbl}>時間</label>
            <input className="input-field" type="time" value={time} onChange={e => setTime(e.target.value)}/>
          </div>
          <div style={{ flex:1 }}>
            <label style={lbl}>時長（選填）</label>
            <input className="input-field" placeholder="1h30m" value={duration} onChange={e => setDuration(e.target.value)}/>
          </div>
        </div>

        <button onClick={handleAdd} disabled={!name.trim()} className="btn-primary" style={{ width:'100%', opacity: name.trim() ? 1 : 0.5 }}>
          新增
        </button>
      </div>
    </BottomSheet>
  )
}

// ── Stop Detail Sheet ─────────────────────────────────────────
function StopDetailSheet({ stop, isOpen, onClose, sync }) {
  const { jpyToTwd, twdToJpy } = useExchangeRate()
  const members = sync.members || MEMBERS

  const [editBasic, setEditBasic] = useState(false)
  const [draftTime, setDraftTime] = useState('')
  const [draftDur,  setDraftDur]  = useState('')
  const [editDesc,  setEditDesc]  = useState(false)
  const [draftDesc, setDraftDesc] = useState('')
  const [draftExp,  setDraftExp]  = useState([])
  const [expSaving, setExpSaving] = useState(false)

  useEffect(() => {
    if (!stop) return
    setDraftTime(stop.time || '')
    setDraftDur(stop.duration || '0h00m')
    setDraftDesc(stop.description || '')
    setEditBasic(false); setEditDesc(false)
    const stopExps = (sync.expenses || []).filter(e => e.stopId === stop.id)
    setDraftExp(stopExps.map(e => ({ ...e, _currency: 'JPY' })))
  }, [stop?.id, sync.expenses])

  const updateStop = useCallback((patch) => {
    if (!sync.tripData) return
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
      id: `exp_new_${Date.now()}`, name:'', amount:0, _currency:'JPY',
      paidBy: members[0], splitWith:[...members],
      stopId: stop.id, date: new Date().toISOString().slice(0,10),
      category:'其他', note:'', isNew:true,
    }])
  }

  const updateRow = (idx, patch) => setDraftExp(prev => prev.map((e,i) => i===idx ? {...e,...patch} : e))
  const removeRow = (idx) => setDraftExp(prev => prev.filter((_,i) => i!==idx))

  const saveExpenses = async () => {
    setExpSaving(true)
    for (const e of (sync.expenses||[]).filter(e => e.stopId === stop.id)) {
      await sync.deleteExpense(e.id)
    }
    for (const d of draftExp) {
      if (!d.name.trim() || !Number(d.amount)) continue
      const amtJPY = d._currency==='JPY' ? Number(d.amount) : twdToJpy(Number(d.amount))
      const { isNew, _currency, ...rest } = d
      await sync.addExpense({
        ...rest,
        id: d.isNew ? `exp_${Date.now()}_${Math.random().toString(36).slice(2,7)}` : d.id,
        amount: amtJPY,
      })
    }
    setExpSaving(false)
  }

  // window.open inside geolocation callback is blocked by browsers (not a direct user gesture).
  // Let Google Maps itself ask for current location — simpler and works everywhere.
  const openGeo = () => {
    const dest = encodeURIComponent(stop.address || stop.name)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=transit`, '_blank')
  }

  if (!stop) return null

  const isFlight = stop.type === 'flight'

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="92vh">
      <div style={{ padding:'0 20px 52px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
          <div style={{ flex:1, paddingRight:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <StopTypeBadge type={stop.type}/>
              <span style={{ fontSize:10, fontWeight:700, color:'var(--rose)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                {TYPE_LABEL[stop.type] || '其他'}
              </span>
            </div>
            <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:24, fontWeight:700, color:'var(--ink)', lineHeight:1.15 }}>
              {stop.name}
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', border:'1.5px solid rgba(212,132,154,0.3)', background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
            <Icon name="x" size={14} color="var(--ink-soft)"/>
          </button>
        </div>

        <div style={divider}/>

        {isFlight && (
          <>
            <section style={{ marginBottom:16 }}>
              <div style={secHeader}>
                <Icon name="plane" size={14} color="var(--rose)"/>
                <span>航班資訊</span>
              </div>
              <div style={{ marginTop:10, padding:'12px 14px', background:'var(--rose-pale)', borderRadius:10, border:'1px solid rgba(212,132,154,0.2)' }}>
                {[
                  { label:'班機號碼', value: stop.flightNo || '—' },
                  { label:'出發機場', value: stop.fromAirport || stop.name },
                  { label:'抵達機場', value: stop.toAirport || '—' },
                  { label:'起飛時間', value: stop.time },
                  { label:'預計飛行', value: stop.duration ? fmtDur(stop.duration) : '—' },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0', borderBottom:'1px solid rgba(212,132,154,0.08)' }}>
                    <span style={{ fontSize:12, color:'var(--ink-soft)' }}>{row.label}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--ink)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {stop.note && <div style={{ fontSize:12, color:'var(--ink-mid)', marginTop:8, lineHeight:1.6 }}>{stop.note}</div>}
            </section>
            <div style={divider}/>
          </>
        )}

        {/* Basic Info */}
        <section style={{ marginBottom:16 }}>
          <div style={secHeader}>
            <Icon name="clock" size={14} color="var(--rose)"/>
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
                <Icon name="clock" size={13} color="var(--ink-soft)"/>
                <span style={{ fontFamily:'Cormorant Garant,serif', fontSize:15, fontWeight:700, color:'var(--ink)' }}>{stop.time}</span>
              </div>
              {stop.duration && stop.duration !== '0h00m' && (
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <Icon name="timer" size={13} color="var(--ink-soft)"/>
                  <span style={{ fontSize:13, color:'var(--ink-mid)' }}>預計 {fmtDur(stop.duration)}</span>
                </div>
              )}
            </div>
          )}
        </section>

        <div style={divider}/>

        {/* Description */}
        <section style={{ marginBottom:16 }}>
          <div style={secHeader}>
            <Icon name="info" size={14} color="var(--rose)"/>
            <span>介紹 / 備註</span>
            <button onClick={() => setEditDesc(v => !v)} style={editBtn}>
              <Icon name="pencil" size={13} color="var(--ink-soft)"/>
            </button>
          </div>
          {editDesc ? (
            <div style={{ marginTop:10 }}>
              <textarea className="input-field" rows={5} value={draftDesc} onChange={e=>setDraftDesc(e.target.value)} placeholder="加入景點介紹或備註…"/>
              <div style={{ display:'flex', gap:8, marginTop:8 }}>
                <button className="btn-primary" style={{ flex:1 }} onClick={saveDesc}>儲存</button>
                <button className="btn-secondary" style={{ flex:1 }} onClick={()=>setEditDesc(false)}>取消</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize:13, lineHeight:1.7, marginTop:10, color: stop.description ? 'var(--ink)' : 'var(--ink-faint)', fontStyle: stop.description ? 'normal' : 'italic' }}>
              {stop.description || '點右側筆圖示加入介紹或備註'}
            </div>
          )}
        </section>

        <div style={divider}/>

        {/* Expenses */}
        <section style={{ marginBottom:16 }}>
          <div style={secHeader}>
            <Icon name="receipt" size={14} color="var(--rose)"/>
            <span>支出細項</span>
            <button onClick={addExpRow} style={{ ...editBtn, marginLeft:'auto' }}>
              <Icon name="plus" size={16} color="var(--rose)"/>
            </button>
          </div>

          {draftExp.length === 0 && (
            <div style={{ fontSize:12, color:'var(--ink-faint)', marginTop:8, fontStyle:'italic' }}>尚無消費記錄，點 ＋ 新增</div>
          )}

          {draftExp.map((exp, idx) => (
            <div key={exp.id} style={{ background:'var(--bg)', borderRadius:10, padding:'12px', marginTop:10, border:'1px solid rgba(212,132,154,0.15)' }}>
              <input className="input-field" placeholder="費用名稱" value={exp.name} style={{ marginBottom:8 }} onChange={e => updateRow(idx, { name: e.target.value })}/>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <select value={exp._currency||'JPY'} onChange={e=>updateRow(idx,{_currency:e.target.value})} style={{ padding:'8px 10px', borderRadius:8, fontSize:13, border:'1.5px solid rgba(212,132,154,0.3)', background:'white', color:'var(--ink)', cursor:'pointer', minWidth:72 }}>
                  <option value="JPY">JPY</option>
                  <option value="TWD">TWD</option>
                </select>
                <input className="input-field" type="number" inputMode="decimal" placeholder="0" style={{ flex:1 }} value={exp.amount||''} onChange={e=>updateRow(idx,{amount:e.target.value})}/>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                {members.map(m => (
                  <button key={m} onClick={()=>updateRow(idx,{paidBy:m})} style={{ padding:'3px 8px', borderRadius:12, fontSize:11, fontWeight:600, cursor:'pointer', border:'none', transition:'all 0.15s', background: exp.paidBy===m ? 'var(--ink)' : 'rgba(212,132,154,0.12)', color: exp.paidBy===m ? 'white' : 'var(--ink-soft)' }}>
                    {m}
                  </button>
                ))}
                {Number(exp.amount) > 0 && (
                  <span style={{ fontSize:11, color:'var(--ink-soft)', marginLeft:4 }}>
                    ≈ NT$ {(exp._currency==='TWD' ? Number(exp.amount) : jpyToTwd(Number(exp.amount))).toLocaleString()}
                  </span>
                )}
                <button onClick={()=>removeRow(idx)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'rgba(212,132,154,0.6)', padding:'2px' }}>
                  <Icon name="trash" size={14}/>
                </button>
              </div>
            </div>
          ))}

          {draftExp.length > 0 && (
            <button onClick={saveExpenses} disabled={expSaving} style={{ width:'100%', marginTop:12, padding:'12px', background:'linear-gradient(135deg,var(--rose-vivid),var(--rose-dark))', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, opacity: expSaving ? 0.7 : 1 }}>
              <Icon name="save" size={15} color="white"/>
              {expSaving ? '儲存中…' : '儲存支出變更'}
            </button>
          )}
        </section>

        <div style={divider}/>

        {/* Map buttons */}
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={openGeo} style={mapBtn('#7AA8B8')}>
            <Icon name="navigation" size={14} color="white"/>
            從現在位置導航
          </button>
          <button onClick={() => {
            const allStops = sync.tripData?.days.flatMap(d => d.stops) || []
            const idx = allStops.findIndex(s => s.id === stop.id)
            const prev = idx > 0 ? allStops[idx-1] : null
            const dest = encodeURIComponent(stop.address || stop.name)
            const origin = prev ? encodeURIComponent(prev.address || prev.name) : ''
            window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`, '_blank')
          }} style={mapBtn('var(--rose)')}>
            <Icon name="train" size={14} color="white"/>
            此站路線
          </button>
        </div>
      </div>
    </BottomSheet>
  )
}

// ── Style constants ───────────────────────────────────────────
const divider   = { height:1, background:'rgba(212,132,154,0.1)', marginBottom:16 }
const secHeader = { display:'flex', alignItems:'center', gap:7, fontSize:12, fontWeight:700, color:'var(--ink-mid)', letterSpacing:'0.04em', textTransform:'uppercase' }
const editBtn   = { marginLeft:'auto', background:'none', border:'none', cursor:'pointer', padding:'2px 4px', borderRadius:6, display:'flex', alignItems:'center' }
const lbl       = { display:'block', fontSize:11, fontWeight:600, color:'var(--ink-soft)', marginBottom:5 }
const mapBtn    = (bg) => ({ flex:1, padding:'11px 6px', background:bg, color:'white', border:'none', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, boxShadow:`0 3px 10px ${bg}44` })

// ── Main ──────────────────────────────────────────────────────
export default function ItineraryTab({ selectedDay, setSelectedDay }) {
  const sync = useSync()
  const [selectedStop,  setSelectedStop]  = useState(null)
  const [editMode,      setEditMode]      = useState(false)
  const [showAddModal,  setShowAddModal]  = useState(false)

  const tripData = sync.tripData
  const expenses = sync.expenses || []
  const dates    = useMemo(() => (tripData?.days || []).map(d => d.date), [tripData])
  const { weather, isTypical } = useWeather(dates)

  const currentDay = tripData?.days.find(d => d.day === selectedDay)
  const segments   = useMemo(() => buildSegments(currentDay?.stops || []), [currentDay])

  // Exit edit mode on day change
  useEffect(() => { setEditMode(false) }, [selectedDay])

  // Re-sync selectedStop when tripData changes
  useEffect(() => {
    if (selectedStop && tripData) {
      const updated = tripData.days.flatMap(d => d.stops).find(s => s.id === selectedStop.id)
      if (updated) setSelectedStop(updated)
    }
  }, [tripData])

  // ── dnd sensors ──
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 6 } })
  )

  // ── Data mutation helpers ──
  const patchDay = useCallback((newStops) => {
    if (!tripData) return
    sync.updateTripData({
      ...tripData,
      days: tripData.days.map(d => d.day === selectedDay ? { ...d, stops: newStops } : d),
    })
  }, [tripData, selectedDay, sync])

  const addStop = useCallback((stopData) => {
    if (!currentDay) return
    patchDay([...currentDay.stops, stopData])
  }, [currentDay, patchDay])

  const deleteStop = useCallback((id) => {
    if (!currentDay) return
    patchDay(currentDay.stops.filter(s => s.id !== id))
  }, [currentDay, patchDay])

  const changeTransitType = useCallback((id, newType) => {
    if (!currentDay) return
    patchDay(currentDay.stops.map(s => s.id === id ? { ...s, type: newType } : s))
  }, [currentDay, patchDay])

  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id || !currentDay) return
    const stops  = currentDay.stops
    const oldIdx = stops.findIndex(s => s.id === active.id)
    const newIdx = stops.findIndex(s => s.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    patchDay(arrayMove(stops, oldIdx, newIdx))
  }, [currentDay, patchDay])

  if (!tripData) return <div style={{ padding:32, textAlign:'center', color:'var(--ink-soft)' }}>載入中…</div>

  const dayWeather    = weather?.find(w => w.date === currentDay?.date)
  const weatherIconName = dayWeather ? (WEATHER_ICON[dayWeather.icon] || 'cloud') : null
  const activityCount = (currentDay?.stops || []).filter(s => !CONNECTOR_TYPES.has(s.type)).length

  return (
    <div>
      <DaySelector days={tripData.days} selectedDay={selectedDay} setSelectedDay={setSelectedDay}/>

      {/* Day header */}
      <div style={{ padding:'12px 18px 8px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:16, fontWeight:700, color:'var(--ink)' }}>
            {currentDay && new Date(currentDay.date).toLocaleDateString('zh-TW', { month:'long', day:'numeric', weekday:'long' })}
          </div>
          {dayWeather && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
              {weatherIconName && <Icon name={weatherIconName} size={14} color="var(--teal)"/>}
              <span style={{ fontSize:12, color:'var(--teal)', fontWeight:500 }}>
                {dayWeather.min}° ~ {dayWeather.max}°C · {dayWeather.label}
              </span>
              <span style={{ fontSize:10, color:'var(--ink-faint)', fontStyle:'italic' }}>參考 tenki.jp</span>
            </div>
          )}
        </div>

        {/* Right: count badge + edit toggle */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--rose)', background:'var(--rose-pale)', padding:'4px 10px', borderRadius:12 }}>
            {activityCount} 站
          </div>
          <button onClick={() => setEditMode(v => !v)} style={{
            padding:'7px 14px', borderRadius:20, border:'none', cursor:'pointer',
            fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6,
            background: editMode
              ? 'linear-gradient(135deg,var(--rose-vivid),var(--rose-dark))'
              : 'white',
            color: editMode ? 'white' : 'var(--rose)',
            boxShadow: editMode
              ? '0 3px 12px rgba(212,132,154,0.45)'
              : '0 1px 6px rgba(212,132,154,0.2)',
            border: editMode ? 'none' : '1.5px solid rgba(212,132,154,0.35)',
          }}>
            <Icon name={editMode ? 'check' : 'pencil'} size={13} color={editMode ? 'white' : 'var(--rose)'}/>
            {editMode ? '完成編輯' : '編輯行程'}
          </button>
        </div>
      </div>

      {/* ── Edit mode ── */}
      {editMode ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={(currentDay?.stops || []).map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div style={{ padding:'6px 16px 24px' }}>
              {/* Edit mode hint banner */}
              <div style={{ marginBottom:10, padding:'8px 12px', background:'rgba(212,132,154,0.08)', borderRadius:10, border:'1px solid rgba(212,132,154,0.2)', display:'flex', alignItems:'center', gap:8 }}>
                <Icon name="gripVertical" size={14} color="var(--rose)"/>
                <span style={{ fontSize:11, color:'var(--rose)', fontWeight:600 }}>長按左側 ⠿ 拖曳排序　點垃圾桶刪除（需再次確認）</span>
              </div>
              {(currentDay?.stops || []).map(stop =>
                CONNECTOR_TYPES.has(stop.type)
                  ? <SortableTransitItem key={stop.id} stop={stop} onTypeChange={changeTransitType} onDelete={deleteStop}/>
                  : <SortableActivityCard key={stop.id} stop={stop} expenses={expenses} onDelete={deleteStop}/>
              )}

              {/* Add stop button */}
              <button onClick={() => setShowAddModal(true)} style={{
                width:'100%', padding:'12px', marginTop:8,
                background:'var(--rose-pale)', border:'1.5px dashed rgba(212,132,154,0.4)',
                borderRadius:12, cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                color:'var(--rose)', fontSize:14, fontWeight:600,
              }}>
                <Icon name="plus" size={16} color="var(--rose)"/>
                新增景點 / 交通
              </button>
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        /* ── View mode ── */
        <div style={{ padding:'6px 16px 24px' }}>
          {segments.map((seg, i) => {
            if (seg.kind === 'activity')
              return <ActivityCard key={seg.stop.id} stop={seg.stop} expenses={expenses} onTap={setSelectedStop}/>
            if (seg.kind === 'transit')
              return <TransitConnector key={`t-${i}`} stops={seg.stops} onTypeChange={changeTransitType}/>
            if (seg.kind === 'walkHint')
              return <WalkHint key={`w-${i}`} mins={seg.mins}/>
            return null
          })}
        </div>
      )}

      <StopDetailSheet stop={selectedStop} isOpen={!!selectedStop} onClose={() => setSelectedStop(null)} sync={sync}/>
      <AddStopModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={addStop}/>
    </div>
  )
}

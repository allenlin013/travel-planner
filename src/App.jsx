import { useState } from 'react'
import { SyncProvider, useSync } from './context/SyncContext'
import { TRIP_DATA } from './data/tripData'
import Icon from './components/Icon'
import ItineraryTab from './tabs/ItineraryTab'
import ExpensesTab from './tabs/ExpensesTab'
import ChecklistTab from './tabs/ChecklistTab'
import DocumentsTab from './tabs/DocumentsTab'
import ShoppingTab from './tabs/ShoppingTab'
import CurrencySheet from './components/CurrencySheet'

const TABS = [
  { icon: 'calendar',     label: '行程' },
  { icon: 'wallet',       label: '記帳' },
  { icon: 'list',         label: '清單' },
  { icon: 'shoppingCart', label: '購物' },
  { icon: 'document',     label: '文件' },
]

// Sakura petal SVG
function Petal({ style, delay = 0, variant = 0 }) {
  const cls = variant === 1 ? 'petal-float2' : 'petal-float'
  const opacity = style?.opacity ?? 0.7
  return (
    <svg width="16" height="16" viewBox="0 0 20 20"
      style={{ ...style, opacity, animationDelay: `${delay}s` }}
      className={cls} aria-hidden>
      {[0,72,144,216,288].map((deg,i) => (
        <ellipse key={i} cx="10" cy="10" rx="2.8" ry="5.5"
          fill="var(--rose-vivid)" opacity="0.55"
          transform={`rotate(${deg},10,10) translate(0,-3.5)`}/>
      ))}
      <circle cx="10" cy="10" r="1.6" fill="white" opacity="0.8"/>
    </svg>
  )
}

function getTodayDay() {
  const today = new Date()
  const start = new Date(TRIP_DATA.startDate)
  const diff = Math.floor((today - start) / 86400000)
  if (diff >= 0 && diff < TRIP_DATA.days.length) return diff + 1
  return 1
}

function AppShell() {
  const sync = useSync()
  const [activeTab, setActiveTab] = useState(0)
  const [selectedDay, setSelectedDay] = useState(getTodayDay)
  const [showCurrency, setShowCurrency] = useState(false)

  const currentDate = TRIP_DATA.days.find(d => d.day === selectedDay)?.date
  const dayLabel = currentDate
    ? new Date(currentDate).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' })
    : ''

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header style={{
        background: 'linear-gradient(135deg, #FDEAF0 0%, #FFFAFE 50%, #F0EDF8 100%)',
        padding: '11px 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        borderBottom: '1px solid rgba(212,132,154,0.22)',
        boxShadow: '0 1px 20px rgba(212,132,154,0.16)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Sakura petals — more of them */}
        <Petal style={{ position:'absolute', top:3, right:90 }} delay={0}/>
        <Petal style={{ position:'absolute', top:9, right:56, opacity:0.65 }} delay={1.8} variant={1}/>
        <Petal style={{ position:'absolute', bottom:3, right:72, opacity:0.5 }} delay={0.9}/>
        <Petal style={{ position:'absolute', top:5, right:118, opacity:0.45 }} delay={2.4} variant={1}/>
        <Petal style={{ position:'absolute', bottom:5, right:42, opacity:0.55 }} delay={3.2}/>
        <Petal style={{ position:'absolute', top:2, left:140, opacity:0.3 }} delay={1.3} variant={1}/>

        <div>
          <div style={{
            fontFamily: 'Cormorant Garant, serif',
            fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--rose)', fontWeight: 500, marginBottom: 2, opacity: 0.8,
          }}>
            Travel Planner · Apr 2026
          </div>
          <div style={{
            fontFamily: 'Cormorant Garant, serif',
            fontSize: 18, color: 'var(--ink)', fontWeight: 700,
            letterSpacing: '0.03em', lineHeight: 1.1,
          }}>
            Osaka · Kyoto · Nara
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Currency converter button */}
          <button onClick={() => setShowCurrency(true)} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--rose-pale)',
            border: '1.5px solid rgba(212,132,154,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}>
            <Icon name="dollarSign" size={14} color="var(--rose)"/>
          </button>

          {/* Sync status dot */}
          <div title={sync.synced ? '已同步' : '連線中…'} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: sync.synced ? '#8FAB9A' : 'var(--rose)',
            boxShadow: sync.synced ? '0 0 5px #8FAB9A88' : '0 0 5px rgba(212,132,154,0.7)',
            transition: 'background 0.5s',
          }}/>

          {activeTab === 0 && (
            <div style={{
              background: 'white', borderRadius: 20,
              padding: '5px 12px',
              boxShadow: '0 2px 10px rgba(212,132,154,0.22)',
              border: '1px solid rgba(212,132,154,0.18)',
              fontFamily: 'Cormorant Garant, serif',
              fontSize: 13, fontWeight: 700, color: 'var(--rose)',
              letterSpacing: '0.02em', whiteSpace: 'nowrap',
            }}>
              Day {selectedDay} · {dayLabel}
            </div>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <main className="main-area">
        {activeTab === 0 && <ItineraryTab selectedDay={selectedDay} setSelectedDay={setSelectedDay}/>}
        {activeTab === 1 && <ExpensesTab/>}
        {activeTab === 2 && <ChecklistTab/>}
        {activeTab === 3 && <ShoppingTab/>}
        {activeTab === 4 && <DocumentsTab/>}
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, height:66,
        background: 'rgba(255,250,254,0.97)',
        borderTop: '1px solid rgba(212,132,154,0.2)',
        display:'flex',
        boxShadow: '0 -2px 20px rgba(212,132,154,0.14)',
        zIndex: 20,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        {TABS.map((tab, i) => {
          const active = activeTab === i
          return (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              flex:1, display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              gap:4, border:'none', background:'none', cursor:'pointer',
              padding:'8px 0', position:'relative',
              color: active ? 'var(--rose)' : 'var(--ink-soft)',
              transition:'color 0.2s',
            }}>
              <Icon name={tab.icon} size={19} color={active ? 'var(--rose)' : 'var(--ink-soft)'}
                strokeWidth={active ? 2 : 1.6}/>
              <span style={{
                fontSize:10,
                fontFamily:'Cormorant Garant, serif',
                fontWeight: active ? 700 : 400,
                letterSpacing:'0.05em',
              }}>{tab.label}</span>
              {active && (
                <div style={{
                  position:'absolute', bottom:0,
                  width:28, height:3,
                  background:'linear-gradient(to right,var(--rose-vivid),var(--rose-dark))',
                  borderRadius:'3px 3px 0 0',
                }}/>
              )}
            </button>
          )
        })}
      </nav>

      {/* ── Currency Converter Sheet ── */}
      <CurrencySheet isOpen={showCurrency} onClose={() => setShowCurrency(false)}/>
    </div>
  )
}

export default function App() {
  return (
    <SyncProvider>
      <AppShell/>
    </SyncProvider>
  )
}

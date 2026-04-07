import { useState } from 'react'
import { SyncProvider, useSync } from './context/SyncContext'
import { TRIP_DATA } from './data/tripData'
import Icon from './components/Icon'
import ItineraryTab from './tabs/ItineraryTab'
import ExpensesTab from './tabs/ExpensesTab'
import ChecklistTab from './tabs/ChecklistTab'
import DocumentsTab from './tabs/DocumentsTab'

const TABS = [
  { icon: 'calendar',  label: '行程' },
  { icon: 'wallet',    label: '記帳' },
  { icon: 'list',      label: '清單' },
  { icon: 'document',  label: '文件' },
]

// Minimal sakura SVG petal
function Petal({ style, delay = 0 }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20"
      style={{ ...style, animationDelay: `${delay}s` }}
      className="petal-float" aria-hidden>
      {[0,72,144,216,288].map((deg,i) => (
        <ellipse key={i} cx="10" cy="10" rx="2.8" ry="5.5"
          fill="#D4909A" opacity="0.5"
          transform={`rotate(${deg},10,10) translate(0,-3.5)`}/>
      ))}
      <circle cx="10" cy="10" r="1.6" fill="white" opacity="0.7"/>
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

  const currentDate = TRIP_DATA.days.find(d => d.day === selectedDay)?.date
  const dayLabel = currentDate
    ? new Date(currentDate).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' })
    : ''

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header style={{
        background: 'linear-gradient(135deg, #F5E8EC 0%, #FDFAFA 60%, #EDF0F5 100%)',
        padding: '11px 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        borderBottom: '1px solid rgba(212,144,154,0.18)',
        boxShadow: '0 1px 16px rgba(212,144,154,0.12)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative petals */}
        <Petal style={{ position:'absolute', top:4, right:70 }} delay={0}/>
        <Petal style={{ position:'absolute', top:10, right:36, opacity:0.6 }} delay={1.8}/>
        <Petal style={{ position:'absolute', bottom:4, right:52, opacity:0.5 }} delay={0.9}/>

        <div>
          <div style={{
            fontFamily: 'Cormorant Garant, serif',
            fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--ink-soft)', fontWeight: 400, marginBottom: 2,
          }}>
            Travel Planner · Apr 2026
          </div>
          <div style={{
            fontFamily: 'Cormorant Garant, serif',
            fontSize: 18, color: 'var(--ink)', fontWeight: 600,
            letterSpacing: '0.03em', lineHeight: 1.1,
          }}>
            Osaka · Kyoto · Nara
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {/* Sync status dot */}
          <div title={sync.synced ? '已同步' : '連線中…'} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: sync.synced ? '#8FAB9A' : '#D4909A',
            boxShadow: sync.synced ? '0 0 5px #8FAB9A88' : '0 0 5px #D4909A88',
            transition: 'background 0.5s',
          }}/>

          {activeTab === 0 && (
            <div style={{
              background: 'white', borderRadius: 20,
              padding: '5px 13px',
              boxShadow: '0 2px 8px rgba(212,144,154,0.2)',
              fontFamily: 'Cormorant Garant, serif',
              fontSize: 13, fontWeight: 600, color: 'var(--rose)',
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
        {activeTab === 3 && <DocumentsTab/>}
      </main>

      {/* ── Bottom Tab Bar ── */}
      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, height:66,
        background: 'rgba(253,250,250,0.96)',
        borderTop: '1px solid rgba(212,144,154,0.18)',
        display:'flex',
        boxShadow: '0 -2px 16px rgba(212,144,154,0.12)',
        zIndex: 20,
        backdropFilter: 'blur(12px)',
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
              <Icon name={tab.icon} size={19} color={active ? 'var(--rose)' : 'var(--ink-soft)'}/>
              <span style={{
                fontSize:10,
                fontFamily:'Cormorant Garant, serif',
                fontWeight: active ? 600 : 400,
                letterSpacing:'0.05em',
              }}>{tab.label}</span>
              {active && (
                <div style={{
                  position:'absolute', bottom:0,
                  width:24, height:2.5,
                  background:'linear-gradient(to right,var(--rose),#B07878)',
                  borderRadius:'3px 3px 0 0',
                }}/>
              )}
            </button>
          )
        })}
      </nav>
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

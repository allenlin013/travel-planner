import { useState, useEffect } from 'react'
import { initStorage } from './utils/storage'
import { TRIP_DATA } from './data/tripData'
import ItineraryTab from './tabs/ItineraryTab'
import ExpensesTab from './tabs/ExpensesTab'
import ChecklistTab from './tabs/ChecklistTab'
import DocumentsTab from './tabs/DocumentsTab'

const TABS = [
  { icon: '🗓', label: '行程' },
  { icon: '💴', label: '記帳' },
  { icon: '📋', label: '清單' },
  { icon: '📁', label: '文件' },
]

// Simple Shiba Inu SVG face
function ShibaIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      {/* Ears */}
      <polygon points="9,30 20,5 29,28" fill="#C87941"/>
      <polygon points="31,28 40,5 51,30" fill="#C87941"/>
      <polygon points="12,29 20,12 27,28" fill="#E8C4A0" opacity="0.6"/>
      <polygon points="33,28 40,12 48,29" fill="#E8C4A0" opacity="0.6"/>
      {/* Face */}
      <circle cx="30" cy="35" r="23" fill="#C87941"/>
      {/* White muzzle */}
      <ellipse cx="30" cy="45" rx="13" ry="9" fill="#F5EDE0"/>
      {/* Eyes */}
      <ellipse cx="22" cy="33" rx="4" ry="4.5" fill="#3D3028"/>
      <ellipse cx="38" cy="33" rx="4" ry="4.5" fill="#3D3028"/>
      <circle cx="23.5" cy="31.5" r="1.5" fill="white"/>
      <circle cx="39.5" cy="31.5" r="1.5" fill="white"/>
      {/* Nose */}
      <ellipse cx="30" cy="42" rx="3.5" ry="2.5" fill="#3D3028"/>
      {/* Mouth */}
      <path d="M27 45 Q30 47.5 33 45" stroke="#3D3028" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// Floating cherry blossom petal SVG
function Petal({ style, delay = 0 }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20"
      style={{ ...style, animationDelay: `${delay}s` }}
      className="petal-float" aria-hidden>
      {[0,72,144,216,288].map((deg,i) => (
        <ellipse key={i} cx="10" cy="10" rx="3" ry="5.5"
          fill="#C4968C" opacity="0.65"
          transform={`rotate(${deg},10,10) translate(0,-3.5)`}/>
      ))}
      <circle cx="10" cy="10" r="1.8" fill="#F7F0E8"/>
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

export default function App() {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedDay, setSelectedDay] = useState(getTodayDay)

  useEffect(() => { initStorage() }, [])

  const currentDate = TRIP_DATA.days.find(d => d.day === selectedDay)?.date
  const dayLabel = currentDate
    ? new Date(currentDate).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' })
    : ''

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header style={{
        background: 'linear-gradient(135deg, #E8D5CC 0%, #F7F0E8 55%, #D4E3DC 100%)',
        padding: '10px 16px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 1px 12px rgba(186,148,130,0.18)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative petals */}
        <Petal style={{ position:'absolute', top:4, right:68, opacity:0.5 }} delay={0}/>
        <Petal style={{ position:'absolute', top:10, right:30, opacity:0.4 }} delay={1.8}/>
        <Petal style={{ position:'absolute', bottom:4, right:50, opacity:0.35 }} delay={0.9}/>

        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <ShibaIcon size={38}/>
          <div>
            <div style={{
              fontFamily: 'Cormorant Garant, serif',
              fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--ink-soft)', fontWeight: 400,
            }}>
              Travel Planner · 2026
            </div>
            <div style={{
              fontFamily: 'Cormorant Garant, serif',
              fontSize: 17, color: 'var(--ink)', fontWeight: 600, lineHeight: 1.15,
              letterSpacing: '0.02em',
            }}>
              Osaka · Kyoto · Nara
            </div>
          </div>
        </div>

        {activeTab === 0 && (
          <div style={{
            background: 'white', borderRadius: 20,
            padding: '5px 13px',
            boxShadow: '0 2px 8px rgba(186,148,130,0.22)',
            fontFamily: 'Cormorant Garant, serif',
            fontSize: 13, fontWeight: 600, color: 'var(--rose)',
            letterSpacing: '0.02em',
          }}>
            Day {selectedDay} · {dayLabel}
          </div>
        )}
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
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 68,
        background: 'rgba(253,250,246,0.96)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        boxShadow: '0 -2px 16px rgba(186,148,130,0.14)',
        zIndex: 20,
        backdropFilter: 'blur(10px)',
      }}>
        {TABS.map((tab, i) => {
          const active = activeTab === i
          return (
            <button key={i} onClick={() => setActiveTab(i)} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 3, border: 'none', background: 'none', cursor: 'pointer',
              padding: '8px 0', position: 'relative',
              color: active ? 'var(--rose)' : 'var(--ink-soft)',
              transition: 'color 0.2s',
            }}>
              <span style={{ fontSize: 21 }}>{tab.icon}</span>
              <span style={{
                fontSize: 10,
                fontFamily: 'Cormorant Garant, serif',
                fontWeight: active ? 600 : 400,
                letterSpacing: '0.04em',
              }}>{tab.label}</span>
              {active && (
                <div style={{
                  position: 'absolute', bottom: 0,
                  width: 28, height: 2.5,
                  background: 'linear-gradient(to right, var(--rose), var(--amber))',
                  borderRadius: '3px 3px 0 0',
                }}/>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

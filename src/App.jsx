import { useState, useEffect } from 'react'
import { initStorage } from './utils/storage'
import { TRIP_DATA } from './data/tripData'
import ItineraryTab from './tabs/ItineraryTab'
import ExpensesTab from './tabs/ExpensesTab'
import ChecklistTab from './tabs/ChecklistTab'
import DocumentsTab from './tabs/DocumentsTab'

const TABS = [
  { icon: '🗓', label: '行程' },
  { icon: '💰', label: '記帳' },
  { icon: '📋', label: '清單' },
  { icon: '📄', label: '文件' },
]

function CherryBlossom({ style, delay = 0 }) {
  return (
    <svg
      width="20" height="20" viewBox="0 0 20 20"
      style={{ ...style, animationDelay: `${delay}s` }}
      className="petal-float"
    >
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <ellipse
          key={i}
          cx="10" cy="10" rx="3.5" ry="6"
          fill="#F2A7C3"
          opacity="0.8"
          transform={`rotate(${deg}, 10, 10) translate(0, -4)`}
        />
      ))}
      <circle cx="10" cy="10" r="2" fill="#FAF3E0" />
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
    ? new Date(currentDate).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
    : ''

  return (
    <div className="app-shell">
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #F2A7C3 0%, #FCE4EE 60%, #A8D8EA 100%)',
        padding: '12px 16px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(242,167,195,0.3)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative petals */}
        <CherryBlossom style={{ position: 'absolute', top: 4, right: 60, opacity: 0.5 }} delay={0} />
        <CherryBlossom style={{ position: 'absolute', top: 8, right: 24, opacity: 0.4 }} delay={1.5} />
        <CherryBlossom style={{ position: 'absolute', bottom: 4, right: 40, opacity: 0.35 }} delay={0.8} />

        <div>
          <div style={{ fontFamily: 'Noto Serif JP', fontSize: 13, color: '#8B5E72', fontWeight: 400 }}>
            🌸 旅遊計畫
          </div>
          <div style={{ fontFamily: 'Noto Serif JP', fontSize: 16, color: '#2C2C2C', fontWeight: 600, lineHeight: 1.2 }}>
            Osaka · Kyoto · Nara
          </div>
        </div>

        {activeTab === 0 && (
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: '4px 12px',
            boxShadow: '0 2px 8px rgba(242,167,195,0.3)',
            fontSize: 13,
            fontWeight: 600,
            color: '#C0392B',
          }}>
            Day {selectedDay} · {dayLabel}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="main-area">
        {activeTab === 0 && <ItineraryTab selectedDay={selectedDay} setSelectedDay={setSelectedDay} />}
        {activeTab === 1 && <ExpensesTab />}
        {activeTab === 2 && <ChecklistTab />}
        {activeTab === 3 && <DocumentsTab />}
      </main>

      {/* Bottom Tab Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 68,
        background: 'white',
        borderTop: '1px solid rgba(242,167,195,0.3)',
        display: 'flex',
        boxShadow: '0 -2px 12px rgba(242,167,195,0.2)',
        zIndex: 20,
      }}>
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '8px 0',
              color: activeTab === i ? '#C0392B' : '#95A5A6',
              transition: 'color 0.2s',
            }}
          >
            <span style={{ fontSize: 22 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: activeTab === i ? 600 : 400 }}>{tab.label}</span>
            {activeTab === i && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                width: 32,
                height: 3,
                background: 'linear-gradient(to right, #F2A7C3, #C0392B)',
                borderRadius: '3px 3px 0 0',
              }} />
            )}
          </button>
        ))}
      </nav>
    </div>
  )
}

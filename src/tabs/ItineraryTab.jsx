import { useState, useCallback } from 'react'
import { getTripData, getStopNote, setStopNote } from '../utils/storage'
import { TYPE_CONFIG, TRANSIT_TYPES } from '../data/tripData'
import TypeBadge from '../components/TypeBadge'
import BottomSheet from '../components/BottomSheet'

function DaySelector({ days, selectedDay, setSelectedDay }) {
  return (
    <div className="day-selector-scroll" style={{ background: 'white', borderBottom: '1px solid rgba(242,167,195,0.2)' }}>
      {days.map(d => {
        const date = new Date(d.date)
        const mmdd = `${date.getMonth() + 1}/${date.getDate()}`
        const active = d.day === selectedDay
        return (
          <button
            key={d.day}
            onClick={() => setSelectedDay(d.day)}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '6px 14px',
              borderRadius: 20,
              border: active ? 'none' : '1px solid rgba(242,167,195,0.4)',
              background: active ? '#F2A7C3' : 'white',
              color: active ? 'white' : '#2C2C2C',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Day {d.day}</span>
            <span style={{ fontSize: 10, opacity: 0.85 }}>{mmdd}</span>
          </button>
        )
      })}
    </div>
  )
}

function StopCard({ stop, isLast, onTap, allStops, index }) {
  const cfg = TYPE_CONFIG[stop.type] || TYPE_CONFIG.other
  const isTransit = TRANSIT_TYPES.has(stop.type)

  return (
    <div style={{ position: 'relative', paddingLeft: 52, paddingRight: 16, paddingBottom: isLast ? 8 : 0 }}>
      {/* Timeline line */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          left: 18,
          top: 44,
          bottom: 0,
          width: 2,
          background: isTransit
            ? 'repeating-linear-gradient(to bottom, #A8D8EA 0, #A8D8EA 5px, transparent 5px, transparent 10px)'
            : 'linear-gradient(to bottom, rgba(242,167,195,0.5), rgba(168,216,234,0.3))',
        }} />
      )}

      {/* Icon */}
      <div style={{ position: 'absolute', left: 0, top: 10 }}>
        <TypeBadge type={stop.type} size="md" />
      </div>

      {/* Card */}
      <button
        onClick={() => onTap(stop)}
        style={{
          width: '100%',
          textAlign: 'left',
          background: isTransit ? 'rgba(168,216,234,0.08)' : 'white',
          border: isTransit
            ? '1px dashed rgba(168,216,234,0.5)'
            : '1px solid rgba(242,167,195,0.2)',
          borderRadius: 12,
          padding: '10px 12px',
          marginBottom: 8,
          cursor: 'pointer',
          boxShadow: isTransit ? 'none' : '2px 4px 12px rgba(242,167,195,0.15)',
          transition: 'transform 0.15s, box-shadow 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#8B5E72', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {stop.time}
            </span>
            <span style={{
              fontSize: isTransit ? 13 : 14,
              fontWeight: isTransit ? 400 : 600,
              color: isTransit ? '#5D7A8C' : '#2C2C2C',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {stop.name}
            </span>
          </div>
          {stop.duration && stop.duration !== '0h00m' && (
            <div style={{ fontSize: 11, color: '#95A5A6', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                background: cfg.bg,
                color: cfg.color,
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: 10,
                fontWeight: 500,
              }}>
                {cfg.label}
              </span>
              <span>⏱ {stop.duration.replace('h', 'hr ').replace('m', 'min')}</span>
            </div>
          )}
        </div>
        <span style={{ fontSize: 14, color: '#D0A0B0', flexShrink: 0 }}>›</span>
      </button>
    </div>
  )
}

function StopDetailSheet({ stop, stops, isOpen, onClose }) {
  const [note, setNote] = useState(() => stop ? getStopNote(stop.id) : '')
  const [savedNote, setSavedNote] = useState(false)
  const cfg = stop ? (TYPE_CONFIG[stop.type] || TYPE_CONFIG.other) : null

  const handleNoteChange = (e) => {
    setNote(e.target.value)
    setSavedNote(false)
  }

  const handleNoteBlur = () => {
    if (stop) {
      setStopNote(stop.id, note)
      setSavedNote(true)
    }
  }

  const openCurrentLocation = () => {
    if (!stop) return
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const origin = `${pos.coords.latitude},${pos.coords.longitude}`
        const dest = encodeURIComponent(stop.name + ' Japan')
        window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`, '_blank')
      }, () => {
        const dest = encodeURIComponent(stop.name + ' Japan')
        window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`, '_blank')
      })
    } else {
      const dest = encodeURIComponent(stop.name + ' Japan')
      window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`, '_blank')
    }
  }

  const openRouteFromPrev = () => {
    if (!stop || !stops) return
    const idx = stops.findIndex(s => s.id === stop.id)
    const prevStop = idx > 0 ? stops[idx - 1] : null
    const dest = encodeURIComponent(stop.name + ' Japan')
    if (prevStop) {
      const origin = encodeURIComponent(prevStop.name + ' Japan')
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`, '_blank')
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${dest}`, '_blank')
    }
  }

  if (!stop) return null

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="75vh">
      <div style={{ padding: '0 16px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: cfg.bg,
            border: `2px solid ${cfg.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {cfg.icon}
          </div>
          <div>
            <div style={{
              background: cfg.bg,
              color: cfg.color,
              borderRadius: 6,
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 600,
              display: 'inline-block',
              marginBottom: 4,
            }}>
              {cfg.label}
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#2C2C2C', lineHeight: 1.2 }}>
              {stop.name}
            </div>
          </div>
        </div>

        {/* Time & Duration */}
        <div style={{
          display: 'flex', gap: 16, marginBottom: 16,
          padding: '10px 14px',
          background: '#FDF0F5',
          borderRadius: 10,
          border: '1px dashed rgba(242,167,195,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🕐</span>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#8B5E72' }}>{stop.time}</span>
          </div>
          {stop.duration && stop.duration !== '0h00m' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⏳</span>
              <span style={{ fontSize: 14, color: '#666' }}>
                {stop.duration.replace('h', 'hr ').replace('m', 'min')}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8B5E72', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            📝 備註
            {savedNote && <span style={{ fontSize: 11, color: '#27AE60' }}>✓ 已儲存</span>}
          </div>
          <textarea
            className="input-field"
            placeholder="輸入備註…"
            value={note}
            onChange={handleNoteChange}
            onBlur={handleNoteBlur}
            rows={3}
          />
        </div>

        {/* Map buttons */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8B5E72', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            🗺 地圖
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={openCurrentLocation}
              style={{
                flex: 1, padding: '10px 8px',
                background: 'linear-gradient(135deg, #A8D8EA, #7ABFD4)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              📍 從現在位置導航
            </button>
            <button
              onClick={openRouteFromPrev}
              style={{
                flex: 1, padding: '10px 8px',
                background: 'linear-gradient(135deg, #F2A7C3, #ED89AB)',
                color: 'white', border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              🚃 此站路線
            </button>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px',
            background: 'white',
            border: '1px solid rgba(242,167,195,0.4)',
            borderRadius: 10,
            fontSize: 14, color: '#8B5E72', cursor: 'pointer', fontWeight: 500,
          }}
        >
          關閉
        </button>
      </div>
    </BottomSheet>
  )
}

export default function ItineraryTab({ selectedDay, setSelectedDay }) {
  const [selectedStop, setSelectedStop] = useState(null)
  const tripData = getTripData()
  const currentDayData = tripData.days.find(d => d.day === selectedDay)

  const handleStopTap = useCallback((stop) => {
    setSelectedStop(stop)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedStop(null)
  }, [])

  return (
    <div>
      <DaySelector
        days={tripData.days}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
      />

      <div style={{ padding: '16px 16px 0' }}>
        {currentDayData && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px dashed rgba(242,167,195,0.3)',
            }}>
              <span style={{ fontFamily: 'Noto Serif JP', fontSize: 14, fontWeight: 600, color: '#8B5E72' }}>
                Day {currentDayData.day}
              </span>
              <span style={{ fontSize: 13, color: '#95A5A6' }}>
                {new Date(currentDayData.date).toLocaleDateString('zh-TW', {
                  month: 'long', day: 'numeric', weekday: 'short'
                })}
              </span>
              <span style={{ fontSize: 12, marginLeft: 'auto', color: '#BDC3C7' }}>
                共 {currentDayData.stops.length} 個景點
              </span>
            </div>

            {currentDayData.stops.map((stop, i) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={i}
                allStops={currentDayData.stops}
                isLast={i === currentDayData.stops.length - 1}
                onTap={handleStopTap}
              />
            ))}
          </>
        )}
      </div>

      <StopDetailSheet
        stop={selectedStop}
        stops={currentDayData?.stops}
        isOpen={!!selectedStop}
        onClose={handleClose}
      />
    </div>
  )
}

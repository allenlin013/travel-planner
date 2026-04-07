import { useEffect } from 'react'

export default function BottomSheet({ isOpen, onClose, children, height = '75vh' }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(61,48,40,0.45)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 40,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.28s ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 50,
          background: 'var(--bg-card)',
          borderRadius: '22px 22px 0 0',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32,0.72,0,1)',
          height,
          maxHeight: '92dvh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 -4px 40px rgba(61,48,40,0.14)',
          willChange: 'transform',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--rose-light)' }}/>
        </div>
        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </>
  )
}

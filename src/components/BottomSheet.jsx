import { useEffect } from 'react'

export default function BottomSheet({ isOpen, onClose, children, height = '75vh', maxHeight = '92dvh' }) {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      <div className={`sheet-backdrop ${isOpen ? '' : 'sheet-backdrop-hidden'}`} onClick={onClose}/>
      <div
        className={`sheet-panel ${isOpen ? 'sheet-panel-visible' : 'sheet-panel-hidden'}`}
        style={{ height, maxHeight }}
      >
        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 8px', flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'var(--rose-light)' }}/>
        </div>
        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden' }}>
          {children}
        </div>
      </div>
    </>
  )
}

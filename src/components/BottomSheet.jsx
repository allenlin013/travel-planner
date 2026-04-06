import { useEffect, useRef } from 'react'

export default function BottomSheet({ isOpen, onClose, children, height = '75vh', maxHeight = '90dvh' }) {
  const sheetRef = useRef(null)

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sheet-backdrop ${isOpen ? '' : 'sheet-backdrop-hidden'}`}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`sheet-panel ${isOpen ? 'sheet-panel-visible' : 'sheet-panel-hidden'}`}
        style={{ height, maxHeight }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#E0D0D8' }} />
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </>
  )
}

import { TYPE_CONFIG } from '../data/tripData'

export default function TypeBadge({ type, size = 'md' }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other
  const sizes = {
    sm: { outer: '28px', fontSize: '13px' },
    md: { outer: '36px', fontSize: '17px' },
    lg: { outer: '44px', fontSize: '22px' },
  }
  const { outer, fontSize } = sizes[size] || sizes.md

  return (
    <div
      style={{
        width: outer,
        height: outer,
        borderRadius: '50%',
        background: cfg.bg,
        border: `1.5px solid ${cfg.color}22`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        flexShrink: 0,
      }}
    >
      {cfg.icon}
    </div>
  )
}

import { TYPE_CONFIG } from '../data/tripData'

export default function TypeBadge({ type, size = 'md' }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other
  const sizes = {
    sm: { outer: '26px', fontSize: '12px' },
    md: { outer: '34px', fontSize: '16px' },
    lg: { outer: '42px', fontSize: '21px' },
  }
  const { outer, fontSize } = sizes[size] || sizes.md

  return (
    <div style={{
      width: outer, height: outer, borderRadius: '50%',
      background: cfg.bg || '#F5F5F5',
      border: `1.5px solid ${cfg.color}28`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, flexShrink: 0,
    }}>
      {cfg.icon}
    </div>
  )
}

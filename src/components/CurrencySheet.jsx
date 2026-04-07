import { useState, useEffect } from 'react'
import { useExchangeRate } from '../hooks/useExchangeRate'
import BottomSheet from './BottomSheet'
import Icon from './Icon'

export default function CurrencySheet({ isOpen, onClose }) {
  const { rate, jpyToTwd, twdToJpy, lastUpdated, loading, fetchRate } = useExchangeRate()
  const [jpyInput, setJpyInput] = useState('')
  const [twdInput, setTwdInput] = useState('')
  const [lastEdited, setLastEdited] = useState('jpy')

  // Sync conversion when inputs change
  useEffect(() => {
    if (lastEdited === 'jpy') {
      const n = parseFloat(jpyInput)
      setTwdInput(isNaN(n) || jpyInput === '' ? '' : String(jpyToTwd(n)))
    }
  }, [jpyInput, rate])

  useEffect(() => {
    if (lastEdited === 'twd') {
      const n = parseFloat(twdInput)
      setJpyInput(isNaN(n) || twdInput === '' ? '' : String(twdToJpy(n)))
    }
  }, [twdInput, rate])

  // Quick presets for common amounts in JPY
  const JPY_PRESETS = [500, 1000, 2000, 5000, 10000]

  const handleJpy = (v) => { setLastEdited('jpy'); setJpyInput(v) }
  const handleTwd = (v) => { setLastEdited('twd'); setTwdInput(v) }

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} height="62vh">
      <div style={{ padding: '0 20px 32px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:22, fontWeight:700, color:'var(--ink)' }}>
              匯率換算
            </div>
            <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:2 }}>
              1 JPY ≈ NT$ {rate.toFixed(4)}
              {lastUpdated && <span style={{ marginLeft:6 }}>· {lastUpdated}</span>}
            </div>
          </div>
          <button onClick={fetchRate} disabled={loading} style={{
            display:'flex', alignItems:'center', gap:5,
            padding:'6px 12px', borderRadius:20,
            background: 'var(--rose-pale)',
            border: '1.5px solid rgba(212,132,154,0.3)',
            color:'var(--rose)', fontSize:12, fontWeight:600,
            cursor:'pointer', opacity: loading ? 0.6 : 1,
          }}>
            <Icon name="arrowRight" size={12} color="var(--rose)"/>
            {loading ? '更新中' : '更新匯率'}
          </button>
        </div>

        {/* Input row */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          {/* JPY input */}
          <div style={{ flex:1 }}>
            <label style={lbl}>日幣 ¥ JPY</label>
            <div style={{ position:'relative' }}>
              <input
                className="input-field"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={jpyInput}
                onChange={e => handleJpy(e.target.value)}
                style={{ paddingLeft: 36, fontSize: 18, fontWeight: 600, fontFamily: 'Cormorant Garant, serif' }}
              />
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'var(--ink-soft)' }}>¥</span>
            </div>
          </div>

          {/* Swap icon */}
          <div style={{ paddingTop:18 }}>
            <div style={{
              width:32, height:32, borderRadius:'50%',
              background:'var(--rose-pale)',
              border:'1.5px solid rgba(212,132,154,0.3)',
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Icon name="arrowRight" size={14} color="var(--rose)"/>
            </div>
          </div>

          {/* TWD input */}
          <div style={{ flex:1 }}>
            <label style={lbl}>台幣 NT$ TWD</label>
            <div style={{ position:'relative' }}>
              <input
                className="input-field"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={twdInput}
                onChange={e => handleTwd(e.target.value)}
                style={{ paddingLeft:42, fontSize:18, fontWeight:600, fontFamily:'Cormorant Garant,serif' }}
              />
              <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'var(--ink-soft)', fontWeight:600 }}>NT$</span>
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div style={{ marginBottom:16 }}>
          <div style={lbl}>快速換算</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {JPY_PRESETS.map(jpy => (
              <button key={jpy} onClick={() => handleJpy(String(jpy))} style={{
                padding:'6px 13px', borderRadius:20, fontSize:13, fontWeight:600,
                background: jpyInput === String(jpy) ? 'var(--rose)' : 'var(--rose-pale)',
                color: jpyInput === String(jpy) ? 'white' : 'var(--rose)',
                border: `1.5px solid ${jpyInput === String(jpy) ? 'transparent' : 'rgba(212,132,154,0.3)'}`,
                cursor:'pointer', transition:'all 0.15s',
              }}>
                ¥{jpy.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Result highlight */}
        {jpyInput && !isNaN(parseFloat(jpyInput)) && (
          <div style={{
            padding:'14px 16px',
            background:'linear-gradient(135deg,var(--rose-pale),white)',
            borderRadius:12,
            border:'1px solid rgba(212,132,154,0.2)',
            textAlign:'center',
          }}>
            <div style={{ fontSize:12, color:'var(--ink-soft)', marginBottom:4 }}>換算結果</div>
            <div style={{ fontFamily:'Cormorant Garant,serif', fontSize:26, fontWeight:700, color:'var(--rose)' }}>
              NT$ {Number(twdInput || 0).toLocaleString()}
            </div>
            <div style={{ fontSize:11, color:'var(--ink-faint)', marginTop:2 }}>
              ¥{parseFloat(jpyInput).toLocaleString()} → NT$ {Number(twdInput || 0).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  )
}

const lbl = { display:'block', fontSize:11, fontWeight:600, color:'var(--ink-mid)', marginBottom:5 }

import { useState, useEffect } from 'react'

const DEFAULT_RATE = 0.218 // JPY → TWD fallback

export function useExchangeRate() {
  const [rate, setRate] = useState(() => {
    const cached = localStorage.getItem('exchange_rate_live')
    if (cached) {
      const { value, ts } = JSON.parse(cached)
      // Cache valid 1h
      if (Date.now() - ts < 3600 * 1000) return value
    }
    return DEFAULT_RATE
  })
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchRate = () => {
    setLoading(true)
    // frankfurter.app — free, no key, CORS-friendly
    fetch('https://api.frankfurter.app/latest?from=TWD&to=JPY')
      .then(r => r.json())
      .then(json => {
        if (json.rates && json.rates.JPY) {
          // TWD → JPY, so JPY → TWD = 1 / json.rates.JPY
          const r = +(1 / json.rates.JPY).toFixed(5)
          setRate(r)
          setLastUpdated(json.date)
          localStorage.setItem('exchange_rate_live', JSON.stringify({ value: r, ts: Date.now() }))
          localStorage.setItem('exchange_rate', JSON.stringify({ JPY_TWD: r }))
        }
      })
      .catch(() => { /* keep default */ })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const cached = localStorage.getItem('exchange_rate_live')
    if (cached) {
      const { ts } = JSON.parse(cached)
      if (Date.now() - ts > 3600 * 1000) fetchRate()
    } else {
      fetchRate()
    }
  }, [])

  const jpyToTwd = (jpy) => Math.round(Number(jpy) * rate)
  const twdToJpy = (twd) => Math.round(Number(twd) / rate)

  return { rate, jpyToTwd, twdToJpy, lastUpdated, loading, fetchRate }
}

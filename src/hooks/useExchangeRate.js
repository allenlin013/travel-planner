import { useState, useEffect, useRef } from 'react'

const DEFAULT_RATE = 0.218   // JPY → TWD fallback
const CACHE_KEY    = 'er_live_v2'
const CACHE_TTL    = 60 * 60 * 1000  // 1 hour

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { value, date, ts } = JSON.parse(raw)
    if (Date.now() - ts < CACHE_TTL) return { value, date }
  } catch (_) {}
  return null
}

function setCache(value, date) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ value, date, ts: Date.now() }))
  localStorage.setItem('exchange_rate', JSON.stringify({ JPY_TWD: value }))
}

// fetch with manual timeout (broad browser compat, including old iOS)
async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchLiveRate() {
  // Primary: exchangerate-api.com v4 (free, no key)
  // Response: { "base": "JPY", "rates": { "TWD": 0.21... } }
  try {
    const r = await fetchWithTimeout('https://api.exchangerate-api.com/v4/latest/JPY')
    if (r.ok) {
      const j = await r.json()
      const rate = j.rates?.TWD
      if (rate && rate > 0) return { value: +rate.toFixed(5), date: j.date || new Date().toISOString().slice(0, 10) }
    }
  } catch (_) {}

  // Fallback: frankfurter.app
  // Response: { "base": "TWD", "rates": { "JPY": 4.5... } }  → invert
  try {
    const r = await fetchWithTimeout('https://api.frankfurter.app/latest?from=TWD&to=JPY')
    if (r.ok) {
      const j = await r.json()
      const jpyPerTwd = j.rates?.JPY
      if (jpyPerTwd && jpyPerTwd > 0) {
        return { value: +(1 / jpyPerTwd).toFixed(5), date: j.date || new Date().toISOString().slice(0, 10) }
      }
    }
  } catch (_) {}

  return null
}

export function useExchangeRate() {
  const init     = getCached()
  const [rate,        setRate]        = useState(init?.value ?? DEFAULT_RATE)
  const [lastUpdated, setLastUpdated] = useState(init?.date  ?? null)
  const [loading,     setLoading]     = useState(false)
  const isFetching = useRef(false)

  const fetchRate = async () => {
    if (isFetching.current) return
    isFetching.current = true
    setLoading(true)
    try {
      const result = await fetchLiveRate()
      if (result) {
        setRate(result.value)
        setLastUpdated(result.date)
        setCache(result.value, result.date)
      }
    } finally {
      isFetching.current = false
      setLoading(false)
    }
  }

  useEffect(() => {
    const cached = getCached()
    if (!cached) {
      fetchRate()   // no cache → fetch now
    } else {
      // Cache exists but check if stale
      try {
        const { ts } = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
        if (Date.now() - ts > CACHE_TTL) fetchRate()
      } catch (_) {
        fetchRate()
      }
    }
  }, [])

  const jpyToTwd = (jpy) => Math.round(Number(jpy) * rate)
  const twdToJpy = (twd) => Math.round(Number(twd) / rate)

  return { rate, jpyToTwd, twdToJpy, lastUpdated, loading, fetchRate }
}

import { useState, useEffect } from 'react'

// Coordinates for each day's region
const REGION_COORDS = {
  osaka:  { lat: 34.6937, lon: 135.5023 },
  kyoto:  { lat: 35.0116, lon: 135.7681 },
  nara:   { lat: 34.6851, lon: 135.8048 },
}

// Day → region mapping (trip-specific)
const DAY_REGION = {
  '2026-04-11': 'osaka', '2026-04-12': 'kyoto',
  '2026-04-13': 'osaka', '2026-04-14': 'osaka',
  '2026-04-15': 'osaka', '2026-04-16': 'osaka',
  '2026-04-17': 'kyoto', '2026-04-18': 'osaka',
}

// WMO weather code → icon name + Chinese label
function decodeWMO(code) {
  if (code === 0)       return { icon: 'sun',       label: '晴',   wmo: code }
  if (code <= 2)        return { icon: 'cloud',      label: '多雲', wmo: code }
  if (code === 3)       return { icon: 'cloud',      label: '陰',   wmo: code }
  if (code <= 49)       return { icon: 'wind',       label: '霧',   wmo: code }
  if (code <= 55)       return { icon: 'cloudRain',  label: '毛毛雨', wmo: code }
  if (code <= 67)       return { icon: 'cloudRain',  label: '雨',   wmo: code }
  if (code <= 77)       return { icon: 'cloudSnow',  label: '雪',   wmo: code }
  if (code <= 82)       return { icon: 'cloudRain',  label: '陣雨', wmo: code }
  return                       { icon: 'cloudRain',  label: '雷雨', wmo: code }
}

// Typical Osaka April weather (fallback)
const TYPICAL = [
  { max: 21, min: 14, code: 1,  precip: 15 },
  { max: 19, min: 13, code: 61, precip: 70 },
  { max: 20, min: 14, code: 2,  precip: 20 },
  { max: 22, min: 15, code: 0,  precip: 5  },
  { max: 21, min: 14, code: 1,  precip: 10 },
  { max: 17, min: 12, code: 63, precip: 75 },
  { max: 19, min: 13, code: 2,  precip: 25 },
  { max: 23, min: 16, code: 0,  precip: 5  },
]

function buildTypical(dates) {
  return dates.map((date, i) => {
    const t = TYPICAL[i] || TYPICAL[TYPICAL.length - 1]
    return { date, ...decodeWMO(t.code), max: t.max, min: t.min, precip: t.precip }
  })
}

const CACHE_PREFIX = 'weather_v2_'
const CACHE_TTL = 3 * 3600 * 1000  // 3 hours

export function useWeather(dates) {
  const [weather,   setWeather]   = useState(null)
  const [isTypical, setIsTypical] = useState(false)

  useEffect(() => {
    if (!dates || dates.length === 0) return

    const cacheKey = CACHE_PREFIX + dates[0]
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) {
          setWeather(data.weather)
          setIsTypical(data.isTypical)
          return
        }
      }
    } catch (_) {}

    // Fetch for each unique region
    const start = dates[0]
    const end   = dates[dates.length - 1]

    // Use Osaka coordinates as primary (good enough for Kyoto/Nara proximity)
    const { lat, lon } = REGION_COORDS.osaka

    fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max` +
      `&timezone=Asia%2FTokyo&start_date=${start}&end_date=${end}` +
      `&forecast_days=16`
    )
      .then(r => r.json())
      .then(json => {
        const d = json.daily
        if (!d || !d.time || d.time.length === 0) throw new Error('no data')

        const w = d.time.map((date, i) => ({
          date,
          ...decodeWMO(d.weather_code[i] ?? 0),
          max:    Math.round(d.temperature_2m_max[i]),
          min:    Math.round(d.temperature_2m_min[i]),
          precip: d.precipitation_probability_max?.[i] ?? 0,
          region: DAY_REGION[date] || 'osaka',
        }))

        setWeather(w)
        setIsTypical(false)
        localStorage.setItem(cacheKey, JSON.stringify({
          data: { weather: w, isTypical: false }, ts: Date.now()
        }))
      })
      .catch(() => {
        const w = buildTypical(dates)
        setWeather(w)
        setIsTypical(true)
        localStorage.setItem(cacheKey, JSON.stringify({
          data: { weather: w, isTypical: true }, ts: Date.now()
        }))
      })
  }, [dates?.join(',')])

  return { weather, isTypical }
}

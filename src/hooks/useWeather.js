import { useState, useEffect } from 'react'

const OSAKA_LAT = 34.6937
const OSAKA_LON = 135.5023

// WMO weather code → emoji + label
function decodeWeather(code) {
  if (code === 0)              return { icon: '☀️', label: '晴' }
  if (code <= 2)               return { icon: '🌤', label: '多雲' }
  if (code === 3)              return { icon: '☁️', label: '陰' }
  if (code <= 49)              return { icon: '🌫', label: '霧' }
  if (code <= 55)              return { icon: '🌦', label: '毛毛雨' }
  if (code <= 67)              return { icon: '🌧', label: '雨' }
  if (code <= 77)              return { icon: '🌨', label: '雪' }
  if (code <= 82)              return { icon: '🌧', label: '陣雨' }
  return { icon: '⛈', label: '雷雨' }
}

// Typical Osaka April weather (fallback when forecast not available)
const TYPICAL = [
  { max: 21, min: 14, code: 1 },  // 4/11
  { max: 19, min: 13, code: 61 }, // 4/12
  { max: 20, min: 14, code: 2 },  // 4/13
  { max: 22, min: 15, code: 0 },  // 4/14
  { max: 21, min: 14, code: 1 },  // 4/15
  { max: 17, min: 12, code: 63 }, // 4/16
  { max: 19, min: 13, code: 2 },  // 4/17
  { max: 23, min: 16, code: 0 },  // 4/18
]

function toTypical(days) {
  return days.map((d, i) => {
    const t = TYPICAL[i] || TYPICAL[TYPICAL.length - 1]
    return { date: d, ...decodeWeather(t.code), max: t.max, min: t.min }
  })
}

export function useWeather(dates) {
  const [weather, setWeather] = useState(null)
  const [isTypical, setIsTypical] = useState(false)

  useEffect(() => {
    if (!dates || dates.length === 0) return

    const cacheKey = `weather_${dates[0]}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data, ts } = JSON.parse(cached)
      // Cache valid 6h
      if (Date.now() - ts < 6 * 3600 * 1000) {
        setWeather(data.weather)
        setIsTypical(data.isTypical)
        return
      }
    }

    const start = dates[0]
    const end = dates[dates.length - 1]

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${OSAKA_LAT}&longitude=${OSAKA_LON}` +
      `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
      `&timezone=Asia%2FTokyo&start_date=${start}&end_date=${end}`
    )
      .then(r => r.json())
      .then(json => {
        if (json.daily && json.daily.time && json.daily.time.length > 0) {
          const w = json.daily.time.map((date, i) => ({
            date,
            ...decodeWeather(json.daily.weathercode[i]),
            max: Math.round(json.daily.temperature_2m_max[i]),
            min: Math.round(json.daily.temperature_2m_min[i]),
          }))
          setWeather(w)
          setIsTypical(false)
          localStorage.setItem(cacheKey, JSON.stringify({ data: { weather: w, isTypical: false }, ts: Date.now() }))
        } else {
          throw new Error('no data')
        }
      })
      .catch(() => {
        // Fallback to typical data
        const w = toTypical(dates)
        setWeather(w)
        setIsTypical(true)
        localStorage.setItem(cacheKey, JSON.stringify({ data: { weather: w, isTypical: true }, ts: Date.now() }))
      })
  }, [dates?.join(',')])

  return { weather, isTypical }
}

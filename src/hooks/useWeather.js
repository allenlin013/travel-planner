// Hardcoded weather forecast
const FORECAST = [
  { date: '2026-04-11', icon: 'sun',       label: '晴',      max: 23, min: 15, precip:  0 },
  { date: '2026-04-12', icon: 'cloud',     label: '晴轉陰',  max: 23, min: 11, precip: 20 },
  { date: '2026-04-13', icon: 'cloud',     label: '多雲',    max: 20, min: 14, precip: 40 },
  { date: '2026-04-14', icon: 'cloud',     label: '多雲',    max: 21, min: 15, precip: 40 },
  { date: '2026-04-15', icon: 'cloud',     label: '多雲放晴', max: 21, min: 14, precip: 30 },
  { date: '2026-04-16', icon: 'sun',       label: '晴',      max: 25, min: 12, precip: 10 },
  { date: '2026-04-17', icon: 'cloud',     label: '多雲間晴', max: 22, min: 14, precip: 40 },
  { date: '2026-04-18', icon: 'cloudRain', label: '晴間多雨', max: 23, min: 15, precip: 70 },
]

const FORECAST_MAP = Object.fromEntries(FORECAST.map(d => [d.date, d]))

export function useWeather(dates) {
  if (!dates || dates.length === 0) {
    return { weather: null, isTypical: false }
  }

  const weather = dates.map(date => {
    const d = FORECAST_MAP[date]
    return d ? { ...d } : { date, icon: 'sun', label: '晴', max: 22, min: 15, precip: 20 }
  })

  return { weather, isTypical: false }
}

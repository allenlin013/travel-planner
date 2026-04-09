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

/** Synthetic hourly data based on daily max/min/precip */
function buildHourly(max, min, dailyPrecip) {
  const hours = []
  for (let h = 0; h < 24; h++) {
    let temp
    if (h <= 6) {
      temp = min + Math.round((max - min) * 0.1 * (h / 6))
    } else if (h <= 14) {
      temp = Math.round(min + (max - min) * (h - 6) / 8)
    } else {
      temp = Math.round(max - (max - min) * Math.min(1, (h - 14) / 9))
    }
    const apparent = temp - 2

    let precipProb
    if (dailyPrecip <= 30) {
      precipProb = Math.round(dailyPrecip * 0.3)
    } else if (dailyPrecip <= 60) {
      precipProb = (h >= 12 && h <= 18) ? dailyPrecip : Math.round(dailyPrecip * 0.25)
    } else {
      precipProb = (h >= 10 && h <= 21) ? dailyPrecip : Math.round(dailyPrecip * 0.4)
    }

    const icon  = precipProb >= 70 ? 'cloudRain' : precipProb >= 40 ? 'cloud' : 'sun'
    const label = precipProb >= 70 ? '陣雨'      : precipProb >= 40 ? '多雲'  : '晴'

    hours.push({ hour: h, temp, apparent, precipProb, icon, label })
  }
  return hours
}

const FORECAST_MAP = Object.fromEntries(FORECAST.map(d => [d.date, d]))
const HOURLY_MAP   = Object.fromEntries(
  FORECAST.map(d => [d.date, buildHourly(d.max, d.min, d.precip)])
)

export function useWeather(dates) {
  if (!dates || dates.length === 0) {
    return { weather: null, isTypical: false, hourlyByDate: null }
  }

  const weather = dates.map(date => {
    const d = FORECAST_MAP[date]
    if (!d) return { date, icon: 'sun', label: '晴', max: 22, min: 15, precip: 20 }
    return { ...d }
  })

  const hourlyByDate = Object.fromEntries(
    dates.map(date => [date, HOURLY_MAP[date] ?? buildHourly(22, 15, 20)])
  )

  return { weather, isTypical: false, hourlyByDate }
}

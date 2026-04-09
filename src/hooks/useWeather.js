// Hardcoded weather forecast from 附件6_天氣預報
// Data: 04/11–04/18 Osaka/Kyoto area, all 晴 (sunny)

const FORECAST = [
  { date: '2026-04-11', icon: 'sun', label: '晴', max: 23, min: 16, precip: 10 },
  { date: '2026-04-12', icon: 'sun', label: '晴', max: 24, min: 11, precip: 30 },
  { date: '2026-04-13', icon: 'sun', label: '晴', max: 23, min: 16, precip: 40 },
  { date: '2026-04-14', icon: 'sun', label: '晴', max: 23, min: 16, precip: 40 },
  { date: '2026-04-15', icon: 'sun', label: '晴', max: 23, min: 16, precip: 30 },
  { date: '2026-04-16', icon: 'sun', label: '晴', max: 23, min: 16, precip: 60 },
  { date: '2026-04-17', icon: 'sun', label: '晴', max: 23, min: 16, precip: 90 },
  { date: '2026-04-18', icon: 'sun', label: '晴', max: 23, min: 16, precip: 90 },
]

/** Synthetic hourly data based on daily max/min/precip */
function buildHourly(max, min, dailyPrecip) {
  const hours = []
  for (let h = 0; h < 24; h++) {
    // Temperature: min at 6am, max at 14pm, returns toward min by midnight
    let temp
    if (h <= 6) {
      temp = min + Math.round((max - min) * 0.1 * (h / 6))
    } else if (h <= 14) {
      temp = Math.round(min + (max - min) * (h - 6) / 8)
    } else {
      temp = Math.round(max - (max - min) * Math.min(1, (h - 14) / 9))
    }
    const apparent = temp - 2

    // Precipitation: peaks in afternoon for rainier days
    let precipProb
    if (dailyPrecip <= 30) {
      precipProb = Math.round(dailyPrecip * 0.3)
    } else if (dailyPrecip <= 60) {
      precipProb = (h >= 12 && h <= 18) ? dailyPrecip : Math.round(dailyPrecip * 0.25)
    } else {
      // 90% days: high all afternoon/evening
      precipProb = (h >= 10 && h <= 21) ? dailyPrecip : Math.round(dailyPrecip * 0.4)
    }

    const icon  = precipProb >= 70 ? 'cloudRain' : precipProb >= 40 ? 'cloud' : 'sun'
    const label = precipProb >= 70 ? '陣雨'      : precipProb >= 40 ? '多雲'  : '晴'

    hours.push({ hour: h, temp, apparent, precipProb, icon, label })
  }
  return hours
}

const FORECAST_MAP  = Object.fromEntries(FORECAST.map(d => [d.date, d]))
const HOURLY_MAP    = Object.fromEntries(
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

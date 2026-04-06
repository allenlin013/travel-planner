export const TRIP_DATA = {
  tripName: "Osaka Kyoto Nara 8天7夜美食旅程",
  startDate: "2026-04-11",
  endDate: "2026-04-18",
  members: ["YL", "CC", "Fu", "Wen", "Dad", "Sister"],
  days: [
    {
      day: 1, date: "2026-04-11",
      stops: [
        { id: "d1s1",  time: "10:30", name: "桃園機場",                 duration: "1h00m",  type: "flight" },
        { id: "d1s2",  time: "11:58", name: "JR三宮站",                 duration: "0h05m",  type: "train" },
        { id: "d1s3",  time: "12:36", name: "大阪車站",                 duration: "0h05m",  type: "train" },
        { id: "d1s4",  time: "12:45", name: "梅田",                    duration: "0h05m",  type: "walk" },
        { id: "d1s5",  time: "13:12", name: "難波站",                  duration: "0h05m",  type: "train" },
        { id: "d1s6",  time: "13:22", name: "ZUBORAYA",                duration: "0h15m",  type: "restaurant" },
        { id: "d1s7",  time: "13:44", name: "MooKEN",                  duration: "0h20m",  type: "restaurant" },
        { id: "d1s8",  time: "14:11", name: "三竹 難波御堂筋総本店",         duration: "1h00m",  type: "restaurant" },
        { id: "d1s9",  time: "15:15", name: "心齋橋筋商店街",            duration: "1h00m",  type: "shopping" },
        { id: "d1s10", time: "16:31", name: "JR難波",                  duration: "0h05m",  type: "train" },
        { id: "d1s11", time: "16:51", name: "安堂車站",                 duration: "0h05m",  type: "train" },
        { id: "d1s12", time: "17:05", name: "住宿 (Naniwanishi)",       duration: "0h15m",  type: "hotel" },
        { id: "d1s13", time: "17:30", name: "JR鶴橋機廠",              duration: "0h00m",  type: "train" },
        { id: "d1s14", time: "17:46", name: "大正站",                  duration: "0h03m",  type: "train" },
        { id: "d1s15", time: "18:00", name: "大阪京セラ巨蛋（演唱會）",    duration: "3h00m",  type: "attraction" },
        { id: "d1s16", time: "21:10", name: "Kinari Taisho（晚餐）",    duration: "1h00m",  type: "restaurant" },
        { id: "d1s17", time: "22:12", name: "大正站",                  duration: "0h05m",  type: "train" },
        { id: "d1s18", time: "22:33", name: "JR鶴橋機廠",              duration: "0h05m",  type: "train" },
        { id: "d1s19", time: "22:48", name: "住宿 (Naniwanishi)",       duration: "1h00m",  type: "hotel" },
      ]
    },
    {
      day: 2, date: "2026-04-12",
      stops: [
        { id: "d2s1",  time: "07:30", name: "JR鶴橋機廠",              duration: "0h00m",  type: "train" },
        { id: "d2s2",  time: "08:00", name: "近鐵日本橋站",             duration: "0h00m",  type: "train" },
        { id: "d2s3",  time: "08:52", name: "奈良公園",                 duration: "1h00m",  type: "attraction" },
        { id: "d2s4",  time: "10:46", name: "伏見稲荷大社 含狐狸鳥居",     duration: "1h10m",  type: "attraction" },
        { id: "d2s5",  time: "12:47", name: "嵐山",                    duration: "2h30m",  type: "attraction" },
        { id: "d2s6",  time: "15:32", name: "蕎麦麺 嵐山かたつむり",       duration: "1h00m",  type: "restaurant" },
        { id: "d2s7",  time: "16:41", name: "天龍寺",                  duration: "1h00m",  type: "attraction" },
        { id: "d2s8",  time: "17:50", name: "渡月橋",                  duration: "1h00m",  type: "attraction" },
        { id: "d2s9",  time: "19:58", name: "近鐵日本橋站",             duration: "1h00m",  type: "train" },
        { id: "d2s10", time: "21:03", name: "福太郎大阪店（晚餐）",      duration: "1h00m",  type: "restaurant" },
        { id: "d2s11", time: "22:08", name: "近鐵日本橋站",             duration: "0h00m",  type: "train" },
        { id: "d2s12", time: "22:27", name: "JR鶴橋機廠",              duration: "0h00m",  type: "train" },
        { id: "d2s13", time: "22:37", name: "住宿 (Naniwanishi)",       duration: "1h00m",  type: "hotel" },
      ]
    },
    {
      day: 3, date: "2026-04-13",
      stops: [
        { id: "d3s1",  time: "10:30", name: "JR鶴橋機廠",                 duration: "0h00m", type: "train" },
        { id: "d3s2",  time: "10:55", name: "HARBS 心齋橋Parco店",         duration: "1h00m", type: "restaurant" },
        { id: "d3s3",  time: "12:04", name: "道頓堀",                      duration: "1h00m", type: "attraction" },
        { id: "d3s4",  time: "13:06", name: "道頓堀 仁々斗 本店（午餐）",       duration: "1h00m", type: "restaurant" },
        { id: "d3s5",  time: "14:39", name: "幣原博物館",                   duration: "1h00m", type: "attraction" },
        { id: "d3s6",  time: "15:56", name: "大阪天滿宮",                   duration: "1h00m", type: "attraction" },
        { id: "d3s7",  time: "17:15", name: "四代目若狹屋飯（晚餐）",          duration: "1h00m", type: "restaurant" },
        { id: "d3s8",  time: "18:20", name: "道頓堀 水上觀光船",             duration: "1h00m", type: "boat" },
        { id: "d3s9",  time: "19:22", name: "章魚燒 道頓堀 總本店",           duration: "0h20m", type: "restaurant" },
        { id: "d3s10", time: "19:44", name: "10分ダッシュ・センタープール",      duration: "1h00m", type: "restaurant" },
        { id: "d3s11", time: "21:05", name: "JR鶴橋機廠",                  duration: "0h00m", type: "train" },
        { id: "d3s12", time: "21:15", name: "住宿 (Naniwanishi)",           duration: "1h00m", type: "hotel" },
      ]
    },
    {
      day: 4, date: "2026-04-14",
      stops: [
        { id: "d4s1", time: "05:30", name: "JR鶴橋機廠",                   duration: "0h00m",  type: "train" },
        { id: "d4s2", time: "06:01", name: "日本環球影城 (USJ)",             duration: "13h00m", type: "attraction" },
        { id: "d4s3", time: "19:30", name: "Itamae-Yakiniku Itto（晚餐）",  duration: "1h30m",  type: "restaurant" },
        { id: "d4s4", time: "21:25", name: "JR鶴橋機廠",                   duration: "0h00m",  type: "train" },
        { id: "d4s5", time: "21:35", name: "住宿 (Naniwanishi)",            duration: "0h00m",  type: "hotel" },
      ]
    },
    {
      day: 5, date: "2026-04-15",
      stops: [
        { id: "d5s1",  time: "08:20", name: "JR鶴橋機廠",                  duration: "0h10m", type: "train" },
        { id: "d5s2",  time: "09:00", name: "大阪城公園車站",               duration: "0h10m", type: "walk" },
        { id: "d5s3",  time: "09:30", name: "大阪城 御座船",                 duration: "0h30m", type: "boat" },
        { id: "d5s4",  time: "10:15", name: "大阪城 天守閣",                duration: "1h00m", type: "attraction" },
        { id: "d5s5",  time: "11:37", name: "Unagi Nishihara（午餐）",      duration: "1h30m", type: "restaurant" },
        { id: "d5s6",  time: "13:16", name: "谷町四丁目車站",               duration: "0h14m", type: "train" },
        { id: "d5s7",  time: "13:47", name: "四天王寺前夕陽丘站",           duration: "0h13m", type: "walk" },
        { id: "d5s8",  time: "14:09", name: "四天王寺",                    duration: "1h00m", type: "attraction" },
        { id: "d5s9",  time: "15:20", name: "通天閣",                      duration: "1h00m", type: "attraction" },
        { id: "d5s10", time: "16:26", name: "KANKANDO janjanyokocho",      duration: "1h00m", type: "attraction" },
        { id: "d5s11", time: "17:39", name: "壽綱亭・花殿 Nabeya（晚餐）",  duration: "1h00m", type: "restaurant" },
        { id: "d5s12", time: "19:02", name: "Harukas300展望台",             duration: "1h00m", type: "attraction" },
        { id: "d5s13", time: "20:06", name: "阿倍野 Q's Mall",              duration: "1h00m", type: "shopping" },
        { id: "d5s14", time: "21:06", name: "JR鶴橋機廠",                  duration: "1h00m", type: "train" },
        { id: "d5s15", time: "22:16", name: "住宿 (Naniwanishi)",           duration: "1h00m", type: "hotel" },
      ]
    },
    {
      day: 6, date: "2026-04-16",
      stops: [
        { id: "d6s1",  time: "10:30", name: "JR鶴橋機廠",                  duration: "0h00m", type: "train" },
        { id: "d6s2",  time: "11:00", name: "くくるの梺梅大阪本店（午餐）", duration: "1h00m", type: "restaurant" },
        { id: "d6s3",  time: "12:22", name: "雪梅探梅田本店",                 duration: "1h00m", type: "shopping" },
        { id: "d6s4",  time: "13:24", name: "grenier Umeda branch",        duration: "1h00m", type: "restaurant" },
        { id: "d6s5",  time: "14:27", name: "Hanadako",                    duration: "1h00m", type: "restaurant" },
        { id: "d6s6",  time: "15:31", name: "京都化粧品相機梅田店",     duration: "1h00m", type: "shopping" },
        { id: "d6s7",  time: "16:34", name: "GRAND FRONT 大阪",            duration: "1h00m", type: "shopping" },
        { id: "d6s8",  time: "17:36", name: "GARIGUETTE Osaka",            duration: "1h00m", type: "restaurant" },
        { id: "d6s9",  time: "18:39", name: "LUCUA Osaka",                 duration: "1h00m", type: "shopping" },
        { id: "d6s10", time: "19:41", name: "Gyukatsu Motomura（晚餐）",   duration: "1h00m", type: "restaurant" },
        { id: "d6s11", time: "20:43", name: "McDonald's Lucua Osaka",      duration: "1h00m", type: "restaurant" },
        { id: "d6s12", time: "22:20", name: "住宿 (Naniwanishi)",           duration: "1h00m", type: "hotel" },
      ]
    },
    {
      day: 7, date: "2026-04-17",
      stops: [
        { id: "d7s1",  time: "09:00", name: "JR鶴橋機廠",              duration: "0h00m", type: "train" },
        { id: "d7s2",  time: "09:00", name: "京都花見小路",             duration: "1h00m", type: "attraction" },
        { id: "d7s3",  time: "10:06", name: "京都八坂神社",             duration: "1h00m", type: "attraction" },
        { id: "d7s4",  time: "11:06", name: "Okutan Kiyomizu（午餐）",  duration: "1h00m", type: "restaurant" },
        { id: "d7s5",  time: "12:13", name: "圓德院（三年坂）",          duration: "1h00m", type: "attraction" },
        { id: "d7s6",  time: "13:22", name: "清水寺",                  duration: "1h00m", type: "attraction" },
        { id: "d7s7",  time: "14:32", name: "二寧坂（二年坂）",          duration: "1h00m", type: "attraction" },
        { id: "d7s8",  time: "16:00", name: "京都八坂神社（夜景）",    duration: "0h00m", type: "attraction" },
        { id: "d7s9",  time: "16:18", name: "麵屋 豚一（晚餐）",        duration: "2h00m", type: "restaurant" },
        { id: "d7s10", time: "19:27", name: "JR鶴橋機廠（返回）",       duration: "1h00m", type: "train" },
      ]
    },
    {
      day: 8, date: "2026-04-18",
      stops: [
        { id: "d8s1", time: "08:00", name: "JR鶴橋機廠",              duration: "0h00m", type: "train" },
        { id: "d8s2", time: "08:18", name: "梅田市場",                 duration: "1h00m", type: "attraction" },
        { id: "d8s3", time: "13:10", name: "關西國際機場",              duration: "0h00m", type: "flight" },
        { id: "d8s4", time: "16:05", name: "臺灣桃園國際機場",          duration: "0h00m", type: "flight" },
      ]
    },
  ]
}

export const MEMBERS = ["YL", "CC", "Fu", "Wen", "Dad", "Sister"]

export const EXCHANGE_RATE = { JPY_TWD: 0.218 }

export const TYPE_CONFIG = {
  attraction: { icon: '🏯', color: '#C0392B', bg: '#FDECEA', label: '景點' },
  restaurant:  { icon: '🍱', color: '#E67E22', bg: '#FEF0E6', label: '餐廳' },
  shopping:    { icon: '🛍️', color: '#9B59B6', bg: '#F5EEF8', label: '購物' },
  hotel:       { icon: '🏠', color: '#27AE60', bg: '#EAFAF1', label: '住宿' },
  train:       { icon: '🚃', color: '#5D7A8C', bg: '#EBF5FB', label: '電車' },
  walk:        { icon: '🚶', color: '#95A5A6', bg: '#F2F3F4', label: '步行' },
  taxi:        { icon: '🚕', color: '#F1C40F', bg: '#FEF9E7', label: '計程車' },
  flight:      { icon: '✈️', color: '#2980B9', bg: '#EAF4FC', label: '飛機' },
  boat:        { icon: '⛵', color: '#1ABC9C', bg: '#E8F8F5', label: '渡船' },
  other:       { icon: '📌', color: '#BDC3C7', bg: '#F2F3F4', label: '其他' },
}

export const TRANSIT_TYPES = new Set(['train', 'walk', 'taxi', 'flight', 'boat'])

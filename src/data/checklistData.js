export const DEFAULT_CHECKLIST = {
  categories: [
    {
      id: "cat_docs",
      name: "證件類",
      icon: "📋",
      items: [
        { id: "item_001", text: "護照（確認有效期 > 6個月）" },
        { id: "item_002", text: "機票電子票（截圖備份）" },
        { id: "item_003", text: "飯店預訂確認信" },
        { id: "item_004", text: "旅遊保險保單" },
      ]
    },
    {
      id: "cat_money",
      name: "錢財類",
      icon: "💴",
      items: [
        { id: "item_005", text: "日幣現金" },
        { id: "item_006", text: "信用卡（VISA / Mastercard）" },
        { id: "item_007", text: "IC卡（ICOCA / Suica）" },
      ]
    },
    {
      id: "cat_devices",
      name: "電子設備",
      icon: "📱",
      items: [
        { id: "item_008", text: "手機和電源" },
        { id: "item_009", text: "行動電源" },
        { id: "item_010", text: "相機 + 記憶卡" },
        { id: "item_011", text: "耳機" },
        { id: "item_012", text: "轉接頭（日本 A 型，同台灣）" },
      ]
    },
    {
      id: "cat_clothes",
      name: "衣物",
      icon: "👕",
      items: [
        { id: "item_013", text: "外套（4月早晚涼）" },
        { id: "item_014", text: "換洗衣物（7套）" },
        { id: "item_015", text: "折疊雨傘" },
        { id: "item_016", text: "舒適步行鞋" },
      ]
    },
    {
      id: "cat_toiletry",
      name: "日常用品",
      icon: "🧴",
      items: [
        { id: "item_017", text: "牙刷牙膏" },
        { id: "item_018", text: "洗髮精沐浴乳（小罐）" },
        { id: "item_019", text: "防曬乳" },
        { id: "item_020", text: "個人藥品" },
      ]
    },
    {
      id: "cat_misc",
      name: "旅遊備用",
      icon: "🎒",
      items: [
        { id: "item_021", text: "地圖冊（景點路線）" },
        { id: "item_022", text: "購物袋 / 環保袋" },
      ]
    },
  ],
  checkedByMember: {
    YL: {}, CC: {}, Fu: {}, Wen: {}, Dad: {}, Sister: {}
  }
}

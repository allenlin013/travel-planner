export const DEFAULT_CHECKLIST = {
  categories: [
    {
      id: "cat_important",
      name: "證件類",
      icon: "🥰",
      items: [
        { id: "item_033", text: "出去玩的好心情" },
      ]
    },
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
        { id: "item_024", text: "自拍棒" },
      ]
    },
    {
      id: "cat_clothes",
      name: "衣物",
      icon: "👕",
      items: [
        { id: "item_013", text: "外套（4月早晚涼）" },
        { id: "item_014", text: "換洗衣物（7套）" },
        { id: "item_016", text: "舒適步行鞋" },
        { id: "item_023", text: "免洗衣褲" },
      ]
    },
    {
      id: "cat_toiletry",
      name: "日常用品",
      icon: "🧴",
      items: [
        { id: "item_017", text: "牙刷牙膏洗面乳" },
        { id: "item_019", text: "防曬乳" },
        { id: "item_020", text: "個人藥品(暈車, 感冒, 消炎)" },
        { id: "item_027", text: "眼鏡&隱形眼鏡" },
        { id: "item_029", text: "刮鬍刀" },
        { id: "item_032", text: "美髮用品(梳子, 髮蠟, 定型液)" },
      ]
    },
    {
      id: "cat_misc",
      name: "旅遊備用",
      icon: "🎒",
      items: [
        { id: "item_021", text: "地圖冊（景點路線）" },
        { id: "item_022", text: "購物袋 / 環保袋" },
        { id: "item_025", text: "口罩" },
        { id: "item_026", text: "太陽眼鏡" },
        { id: "item_028", text: "紙巾&濕紙巾" },
        { id: "item_015", text: "折疊雨傘&輕便雨衣" },
        { id: "item_030", text: "購物袋" },
        { id: "item_031", text: "垃圾袋" },
      ]
    },
  ],
  checkedByMember: {
    YL: {}, CC: {}, Fu: {}, Wen: {}, Dad: {}, Sister: {}
  }
}

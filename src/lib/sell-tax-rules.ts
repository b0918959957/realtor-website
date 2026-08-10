/**
 * 小飛賣房稅費＆實拿試算 —— 稅務規則中心（TAX_RULES）
 *
 * ⚠️ 維護規則：所有會隨法規變動的數字，只能寫在這個檔案裡。
 *    元件與計算引擎一律從這裡讀，不准把稅率、門檻、比例散落在其他檔案。
 *
 * 資料來源（2026-08-10 查證）：
 *  - 財政部 房地合一稅專區「稅制設計－個人」
 *  - 財政部南區／北區／臺北國稅局 房地合一稅 2.0 專區
 *  - 財政部全球資訊網「訂定 114 年度個人出售房屋之財產交易所得計算規定」
 *  - 財政部稅務入口網 土地增值稅節稅手冊
 *  - 臺北市稅捐稽徵處 土地增值稅－稅率與計算（速算公式）
 *  - 各地方稅務局：房屋稅納稅義務基準日、地價稅納稅義務基準日
 */

export type Bracket = {
  /** 持有期間上限（月）。null 代表無上限。 */
  maxMonths: number | null;
  rate: number;
  label: string;
};

export const TAX_RULES = {
  /** 法規版本代號，顯示在頁尾 */
  version: "2026.08",
  /** 最後查證日期 */
  lastUpdated: "2026-08-10",

  /* ───────────────────────── 新舊制適用範圍 ───────────────────────── */
  regime: {
    /** 105/1/1 起取得之房地，一律適用房地合一新制 */
    newRegimeAcquireFrom: "2016-01-01",
    /** 103/1/2 之後取得、且持有期間在 2 年以內者，105/1/1 以後出售亦適用新制 */
    shortHoldAcquireFrom: "2014-01-02",
    shortHoldMonths: 24,
    /** 新制自 105/1/1 起施行（出售日） */
    newRegimeSellFrom: "2016-01-01",
    /** 房地合一 2.0 自 110/7/1 起施行（出售日） */
    v2SellFrom: "2021-07-01"
  },

  /* ─────────────────── 房地合一所得稅：稅率級距 ─────────────────── */
  houseLandRates: {
    /** 2.0（110/7/1 以後出售） */
    v2: {
      resident: [
        { maxMonths: 24, rate: 0.45, label: "持有 2 年以內" },
        { maxMonths: 60, rate: 0.35, label: "超過 2 年、未逾 5 年" },
        { maxMonths: 120, rate: 0.2, label: "超過 5 年、未逾 10 年" },
        { maxMonths: null, rate: 0.15, label: "超過 10 年" }
      ] as Bracket[],
      nonResident: [
        { maxMonths: 24, rate: 0.45, label: "持有 2 年以內" },
        { maxMonths: null, rate: 0.35, label: "超過 2 年" }
      ] as Bracket[]
    },
    /** 1.0（105/1/1 ～ 110/6/30 出售） */
    v1: {
      resident: [
        { maxMonths: 12, rate: 0.45, label: "持有 1 年以內" },
        { maxMonths: 24, rate: 0.35, label: "超過 1 年、未逾 2 年" },
        { maxMonths: 120, rate: 0.2, label: "超過 2 年、未逾 10 年" },
        { maxMonths: null, rate: 0.15, label: "超過 10 年" }
      ] as Bracket[],
      nonResident: [
        { maxMonths: 12, rate: 0.45, label: "持有 1 年以內" },
        { maxMonths: null, rate: 0.35, label: "超過 1 年" }
      ] as Bracket[]
    },
    /** 符合法定特殊情形者，不分持有期間適用 20% */
    special: {
      rate: 0.2,
      label: "特殊情形優惠稅率 20%",
      cases: [
        "因財政部公告之非自願性因素（如調職、房地遭強制執行等）交易",
        "以自有土地與營利事業合建分回房地，且自土地取得日起 2 年內完成交易",
        "參與都市更新或危老重建取得房地，於興建完成所有權移轉登記日起 5 年內交易"
      ]
    }
  },

  /* ─────────────────── 自住房地租稅優惠（房地合一） ─────────────────── */
  selfUseIncomeTax: {
    /** 課稅所得 400 萬元以內免稅 */
    exemptIncome: 4_000_000,
    /** 超過部分適用 10% */
    rate: 0.1,
    /** 逐項資格條件，全部符合才「可能」適用 */
    checks: [
      {
        key: "household",
        label: "本人、配偶或未成年子女已於該房屋辦竣戶籍登記",
        hint: "只有實際居住沒設籍不算；設籍在別處也不算。"
      },
      {
        key: "livedSixYears",
        label: "本人、配偶或未成年子女持有並實際居住該房屋連續滿 6 年",
        hint: "持有、設籍、實際居住三者都要連續滿 6 年，中斷會被打掉重算。"
      },
      {
        key: "noRent",
        label: "交易前 6 年內，該房地沒有出租",
        hint: "曾申報租賃所得或有租約紀錄，國稅局查得到。"
      },
      {
        key: "noBusiness",
        label: "交易前 6 年內，該房地沒有供營業或執行業務使用",
        hint: "曾設立公司、工作室、營業登記在此地址都要留意。"
      },
      {
        key: "notUsedBefore",
        label: "本人、配偶及未成年子女於交易前 6 年內未曾適用過此自住優惠",
        hint: "一家人 6 年內只能用一次。"
      }
    ]
  },

  /* ─────────────────── 出售費用未提示證明之核定標準 ─────────────────── */
  expenseStandard: {
    /** 按成交價額 3% 計算 */
    rate: 0.03,
    /** 上限 30 萬元 */
    cap: 300_000,
    note:
      "有實際合法支付證明時，應依實際符合規定之費用核實認定；" +
      "未提示證明、或所提示金額未達成交價額 3% 者，稽徵機關得按成交價額 3% 計算，並以 30 萬元為限。"
  },

  /* ───────────────────────── 土地增值稅 ───────────────────────── */
  landIncrementTax: {
    /**
     * 速算公式：應納稅額 = a × 稅率 － b × 累進差額率
     *   a = 土地漲價總數額
     *   b = 按物價指數調整後之原規定地價或前次移轉現值總額
     * 依持有年限給予長期減徵（僅減徵超過最低稅率部分）。
     */
    brackets: {
      base: {
        label: "持有未滿 20 年",
        t1: { rate: 0.2, deduct: 0 },
        t2: { rate: 0.3, deduct: 0.1 },
        t3: { rate: 0.4, deduct: 0.3 }
      },
      y20: {
        label: "持有滿 20 年以上（減徵 20%）",
        t1: { rate: 0.2, deduct: 0 },
        t2: { rate: 0.28, deduct: 0.08 },
        t3: { rate: 0.36, deduct: 0.24 }
      },
      y30: {
        label: "持有滿 30 年以上（減徵 30%）",
        t1: { rate: 0.2, deduct: 0 },
        t2: { rate: 0.27, deduct: 0.07 },
        t3: { rate: 0.34, deduct: 0.21 }
      },
      y40: {
        label: "持有滿 40 年以上（減徵 40%）",
        t1: { rate: 0.2, deduct: 0 },
        t2: { rate: 0.26, deduct: 0.06 },
        t3: { rate: 0.32, deduct: 0.18 }
      }
    },
    /** 自用住宅用地優惠稅率 */
    selfUseRate: 0.1,
    /** 自用住宅用地面積上限（平方公尺） */
    selfUseArea: { urban: 150, nonUrban: 350 },
    /** 一生一次 */
    onceInLifetime: [
      {
        key: "household",
        label: "土地所有權人或其配偶、未成年子女於該地辦竣戶籍登記",
        hint: ""
      },
      { key: "noRentBusiness", label: "出售前 1 年內無出租、無供營業使用", hint: "" },
      {
        key: "ownHouse",
        label: "地上房屋為土地所有權人或其配偶、未成年子女所有",
        hint: ""
      },
      {
        key: "areaLimit",
        label: "都市土地未超過 150 ㎡（約 45.4 坪）／非都市土地未超過 350 ㎡（約 105.9 坪）",
        hint: "超過部分按一般用地稅率課徵。"
      },
      { key: "notUsedOnce", label: "本人一生尚未使用過「一生一次」優惠", hint: "" }
    ],
    /** 一生一屋（已用過一生一次者，符合下列條件仍可適用 10%） */
    onceInLifetimeHouse: [
      {
        key: "usedOnce",
        label: "已使用過「一生一次」自用住宅優惠",
        hint: "這是適用一生一屋的前提。"
      },
      {
        key: "onlyHouse",
        label: "出售時，本人與配偶及未成年子女名下無該自用住宅以外之房屋",
        hint: ""
      },
      {
        key: "sixYears",
        label: "出售前持有該土地 6 年以上，且辦竣戶籍登記並居住連續滿 6 年",
        hint: ""
      },
      { key: "noRentBusiness6", label: "出售前 5 年內無出租、無供營業使用", hint: "" },
      {
        key: "areaLimit",
        label: "都市土地未超過 150 ㎡／非都市土地未超過 350 ㎡",
        hint: ""
      }
    ]
  },

  /* ─────────────────── 舊制：個人出售房屋財產交易所得 ─────────────────── */
  legacyPropertyIncome: {
    /** 財政部最新已公告年度 */
    year: "114 年度",
    announcedAt: "2026-03-04",
    /**
     * 高總價案件：以實際成交金額按房屋評定現值占「公告土地現值＋房屋評定現值」
     * 之比例計算房屋收入，再以該收入 20% 計算所得額。
     */
    highValueRate: 0.2,
    highValueThresholds: [
      { cities: ["臺北市", "台北市"], total: 60_000_000, perPing: 1_200_000 },
      { cities: ["新北市"], total: 40_000_000, perPing: 750_000 },
      {
        cities: ["桃園市", "新竹縣", "新竹市", "臺中市", "台中市", "臺南市", "台南市", "高雄市"],
        total: 30_000_000,
        perPing: 500_000
      },
      { cities: ["__default__"], total: 22_000_000, perPing: 350_000 }
    ],
    /** 綜合所得稅邊際稅率（併入出售年度綜所稅計算，供粗估用） */
    marginalRates: [0.05, 0.12, 0.2, 0.3, 0.4],
    note:
      "舊制房屋財產交易所得併入出售年度綜合所得稅申報，實際稅額取決於當年度全部所得。" +
      "非高總價案件且無法提示成本證明者，係按房屋評定現值乘以財政部公告之各縣市、各行政區比率計算，" +
      "比率需查閱當年度公告，本工具不代為推估。"
  },

  /* ─────────────────── 房屋稅／地價稅 納稅義務基準日 ─────────────────── */
  holdingTaxBaseDates: {
    houseTax: {
      label: "房屋稅",
      baseDate: "每年 2 月末日",
      levyPeriod: "每年 5 月 1 日至 5 月 31 日一次徵收全年份",
      note: "以基準日當天的房屋所有權人為該年度納稅義務人。"
    },
    landTax: {
      label: "地價稅",
      baseDate: "每年 8 月 31 日",
      levyPeriod: "每年 11 月 1 日至 11 月 30 日徵收",
      note: "以基準日當天土地登記簿所載之土地所有權人為該年度納稅義務人。"
    },
    warning:
      "法定納稅義務人依基準日認定，與買賣雙方在契約上「按持有天數分算」是兩件事。" +
      "契約分算屬私人約定，不會改變法定納稅義務人。"
  },

  /* ─────────────────── 交易成本預設值（全部可改） ─────────────────── */
  defaults: {
    agentFeeRate: 0.04,
    agentFeeNote: "4% 僅作為本工具預設試算值，實際服務費依委託契約／買賣契約約定。",
    escrowRate: 0.0003,
    escrowNote: "萬分之三為常見試算值，實際費率依履約保證機構、交易方案及契約為準。",
    admin: {
      contractFee: 2_000,
      transferFee: 12_000,
      extraLandParcelFee: 1_000,
      extraBuildingFee: 1_000,
      mortgageReleaseFee: 2_500,
      priceRegistrationFee: 1_500,
      otherAdminFee: 0
    },
    adminNote:
      "以上皆為市場常見參考行情，非全台統一法定費用，實際依承辦地政士（代書）報價與契約約定。"
  },

  /* ───────────────────────── 官方資料來源 ───────────────────────── */
  sources: [
    { name: "財政部 房地合一稅專區（稅制設計－個人）", url: "https://www.mof.gov.tw/houseandland/multiplehtml/de144e74630c4ac59f2d84a068c889c9" },
    { name: "財政部南區國稅局 房地合一稅 2.0", url: "https://www.ntbsa.gov.tw/singlehtml/c2ec51da64ab44389bb411f0fbea39f5?cntId=9361dd10f0b241208e75704a669f2231" },
    { name: "財政部稅務入口網 土地增值稅節稅手冊", url: "https://www.etax.nat.gov.tw/etwmain/tax-info/understanding/tax-saving-manual/local/land-value-increment-tax/noaGA0q" },
    { name: "財政部稅務入口網 土地增值稅試算", url: "https://www.etax.nat.gov.tw/etwmain/etw158w/51" },
    { name: "財政部 114 年度個人出售房屋之財產交易所得計算規定", url: "https://www.mof.gov.tw/singlehtml/384fb3077bb349ea973e7fc6f13b6974?cntId=e837fc9c5b6e4345a7a4ab02b7ab3436" },
    { name: "財政部稅務入口網（綜合查詢）", url: "https://www.etax.nat.gov.tw/" }
  ]
} as const;

export type TaxRules = typeof TAX_RULES;

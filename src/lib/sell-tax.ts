/**
 * 小飛賣房稅費＆實拿試算 —— 計算引擎
 *
 * 原則：
 *  1. 稅率、門檻一律從 TAX_RULES 讀，這個檔案不寫死任何數字。
 *  2. 資料不足時回傳 status = "insufficient"，不硬算、不亂補。
 *  3. 所有金額內部一律用「元」計算，顯示時才換算成萬元。
 */

import { TAX_RULES, type Bracket } from "./sell-tax-rules";

/* ══════════════════════════════ 型別 ══════════════════════════════ */

export type SellerKind = "individual" | "company";
export type Residency = "resident" | "nonResident";
export type AcquireType = "purchase" | "inherit" | "gift" | "spouseGift" | "partition" | "other";
export type PropertyKind =
  | "大樓" | "華廈" | "公寓" | "透天" | "店面" | "辦公室" | "廠房" | "土地" | "預售屋" | "其他";

export type Mode = "quick" | "advanced";

/** 單一費用項目：金額 + 有無單據 */
export type ProofItem = { amount: number; hasProof: boolean };

export type Basic = {
  sellerKind: SellerKind;
  residency: Residency;
  city: string;
  district: string;
  propertyKind: PropertyKind;
  acquireType: AcquireType;
};

export type Deal = {
  acquireDate: string;   // YYYY-MM-DD
  sellDate: string;      // YYYY-MM-DD
  /** 繼承／受贈可併計前手持有期間時，前手的取得日 */
  priorOwnerAcquireDate: string;
  countPriorHolding: boolean;
  acquirePrice: number;  // 元
  sellPrice: number;     // 元
};

export type Cost = {
  deedTax: ProofItem;        // 契稅
  stampTax: ProofItem;       // 印花稅
  agencyFee: ProofItem;      // 當初取得時代書費
  govFee: ProofItem;         // 規費
  notaryFee: ProofItem;      // 公證／認證費
  buyAgentFee: ProofItem;    // 當初購屋仲介費
  loanInterest: ProofItem;   // 取得房地前之借款利息
  improvement: ProofItem;    // 裝潢／增建／改良／重大修繕
  otherCost: ProofItem;
};

export type SellExpense = {
  useActual: boolean;        // true = 以實際費用核實；false = 直接採核定標準
  sellAgentFee: number;      // 出售仲介服務費（同時是現金支出）
  advertising: number;
  cleaning: number;
  moving: number;
  otherExpense: number;
  hasProof: boolean;         // 是否有合法支付證明
};

export type SelfUseIncome = {
  household: boolean;
  livedSixYears: boolean;
  noRent: boolean;
  noBusiness: boolean;
  notUsedBefore: boolean;
};

export type LandTaxInput = {
  /** known = 已有試算金額；advanced = 用土地資料試算；unknown = 沒資料 */
  source: "known" | "advanced" | "unknown";
  knownAmount: number;
  /** 進階：本次申報移轉現值總額（元） */
  declaredValue: number;
  /** 進階：原規定地價或前次移轉現值總額（元，未調整） */
  priorValue: number;
  /** 進階：臺灣地區消費者物價總指數（%） */
  cpiIndex: number;
  /** 進階：得減除之土地改良費用（工程受益費、重劃負擔等） */
  landImproveFee: number;
  /** 進階：本次公告土地現值總額（用於房地合一 2.0 土地漲價總數額減除上限） */
  landAnnouncedValue: number;
  /** 是否適用自用住宅用地 10% */
  selfUseLand: boolean;
  /** 土地持有年數（用於長期減徵） */
  landHoldYears: number;
};

export type Financing = {
  remainingLoan: number;
  prepayPenaltyKnown: "none" | "yes" | "unknown";
  prepayPenalty: number;
};

export type Escrow = { status: "yes" | "no" | "undecided"; rate: number; overrideAmount: number | null };

export type AdminFees = {
  contractFee: number;
  transferFee: number;
  extraLandParcelFee: number;
  extraBuildingFee: number;
  mortgageReleaseFee: number;
  priceRegistrationFee: number;
  otherAdminFee: number;
};

export type Settlement = {
  houseTax: number;
  landTax: number;
  managementFee: number;
  water: number;
  electricity: number;
  gas: number;
  rentDeposit: number;   // 正數＝賣方要退給買方（支出）
  otherSettle: number;
};

export type OtherCosts = {
  engineeringBenefitFee: { on: boolean; amount: number };
  leaseTermination: { on: boolean; amount: number };
  repairHandover: { on: boolean; amount: number };
  otherMisc: { on: boolean; amount: number };
};

export type LegacyInput = {
  /** 房屋評定現值（元） */
  houseAssessedValue: number;
  /** 公告土地現值總額（元） */
  landAnnouncedValue: number;
  /** 房屋坪數（用於高總價單價門檻判斷） */
  pings: number;
  /** 核實 or 推計 */
  path: "actual" | "standard";
  /** 推計時：財政部公告該行政區之比率（%），使用者自行查表填入 */
  standardRatePct: number;
  /** 綜所稅邊際稅率 */
  marginalRate: number;
};

export type AgentFee = { mode: "rate" | "amount"; rate: number; amount: number };

export type Input = {
  mode: Mode;
  basic: Basic;
  deal: Deal;
  cost: Cost;
  sellExpense: SellExpense;
  selfUse: SelfUseIncome;
  specialRate20: boolean;
  priorYearLoss: number;
  land: LandTaxInput;
  legacy: LegacyInput;
  financing: Financing;
  agent: AgentFee;
  escrow: Escrow;
  admin: AdminFees;
  settlement: Settlement;
  other: OtherCosts;
  settlementEnabled: boolean;
};

/* ══════════════════════════════ 小工具 ══════════════════════════════ */

export const emptyProof = (): ProofItem => ({ amount: 0, hasProof: false });

export function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** 千分位 */
export function money(v: number): string {
  const n = Math.round(v);
  return n.toLocaleString("zh-TW");
}

/** 元 → 萬元（保留 1 位小數，整數則不顯示小數） */
export function toWan(v: number): string {
  const w = v / 10_000;
  const rounded = Math.round(w * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toLocaleString("zh-TW") : rounded.toLocaleString("zh-TW", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** 依單位輸出顯示字串 */
export function fmt(v: number, unit: "wan" | "yuan"): string {
  return unit === "wan" ? `${toWan(v)} 萬` : `${money(v)} 元`;
}

/** 兩個日期相差的完整月數 */
export function monthsBetween(from: string, to: string): number | null {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m -= 1;
  return m;
}

export function holdingText(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y <= 0) return `${m} 個月`;
  return m === 0 ? `${y} 年` : `${y} 年 ${m} 個月`;
}

function pickBracket(brackets: Bracket[], months: number): Bracket {
  for (const b of brackets) {
    if (b.maxMonths === null || months <= b.maxMonths) return b;
  }
  return brackets[brackets.length - 1];
}

/* ══════════════════════ 一、新舊制判斷 ══════════════════════ */

export type RegimeResult = {
  regime: "houseLand" | "legacy" | "unknown";
  version: "v1" | "v2" | null;
  reason: string;
  /** 取得方式特殊，取得日與成本認定需另外確認 */
  needsManualCheck: boolean;
  manualNote: string;
};

const ACQUIRE_LABEL: Record<AcquireType, string> = {
  purchase: "買賣",
  inherit: "繼承",
  gift: "贈與",
  spouseGift: "配偶贈與",
  partition: "分割",
  other: "其他"
};

export function judgeRegime(basic: Basic, deal: Deal): RegimeResult {
  const R = TAX_RULES.regime;
  const acq = deal.acquireDate;
  const sell = deal.sellDate;

  if (!acq || !sell) {
    return {
      regime: "unknown",
      version: null,
      reason: "尚未輸入取得日期或預計出售日期，無法判斷適用制度。",
      needsManualCheck: false,
      manualNote: ""
    };
  }

  const special = basic.acquireType !== "purchase";
  const manualNote = special
    ? `此案件為「${ACQUIRE_LABEL[basic.acquireType]}」取得，取得日認定與成本認定可能與一般買賣不同，` +
      `建議請地政士或國稅局協助確認後再定案。本工具的判斷僅供初步參考。`
    : "";

  if (sell < R.newRegimeSellFrom) {
    return {
      regime: "legacy",
      version: null,
      reason: "出售日在 105 年 1 月 1 日之前，不屬於房地合一課稅範圍。",
      needsManualCheck: special,
      manualNote
    };
  }

  const version: "v1" | "v2" = sell >= R.v2SellFrom ? "v2" : "v1";
  const months = monthsBetween(acq, sell) ?? 0;

  if (acq >= R.newRegimeAcquireFrom) {
    return {
      regime: "houseLand",
      version,
      reason: "房地於 105 年 1 月 1 日以後取得，適用房地合一所得稅新制。",
      needsManualCheck: special,
      manualNote
    };
  }

  if (acq >= R.shortHoldAcquireFrom && months <= R.shortHoldMonths) {
    return {
      regime: "houseLand",
      version,
      reason:
        "房地於 103 年 1 月 2 日以後取得，且持有期間在 2 年以內，105 年 1 月 1 日以後出售同樣適用房地合一新制。",
      needsManualCheck: special,
      manualNote
    };
  }

  return {
    regime: "legacy",
    version: null,
    reason:
      "房地於 105 年 1 月 1 日之前取得，且不符合「103 年 1 月 2 日後取得且持有 2 年以內」的情形，" +
      "本案可能適用舊制房屋財產交易所得。",
    needsManualCheck: special,
    manualNote
  };
}

/* ══════════════════════ 二、土地增值稅 ══════════════════════ */

export type LandTaxResult = {
  status: "ok" | "manual" | "insufficient";
  amount: number;
  /** 土地漲價總數額（元） */
  incrementTotal: number;
  /** 按物價指數調整後之原地價 */
  adjustedPrior: number;
  multiple: number | null;
  tierLabel: string;
  note: string;
};

export function calcLandIncrementTax(land: LandTaxInput): LandTaxResult {
  const L = TAX_RULES.landIncrementTax;

  if (land.source === "known") {
    const amt = num(land.knownAmount);
    return {
      status: amt > 0 ? "manual" : "insufficient",
      amount: Math.max(0, amt),
      incrementTotal: 0,
      adjustedPrior: 0,
      multiple: null,
      tierLabel: "",
      note:
        amt > 0
          ? "採用你輸入的稅務局／代書已試算金額。"
          : "尚未輸入已試算的土地增值稅金額。"
    };
  }

  if (land.source === "unknown") {
    return {
      status: "insufficient",
      amount: 0,
      incrementTotal: 0,
      adjustedPrior: 0,
      multiple: null,
      tierLabel: "",
      note:
        "土地增值稅需要前次移轉現值、本次申報移轉現值等土地資料才能較準確計算，" +
        "目前資料不足，本次試算未計入土地增值稅。"
    };
  }

  const declared = num(land.declaredValue);
  const prior = num(land.priorValue);
  const cpi = num(land.cpiIndex);

  if (declared <= 0 || prior <= 0 || cpi <= 0) {
    return {
      status: "insufficient",
      amount: 0,
      incrementTotal: 0,
      adjustedPrior: 0,
      multiple: null,
      tierLabel: "",
      note: "目前資料不足，請補充「本次申報移轉現值」「前次移轉現值／原規定地價」與「物價指數」。"
    };
  }

  const adjustedPrior = prior * (cpi / 100);
  const incrementTotal = Math.max(0, declared - adjustedPrior - num(land.landImproveFee));

  if (incrementTotal <= 0) {
    return {
      status: "ok",
      amount: 0,
      incrementTotal: 0,
      adjustedPrior,
      multiple: 0,
      tierLabel: "無土地漲價，無須課徵",
      note: "依輸入資料，土地漲價總數額為 0，初步試算無土地增值稅。"
    };
  }

  if (land.selfUseLand) {
    return {
      status: "ok",
      amount: incrementTotal * L.selfUseRate,
      incrementTotal,
      adjustedPrior,
      multiple: incrementTotal / adjustedPrior,
      tierLabel: "自用住宅用地 10%",
      note:
        "已依自用住宅用地 10% 優惠稅率試算。是否真正符合一生一次／一生一屋規定，" +
        "以及超過面積上限的部分，仍應以地方稅務局核定為準。"
    };
  }

  const years = num(land.landHoldYears);
  const set =
    years >= 40 ? L.brackets.y40 : years >= 30 ? L.brackets.y30 : years >= 20 ? L.brackets.y20 : L.brackets.base;

  const multiple = incrementTotal / adjustedPrior;
  let amount: number;
  let tierLabel: string;

  if (multiple < 1) {
    amount = incrementTotal * set.t1.rate;
    tierLabel = `第一級（漲價未達 1 倍）稅率 ${(set.t1.rate * 100).toFixed(0)}%`;
  } else if (multiple < 2) {
    amount = incrementTotal * set.t2.rate - adjustedPrior * set.t2.deduct;
    tierLabel = `第二級（漲價 1～2 倍）稅率 ${(set.t2.rate * 100).toFixed(0)}%`;
  } else {
    amount = incrementTotal * set.t3.rate - adjustedPrior * set.t3.deduct;
    tierLabel = `第三級（漲價 2 倍以上）稅率 ${(set.t3.rate * 100).toFixed(0)}%`;
  }

  return {
    status: "ok",
    amount: Math.max(0, amount),
    incrementTotal,
    adjustedPrior,
    multiple,
    tierLabel: `${tierLabel}｜${set.label}`,
    note:
      "依土地稅法累進稅率速算公式初步試算，實際應納稅額仍以地方稅務局核定為準。"
  };
}

/* ══════════════════════ 三、取得成本與出售費用 ══════════════════════ */

export function totalAcquireCost(deal: Deal, cost: Cost): number {
  const items = Object.values(cost) as ProofItem[];
  return num(deal.acquirePrice) + items.reduce((s, it) => s + num(it.amount), 0);
}

export type SellExpenseResult = {
  /** 可用於稅務減除的費用 */
  deductible: number;
  actual: number;
  standard: number;
  usedStandard: boolean;
  note: string;
};

export function calcSellExpense(sellPrice: number, e: SellExpense): SellExpenseResult {
  const S = TAX_RULES.expenseStandard;
  const actual =
    num(e.sellAgentFee) + num(e.advertising) + num(e.cleaning) + num(e.moving) + num(e.otherExpense);
  const standard = Math.min(num(sellPrice) * S.rate, S.cap);

  if (!e.useActual || !e.hasProof || actual <= 0) {
    return {
      deductible: standard,
      actual,
      standard,
      usedStandard: true,
      note:
        "未提示合法支付證明，依現行核定標準按成交價額 3% 計算（上限 30 萬元）。" +
        "留好單據通常可以扣得更多。"
    };
  }

  if (actual < standard) {
    return {
      deductible: standard,
      actual,
      standard,
      usedStandard: true,
      note:
        "你提示的費用金額未達成交價額 3%，依現行規定得按成交價額 3% 計算（上限 30 萬元），" +
        "本次採較有利的核定標準試算。"
    };
  }

  return {
    deductible: actual,
    actual,
    standard,
    usedStandard: false,
    note: "以實際且有合法支付證明的費用核實減除（未與核定標準重複扣除）。"
  };
}

/* ══════════════════════ 四、房地合一所得稅 ══════════════════════ */

export type SelfUseResult = { qualified: boolean; missing: string[] };

export function checkSelfUse(s: SelfUseIncome): SelfUseResult {
  const missing: string[] = [];
  for (const c of TAX_RULES.selfUseIncomeTax.checks) {
    if (!s[c.key as keyof SelfUseIncome]) missing.push(c.label);
  }
  return { qualified: missing.length === 0, missing };
}

export type HouseLandTaxResult = {
  status: "ok" | "loss" | "insufficient";
  /** 房地交易所得（成交價 － 成本 － 費用） */
  tradeIncome: number;
  /** 得減除之土地漲價總數額 */
  landIncrementDeduct: number;
  landDeductCapped: boolean;
  /** 課稅所得 */
  taxableIncome: number;
  rate: number;
  rateLabel: string;
  months: number;
  selfUseApplied: boolean;
  tax: number;
  notes: string[];
};

export function calcHouseLandTax(input: Input, sellPrice: number, landRes: LandTaxResult): HouseLandTaxResult {
  const notes: string[] = [];
  const { basic, deal, cost, sellExpense, land } = input;

  const acqForHolding =
    deal.countPriorHolding && deal.priorOwnerAcquireDate ? deal.priorOwnerAcquireDate : deal.acquireDate;
  const months = monthsBetween(acqForHolding, deal.sellDate) ?? 0;

  if (deal.countPriorHolding && deal.priorOwnerAcquireDate) {
    notes.push("持有期間已依你的設定併計前手（被繼承人／贈與人／配偶）持有期間。");
  }

  const acquireCost = totalAcquireCost(deal, cost);
  const expenseRes = calcSellExpense(sellPrice, sellExpense);
  const tradeIncome = sellPrice - acquireCost - expenseRes.deductible;

  // 得減除之土地漲價總數額
  let landDeduct = landRes.status === "ok" ? landRes.incrementTotal : 0;
  let landDeductCapped = false;
  if (landRes.status !== "ok") {
    notes.push(
      "目前沒有足夠土地資料計算「土地漲價總數額」，本次未在房地合一課稅所得中減除該項，" +
      "實際稅額可能低於此處試算值。"
    );
  } else if (input.mode === "advanced" && num(land.landAnnouncedValue) > 0 && num(land.priorValue) > 0) {
    const cap = Math.max(0, num(land.landAnnouncedValue) - num(land.priorValue));
    if (landDeduct > cap) {
      landDeduct = cap;
      landDeductCapped = true;
      notes.push(
        "依房地合一 2.0 規定，得減除之土地漲價總數額以「本次公告土地現值總額減除前次移轉現值總額」為限，已套用上限。"
      );
    }
  }

  if (tradeIncome <= 0) {
    return {
      status: "loss",
      tradeIncome,
      landIncrementDeduct: 0,
      landDeductCapped: false,
      taxableIncome: 0,
      rate: 0,
      rateLabel: "交易損失，無應納稅額",
      months,
      selfUseApplied: false,
      tax: 0,
      notes: [
        ...notes,
        "依目前輸入資料為交易損失，初步試算無房地合一應納稅額；" +
        "交易損失依規定得自交易日以後 3 年內之房地交易所得中扣除，仍應依規定申報。"
      ]
    };
  }

  const taxableIncome = Math.max(0, tradeIncome - landDeduct - Math.max(0, num(input.priorYearLoss)));

  // 稅率
  const regime = judgeRegime(basic, deal);
  const table =
    regime.version === "v1" ? TAX_RULES.houseLandRates.v1 : TAX_RULES.houseLandRates.v2;
  const brackets = basic.residency === "resident" ? table.resident : table.nonResident;
  const bracket = pickBracket(brackets, months);

  let rate = bracket.rate;
  let rateLabel = `${bracket.label}，適用稅率 ${(rate * 100).toFixed(0)}%`;

  if (input.specialRate20) {
    rate = TAX_RULES.houseLandRates.special.rate;
    rateLabel = `${TAX_RULES.houseLandRates.special.label}（依你勾選的特殊情形）`;
    notes.push("你已勾選符合特殊情形，是否真正適用 20% 優惠稅率，仍須由國稅局依個案認定。");
  }

  const selfUse = checkSelfUse(input.selfUse);
  const SU = TAX_RULES.selfUseIncomeTax;

  let tax: number;
  let selfUseApplied = false;

  if (selfUse.qualified) {
    selfUseApplied = true;
    tax = Math.max(0, taxableIncome - SU.exemptIncome) * SU.rate;
    notes.push(
      `依目前輸入資料，你「可能」符合自住房地優惠：課稅所得 ${toWan(SU.exemptIncome)} 萬元以內免稅，` +
      `超過部分按 ${(SU.rate * 100).toFixed(0)}% 課徵。是否真正符合，仍須確認設籍、實際居住、出租／營業及 6 年內適用紀錄。`
    );
  } else {
    tax = taxableIncome * rate;
  }

  return {
    status: "ok",
    tradeIncome,
    landIncrementDeduct: landDeduct,
    landDeductCapped,
    taxableIncome,
    rate,
    rateLabel,
    months,
    selfUseApplied,
    tax,
    notes
  };
}

/* ══════════════════════ 五、舊制財產交易所得 ══════════════════════ */

export type LegacyTaxResult = {
  status: "ok" | "insufficient";
  houseRevenue: number;
  income: number;
  method: string;
  tax: number;
  notes: string[];
};

function highValueThreshold(city: string) {
  const T = TAX_RULES.legacyPropertyIncome.highValueThresholds;
  for (const t of T) {
    if ((t.cities as readonly string[]).includes(city)) return t;
  }
  return T[T.length - 1];
}

export function calcLegacyTax(input: Input, sellPrice: number): LegacyTaxResult {
  const L = TAX_RULES.legacyPropertyIncome;
  const g = input.legacy;
  const notes: string[] = [
    "本案可能適用舊制房屋財產交易所得：土地部分不課所得稅（已課土地增值稅），" +
    "房屋部分之財產交易所得應併入出售年度綜合所得稅申報。"
  ];

  const houseVal = num(g.houseAssessedValue);
  const landVal = num(g.landAnnouncedValue);

  if (houseVal <= 0 || landVal <= 0) {
    return {
      status: "insufficient",
      houseRevenue: 0,
      income: 0,
      method: "",
      tax: 0,
      notes: [
        ...notes,
        "目前資料不足，請補充「房屋評定現值」與「公告土地現值總額」，才能把成交價分攤出房屋部分的收入。"
      ]
    };
  }

  const ratio = houseVal / (houseVal + landVal);
  const houseRevenue = sellPrice * ratio;

  // 高總價案件判斷
  const th = highValueThreshold(input.basic.city);
  const pings = num(g.pings);
  const isHighValue =
    sellPrice >= th.total || (pings > 0 && sellPrice / pings >= th.perPing);

  if (g.path === "actual") {
    const acquireCost = totalAcquireCost(input.deal, input.cost) * ratio;
    const expense = calcSellExpense(sellPrice, input.sellExpense).deductible * ratio;
    const income = Math.max(0, houseRevenue - acquireCost - expense);
    return {
      status: "ok",
      houseRevenue,
      income,
      method: "核實計算（以房屋評定現值占公告土地現值＋房屋評定現值之比例分攤成交價、成本與費用）",
      tax: income * num(g.marginalRate),
      notes: [
        ...notes,
        "已依你輸入的成本與費用核實計算房屋部分所得，成本／費用皆按房屋比例分攤。",
        "最終稅額取決於你出售年度的全部綜合所得，此處係以你選擇的邊際稅率粗估。"
      ]
    };
  }

  if (isHighValue) {
    const income = houseRevenue * L.highValueRate;
    return {
      status: "ok",
      houseRevenue,
      income,
      method: `高總價案件：房屋收入 × ${(L.highValueRate * 100).toFixed(0)}%（${L.year}標準）`,
      tax: income * num(g.marginalRate),
      notes: [
        ...notes,
        `依 ${L.year} 財政部公告，${input.basic.city || "該地區"}房地總成交金額達 ${toWan(th.total)} 萬元` +
        `或每坪單價達 ${toWan(th.perPing)} 萬元者，屬高總價案件，按房屋收入 20% 計算所得額。`,
        "最終稅額取決於你出售年度的全部綜合所得，此處係以你選擇的邊際稅率粗估。"
      ]
    };
  }

  const pct = num(g.standardRatePct);
  if (pct <= 0) {
    return {
      status: "insufficient",
      houseRevenue,
      income: 0,
      method: "",
      tax: 0,
      notes: [
        ...notes,
        "本案非高總價案件，若無法提示成本證明，需依財政部公告之各縣市／各行政區比率，" +
        "以「房屋評定現值 × 該比率」計算所得額。該比率必須查閱當年度公告，本工具不代為推估，" +
        "請補充比率或改用「有成本證明」路徑。"
      ]
    };
  }

  const income = houseVal * (pct / 100);
  return {
    status: "ok",
    houseRevenue,
    income,
    method: `推計：房屋評定現值 × ${pct}%（${L.year}財政部公告之地區比率，由你輸入）`,
    tax: income * num(g.marginalRate),
    notes: [
      ...notes,
      "此處採用你輸入的公告比率計算，請確認比率與該房屋所在行政區之公告一致。",
      "最終稅額取決於你出售年度的全部綜合所得，此處係以你選擇的邊際稅率粗估。"
    ]
  };
}

/* ══════════════════════ 六、交易成本與實拿 ══════════════════════ */

export function calcAgentFee(sellPrice: number, a: AgentFee): number {
  return a.mode === "amount" ? Math.max(0, num(a.amount)) : Math.max(0, sellPrice * (num(a.rate) / 100));
}

export function calcEscrowFee(sellPrice: number, e: Escrow): number {
  if (e.status !== "yes") return 0;
  if (e.overrideAmount !== null && e.overrideAmount >= 0) return num(e.overrideAmount);
  return Math.max(0, sellPrice * num(e.rate));
}

export function totalAdmin(a: AdminFees): number {
  return Object.values(a).reduce((s, v) => s + Math.max(0, num(v)), 0);
}

export function totalSettlement(s: Settlement, enabled: boolean): number {
  if (!enabled) return 0;
  return Object.values(s).reduce((sum, v) => sum + num(v), 0);
}

export function totalOther(o: OtherCosts): number {
  return Object.values(o).reduce((s, v) => s + (v.on ? Math.max(0, num(v.amount)) : 0), 0);
}

export type Breakdown = {
  sellPrice: number;
  /* 政府稅負 */
  landIncrementTax: number;
  incomeTax: number;
  incomeTaxLabel: string;
  govTotal: number;
  /* 交易服務成本 */
  agentFee: number;
  escrowFee: number;
  adminFee: number;
  serviceTotal: number;
  /* 財務成本 */
  remainingLoan: number;
  prepayPenalty: number;
  financeTotal: number;
  /* 交屋結算 */
  settlement: number;
  /* 其他 */
  other: number;
  /* 合計 */
  totalDeduction: number;
  netProceeds: number;
};

export type Result = {
  regime: RegimeResult;
  months: number;
  holdingLabel: string;
  land: LandTaxResult;
  houseLand: HouseLandTaxResult | null;
  legacy: LegacyTaxResult | null;
  expense: SellExpenseResult;
  selfUse: SelfUseResult;
  acquireCost: number;
  breakdown: Breakdown;
  warnings: string[];
  /** 有哪些項目因資料不足未計入 */
  uncounted: string[];
};

export function compute(input: Input, overridePrice?: number): Result {
  const sellPrice = Math.max(0, num(overridePrice ?? input.deal.sellPrice));
  const warnings: string[] = [];
  const uncounted: string[] = [];

  const regime = judgeRegime(input.basic, input.deal);
  const land = calcLandIncrementTax(input.land);
  const expense = calcSellExpense(sellPrice, input.sellExpense);
  const selfUse = checkSelfUse(input.selfUse);
  const acquireCost = totalAcquireCost(input.deal, input.cost);

  if (land.status === "insufficient") uncounted.push("土地增值稅");

  let houseLand: HouseLandTaxResult | null = null;
  let legacy: LegacyTaxResult | null = null;
  let incomeTax = 0;
  let incomeTaxLabel = "所得稅";

  if (regime.regime === "houseLand") {
    houseLand = calcHouseLandTax(input, sellPrice, land);
    incomeTax = houseLand.tax;
    incomeTaxLabel = "房地合一所得稅";
  } else if (regime.regime === "legacy") {
    legacy = calcLegacyTax(input, sellPrice);
    incomeTax = legacy.tax;
    incomeTaxLabel = "舊制財產交易所得稅（併入綜所稅）";
    if (legacy.status === "insufficient") uncounted.push("舊制房屋財產交易所得稅");
  } else {
    uncounted.push("所得稅（尚未輸入取得／出售日期）");
  }

  const agentFee = calcAgentFee(sellPrice, input.agent);
  const escrowFee = calcEscrowFee(sellPrice, input.escrow);
  const adminFee = totalAdmin(input.admin);
  const remainingLoan = Math.max(0, num(input.financing.remainingLoan));
  const prepayPenalty =
    input.financing.prepayPenaltyKnown === "yes" ? Math.max(0, num(input.financing.prepayPenalty)) : 0;
  if (input.financing.prepayPenaltyKnown === "unknown") uncounted.push("房貸提前清償違約金");
  if (input.escrow.status === "undecided") uncounted.push("履約保證費（尚未確定是否使用）");

  const settlement = totalSettlement(input.settlement, input.settlementEnabled);
  const other = totalOther(input.other);

  const govTotal = land.amount + incomeTax;
  const serviceTotal = agentFee + escrowFee + adminFee;
  const financeTotal = remainingLoan + prepayPenalty;
  const totalDeduction = govTotal + serviceTotal + financeTotal + settlement + other;
  const netProceeds = sellPrice - totalDeduction;

  if (input.basic.sellerKind === "company") {
    warnings.push(
      "法人交易涉及營利事業所得稅、營業稅等不同規定，本工具的自然人公式不適用，" +
      "請另外進入法人模式或洽會計師評估。"
    );
  }
  if (netProceeds < 0) {
    warnings.push(
      "注意：依目前資料，出售價款可能不足以清償房貸及相關稅費，" +
      "建議在簽約前先向銀行確認清償金額與資金缺口。"
    );
  }
  if (regime.needsManualCheck) warnings.push(regime.manualNote);

  return {
    regime,
    months: houseLand?.months ?? (monthsBetween(input.deal.acquireDate, input.deal.sellDate) ?? 0),
    holdingLabel: holdingText(
      houseLand?.months ?? (monthsBetween(input.deal.acquireDate, input.deal.sellDate) ?? 0)
    ),
    land,
    houseLand,
    legacy,
    expense,
    selfUse,
    acquireCost,
    breakdown: {
      sellPrice,
      landIncrementTax: land.amount,
      incomeTax,
      incomeTaxLabel,
      govTotal,
      agentFee,
      escrowFee,
      adminFee,
      serviceTotal,
      remainingLoan,
      prepayPenalty,
      financeTotal,
      settlement,
      other,
      totalDeduction,
      netProceeds
    },
    warnings,
    uncounted
  };
}

/* ══════════════════════ 七、賣價情境模擬 ══════════════════════ */

export type Scenario = { price: number; net: number; tax: number; diff: number };

export function scenarios(input: Input, prices: number[]): Scenario[] {
  const base = compute(input).breakdown.netProceeds;
  return prices
    .filter((p) => p > 0)
    .sort((a, b) => a - b)
    .map((price) => {
      const r = compute(input, price);
      return {
        price,
        net: r.breakdown.netProceeds,
        tax: r.breakdown.govTotal,
        diff: r.breakdown.netProceeds - base
      };
    });
}

export function defaultScenarioPrices(sellPrice: number): number[] {
  const step = 500_000;
  return [sellPrice - step * 2, sellPrice - step, sellPrice, sellPrice + step, sellPrice + step * 2].filter(
    (p) => p > 0
  );
}

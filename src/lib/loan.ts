/**
 * 購屋能力試算核心邏輯（純函式，不含 UI）
 *
 * 設計原則：銀行看的是「借得到多少」，這裡同時算「買下去會不會太硬」。
 * 所有門檻都是建議值，不是任何銀行的正式標準。
 */

/* ------------------------------------------------------------------ 格式化 */

const NF = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 });

/** 12345 → "12,345" */
export function num(n: number): string {
  return NF.format(Math.round(n || 0));
}

/** 12345 → "NT$ 12,345" */
export function money(n: number): string {
  return `NT$ ${num(n)}`;
}

/** 元 → 萬（帶一位小數，整數則不顯示小數） */
export function toWan(yuan: number): string {
  const w = (yuan || 0) / 10000;
  if (Math.abs(w) >= 100) return NF.format(Math.round(w));
  return (Math.round(w * 10) / 10).toString();
}

/* -------------------------------------------------------------- 型別定義 */

export type Basic = {
  age: number;
  married: boolean;
  jointApply: boolean;
  hasChildren: boolean;
  childCount: number;
  occupation: string;
  jobYears: number;
  city: string;
  selfEmployed: boolean;
  hasPayrollTransfer: boolean;
  /** 這是名下第幾戶房貸：1 / 2 / 3（3 代表三戶以上） */
  houseOrder: 1 | 2 | 3;
  /** 既有房貸是否仍在繳款中 */
  existingMortgageActive: boolean;
  /** 這次購屋是否為自住 */
  ownerOccupied: boolean;
};

export type Income = {
  selfSalary: number;
  spouseSalary: number;
  bonusMonthly: number;
  yearEndBonus: number;
  rent: number;
  dividend: number;
  other: number;
};

export type IncomeRatios = {
  selfSalary: number;
  spouseSalary: number;
  bonusMonthly: number;
  yearEndBonus: number;
  rent: number;
  dividend: number;
  other: number;
};

export type Debts = {
  credit: number;
  car: number;
  student: number;
  card: number;
  mortgage: number;
  otherDebt: number;
};

export type Living = {
  daily: number;
  support: number;
  insurance: number;
  otherFixed: number;
};

export type Purchase = {
  /** 房屋總價，單位：萬 */
  price: number;
  /** 貸款成數 % */
  ltv: number;
  /** 年利率 % */
  rate: number;
  /** 貸款年限 */
  years: number;
  useGrace: boolean;
  graceYears: number;
  /** 可動用自備款，單位：萬 */
  cash: number;
  /** 預留裝潢／家具費，單位：萬 */
  renovation: number;
  /** 緊急預備金要留幾個月家庭支出 */
  emergencyMonths: number;
};

export type Level = "green" | "yellow" | "orange" | "red";

/* ------------------------------------------------------------ 預設認列比例 */

/**
 * 銀行不會把自報收入全額採計，穩定度越低折得越兇。
 * 這裡給的是常見概估值，實際依各銀行與申請人條件而定。
 */
export function defaultRatios(basic: Pick<Basic, "selfEmployed" | "hasPayrollTransfer">): IncomeRatios {
  const salary = basic.selfEmployed ? 70 : basic.hasPayrollTransfer ? 100 : 80;
  return {
    selfSalary: salary,
    spouseSalary: 100,
    bonusMonthly: 70,
    yearEndBonus: 60,
    rent: 70,
    dividend: 65,
    other: 60
  };
}

/* ---------------------------------------------------------------- 收入彙總 */

/** 家庭實際入袋的月收入（不打折，用來算生活壓力） */
export function rawMonthlyIncome(inc: Income, joint: boolean): number {
  return (
    inc.selfSalary +
    (joint ? inc.spouseSalary : 0) +
    inc.bonusMonthly +
    inc.yearEndBonus / 12 +
    inc.rent +
    inc.dividend +
    inc.other
  );
}

/** 銀行認列後的月收入（打折，用來算核貸機率） */
export function recognizedMonthlyIncome(inc: Income, r: IncomeRatios, joint: boolean): number {
  return (
    (inc.selfSalary * r.selfSalary) / 100 +
    (joint ? (inc.spouseSalary * r.spouseSalary) / 100 : 0) +
    (inc.bonusMonthly * r.bonusMonthly) / 100 +
    ((inc.yearEndBonus / 12) * r.yearEndBonus) / 100 +
    (inc.rent * r.rent) / 100 +
    (inc.dividend * r.dividend) / 100 +
    (inc.other * r.other) / 100
  );
}

export function totalDebts(d: Debts): number {
  return d.credit + d.car + d.student + d.card + d.mortgage + d.otherDebt;
}

export function totalLiving(l: Living): number {
  return l.daily + l.support + l.insurance + l.otherFixed;
}

/* ------------------------------------------------------------------ 房貸 */

/** 本息平均攤還月付金（PMT） */
export function pmt(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const i = annualRatePct / 100 / 12;
  if (i === 0) return principal / months;
  return (principal * i) / (1 - Math.pow(1 + i, -months));
}

/** 由可負擔月付反推最高本金 */
export function principalFromPayment(payment: number, annualRatePct: number, years: number): number {
  if (payment <= 0 || years <= 0) return 0;
  const i = annualRatePct / 100 / 12;
  const n = years * 12;
  if (i === 0) return payment * n;
  return (payment * (1 - Math.pow(1 + i, -n))) / i;
}

export type LoanResult = {
  principal: number;
  /** 寬限期內每月只繳息 */
  gracePayment: number;
  /** 寬限期結束後的月付金（沒有寬限期時就是正常月付） */
  normalPayment: number;
  totalInterest: number;
  totalPaid: number;
  graceMonths: number;
};

export function calcLoan(p: Purchase): LoanResult {
  const priceYuan = p.price * 10000;
  const principal = Math.round((priceYuan * p.ltv) / 100);
  const totalMonths = p.years * 12;
  const graceMonths = p.useGrace ? Math.min(p.graceYears * 12, Math.max(totalMonths - 12, 0)) : 0;
  const repayMonths = totalMonths - graceMonths;

  if (principal <= 0 || repayMonths <= 0) {
    return { principal: Math.max(principal, 0), gracePayment: 0, normalPayment: 0, totalInterest: 0, totalPaid: 0, graceMonths };
  }

  const i = p.rate / 100 / 12;
  const gracePayment = Math.round(principal * i);
  const normalPayment = Math.round(pmt(principal, p.rate, repayMonths));
  const totalPaid = gracePayment * graceMonths + normalPayment * repayMonths;

  return {
    principal,
    gracePayment,
    normalPayment,
    totalInterest: totalPaid - principal,
    totalPaid,
    graceMonths
  };
}

/* ------------------------------------------------------- 交屋前要準備的錢 */

export type FeeItem = {
  key: string;
  label: string;
  note: string;
  amount: number;
};

/**
 * 買房不是只有頭期款。以下稅費為概估值，實際依物件、地區、銀行方案而異，
 * 使用者可自行修改每一項金額。
 */
export function defaultFees(args: {
  priceYuan: number;
  downPayment: number;
  principal: number;
  monthlyOutgo: number;
  renovationYuan: number;
  emergencyMonths: number;
}): FeeItem[] {
  const { priceYuan, downPayment, principal, monthlyOutgo, renovationYuan, emergencyMonths } = args;
  return [
    { key: "down", label: "頭期款", note: "總價 − 貸款金額", amount: Math.max(downPayment, 0) },
    { key: "deed", label: "契稅", note: "以房屋評定現值概估，約總價 0.6%", amount: priceYuan * 0.006 },
    {
      key: "stamp",
      label: "印花稅",
      note: "稅率 0.1%，稅基為公告土地現值＋房屋評定現值，此處以總價概估",
      amount: priceYuan * 0.001
    },
    { key: "register", label: "登記規費", note: "約總價 0.1%～0.2%，此處抓 0.1%", amount: priceYuan * 0.001 },
    { key: "scrivener", label: "代書費", note: "買賣過戶＋設定，概估定額", amount: 25000 },
    { key: "agency", label: "仲介服務費", note: "買方常見約總價 1~2%，此處抓 2%", amount: priceYuan * 0.02 },
    { key: "setup", label: "房貸設定相關費用", note: "設定規費＋開辦費概估", amount: principal * 0.0012 + 8000 },
    { key: "renovation", label: "裝潢／家具預備金", note: "由你自己填", amount: renovationYuan },
    {
      key: "emergency",
      label: "緊急預備金",
      note: `家庭每月總支出 × ${emergencyMonths} 個月`,
      amount: monthlyOutgo * emergencyMonths
    }
  ];
}

/* ---------------------------------------------------------------- 收支比 */

/** 銀行版：只看銀行看得到的負債，分母是認列後收入 */
export function bankDti(debtPayments: number, newMortgage: number, recognizedIncome: number): number {
  if (recognizedIncome <= 0) return 0;
  return ((debtPayments + newMortgage) / recognizedIncome) * 100;
}

/** 生活版：加上生活支出，分母是實際入袋收入 */
export function lifeDti(
  debtPayments: number,
  living: number,
  newMortgage: number,
  rawIncome: number
): number {
  if (rawIncome <= 0) return 0;
  return ((debtPayments + living + newMortgage) / rawIncome) * 100;
}

/**
 * 建議值分級，不是銀行的正式標準。
 * 採保守抓法：40% 以內相對安全、40~50% 偏緊、超過 50% 就要當心。
 */
export function bankLevel(dti: number): Level {
  if (dti <= 40) return "green";
  if (dti <= 50) return "yellow";
  if (dti <= 60) return "orange";
  return "red";
}

/**
 * 生活版的分母含生活費，門檻要另外抓——重點看「扣完還剩幾成」：
 * 剩 25% 以上算輕鬆、剩 15% 以上還可以、剩 5% 以上已經很緊、幾乎沒剩就是紅燈。
 */
export function lifeLevel(dti: number): Level {
  if (dti <= 75) return "green";
  if (dti <= 85) return "yellow";
  if (dti <= 95) return "orange";
  return "red";
}

/* ------------------------------------------------------------ 建議成數區間 */

export type LtvRange = {
  low: number;
  high: number;
  note: string;
  /** 央行規定的成數上限（%），無明文上限時為 null */
  regCap: number | null;
  /** 央行是否規定不得有寬限期 */
  graceBanned: boolean;
};

/**
 * 依名下第幾戶給「區間」而不是固定數字。
 *
 * 法規錨點：央行 115.3.19 理監事會決議、115.3.20 生效之
 * 「中央銀行對金融機構辦理不動產抵押貸款業務規定」——
 * 第 2 戶最高 6 成且無寬限期、第 3 戶以上最高 3 成且無寬限期。
 * 區間下緣則是市場實務的保守抓法，實際仍依銀行政策與個人條件而定。
 */
export function suggestedLtv(order: 1 | 2 | 3, ownerOccupied: boolean): LtvRange {
  if (order === 1) {
    return {
      low: 70,
      high: 80,
      note: "第一戶自住條件最好，體質好有機會到 8 成，但不是保證。",
      regCap: null,
      graceBanned: false
    };
  }
  if (order === 2) {
    return {
      low: 50,
      high: 60,
      note: ownerOccupied
        ? "央行規定第 2 戶最高 6 成，且不得有寬限期（115.3.20 起）。"
        : "非自住會被抓得更緊，央行對第 2 戶的上限是 6 成，且不得有寬限期。",
      regCap: 60,
      graceBanned: true
    };
  }
  return {
    low: 25,
    high: 30,
    note: "央行規定第 3 戶以上最高 3 成，且不得有寬限期，部分銀行甚至不承作。",
    regCap: 30,
    graceBanned: true
  };
}

const LEVEL_ORDER: Level[] = ["green", "yellow", "orange", "red"];

export function worseLevel(a: Level, b: Level): Level {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

export function downgrade(level: Level, steps = 1): Level {
  const idx = Math.min(LEVEL_ORDER.indexOf(level) + steps, LEVEL_ORDER.length - 1);
  return LEVEL_ORDER[idx];
}

export const LEVEL_TEXT: Record<Level, { tag: string; desc: string }> = {
  green: {
    tag: "相對輕鬆",
    desc: "房貸與固定支出佔比合理，扣完之後仍有生活與儲蓄的空間。"
  },
  yellow: {
    tag: "可以，但要控制支出",
    desc: "購屋能力還在，但生活彈性開始變小，突發支出的緩衝不多。"
  },
  orange: {
    tag: "偏緊",
    desc: "建議降低總價、增加自備款或延長年限，先把每月壓力拉下來。"
  },
  red: {
    tag: "壓力過高",
    desc: "就算銀行願意貸，這個負擔水位也可能明顯影響生活品質與風險承受度。"
  }
};

/* ------------------------------------------------------------ 反推可買總價 */

/** 反推時用的雜費概估：稅費＋仲介＋代書，約總價 2.8% 再加固定 3.3 萬 */
const MISC_RATE = 0.028;
const MISC_FIXED = 33000;

function priceCapFromIncome(args: {
  recognizedIncome: number;
  rawIncome: number;
  debtPayments: number;
  living: number;
  targetBank: number;
  targetLife: number;
  rate: number;
  years: number;
  ltv: number;
}): number {
  const bankCap = (args.recognizedIncome * args.targetBank) / 100 - args.debtPayments;
  const lifeCap = (args.rawIncome * args.targetLife) / 100 - args.debtPayments - args.living;
  const affordable = Math.min(bankCap, lifeCap);
  if (affordable <= 0) return 0;
  const principal = principalFromPayment(affordable, args.rate, args.years);
  return args.ltv > 0 ? principal / (args.ltv / 100) : 0;
}

function priceCapFromCash(cashYuan: number, reservesYuan: number, ltv: number): number {
  const usable = cashYuan - reservesYuan;
  if (usable <= 0) return 0;
  const downRate = 1 - ltv / 100;
  const denom = downRate + MISC_RATE;
  if (denom <= 0) return 0;
  return Math.max((usable - MISC_FIXED) / denom, 0);
}

export type PriceBands = {
  /** 單位皆為「萬」 */
  comfortLow: number;
  comfortHigh: number;
  okHigh: number;
  /** 自備款算得出來的天花板（萬）；若收入才是瓶頸則為 null */
  cashCapped: boolean;
};

export function affordablePriceBands(args: {
  recognizedIncome: number;
  rawIncome: number;
  debtPayments: number;
  living: number;
  rate: number;
  years: number;
  ltv: number;
  cashYuan: number;
  reservesYuan: number;
}): PriceBands {
  // 舒適＝生活版壓在 75%（扣完還剩 25%）、可接受＝85%（還剩 15%）
  const comfort = priceCapFromIncome({ ...args, targetBank: 40, targetLife: 75 });
  const ok = priceCapFromIncome({ ...args, targetBank: 50, targetLife: 85 });
  const cashCap = priceCapFromCash(args.cashYuan, args.reservesYuan, args.ltv);

  const comfortCapped = Math.min(comfort, cashCap);
  const okCapped = Math.min(ok, cashCap);

  return {
    comfortLow: Math.max(comfortCapped * 0.85, 0) / 10000,
    comfortHigh: Math.max(comfortCapped, 0) / 10000,
    okHigh: Math.max(okCapped, 0) / 10000,
    cashCapped: cashCap < ok && cashCap > 0
  };
}

/* ---------------------------------------------------------- 利率壓力測試 */

export type StressRow = {
  label: string;
  rate: number;
  payment: number;
  deltaMonth: number;
  deltaYear: number;
};

export function rateStress(p: Purchase, base: LoanResult): StressRow[] {
  const repayMonths = p.years * 12 - base.graceMonths;
  return [0, 0.5, 1].map((bump) => {
    const rate = p.rate + bump;
    const payment = Math.round(pmt(base.principal, rate, repayMonths));
    return {
      label: bump === 0 ? "目前利率" : `＋${bump}%`,
      rate,
      payment,
      deltaMonth: payment - base.normalPayment,
      deltaYear: (payment - base.normalPayment) * 12
    };
  });
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Basic,
  type Debts,
  type FeeItem,
  type Income,
  type IncomeRatios,
  type Level,
  type Living,
  type Purchase,
  LEVEL_TEXT,
  affordablePriceBands,
  bankDti,
  bankLevel,
  calcLoan,
  defaultFees,
  defaultRatios,
  lifeDti,
  lifeLevel,
  money,
  num,
  rateStress,
  rawMonthlyIncome,
  recognizedMonthlyIncome,
  suggestedLtv,
  toWan,
  totalDebts,
  totalLiving
} from "@/lib/loan";
import { advice, assess } from "@/lib/loan-advice";

/* --------------------------------------------------------------- 初始值 */

const INIT_BASIC: Basic = {
  age: 35,
  married: false,
  jointApply: false,
  hasChildren: false,
  childCount: 1,
  occupation: "",
  jobYears: 3,
  city: "",
  selfEmployed: false,
  hasPayrollTransfer: true,
  houseOrder: 1,
  existingMortgageActive: false,
  ownerOccupied: true
};

const CITIES = [
  "高雄市", "屏東縣", "台南市", "台中市", "台北市", "新北市", "桃園市",
  "基隆市", "新竹市", "新竹縣", "苗栗縣", "彰化縣", "南投縣", "雲林縣",
  "嘉義市", "嘉義縣", "宜蘭縣", "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣"
];

const INIT_INCOME: Income = {
  selfSalary: 60000,
  spouseSalary: 0,
  bonusMonthly: 0,
  yearEndBonus: 0,
  rent: 0,
  dividend: 0,
  other: 0
};

const INIT_DEBTS: Debts = { credit: 0, car: 0, student: 0, card: 0, mortgage: 0, otherDebt: 0 };

const INIT_LIVING: Living = { daily: 25000, support: 0, insurance: 3000, otherFixed: 0 };

const INIT_PURCHASE: Purchase = {
  price: 1000,
  ltv: 80,
  rate: 2.3,
  years: 30,
  useGrace: false,
  graceYears: 3,
  cash: 300,
  renovation: 50,
  emergencyMonths: 6
};

/* ------------------------------------------------------------ 小工具元件 */

/** 數字輸入框：內部保留字串緩衝，才能正常輸入小數點 */
function NumInput({
  value,
  onChange,
  suffix,
  placeholder,
  max
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  placeholder?: string;
  max?: number;
}) {
  const [buf, setBuf] = useState(value ? String(value) : "");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setBuf(value ? String(value) : "");
  }, [value, focused]);

  return (
    <div className="pa-input">
      <input
        type="text"
        inputMode="decimal"
        value={buf}
        placeholder={placeholder ?? "0"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const t = e.target.value;
          if (t !== "" && !/^\d*\.?\d*$/.test(t)) return;
          setBuf(t);
          const n = t === "" ? 0 : Number(t);
          if (!Number.isNaN(n)) onChange(max !== undefined ? Math.min(n, max) : n);
        }}
      />
      {suffix && <span className="pa-suffix">{suffix}</span>}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="pa-row">
      <div className="pa-row-label">
        <span>{label}</span>
        {hint && <em>{hint}</em>}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string | number | boolean>({
  value,
  onChange,
  options
}: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="pa-seg">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          className={value === o.value ? "on" : ""}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function RatioSlider({
  label,
  value,
  onChange,
  min,
  max
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="pa-ratio">
      <div className="pa-ratio-head">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Card({
  step,
  title,
  desc,
  children
}: {
  step: string;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pa-card">
      <header className="pa-card-head">
        <span className="pa-step">{step}</span>
        <div>
          <h3>{title}</h3>
          {desc && <p>{desc}</p>}
        </div>
      </header>
      <div className="pa-card-body">{children}</div>
    </section>
  );
}

function DtiBar({ label, dti, level, note }: { label: string; dti: number; level: Level; note: string }) {
  return (
    <div className="pa-dti">
      <div className="pa-dti-head">
        <span>{label}</span>
        <strong className={`lv-${level}`}>{dti.toFixed(0)}%</strong>
      </div>
      <div className="pa-dti-track">
        <div className={`pa-dti-fill lv-${level}`} style={{ width: `${Math.min(dti, 100)}%` }} />
      </div>
      <p>{note}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ 主體 */

export default function PurchaseAdvisor({ contactHref }: { contactHref: string }) {
  const [basic, setBasic] = useState<Basic>(INIT_BASIC);
  const [income, setIncome] = useState<Income>(INIT_INCOME);
  const [ratios, setRatios] = useState<IncomeRatios>(defaultRatios(INIT_BASIC));
  const [ratiosTouched, setRatiosTouched] = useState(false);
  const [debts, setDebts] = useState<Debts>(INIT_DEBTS);
  const [living, setLiving] = useState<Living>(INIT_LIVING);
  const [purchase, setPurchase] = useState<Purchase>(INIT_PURCHASE);
  const [feeOn, setFeeOn] = useState<Record<string, boolean>>({});
  const [feeEdit, setFeeEdit] = useState<Record<string, number>>({});
  const [showRatios, setShowRatios] = useState(false);

  // 第 2 戶以上央行規定不得有寬限期，切過去時直接關掉，避免算出不可能的月付
  useEffect(() => {
    if (basic.houseOrder >= 2) setPurchase((s) => (s.useGrace ? { ...s, useGrace: false } : s));
  }, [basic.houseOrder]);

  // 職業型態改變時，若使用者沒手動調過比例就跟著更新預設值
  useEffect(() => {
    if (!ratiosTouched) {
      setRatios(defaultRatios({ selfEmployed: basic.selfEmployed, hasPayrollTransfer: basic.hasPayrollTransfer }));
    }
  }, [basic.selfEmployed, basic.hasPayrollTransfer, ratiosTouched]);

  const setB = <K extends keyof Basic>(k: K, v: Basic[K]) => setBasic((s) => ({ ...s, [k]: v }));
  const setI = (k: keyof Income, v: number) => setIncome((s) => ({ ...s, [k]: v }));
  const setD = (k: keyof Debts, v: number) => setDebts((s) => ({ ...s, [k]: v }));
  const setL = (k: keyof Living, v: number) => setLiving((s) => ({ ...s, [k]: v }));
  const setP = <K extends keyof Purchase>(k: K, v: Purchase[K]) => setPurchase((s) => ({ ...s, [k]: v }));
  const setR = (k: keyof IncomeRatios, v: number) => {
    setRatiosTouched(true);
    setRatios((s) => ({ ...s, [k]: v }));
  };

  const reset = () => {
    setBasic(INIT_BASIC);
    setIncome(INIT_INCOME);
    setRatios(defaultRatios(INIT_BASIC));
    setRatiosTouched(false);
    setDebts(INIT_DEBTS);
    setLiving(INIT_LIVING);
    setPurchase(INIT_PURCHASE);
    setFeeOn({});
    setFeeEdit({});
  };

  /* ------------------------------------------------------------ 計算 */

  const r = useMemo(() => {
    const joint = basic.married && basic.jointApply;
    const raw = rawMonthlyIncome(income, joint);
    const recognized = recognizedMonthlyIncome(income, ratios, joint);
    const debtPayments = totalDebts(debts);
    const livingTotal = totalLiving(living);
    const loan = calcLoan(purchase);
    const priceYuan = purchase.price * 10000;
    const downPayment = priceYuan - loan.principal;
    const monthlyOutgo = debtPayments + livingTotal + loan.normalPayment;

    const fees = defaultFees({
      priceYuan,
      downPayment,
      principal: loan.principal,
      monthlyOutgo,
      renovationYuan: purchase.renovation * 10000,
      emergencyMonths: purchase.emergencyMonths
    }).map((f): FeeItem => ({ ...f, amount: feeEdit[f.key] ?? f.amount }));

    const cashNeeded = fees.reduce((sum, f) => (feeOn[f.key] === false ? sum : sum + f.amount), 0);
    const cashAvailable = purchase.cash * 10000;

    const bDti = bankDti(debtPayments, loan.normalPayment, recognized);
    const lDti = lifeDti(debtPayments, livingTotal, loan.normalPayment, raw);
    const bank = { dti: bDti, level: bankLevel(bDti) };
    const life = { dti: lDti, level: lifeLevel(lDti) };
    const surplus = raw - debtPayments - livingTotal - loan.normalPayment;

    const stress = rateStress(purchase, loan);
    const reserves = purchase.renovation * 10000 + monthlyOutgo * purchase.emergencyMonths;
    const bands = affordablePriceBands({
      recognizedIncome: recognized,
      rawIncome: raw,
      debtPayments,
      living: livingTotal,
      rate: purchase.rate,
      years: purchase.years,
      ltv: purchase.ltv,
      cashYuan: cashAvailable,
      reservesYuan: reserves
    });

    const ltvRange = suggestedLtv(basic.houseOrder, basic.ownerOccupied);

    const input = {
      basic,
      purchase,
      loan,
      bank,
      life,
      cashNeeded,
      cashAvailable,
      surplus,
      rawIncome: raw,
      living: livingTotal,
      debtPayments,
      paymentPlus1: stress[2]?.payment ?? loan.normalPayment,
      comfortHigh: bands.comfortHigh,
      ltvRange
    };

    return {
      joint,
      raw,
      recognized,
      debtPayments,
      livingTotal,
      loan,
      downPayment,
      fees,
      cashNeeded,
      cashAvailable,
      bank,
      life,
      surplus,
      stress,
      bands,
      ltvRange,
      verdict: assess(input),
      tips: advice(input),
      emergencyFund: monthlyOutgo * purchase.emergencyMonths
    };
  }, [basic, income, ratios, debts, living, purchase, feeOn, feeEdit]);

  const lv = r.verdict.level;

  /* -------------------------------------------------------------- UI */

  return (
    <div className="pa-wrap">
      {/* ============================ 輸入 ============================ */}
      <div className="pa-forms">
        <Card step="A" title="基本資料" desc="這些會影響銀行怎麼看你的收入，以及年限能不能拉滿。">
          <div className="pa-grid-2">
            <Row label="年齡">
              <NumInput value={basic.age} onChange={(v) => setB("age", v)} suffix="歲" max={100} />
            </Row>
            <Row label="工作年資">
              <NumInput value={basic.jobYears} onChange={(v) => setB("jobYears", v)} suffix="年" max={60} />
            </Row>
          </div>

          <div className="pa-grid-2">
            <Row label="職業">
              <input
                className="pa-text"
                type="text"
                value={basic.occupation}
                placeholder="例如：工程師、餐飲業"
                onChange={(e) => setB("occupation", e.target.value)}
              />
            </Row>
            <Row label="工作縣市">
              <select
                className="pa-text"
                value={basic.city}
                onChange={(e) => setB("city", e.target.value)}
              >
                <option value="">請選擇</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Row>
          </div>

          <Row label="婚姻狀態">
            <Segmented
              value={basic.married}
              onChange={(v) => {
                setB("married", v);
                if (!v) setB("jointApply", false);
              }}
              options={[
                { label: "單身", value: false },
                { label: "已婚", value: true }
              ]}
            />
          </Row>

          {basic.married && (
            <Row label="夫妻共同負擔" hint="配偶收入與負債一起計入">
              <Segmented
                value={basic.jointApply}
                onChange={(v) => setB("jointApply", v)}
                options={[
                  { label: "否", value: false },
                  { label: "是", value: true }
                ]}
              />
            </Row>
          )}

          <Row label="有未成年子女">
            <Segmented
              value={basic.hasChildren}
              onChange={(v) => setB("hasChildren", v)}
              options={[
                { label: "沒有", value: false },
                { label: "有", value: true }
              ]}
            />
          </Row>

          {basic.hasChildren && (
            <Row label="子女人數">
              <NumInput value={basic.childCount} onChange={(v) => setB("childCount", v)} suffix="位" max={10} />
            </Row>
          )}

          <div className="pa-grid-2">
            <Row label="是否自營業">
              <Segmented
                value={basic.selfEmployed}
                onChange={(v) => setB("selfEmployed", v)}
                options={[
                  { label: "受僱", value: false },
                  { label: "自營", value: true }
                ]}
              />
            </Row>
            <Row label="有固定薪轉">
              <Segmented
                value={basic.hasPayrollTransfer}
                onChange={(v) => setB("hasPayrollTransfer", v)}
                options={[
                  { label: "沒有", value: false },
                  { label: "有", value: true }
                ]}
              />
            </Row>
          </div>
        </Card>

        <Card step="B" title="收入" desc="填實際入袋金額就好，折算交給下面的認列比例處理。">
          <Row label="本人月收入">
            <NumInput value={income.selfSalary} onChange={(v) => setI("selfSalary", v)} suffix="元／月" />
          </Row>
          {r.joint && (
            <Row label="配偶月收入">
              <NumInput value={income.spouseSalary} onChange={(v) => setI("spouseSalary", v)} suffix="元／月" />
            </Row>
          )}
          <div className="pa-grid-2">
            <Row label="固定獎金" hint="平均每月">
              <NumInput value={income.bonusMonthly} onChange={(v) => setI("bonusMonthly", v)} suffix="元／月" />
            </Row>
            <Row label="年終獎金" hint="一年總額">
              <NumInput value={income.yearEndBonus} onChange={(v) => setI("yearEndBonus", v)} suffix="元／年" />
            </Row>
            <Row label="租金收入">
              <NumInput value={income.rent} onChange={(v) => setI("rent", v)} suffix="元／月" />
            </Row>
            <Row label="股息／其他穩定收入">
              <NumInput value={income.dividend} onChange={(v) => setI("dividend", v)} suffix="元／月" />
            </Row>
          </div>
          <Row label="其他收入">
            <NumInput value={income.other} onChange={(v) => setI("other", v)} suffix="元／月" />
          </Row>

          <div className="pa-income-sum">
            <div>
              <span>家庭實際月收入</span>
              <strong>{money(r.raw)}</strong>
            </div>
            <div>
              <span>銀行認列後月收入</span>
              <strong className="accent">{money(r.recognized)}</strong>
            </div>
          </div>

          <button type="button" className="pa-toggle-link" onClick={() => setShowRatios((v) => !v)}>
            {showRatios ? "▲ 收起認列比例" : "▼ 調整收入認列比例"}
          </button>

          {showRatios && (
            <div className="pa-ratios">
              <RatioSlider label="本人薪資" value={ratios.selfSalary} onChange={(v) => setR("selfSalary", v)} min={50} max={100} />
              {r.joint && (
                <RatioSlider label="配偶薪資" value={ratios.spouseSalary} onChange={(v) => setR("spouseSalary", v)} min={50} max={100} />
              )}
              <RatioSlider label="固定獎金" value={ratios.bonusMonthly} onChange={(v) => setR("bonusMonthly", v)} min={50} max={100} />
              <RatioSlider label="年終獎金" value={ratios.yearEndBonus} onChange={(v) => setR("yearEndBonus", v)} min={0} max={100} />
              <RatioSlider label="租金收入" value={ratios.rent} onChange={(v) => setR("rent", v)} min={50} max={100} />
              <RatioSlider label="股息／其他穩定" value={ratios.dividend} onChange={(v) => setR("dividend", v)} min={0} max={100} />
              <RatioSlider label="其他收入" value={ratios.other} onChange={(v) => setR("other", v)} min={0} max={100} />
              <p className="pa-note">
                銀行實際認列比例依個別銀行與申請人條件不同，本工具僅為試算。
              </p>
            </div>
          )}
        </Card>

        <Card
          step="C"
          title="這是你的第幾戶"
          desc="這一段最關鍵。成數不是固定數字，第幾戶差很多，很多人卡的就是這裡。"
        >
          <Row label="名下第幾戶房貸">
            <Segmented<1 | 2 | 3>
              value={basic.houseOrder}
              onChange={(v) => {
                setB("houseOrder", v);
                if (v === 1) setB("existingMortgageActive", false);
              }}
              options={[
                { label: "第一戶", value: 1 },
                { label: "第二戶", value: 2 },
                { label: "第三戶以上", value: 3 }
              ]}
            />
          </Row>

          {basic.houseOrder >= 2 && (
            <Row label="既有房貸還在繳嗎">
              <Segmented
                value={basic.existingMortgageActive}
                onChange={(v) => setB("existingMortgageActive", v)}
                options={[
                  { label: "已繳清", value: false },
                  { label: "還在繳", value: true }
                ]}
              />
            </Row>
          )}

          <Row label="這次購屋用途">
            <Segmented
              value={basic.ownerOccupied}
              onChange={(v) => setB("ownerOccupied", v)}
              options={[
                { label: "自住", value: true },
                { label: "非自住", value: false }
              ]}
            />
          </Row>

          <div className="pa-ltv-hint">
            <p>
              建議先用 <strong>{r.ltvRange.low}~{r.ltvRange.high} 成</strong> 試算
            </p>
            <em>{r.ltvRange.note}實際成數會依銀行政策、收支比與信用狀況調整，不是固定數字。</em>
          </div>
        </Card>

        <Card step="D" title="現有負債" desc="這一段很多人會卡關——不是收入不夠，是負債把你卡住。銀行最在意的是你每個月要還多少。">

          <div className="pa-grid-2">
            <Row label="信貸月付">
              <NumInput value={debts.credit} onChange={(v) => setD("credit", v)} suffix="元" />
            </Row>
            <Row label="車貸月付">
              <NumInput value={debts.car} onChange={(v) => setD("car", v)} suffix="元" />
            </Row>
            <Row label="學貸月付">
              <NumInput value={debts.student} onChange={(v) => setD("student", v)} suffix="元" />
            </Row>
            <Row label="卡循／分期月付">
              <NumInput value={debts.card} onChange={(v) => setD("card", v)} suffix="元" />
            </Row>
            <Row label="既有房貸月付">
              <NumInput value={debts.mortgage} onChange={(v) => setD("mortgage", v)} suffix="元" />
            </Row>
            <Row label="其他貸款月付">
              <NumInput value={debts.otherDebt} onChange={(v) => setD("otherDebt", v)} suffix="元" />
            </Row>
          </div>
          <div className="pa-sub-sum">
            銀行看得到的負債合計 <strong>{money(r.debtPayments)}</strong>／月
          </div>
        </Card>

        <Card
          step="E"
          title="實際生活支出"
          desc="這些銀行看不到，但你每個月真的要付。銀行願意貸，不代表生活壓力就合理。"
        >
          <div className="pa-grid-2">
            <Row label="家庭固定生活費">
              <NumInput value={living.daily} onChange={(v) => setL("daily", v)} suffix="元" />
            </Row>
            <Row label="扶養費">
              <NumInput value={living.support} onChange={(v) => setL("support", v)} suffix="元" />
            </Row>
            <Row label="保險支出">
              <NumInput value={living.insurance} onChange={(v) => setL("insurance", v)} suffix="元" />
            </Row>
            <Row label="其他固定支出">
              <NumInput value={living.otherFixed} onChange={(v) => setL("otherFixed", v)} suffix="元" />
            </Row>
          </div>
          <div className="pa-sub-sum">
            生活支出合計 <strong>{money(r.livingTotal)}</strong>／月
          </div>
        </Card>

        <Card step="F" title="購屋資料" desc="想買的物件條件。改任何一個數字，右邊的評估會立刻跟著變。">
          <div className="pa-grid-2">
            <Row label="房屋總價">
              <NumInput value={purchase.price} onChange={(v) => setP("price", v)} suffix="萬" />
            </Row>
            <Row label="可動用自備款">
              <NumInput value={purchase.cash} onChange={(v) => setP("cash", v)} suffix="萬" />
            </Row>
          </div>

          <Row
            label="貸款成數"
            hint={`${purchase.ltv}%　建議 ${r.ltvRange.low}~${r.ltvRange.high} 成`}
          >
            <input
              type="range"
              className={`pa-range${purchase.ltv > r.ltvRange.high ? " over" : ""}`}
              min={10}
              max={90}
              step={5}
              value={purchase.ltv}
              onChange={(e) => setP("ltv", Number(e.target.value))}
            />
          </Row>
          {purchase.ltv > r.ltvRange.high && (
            <p className="pa-inline-warn">
              {r.ltvRange.regCap !== null
                ? `央行對這一戶的成數上限是 ${r.ltvRange.regCap / 10} 成，超過的部分銀行做不到。`
                : "超過建議區間了。成數抓太滿，自備款會突然差一大截，實際核下來多半沒這麼高。"}
            </p>
          )}

          <div className="pa-grid-2">
            <Row label="貸款利率">
              <NumInput value={purchase.rate} onChange={(v) => setP("rate", v)} suffix="%" max={20} />
            </Row>
            <Row label="貸款年限">
              <NumInput value={purchase.years} onChange={(v) => setP("years", v)} suffix="年" max={40} />
            </Row>
          </div>

          {r.ltvRange.graceBanned ? (
            <div className="pa-rule-box">
              <p>
                <strong>這一戶不能有寬限期</strong>
              </p>
              <em>
                央行規定第 {basic.houseOrder === 2 ? "2" : "3"} 戶
                {basic.houseOrder === 2 ? "" : "以上"}購屋貸款不得有寬限期（115.3.20 生效）。
                唯一的例外是「先買後賣」的實質換屋自住：與銀行切結後，需在撥款後 18 個月內
                賣掉並塗銷第 1 戶房貸，才可不受成數上限與無寬限期的限制。
              </em>
            </div>
          ) : (
            <Row label="使用寬限期" hint="只繳息、不還本">
              <Segmented
                value={purchase.useGrace}
                onChange={(v) => setP("useGrace", v)}
                options={[
                  { label: "不用", value: false },
                  { label: "要用", value: true }
                ]}
              />
            </Row>
          )}

          {purchase.useGrace && !r.ltvRange.graceBanned && (
            <Row label="寬限期年數">
              <NumInput value={purchase.graceYears} onChange={(v) => setP("graceYears", v)} suffix="年" max={10} />
            </Row>
          )}

          <div className="pa-grid-2">
            <Row label="預留裝潢／家具">
              <NumInput value={purchase.renovation} onChange={(v) => setP("renovation", v)} suffix="萬" />
            </Row>
            <Row label="緊急預備金">
              <NumInput
                value={purchase.emergencyMonths}
                onChange={(v) => setP("emergencyMonths", v)}
                suffix="個月"
                max={24}
              />
            </Row>
          </div>
        </Card>

        <Card step="G" title="交屋前要準備的現金" desc="買房不是只有頭期款。不需要的項目可以取消勾選，金額也能自己改。">
          <ul className="pa-fees">
            {r.fees.map((f) => {
              const on = feeOn[f.key] !== false;
              return (
                <li key={f.key} className={on ? "" : "off"}>
                  <label className="pa-check">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={(e) => setFeeOn((s) => ({ ...s, [f.key]: e.target.checked }))}
                    />
                    <span>
                      {f.label}
                      <em>{f.note}</em>
                    </span>
                  </label>
                  <NumInput
                    value={Math.round(f.amount)}
                    onChange={(v) => setFeeEdit((s) => ({ ...s, [f.key]: v }))}
                    suffix="元"
                  />
                </li>
              );
            })}
          </ul>
          <div className="pa-fee-total">
            <span>建議交屋前至少準備</span>
            <strong>約 {toWan(r.cashNeeded)} 萬</strong>
          </div>
          <p className="pa-note">
            稅費為概估值，實際依物件評定現值、地區與銀行方案而異。
          </p>
        </Card>

        <button type="button" className="pa-reset" onClick={reset}>
          清除，重新計算
        </button>
      </div>

      {/* ============================ 結果 ============================ */}
      <div className="pa-results">
        <div className={`pa-verdict lv-${lv}`}>
          <p className="pa-verdict-eyebrow">小飛評估</p>
          <h3>{r.verdict.headline}</h3>
          <p className="pa-verdict-desc">{LEVEL_TEXT[lv].desc}</p>
        </div>

        {/* 這間房的體檢表 */}
        <div className="pa-panel">
          <h4 className="pa-panel-title">這間房，你目前的條件對得上嗎</h4>
          <ul className="pa-check-list">
            <li className={r.cashAvailable >= r.cashNeeded ? "ok" : "bad"}>
              <span>自備款夠不夠</span>
              <strong>
                {r.cashAvailable >= r.cashNeeded
                  ? `夠，還多約 ${toWan(r.cashAvailable - r.cashNeeded)} 萬`
                  : `還差約 ${toWan(r.cashNeeded - r.cashAvailable)} 萬`}
              </strong>
            </li>
            <li className={r.surplus > 0 ? "ok" : "bad"}>
              <span>每月剩餘可支配</span>
              <strong>{money(r.surplus)}</strong>
            </li>
            <li className={feeOn["emergency"] !== false && r.cashAvailable >= r.cashNeeded ? "ok" : "warn"}>
              <span>緊急預備金</span>
              <strong>
                {feeOn["emergency"] === false
                  ? "未列入計算"
                  : `已預留 ${purchase.emergencyMonths} 個月（${toWan(r.emergencyFund)} 萬）`}
              </strong>
            </li>
          </ul>
        </div>

        {/* 主要數字 */}
        <div className="pa-panel">
          <h4 className="pa-panel-title">試算結果</h4>
          <ul className="pa-figures">
            <li>
              <span>房屋總價</span>
              <strong>{money(purchase.price * 10000)}</strong>
            </li>
            <li>
              <span>貸款金額</span>
              <strong>{money(r.loan.principal)}</strong>
            </li>
            <li>
              <span>自備款（頭期）</span>
              <strong>{money(r.downPayment)}</strong>
            </li>
            <li className="hl">
              <span>交屋前建議準備現金</span>
              <strong>{money(r.cashNeeded)}</strong>
            </li>
            <li className="big">
              <span>{purchase.useGrace ? "寬限期內月付" : "每月月付"}</span>
              <strong>{money(purchase.useGrace ? r.loan.gracePayment : r.loan.normalPayment)}</strong>
            </li>
            {purchase.useGrace && (
              <li className="big alert">
                <span>寬限期結束後月付</span>
                <strong>{money(r.loan.normalPayment)}</strong>
              </li>
            )}
            <li>
              <span>總利息</span>
              <strong>{money(r.loan.totalInterest)}</strong>
            </li>
            <li>
              <span>本息總還款</span>
              <strong>{money(r.loan.totalPaid)}</strong>
            </li>
            <li className="hl">
              <span>每月剩餘可支配所得</span>
              <strong className={r.surplus > 0 ? "" : "danger"}>{money(r.surplus)}</strong>
            </li>
          </ul>

          {purchase.useGrace && r.loan.normalPayment > r.loan.gracePayment && (
            <p className="pa-warning">
              不要只看前幾年的月付。寬限期結束後每月要繳 {money(r.loan.normalPayment)}，
              一次多出 {money(r.loan.normalPayment - r.loan.gracePayment)}，那才是你真正要承受的金額。
            </p>
          )}
        </div>

        {/* 收支比 */}
        <div className="pa-panel">
          <h4 className="pa-panel-title">兩種收支比</h4>
          <DtiBar
            label="銀行版（核貸角度）"
            dti={r.bank.dti}
            level={r.bank.level}
            note={`貸款負債 ÷ 認列收入。${LEVEL_TEXT[r.bank.level].tag}`}
          />
          <DtiBar
            label="生活版（實際壓力）"
            dti={r.life.dti}
            level={r.life.level}
            note={`含生活費的全部固定支出 ÷ 家庭實際收入。${LEVEL_TEXT[r.life.level].tag}`}
          />
          <p className="pa-note">
            分級為建議值，非任何銀行的正式標準。銀行只看得到左邊那一半，右邊那一半要你自己顧。
          </p>
        </div>

        {/* 反推可買總價 */}
        <div className="pa-panel">
          <h4 className="pa-panel-title">你比較適合看的總價</h4>
          {r.bands.comfortHigh > 0 ? (
            <>
              <ul className="pa-bands">
                <li className="lv-green">
                  <span>舒適區</span>
                  <strong>
                    {toWan(r.bands.comfortLow * 10000)}～{toWan(r.bands.comfortHigh * 10000)} 萬
                  </strong>
                  <em>房貸與生活都留有餘裕，還能存下錢。</em>
                </li>
                <li className="lv-yellow">
                  <span>可接受區</span>
                  <strong>
                    {toWan(r.bands.comfortHigh * 10000)}～{toWan(r.bands.okHigh * 10000)} 萬
                  </strong>
                  <em>買得下去，但要開始盯著支出過日子。</em>
                </li>
                <li className="lv-orange">
                  <span>壓力區</span>
                  <strong>{toWan(r.bands.okHigh * 10000)} 萬以上</strong>
                  <em>需要降成數、拉長年限或增加自備款才建議考慮。</em>
                </li>
              </ul>
              <p className="pa-note">
                {r.bands.cashCapped
                  ? "目前的瓶頸是自備款，不是收入。多備一點現金，可看的總價會往上開。"
                  : "以你的收入、負債與生活費推算，並已扣掉裝潢與緊急預備金的預留。"}
              </p>
            </>
          ) : (
            <p className="pa-empty">
              以目前的收入、負債與生活費，還推不出建議總價。先把收入或負債的數字填完整，或考慮降低既有負債。
            </p>
          )}
        </div>

        {/* 利率壓力測試 */}
        <div className="pa-panel">
          <h4 className="pa-panel-title">利率壓力測試</h4>
          <table className="pa-table">
            <thead>
              <tr>
                <th>情境</th>
                <th>利率</th>
                <th>月付</th>
                <th>每月多付</th>
                <th>每年多付</th>
              </tr>
            </thead>
            <tbody>
              {r.stress.map((s) => (
                <tr key={s.label}>
                  <td>{s.label}</td>
                  <td>{s.rate.toFixed(2)}%</td>
                  <td>{num(s.payment)}</td>
                  <td>{s.deltaMonth > 0 ? `+${num(s.deltaMonth)}` : "—"}</td>
                  <td>{s.deltaYear > 0 ? `+${num(s.deltaYear)}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="pa-note">單位：元。以寬限期結束後的本息攤還月付金比較。</p>
        </div>

        {/* 小飛提醒 */}
        <div className="pa-panel pa-tips">
          <h4 className="pa-panel-title">小飛提醒</h4>
          <ul>
            {r.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

        <div className="pa-closing">
          <p>
            如果你只是想先了解，這樣試算已經可以抓到大方向 👍
            <br />
            但很多人最後不是買不起，是卡在銀行審核。
          </p>
          <p className="pa-closing-strong">
            如果你已經在看房或準備出價，這一步會很關鍵。
          </p>
          <a className="btn btn-primary btn-block pa-cta" href={contactHref}>
            想知道怎麼調整、哪間銀行比較好過？找我聊
          </a>
          <p className="pa-closing-soft">你再主動找我就好，我不會打擾你 👍</p>
        </div>

        <p className="pa-disclaimer">
          本工具僅供購屋財務規劃與初步試算，不代表任何銀行最終核貸結果。實際貸款成數、利率、收入認列與審核條件，
          仍依各銀行及申請人信用、負債、收入、擔保品條件為準。
        </p>
      </div>
    </div>
  );
}

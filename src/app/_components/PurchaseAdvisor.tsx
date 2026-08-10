"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Basic,
  type FeeItem,
  type IncomeType,
  type Level,
  type Money,
  type Purchase,
  INCOME_TYPE_LABEL,
  LEVEL_TEXT,
  affordablePriceBands,
  bankDti,
  bankLevel,
  calcLoan,
  defaultFees,
  lifeDti,
  lifeLevel,
  money,
  num,
  rateStress,
  recognizedMonthlyIncome,
  suggestedLtv,
  toWan
} from "@/lib/loan";
import { advice, assess } from "@/lib/loan-advice";

/* --------------------------------------------------------------- 初始值 */

const INIT_BASIC: Basic = {
  ownedMortgages: 0,
  ownerOccupied: true,
  age: 0,
  incomeType: "salary"
};

const INIT_MONEY: Money = {
  income: 60000,
  debtPayment: 0,
  livingCost: 28000,
  recognizeRatio: 100
};

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
  max,
  big
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  placeholder?: string;
  max?: number;
  big?: boolean;
}) {
  const [buf, setBuf] = useState(value ? String(value) : "");
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setBuf(value ? String(value) : "");
  }, [value, focused]);

  return (
    <div className={`pa-input${big ? " big" : ""}`}>
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

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="pa-card">
      <header className="pa-card-head">
        <h3>{title}</h3>
        {desc && <p>{desc}</p>}
      </header>
      <div className="pa-card-body">{children}</div>
    </section>
  );
}

function Fold({
  title,
  hint,
  children
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`pa-fold${open ? " open" : ""}`}>
      <button type="button" className="pa-fold-head" onClick={() => setOpen((v) => !v)}>
        <span>
          {title}
          {hint && <em>{hint}</em>}
        </span>
        <i aria-hidden="true">{open ? "−" : "＋"}</i>
      </button>
      {open && <div className="pa-fold-body">{children}</div>}
    </div>
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
  const [m, setMoney] = useState<Money>(INIT_MONEY);
  const [ratioTouched, setRatioTouched] = useState(false);
  const [purchase, setPurchase] = useState<Purchase>(INIT_PURCHASE);
  const [feeOn, setFeeOn] = useState<Record<string, boolean>>({});
  const [feeEdit, setFeeEdit] = useState<Record<string, number>>({});

  // 收入類型改變時，若使用者沒手動拉過比例就跟著更新
  useEffect(() => {
    if (!ratioTouched) {
      setMoney((s) => ({ ...s, recognizeRatio: INCOME_TYPE_LABEL[basic.incomeType].ratio }));
    }
  }, [basic.incomeType, ratioTouched]);

  // 名下有房貸在繳時，央行規定不得有寬限期
  useEffect(() => {
    if (basic.ownedMortgages >= 1) setPurchase((s) => (s.useGrace ? { ...s, useGrace: false } : s));
  }, [basic.ownedMortgages]);

  const setB = <K extends keyof Basic>(k: K, v: Basic[K]) => setBasic((s) => ({ ...s, [k]: v }));
  const setM = (k: keyof Money, v: number) => setMoney((s) => ({ ...s, [k]: v }));
  const setP = <K extends keyof Purchase>(k: K, v: Purchase[K]) => setPurchase((s) => ({ ...s, [k]: v }));

  const reset = () => {
    setBasic(INIT_BASIC);
    setMoney(INIT_MONEY);
    setRatioTouched(false);
    setPurchase(INIT_PURCHASE);
    setFeeOn({});
    setFeeEdit({});
  };

  /* ------------------------------------------------------------ 計算 */

  const r = useMemo(() => {
    const recognized = recognizedMonthlyIncome(m);
    const loan = calcLoan(purchase);
    const priceYuan = purchase.price * 10000;
    const downPayment = priceYuan - loan.principal;
    const monthlyOutgo = m.debtPayment + m.livingCost + loan.normalPayment;

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

    const bDti = bankDti(m.debtPayment, loan.normalPayment, recognized);
    const lDti = lifeDti(m.debtPayment, m.livingCost, loan.normalPayment, m.income);
    const bank = { dti: bDti, level: bankLevel(bDti) };
    const life = { dti: lDti, level: lifeLevel(lDti) };
    const surplus = m.income - m.debtPayment - m.livingCost - loan.normalPayment;

    const stress = rateStress(purchase, loan);
    const reserves = purchase.renovation * 10000 + monthlyOutgo * purchase.emergencyMonths;
    const bands = affordablePriceBands({
      recognizedIncome: recognized,
      rawIncome: m.income,
      debtPayments: m.debtPayment,
      living: m.livingCost,
      rate: purchase.rate,
      years: purchase.years,
      ltv: purchase.ltv,
      cashYuan: cashAvailable,
      reservesYuan: reserves
    });

    const ltvRange = suggestedLtv(basic.ownedMortgages, basic.ownerOccupied);

    const input = {
      basic,
      purchase,
      loan,
      bank,
      life,
      cashNeeded,
      cashAvailable,
      surplus,
      rawIncome: m.income,
      living: m.livingCost,
      debtPayments: m.debtPayment,
      paymentPlus1: stress[2]?.payment ?? loan.normalPayment,
      comfortHigh: bands.comfortHigh,
      ltvRange
    };

    return {
      recognized,
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
  }, [basic, m, purchase, feeOn, feeEdit]);

  const lv = r.verdict.level;

  /* -------------------------------------------------------------- UI */

  return (
    <div className="pa-wrap">
      {/* ============================ 輸入 ============================ */}
      <div className="pa-forms">
        <Card title="你每個月的錢" desc="只要三個數字，其他都可以先不用管。">
          <Row label="家庭月收入" hint="含配偶，實際入袋的">
            <NumInput big value={m.income} onChange={(v) => setM("income", v)} suffix="元" />
          </Row>
          <Row label="每月要還的貸款" hint="信貸、車貸、學貸、卡循加總；沒有就填 0">
            <NumInput big value={m.debtPayment} onChange={(v) => setM("debtPayment", v)} suffix="元" />
          </Row>
          <Row label="每月生活開銷" hint="吃住、保險、孝親、小孩，全部加起來">
            <NumInput big value={m.livingCost} onChange={(v) => setM("livingCost", v)} suffix="元" />
          </Row>
        </Card>

        <Card title="想買的房子" desc="填總價跟手上的錢就好，貸款條件我先幫你帶市場行情。">
          <div className="pa-grid-2">
            <Row label="房屋總價">
              <NumInput big value={purchase.price} onChange={(v) => setP("price", v)} suffix="萬" />
            </Row>
            <Row label="手上可動用的錢">
              <NumInput big value={purchase.cash} onChange={(v) => setP("cash", v)} suffix="萬" />
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
                : "超過建議區間了。成數抓太滿，自備款會突然差一大截。"}
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
        </Card>

        {/* -------- 進階：預設收起，想細算的人再展開 -------- */}
        <Fold title="名下已有房貸？" hint={`目前算第 ${basic.ownedMortgages + 1} 戶`}>
          <Row label="名下還在繳的房貸" hint="已繳清、抵押權已塗銷的不算">
            <Segmented<0 | 1 | 2>
              value={basic.ownedMortgages}
              onChange={(v) => setB("ownedMortgages", v)}
              options={[
                { label: "沒有", value: 0 },
                { label: "1 戶", value: 1 },
                { label: "2 戶以上", value: 2 }
              ]}
            />
          </Row>
          <Row label="這次是自住嗎">
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
            <em>{r.ltvRange.note}實際成數依銀行政策、收支比與信用狀況調整，不是固定數字。</em>
          </div>
        </Fold>

        <Fold
          title="寬限期與收入認列"
          hint={basic.ownedMortgages >= 1 ? "這一戶不能有寬限期" : purchase.useGrace ? `寬限 ${purchase.graceYears} 年` : "未使用"}
        >
          {r.ltvRange.graceBanned ? (
            <div className="pa-rule-box">
              <p>
                <strong>這一戶不能有寬限期</strong>
              </p>
              <em>
                央行規定第 {basic.ownedMortgages + 1} 戶購屋貸款不得有寬限期（115.3.20 生效）。
                唯一的例外是「先買後賣」的實質換屋自住：與銀行切結後，需在撥款後 18 個月內
                賣掉並塗銷原本那戶的房貸，才可不受成數上限與無寬限期的限制。
              </em>
            </div>
          ) : (
            <>
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
              {purchase.useGrace && (
                <Row label="寬限期年數">
                  <NumInput
                    value={purchase.graceYears}
                    onChange={(v) => setP("graceYears", v)}
                    suffix="年"
                    max={10}
                  />
                </Row>
              )}
            </>
          )}

          <Row label="收入類型" hint="影響銀行認列多少">
            <Segmented<IncomeType>
              value={basic.incomeType}
              onChange={(v) => setB("incomeType", v)}
              options={(Object.keys(INCOME_TYPE_LABEL) as IncomeType[]).map((k) => ({
                label: INCOME_TYPE_LABEL[k].label,
                value: k
              }))}
            />
          </Row>

          <div className="pa-ratio">
            <div className="pa-ratio-head">
              <span>銀行認列比例</span>
              <strong>{m.recognizeRatio}%</strong>
            </div>
            <input
              type="range"
              min={40}
              max={100}
              step={5}
              value={m.recognizeRatio}
              onChange={(e) => {
                setRatioTouched(true);
                setM("recognizeRatio", Number(e.target.value));
              }}
            />
            <p className="pa-note">
              {INCOME_TYPE_LABEL[basic.incomeType].hint}。認列後月收入{" "}
              <strong>{money(r.recognized)}</strong>。實際比例依各銀行與申請人條件不同，本工具僅為試算。
            </p>
          </div>

          <Row label="年齡" hint="選填，用來檢查 80 條款">
            <NumInput value={basic.age} onChange={(v) => setB("age", v)} suffix="歲" max={100} />
          </Row>
        </Fold>

        <Fold title="交屋前要準備的現金" hint={`約 ${toWan(r.cashNeeded)} 萬`}>
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
          <p className="pa-note">稅費為概估值，實際依物件評定現值、地區與銀行方案而異。</p>
        </Fold>

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

        <div className="pa-panel">
          <ul className="pa-check-list">
            <li className={r.cashAvailable >= r.cashNeeded ? "ok" : "bad"}>
              <span>手上的錢夠不夠</span>
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
          </ul>

          <ul className="pa-figures">
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
              <span>貸款金額</span>
              <strong>{money(r.loan.principal)}</strong>
            </li>
            <li>
              <span>頭期款</span>
              <strong>{money(r.downPayment)}</strong>
            </li>
            <li className="hl">
              <span>交屋前建議準備現金</span>
              <strong>{money(r.cashNeeded)}</strong>
            </li>
          </ul>

          {purchase.useGrace && r.loan.normalPayment > r.loan.gracePayment && (
            <p className="pa-warning">
              不要只看前幾年的月付。寬限期結束後每月要繳 {money(r.loan.normalPayment)}，
              一次多出 {money(r.loan.normalPayment - r.loan.gracePayment)}，那才是你真正要承受的金額。
            </p>
          )}
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
                  ? "目前的瓶頸是手上的現金，不是收入。多備一點錢，可看的總價會往上開。"
                  : "以你的收入、負債與生活費推算，並已扣掉裝潢與緊急預備金的預留。"}
              </p>
            </>
          ) : (
            <p className="pa-empty">
              以目前的收入、負債與生活費，還推不出建議總價。先確認上面三個數字有沒有填對。
            </p>
          )}
        </div>

        <a className="btn btn-primary btn-block pa-cta" href={contactHref}>
          想知道實際能貸到哪？找我聊
        </a>
        <p className="pa-closing-soft">你再主動找我就好，我不會打擾你 👍</p>

        {/* 細節：想看的人再展開 */}
        <Fold title="兩種收支比" hint={`銀行版 ${r.bank.dti.toFixed(0)}%／生活版 ${r.life.dti.toFixed(0)}%`}>
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
        </Fold>

        <Fold title="利率升了會怎樣" hint={`＋1% 月付 ${num(r.stress[2]?.payment ?? 0)}`}>
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
        </Fold>

        <Fold title="總利息與還款總額" hint={money(r.loan.totalInterest)}>
          <ul className="pa-figures">
            <li>
              <span>房屋總價</span>
              <strong>{money(purchase.price * 10000)}</strong>
            </li>
            <li>
              <span>總利息</span>
              <strong>{money(r.loan.totalInterest)}</strong>
            </li>
            <li>
              <span>本息總還款</span>
              <strong>{money(r.loan.totalPaid)}</strong>
            </li>
          </ul>
        </Fold>

        {/* 小飛提醒 */}
        <div className="pa-panel pa-tips">
          <h4 className="pa-panel-title">小飛提醒</h4>
          <ul>
            {r.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

        <p className="pa-disclaimer">
          本工具僅供購屋財務規劃與初步試算，不代表任何銀行最終核貸結果。實際貸款成數、利率、收入認列與審核條件，
          仍依各銀行及申請人信用、負債、收入、擔保品條件為準。
        </p>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

/** 千分位顯示 */
const nf = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 });

/**
 * 房貸試算（本息平均攤還，台灣常見方式）
 *
 * 寬限期內只繳利息，寬限期結束後把本金攤到剩餘期數。
 * 僅供估算參考，實際條件以銀行核貸為準。
 */
function calculate({
  total,
  ratio,
  years,
  rate,
  graceYears
}: {
  total: number;
  ratio: number;
  years: number;
  rate: number;
  graceYears: number;
}) {
  const principal = Math.round((total * 10000 * ratio) / 100);
  const downPayment = total * 10000 - principal;
  const monthlyRate = rate / 100 / 12;
  const totalMonths = years * 12;
  const graceMonths = Math.min(graceYears * 12, totalMonths);
  const repayMonths = totalMonths - graceMonths;

  if (principal <= 0 || repayMonths <= 0) {
    return { principal, downPayment, gracePayment: 0, monthlyPayment: 0, totalInterest: 0, totalPaid: 0 };
  }

  // 寬限期：每月只繳利息
  const gracePayment = Math.round(principal * monthlyRate);

  // 寬限期後：本息平均攤還
  const monthlyPayment =
    monthlyRate === 0
      ? Math.round(principal / repayMonths)
      : Math.round(
          (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -repayMonths))
        );

  const totalPaid = gracePayment * graceMonths + monthlyPayment * repayMonths;
  const totalInterest = totalPaid - principal;

  return { principal, downPayment, gracePayment, monthlyPayment, totalInterest, totalPaid };
}

function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="calc-field">
      <label>
        {label}
        {hint && <span className="calc-hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export default function LoanCalculator({ contactHref }: { contactHref: string }) {
  const [total, setTotal] = useState(1000);
  const [ratio, setRatio] = useState(80);
  const [years, setYears] = useState(30);
  const [rate, setRate] = useState(2.2);
  const [graceYears, setGraceYears] = useState(0);

  const result = useMemo(
    () => calculate({ total, ratio, years, rate, graceYears }),
    [total, ratio, years, rate, graceYears]
  );

  return (
    <div className="calc-wrap">
      <div className="calc-inputs">
        <Field label="房屋總價" hint="萬元">
          <div className="calc-row">
            <input
              type="range"
              min={100}
              max={5000}
              step={10}
              value={total}
              onChange={(e) => setTotal(Number(e.target.value))}
            />
            <input
              type="number"
              className="calc-number"
              min={100}
              max={100000}
              value={total}
              onChange={(e) => setTotal(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </Field>

        <Field label="貸款成數" hint="%">
          <div className="calc-row">
            <input
              type="range"
              min={10}
              max={90}
              step={5}
              value={ratio}
              onChange={(e) => setRatio(Number(e.target.value))}
            />
            <input
              type="number"
              className="calc-number"
              min={0}
              max={100}
              value={ratio}
              onChange={(e) => setRatio(Math.min(100, Math.max(0, Number(e.target.value))))}
            />
          </div>
        </Field>

        <Field label="貸款年限" hint="年">
          <div className="calc-row">
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
            />
            <input
              type="number"
              className="calc-number"
              min={1}
              max={40}
              value={years}
              onChange={(e) => setYears(Math.min(40, Math.max(1, Number(e.target.value))))}
            />
          </div>
        </Field>

        <Field label="年利率" hint="%">
          <div className="calc-row">
            <input
              type="range"
              min={1}
              max={5}
              step={0.05}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
            <input
              type="number"
              className="calc-number"
              min={0}
              max={20}
              step={0.01}
              value={rate}
              onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </Field>

        <Field label="寬限期" hint="年・只繳息不還本">
          <div className="calc-row">
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={graceYears}
              onChange={(e) => setGraceYears(Number(e.target.value))}
            />
            <input
              type="number"
              className="calc-number"
              min={0}
              max={10}
              value={graceYears}
              onChange={(e) => setGraceYears(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </Field>
      </div>

      <div className="calc-result">
        <p className="calc-result-label">每月應繳</p>
        <p className="calc-main">
          <span className="calc-currency">NT$</span>
          {nf.format(result.monthlyPayment)}
        </p>

        {graceYears > 0 && (
          <p className="calc-grace">
            寬限期 {graceYears} 年內每月只繳息 <strong>NT$ {nf.format(result.gracePayment)}</strong>
            <br />
            寬限期後才開始還本，月付金為上方金額
          </p>
        )}

        <div className="calc-breakdown">
          <div>
            <span>自備款</span>
            <strong>NT$ {nf.format(result.downPayment)}</strong>
          </div>
          <div>
            <span>貸款金額</span>
            <strong>NT$ {nf.format(result.principal)}</strong>
          </div>
          <div>
            <span>總利息</span>
            <strong>NT$ {nf.format(result.totalInterest)}</strong>
          </div>
          <div>
            <span>本息總計</span>
            <strong>NT$ {nf.format(result.totalPaid)}</strong>
          </div>
        </div>

        <a className="btn btn-primary btn-block calc-cta" href={contactHref}>
          想知道自己能貸多少？問我
        </a>

        <p className="calc-disclaimer">
          本試算採本息平均攤還，僅供概算參考。實際可貸成數、利率與年限依銀行審核結果而定，
          並會受個人信用、收入與物件條件影響。
        </p>
      </div>
    </div>
  );
}

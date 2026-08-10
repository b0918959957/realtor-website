/**
 * 小飛評估與提醒
 *
 * 這裡負責把一堆數字翻成人話。語氣原則：務實、直接、中立，
 * 不恐嚇也不鼓吹買房。銀行回答「你可以借多少」，這裡回答「你適合買多少」。
 */

import {
  type Basic,
  type Level,
  type LoanResult,
  type LtvRange,
  type Purchase,
  downgrade,
  money,
  toWan,
  worseLevel
} from "@/lib/loan";

export type Verdict = {
  level: Level;
  headline: string;
};

export type AssessInput = {
  basic: Basic;
  purchase: Purchase;
  loan: LoanResult;
  bank: { dti: number; level: Level };
  life: { dti: number; level: Level };
  /** 交屋前建議準備的現金總額 */
  cashNeeded: number;
  /** 可動用自備款（元） */
  cashAvailable: number;
  /** 每月剩餘可支配所得（已扣寬限期後房貸） */
  surplus: number;
  /** 家庭實際月收入 */
  rawIncome: number;
  /** 生活支出合計 */
  living: number;
  /** 既有負債月付合計 */
  debtPayments: number;
  /** 利率 +1% 後的月付 */
  paymentPlus1: number;
  /** 建議的舒適總價上限（萬） */
  comfortHigh: number;
  /** 依戶數推的建議成數區間 */
  ltvRange: LtvRange;
};

/* ------------------------------------------------------------------ 評估 */

export function assess(a: AssessInput): Verdict {
  const cashShort = a.cashNeeded - a.cashAvailable;
  let level = worseLevel(a.bank.level, a.life.level);

  // 剩餘現金太薄：即使比率好看，生活也沒有緩衝
  if (a.rawIncome > 0 && a.surplus < a.rawIncome * 0.1) {
    level = downgrade(level);
  }
  // 自備款差一截，先別談買不買得起
  if (cashShort > 0 && cashShort > a.cashNeeded * 0.1) {
    level = downgrade(level);
  }

  if (cashShort > 0) {
    return {
      level: worseLevel(level, "orange"),
      headline: "自備款還不夠，先別急著出價"
    };
  }

  const headline: Record<Level, string> = {
    green: "可以買，而且相對輕鬆",
    yellow: "可以買，但要控制支出",
    orange: "偏緊，建議調整條件再出手",
    red: "這個總價目前不建議硬買"
  };

  return { level, headline: headline[level] };
}

/* -------------------------------------------------------------- 小飛提醒 */

export function advice(a: AssessInput): string[] {
  const tips: string[] = [];
  const { basic, purchase, loan } = a;
  const cashShort = a.cashNeeded - a.cashAvailable;

  /* 自備款 */
  if (cashShort > 0) {
    tips.push(
      `交屋前建議準備約 ${toWan(a.cashNeeded)} 萬，你目前可動用 ${toWan(a.cashAvailable)} 萬，還差約 ${toWan(cashShort)} 萬。` +
        `頭期款以外還有稅費、代書、仲介費跟家具，這些都是現金支出，不能算進貸款裡。`
    );
  } else if (cashShort > -a.cashNeeded * 0.15) {
    tips.push(
      `你的自備款剛好夠，但幾乎沒有餘裕。買房之後還會有臨時支出，我不建議把現金全部壓下去，` +
        `手上至少留幾個月的生活費比較安心。`
    );
  } else {
    tips.push(
      `你的自備款足夠，但不要全部拿去當頭期款。買完房還有稅費、家具、裝潢跟臨時支出，` +
        `建議至少保留 6 個月家庭生活費再談加價。`
    );
  }

  /* 寬限期 */
  if (purchase.useGrace && purchase.graceYears > 0 && loan.normalPayment > loan.gracePayment) {
    const jump = loan.normalPayment - loan.gracePayment;
    tips.push(
      `寬限期內每月只繳息 ${money(loan.gracePayment)}，看起來很輕鬆；但第 ${purchase.graceYears + 1} 年開始要繳 ${money(loan.normalPayment)}，` +
        `一次多出 ${money(jump)}。這個數字才是你真正要評估的壓力，不要只看前幾年。`
    );
  }

  /* 銀行版 vs 生活版的落差 */
  if (a.bank.dti <= 50 && a.life.dti > 85) {
    tips.push(
      `銀行版收支比 ${a.bank.dti.toFixed(0)}% 看起來過得去，但把生活費、保險這些銀行看不到的支出加回去之後是 ${a.life.dti.toFixed(0)}%。` +
        `銀行願意貸，不代表你的日子好過——這中間的差距要由你自己承擔。`
    );
  }

  /* 每月剩餘 */
  if (a.rawIncome > 0) {
    if (a.surplus <= 0) {
      tips.push(
        `扣掉房貸與所有固定支出後，每月是負的。以這個總價來看我會直接建議往下調，` +
          `不然只要有一次意外支出就會很難處理。`
      );
    } else {
      const detail = basic.hasChildren
        ? `你有 ${basic.childCount || 1} 位未成年子女，教育與醫療的變動支出通常會比預估多`
        : `如果之後有換車、生小孩或家人醫療需求，這個數字會再被吃掉一塊`;
      tips.push(
        `扣掉房貸與固定支出後，每月剩下約 ${money(a.surplus)}。${detail}。` +
          (a.comfortHigh > 0 && purchase.price > a.comfortHigh
            ? `以你目前的條件，總價抓在 ${toWan(a.comfortHigh * 10000)} 萬以內生活會比較有彈性。`
            : `以你目前的條件，這個水位還算守得住。`)
      );
    }
  }

  /* 利率風險 */
  if (a.paymentPlus1 > loan.normalPayment) {
    const d = a.paymentPlus1 - loan.normalPayment;
    tips.push(
      `如果利率再升 1%，月付會變成 ${money(a.paymentPlus1)}，每月多 ${money(d)}、一年多 ${money(d * 12)}。` +
        `試算時建議預留這段緩衝，不要抓在剛好繳得起的位置。`
    );
  }

  /* 80 條款 */
  if (basic.age > 0 && basic.age + purchase.years > 80) {
    tips.push(
      `你的年齡 ${basic.age} 加上貸款年限 ${purchase.years} 年等於 ${basic.age + purchase.years}，超過多數銀行的「80 條款」（年齡＋年限 ≤ 80）。` +
        `年限可能會被砍短，月付會跟著變高，這點要先算進去。`
    );
  }

  /* 自營業 */
  if (basic.selfEmployed) {
    tips.push(
      `自營收入銀行通常只認列七成左右，帳面收入和銀行看到的收入會有落差。` +
        `報稅資料、扣繳憑單與存摺往來越完整，認列比例越有機會拉高。`
    );
  } else if (!basic.hasPayrollTransfer) {
    tips.push(
      `沒有固定薪轉的話，銀行對收入的認列會比較保守。` +
        `送件前先把薪資入帳紀錄整理好，對成數和利率都有幫助。`
    );
  }

  /* 年資 */
  if (basic.jobYears > 0 && basic.jobYears < 1) {
    tips.push(`目前年資未滿 1 年，部分銀行會要求滿一年或加保人。如果不急，等年資滿一年再送件條件通常會好一些。`);
  }

  /* 戶數與成數：很多人不是買不起，是卡在這裡 */
  const { low, high, note, regCap } = a.ltvRange;

  if (basic.houseOrder === 2 && basic.existingMortgageActive) {
    tips.push(
      `你第 1 戶房貸還在繳，又要買第 2 戶。如果實際上是「先買後賣」的換屋自住，` +
        `可以跟銀行切結：撥款後 18 個月內把第 1 戶賣掉、清償並塗銷抵押權，就能不受 6 成上限與無寬限期的限制。` +
        `這條路能不能走、怎麼談，是這個案子最值錢的地方，建議直接找我談。`
    );
  }

  if (regCap !== null && purchase.ltv > regCap) {
    tips.push(
      `你抓的是 ${purchase.ltv} 成，但以${basic.houseOrder === 1 ? "第一戶" : basic.houseOrder === 2 ? "第二戶" : "第三戶以上"}來說，` +
        `我會建議先用 ${low}~${high} 成試算。${note}成數抓太滿，自備款會突然差一大截。`
    );
  } else if (basic.houseOrder >= 2) {
    tips.push(`${note}實際成數會依銀行政策、收支比與信用狀況調整，不是固定數字，這裡一律先抓保守的。`);
  }

  if (basic.houseOrder >= 2 && basic.existingMortgageActive && debtMortgageMissing(a)) {
    tips.push(
      `你有房貸還在繳，但「既有房貸月付」那格是 0。這一格空著整份試算都會失真——` +
        `銀行最在意的就是你每個月總共要還多少，記得補上去。`
    );
  }

  /* 觀念收尾 */
  tips.push(
    `最後提醒一個觀念：銀行看的不是你賺多少，是你「還得起多少」。` +
      `很多人不是買不起，是貸不過——卡住的通常是負債和收入認列，不是價格。`
  );

  return tips;
}

/** 說有房貸在繳、卻沒填既有房貸月付 */
function debtMortgageMissing(a: AssessInput): boolean {
  return a.debtPayments <= 0;
}

/**
 * 小飛賣房稅費＆實拿試算 —— 小飛提醒產生器
 *
 * 語氣原則：務實、中立、直接；不恐嚇、不鼓勵逃漏稅、不為成交美化數字。
 * 每一條提醒都必須是「依使用者輸入資料推導出來的」，不放萬用罐頭話。
 */

import { TAX_RULES } from "./sell-tax-rules";
import { type Input, type Result, toWan } from "./sell-tax";

export type Tip = {
  tone: "info" | "warn" | "good";
  title: string;
  body: string;
};

/** 房地合一稅率級距的月份門檻，用來判斷「快跳級距了」 */
const BRACKET_EDGES = [24, 60, 120];

export function buildTips(input: Input, r: Result): Tip[] {
  const tips: Tip[] = [];
  const b = r.breakdown;
  const wan = (v: number) => `${toWan(v)} 萬`;

  /* 1. 最大的一筆到底是什麼 —— 破除「都是仲介費害的」 */
  const items = [
    { name: "剩餘房貸", v: b.remainingLoan, kind: "debt" },
    { name: "房地合一／所得稅", v: b.incomeTax, kind: "tax" },
    { name: "土地增值稅", v: b.landIncrementTax, kind: "tax" },
    { name: "仲介服務費", v: b.agentFee, kind: "service" }
  ].sort((a, c) => c.v - a.v);
  const top = items[0];

  if (top && top.v > 0 && b.totalDeduction > 0) {
    if (top.kind === "tax") {
      tips.push({
        tone: "warn",
        title: `你這筆最大的成本是「${top.name}」，不是仲介費`,
        body:
          `${top.name}約 ${wan(top.v)}，仲介服務費約 ${wan(b.agentFee)}。` +
          `談價格之前，先把最大的那一塊看清楚，才知道每一段價差對你的實際影響。`
      });
    } else if (top.kind === "debt") {
      tips.push({
        tone: "info",
        title: "扣掉最多的是房貸，這一塊不是成本、是還你自己的錢",
        body:
          `剩餘房貸約 ${wan(b.remainingLoan)}，它會從價金裡先被清償，但它不是「損失」，` +
          `而是把原本就欠銀行的部分還掉。真正被拿走的是稅與交易成本共約 ` +
          `${wan(b.govTotal + b.serviceTotal + b.settlement + b.other)}。`
      });
    }
  }

  /* 2. 接近稅率級距 */
  if (r.regime.regime === "houseLand" && r.months > 0 && !r.selfUse.qualified && !input.specialRate20) {
    for (const edge of BRACKET_EDGES) {
      const gap = edge - r.months;
      if (gap > 0 && gap <= 6) {
        tips.push({
          tone: "warn",
          title: `再 ${gap} 個月就跨過下一個稅率級距`,
          body:
            `你目前持有 ${r.holdingLabel}，距離「超過 ${edge / 12} 年」還差約 ${gap} 個月。` +
            `跨過去之後房地合一稅率會下降一階。這不是叫你一定要等，` +
            `而是建議你先確認出售時程對稅負的影響，再決定要不要調整交易節奏 ——` +
            `市場行情與資金需求同樣要一起評估。`
        });
        break;
      }
    }
  }

  /* 3. 自住優惠 */
  const SU = TAX_RULES.selfUseIncomeTax;
  if (r.regime.regime === "houseLand") {
    if (r.selfUse.qualified) {
      tips.push({
        tone: "good",
        title: "你可能符合自住房地優惠，但這一項最容易在細節上被打掉",
        body:
          `依你輸入的資料，課稅所得 ${toWan(SU.exemptIncome)} 萬元以內可能免稅、超過部分適用 ` +
          `${(SU.rate * 100).toFixed(0)}%。是否真正符合，仍須確認設籍時間、實際居住紀錄、` +
          `6 年內有無出租或供營業使用、以及一家人 6 年內是否用過這項優惠。` +
          `這幾項國稅局查得到，建議簽約前先確認清楚。`
      });
    } else if (r.selfUse.missing.length > 0 && r.selfUse.missing.length <= 2) {
      tips.push({
        tone: "warn",
        title: `自住優惠目前差 ${r.selfUse.missing.length} 項條件`,
        body:
          `尚未符合：${r.selfUse.missing.join("、")}。` +
          `自住優惠的免稅額是 ${toWan(SU.exemptIncome)} 萬元，差距不小，` +
          `建議先確認這幾項是否真的不符合，或只是資料還沒補齊。`
      });
    }
  }

  /* 4. 土增稅資料不足 */
  if (r.land.status === "insufficient") {
    tips.push({
      tone: "warn",
      title: "這個數字目前少算了土地增值稅",
      body:
        "土地增值稅不能用「賣價減買價」推估，它要看前次移轉現值、本次申報移轉現值與物價指數。" +
        "建議先調土地謄本，或請地方稅務局／代書試算後把金額填回來，最後實拿會準很多。"
    });
  } else if (r.land.status === "manual") {
    tips.push({
      tone: "info",
      title: "土地增值稅採用你提供的試算金額",
      body: "這筆是照你輸入的金額計入，不是本工具算出來的。若稅務局後來核定金額不同，實拿會跟著變動。"
    });
  }

  /* 5. 帳面賺 vs 實際拿回 */
  const bookGain = b.sellPrice - r.acquireCost;
  if (bookGain > 0 && b.netProceeds >= 0) {
    tips.push({
      tone: "info",
      title: "帳面價差跟真正拿回的現金，是兩件事",
      body:
        `這間房帳面上比取得成本高約 ${wan(bookGain)}，但那不是你會拿到的錢。` +
        `扣掉房貸、稅負與交易成本後，過戶當天實際匯進你帳戶的現金約 ${wan(b.netProceeds)} ——` +
        `這筆錢裡面大部分是你原本就已經還進房子裡的本金，不是獲利。` +
        `「帳面賺多少」跟「手上拿回多少」是兩個數字，資金規劃要看後面那個。`
    });
  }

  /* 6. 費用採核定標準 */
  if (r.expense.usedStandard && r.expense.actual < r.expense.standard) {
    tips.push({
      tone: "info",
      title: "出售費用目前是用核定標準扣的",
      body:
        `目前依成交價額 ${(TAX_RULES.expenseStandard.rate * 100).toFixed(0)}%（上限 ` +
        `${toWan(TAX_RULES.expenseStandard.cap)} 萬元）計算，可減除 ${wan(r.expense.standard)}。` +
        `如果你的仲介費、廣告費、清潔搬運費等實際支出加起來會超過這個數字，` +
        `記得把合法憑證留好，核實認定通常對你比較有利。`
    });
  }

  /* 7. 交易損失 */
  if (r.houseLand?.status === "loss") {
    tips.push({
      tone: "info",
      title: "依目前資料是交易損失，但還是要申報",
      body:
        "沒有應納稅額不代表不用報。房地合一交易不論有無稅額，都應在所有權移轉登記日次日起 30 日內申報，" +
        "而且交易損失依規定得自交易日以後 3 年內的房地交易所得中扣除，報了才留得住。"
    });
  }

  /* 8. 取得方式特殊 */
  if (input.basic.acquireType !== "purchase") {
    tips.push({
      tone: "warn",
      title: "你的取得方式不是一般買賣，成本認定要另外確認",
      body:
        "繼承、受贈、分割等方式取得的房地，取得成本通常不是「當初的買價」，" +
        "而是依稅法規定以取得當時的房屋評定現值及公告土地現值按物價指數調整後認定，持有期間也可能可以併計前手。" +
        "這一段對稅額影響很大，建議請地政士或國稅局協助確認後再定案。"
    });
  }

  /* 9. 資金缺口 */
  if (b.netProceeds < 0) {
    tips.push({
      tone: "warn",
      title: "這個價格賣掉，錢可能不夠付清",
      body:
        `依目前資料，成交價 ${wan(b.sellPrice)} 扣掉全部稅費與房貸後短少約 ` +
        `${wan(Math.abs(b.netProceeds))}。簽約前請先向銀行確認實際清償金額，` +
        `並確認這個缺口要怎麼補，不要等到過戶當天才發現。`
    });
  }

  /* 10. 房貸提前清償違約金未確認 */
  if (input.financing.prepayPenaltyKnown === "unknown" && b.remainingLoan > 0) {
    tips.push({
      tone: "info",
      title: "提前清償違約金還沒確認",
      body:
        "房貸通常有綁約期，期間內清償可能要付違約金，金額從幾千到幾十萬都有可能。" +
        "打給銀行問「綁約到什麼時候、提前清償要付多少」，兩分鐘就問得到，這筆目前沒有計入。"
    });
  }

  /* 11. 履約保證未決定 */
  if (input.escrow.status === "undecided") {
    tips.push({
      tone: "info",
      title: "履約保證還沒決定，這筆目前沒有計入",
      body:
        `以成交價 ${wan(b.sellPrice)}、常見的萬分之三試算約 ` +
        `${wan(b.sellPrice * TAX_RULES.defaults.escrowRate)}。實際費率依履約保證機構與契約為準。`
    });
  }

  /* 12. 舊制資料不足 */
  if (r.legacy?.status === "insufficient") {
    tips.push({
      tone: "warn",
      title: "舊制所得稅目前無法精算",
      body:
        "本案可能適用舊制房屋財產交易所得，需要房屋評定現值、公告土地現值，" +
        "才能把成交價分攤出房屋部分的收入。這些數字在房屋稅單、地價稅單或謄本上找得到。"
    });
  }

  /* 13. 法人 */
  if (input.basic.sellerKind === "company") {
    tips.push({
      tone: "warn",
      title: "法人不適用這套自然人公式",
      body:
        "公司／法人出售不動產涉及營利事業所得稅、營業稅等不同規定，" +
        "本工具的試算結果不適用於法人，請洽會計師另外評估。"
    });
  }

  return tips;
}

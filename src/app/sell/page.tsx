import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import SellGate from "@/app/_components/SellGate";
import SellTaxCalculator from "@/app/_components/SellTaxCalculator";
import { PROFILE } from "@/lib/profile";
import { GATE_COOKIE, verifyToken } from "@/lib/sell-gate";
import { DISCLAIMERS, TAX_RULES } from "@/lib/sell-tax-rules";
import "../site.css";
import "./sell-tax.css";

const LINE_URL = PROFILE.social.line;

/**
 * 這是不公開的工具頁：不上選單、不從首頁連過來、不讓搜尋引擎收錄。
 * 只有拿到網址＋通關密語的人可以使用。
 */
export const metadata: Metadata = {
  title: "小飛賣房稅費＆實拿試算",
  description: "限定工具，需通關密語。",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true }
  }
};

export const dynamic = "force-dynamic";

export default async function SellPage() {
  const store = await cookies();
  const authed = verifyToken(store.get(GATE_COOKIE)?.value);

  if (!authed) {
    return (
      <div className="site-root">
        <SellGate lineUrl={LINE_URL} />
      </div>
    );
  }

  return (
    <div className="site-root">
      <header className="site-header scrolled no-print">
        <div className="container header-inner">
          <Link href="/" className="logo">
            劉羽菲<span>・房仲服務</span>
          </Link>
          <div className="header-cta">
            <a className="btn btn-line" href={LINE_URL} target="_blank" rel="noopener noreferrer">
              加 LINE 諮詢
            </a>
          </div>
        </div>
      </header>

      <main className="pa-page st-page">
        <section className="pa-hero st-hero">
          <div className="container">
            <p className="section-eyebrow">SELLER NET PROCEEDS</p>
            <h1 className="pa-hero-title">小飛賣房稅費＆實拿試算</h1>
            <p className="pa-hero-sub">別只看賣多少，真正重要的是最後拿回多少。</p>

            <p className="st-hero-lead">
              成交價是表面，實拿才是屋主真正要看的數字。
              <br />
              這個工具會把稅、費用、房貸全部攤開，算出一句話 👇
              <br />
              <strong>這間房如果成交 XXX 萬，全部扣完，你大約實拿 XXX 萬。</strong>
            </p>

            <p className="st-hero-trust">
              你填的資料<strong>只留在你自己的手機或電腦裡</strong>，不會送出、我這邊看不到。
            </p>

            <ul className="st-hero-points">
              <li>我賣房會遇到哪些稅？</li>
              <li>我適用房地合一新制還是舊制？</li>
              <li>房地合一稅、土地增值稅大約多少？</li>
              <li>仲介費、履保、代書費加起來多少？</li>
              <li>房貸還清後，我最後真正拿回多少？</li>
              <li>賣不同價格，我實拿差多少？</li>
            </ul>

            <p className="st-hero-note">
              這是<strong>初步試算工具</strong>，不是正式稅額核定系統。
              會因個案、地方政府、國稅局認定、證明文件或契約而變動的項目，都會標示為「預估」。
            </p>
          </div>
        </section>

        <section className="pa-main">
          <div className="container">
            <SellTaxCalculator lineUrl={LINE_URL} />
          </div>
        </section>

        <section className="st-legal">
          <div className="container">
            <h2>法規版本與資料來源</h2>
            <p className="st-legal-version">
              法規版本 {TAX_RULES.version}｜最後更新日期 {TAX_RULES.lastUpdated}
            </p>
            <p className="st-legal-desc">
              以下項目集中管理，法規異動時一次更新：房地合一稅率、自住房地優惠、
              出售費用核定比例及上限、舊制財產交易所得標準、房屋稅與地價稅納稅義務基準日、
              土地增值稅稅率與長期減徵規定。
            </p>
            <ul className="st-sources">
              {TAX_RULES.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
            <div className="st-disclaimer">
              <p className="st-disclaimer-title">免責聲明</p>
              <ol>
                <li>
                  本工具為<strong>初步試算</strong>，僅供賣房財務規劃參考，不代表稅捐機關正式核定結果。
                  實際金額<strong>可能與國稅局核定有明顯差距</strong>，差距原因詳見試算結果頁的說明。
                </li>
                <li>
                  房地合一所得稅由<strong>國稅局</strong>核定，土地增值稅由<strong>地方稅務局</strong>核定；
                  成本與費用能否認列，由稅捐機關依你提示的證明文件審核。
                </li>
                <li>
                  仲介服務費、履約保證費、代書及行政費<strong>均非法定統一費率</strong>，
                  預設值僅供試算，實際依契約與各單位報價。
                </li>
                <li>{DISCLAIMERS.filing}</li>
                <li>
                  本工具產生的數字與提醒屬一般性資訊，<strong>不構成稅務、法律、會計或投資建議</strong>，
                  不得作為報稅、貸款或訴訟依據。個案請洽國稅局、地方稅務局、地政士或會計師。
                  法人交易不適用本工具。
                </li>
                <li>
                  你輸入的資料<strong>只存在你自己的裝置</strong>，不會傳送到伺服器，劉羽菲也讀不到。
                </li>
              </ol>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer no-print">
        <div className="container footer-inner">
          <div className="footer-brand">
            <p className="footer-name">
              {PROFILE.name}（{PROFILE.alias}）
            </p>
            <p>不是只幫屋主看能賣多少，而是把賣掉之後真正剩多少算清楚。</p>
          </div>
          <div className="footer-contact">
            <a href={`tel:${PROFILE.phoneRaw}`}>{PROFILE.phone}</a>
            <a href={LINE_URL} target="_blank" rel="noopener noreferrer">
              LINE 諮詢
            </a>
            <Link href="/">回首頁</Link>
          </div>
        </div>
        <p className="footer-copyright">
          © {new Date().getFullYear()} 劉羽菲房仲服務. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

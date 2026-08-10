import type { Metadata } from "next";
import Link from "next/link";
import PurchaseAdvisor from "@/app/_components/PurchaseAdvisor";
import { PROFILE } from "@/lib/profile";
import "../site.css";

const LINE_URL = PROFILE.social.line;

export const metadata: Metadata = {
  title: "小飛買房貸款試算｜算你適合買多少，不只是能貸多少",
  description:
    "輸入收入、負債、自備款與想買的總價，立刻知道自己買不買得起、建議看多少總價、自備款夠不夠、月付會不會太硬、寬限期結束後壓力多大。銀行版與生活版收支比分開算，含利率壓力測試與購屋建議。",
  keywords: [
    "買房貸款試算", "房貸試算", "收支比試算", "DTI 計算", "購屋能力評估",
    "可以買多少錢的房子", "自備款計算", "寬限期試算", "房貸利率壓力測試",
    "高雄房仲", "屏東房仲", "劉羽菲", "小飛"
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/loan" },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "劉羽菲｜高雄・屏東房仲",
    url: "/loan",
    title: "小飛買房貸款試算｜銀行願意貸，不代表你一定適合買",
    description:
      "不是只算你能貸多少，而是幫你判斷這間房買下去會不會太硬。含自備款總需求、寬限期後月付、兩種收支比、可買總價區間與利率壓力測試。",
    images: ["/site/hero-liu.jpg"]
  },
  twitter: {
    card: "summary_large_image",
    title: "小飛買房貸款試算",
    description: "不是只算你能貸多少，而是幫你判斷這間房買下去會不會太硬。",
    images: ["/site/hero-liu.jpg"]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "小飛買房貸款試算",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  inLanguage: "zh-Hant-TW",
  description:
    "購屋能力評估工具：輸入收入、負債、自備款與目標總價，計算貸款金額、交屋前所需現金、月付與寬限期後月付、銀行版與生活版收支比、建議可買總價區間與利率壓力測試。",
  offers: { "@type": "Offer", price: "0", priceCurrency: "TWD" },
  author: {
    "@type": "RealEstateAgent",
    name: PROFILE.name,
    alternateName: PROFILE.alias,
    telephone: "+886-918-959-957",
    areaServed: [
      { "@type": "City", name: "高雄市" },
      { "@type": "City", name: "屏東市" }
    ]
  }
};

export default function LoanPage() {
  return (
    <div className="site-root">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="site-header scrolled">
        <div className="container header-inner">
          <Link href="/" className="logo">
            劉羽菲<span>・房仲服務</span>
          </Link>
          <div className="header-cta">
            <Link className="btn btn-ghost pa-back" href="/">
              ← 回首頁
            </Link>
            <a className="btn btn-line" href={LINE_URL} target="_blank" rel="noopener noreferrer">
              加 LINE 諮詢
            </a>
          </div>
        </div>
      </header>

      <main id="top" className="pa-page">
        <section className="pa-hero">
          <div className="container">
            <p className="section-eyebrow">HOME AFFORDABILITY</p>
            <h1 className="pa-hero-title">小飛買房貸款試算</h1>
            <p className="pa-hero-sub">不是只算你能貸多少，而是幫你判斷這間房買下去會不會太硬。</p>
            <p className="pa-hero-lead">
              很多人以為自己買不起房，其實是被銀行卡住。
              <br />
              我先幫你看一件事 👇
              <br />
              <strong>你現在的條件，有沒有機會貸得過。</strong>
            </p>

            <p className="pa-hero-trust">
              我會一步一步幫你試算，你放心填 👍
              <br />
              這些資料<strong>只留在你自己的手機或電腦裡</strong>，不會送出、我這邊看不到，也不會主動聯絡你。
            </p>

            <p className="pa-hero-desc">
              銀行回答的是「你可以借多少」，這個工具想回答的是「你適合買多少」。
              能貸，不代表一定要貸滿；買房不是把現金全部壓下去，手上要留生活的空間。
            </p>
            <ul className="pa-hero-points">
              <li>我買不買得起？</li>
              <li>建議看多少總價？</li>
              <li>自備款夠不夠？</li>
              <li>月付會不會太硬？</li>
              <li>寬限期結束後會不會突然變重？</li>
            </ul>
          </div>
        </section>

        <section className="pa-main">
          <div className="container">
            <PurchaseAdvisor contactHref="/#contact" />
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <p className="footer-name">{PROFILE.name}（{PROFILE.alias}）</p>
            <p>高屏房仲・專業房產顧問｜買房前想先算清楚，隨時找我聊聊。</p>
          </div>
          <div className="footer-contact">
            <a href={`tel:${PROFILE.phoneRaw}`}>{PROFILE.phone}</a>
            <a href={LINE_URL} target="_blank" rel="noopener noreferrer">LINE 諮詢</a>
            <Link href="/">回首頁</Link>
            <Link href="/card">電子名片</Link>
          </div>
        </div>
        <p className="footer-copyright">© {new Date().getFullYear()} 劉羽菲房仲服務. All rights reserved.</p>
      </footer>
    </div>
  );
}

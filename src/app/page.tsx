import type { Metadata } from "next";
import SiteHome from "@/app/_components/SiteHome";
import "./site.css";

export const metadata: Metadata = {
  title: "劉羽菲（小飛）｜高雄・屏東房仲｜買賣租賃・家具租賃・影音拍攝・稅務諮詢・簡易裝潢",
  description:
    "劉羽菲（小飛），深耕高雄市、屏東市的專業房仲，提供房屋買賣租賃、家具租賃服務、影音拍攝、稅務諮詢、簡易裝潢一站式服務。歡迎留下資料或加 LINE 免費諮詢。",
  keywords: [
    "高雄房仲", "屏東房仲", "劉羽菲", "小飛", "房屋買賣", "房屋租賃",
    "家具租賃", "影音拍攝", "稅務諮詢", "簡易裝潢", "高雄買房", "屏東買房"
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    siteName: "劉羽菲｜高雄・屏東房仲",
    title: "劉羽菲（小飛）｜高雄・屏東房仲 專業服務",
    description: "房屋買賣租賃、家具租賃、影音拍攝、稅務諮詢、簡易裝潢一站式服務。留下資料或加 LINE 免費諮詢。",
    images: ["/site/hero-liu.jpg"]
  },
  twitter: {
    card: "summary_large_image",
    title: "劉羽菲（小飛）｜高雄・屏東房仲 專業服務",
    description: "房屋買賣租賃、家具租賃、影音拍攝、稅務諮詢、簡易裝潢一站式服務。",
    images: ["/site/hero-liu.jpg"]
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "劉羽菲",
  alternateName: "小飛",
  image: "/site/hero-liu.jpg",
  telephone: "+886-918-959-957",
  areaServed: [
    { "@type": "City", name: "高雄市" },
    { "@type": "City", name: "屏東市" }
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: "高雄市",
    addressRegion: "高雄市",
    addressCountry: "TW"
  },
  sameAs: ["https://line.me/R/ti/p/@wyb2506c"],
  award: [
    "住商不動產 2026年高屏澎東短影音 第二名",
    "住商不動產 年度風雲經紀人獎"
  ],
  makesOffer: [
    "房屋買賣租賃仲介", "家具租賃服務", "影音拍攝服務", "稅務諮詢", "簡易裝潢"
  ].map((name) => ({
    "@type": "Offer",
    itemOffered: { "@type": "Service", name }
  }))
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHome />
    </>
  );
}

import type { Metadata } from "next";
import "./globals.css";

// 部署後 Vercel 會自動帶入 VERCEL_URL；本機則用 localhost
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "劉羽菲（小飛）｜高屏房仲 免費諮詢",
  description: "高雄・屏東專業房仲劉羽菲（小飛），提供買賣租賃、家具租賃、影音拍攝、稅務諮詢、簡易裝潢。歡迎留下資料或加 LINE 免費諮詢。",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}

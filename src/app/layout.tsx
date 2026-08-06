import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "劉羽菲（小飛）｜高屏房仲 免費諮詢",
  description: "高雄・屏東專業房仲劉羽菲（小飛），提供買賣租賃、房屋估價、貸款規劃、稅務諮詢、家具租賃、影音拍攝、居家淨水、簡易裝潢一站式服務。歡迎留下資料或加 LINE 免費諮詢。",
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}

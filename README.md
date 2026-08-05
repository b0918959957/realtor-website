# 劉羽菲（小飛）｜高雄・屏東房仲官網 + 線上預約系統

高屏地區房仲個人官網，整合電子名片、線上預約與預約管理後台。

## 網站結構

| 路徑 | 說明 |
| --- | --- |
| `/` | 個人官網首頁（服務區域、戰績、服務項目、預約入口） |
| `/card` | 電子名片（可分享給客戶的個人入口） |
| `/card/booking` | 線上預約表單 |
| `/admin/appointments` | 預約管理後台（客戶溫度判定與追蹤建議） |

## 服務項目

房屋買賣租賃、家具租賃服務、影音拍攝（真人實境短影音／長影音）、稅務諮詢、簡易裝潢。

## 技術

- Next.js 16 (App Router) + React 19 + TypeScript
- 本機 JSON 儲存預約資料
- 時段撞號防護
- 客戶溫度自動判定與追蹤建議
- Slack 通知（選用）

## 本機開發

需要 Node.js 20.9 以上。

```bash
npm ci
npm run check   # TypeScript 型別檢查
npm run build   # 正式建置
npm run dev     # 開發伺服器 http://localhost:3000
```

## 環境變數

複製 `.env.example` 為 `.env.local` 後填入。全部為選用，不設定也能正常運作。

| 變數 | 用途 |
| --- | --- |
| `SLACK_WEBHOOK_URL` | 設定後，客戶送出預約時推播到 Slack 頻道 |
| `NEXT_PUBLIC_SITE_URL` | 正式網址，用於 SEO 與社群分享圖片 |

## 自訂設定

| 檔案 | 內容 |
| --- | --- |
| `src/lib/profile.ts` | 姓名、電話、Email、服務區域、社群連結 |
| `src/lib/booking.ts` | 營業時間、可預約天數、諮詢需求選項 |
| `src/lib/grading.ts` | 客戶溫度判定規則與地區關鍵字 |
| `src/app/site.css` | 官網首頁樣式（範圍化於 `.site-root`） |
| `src/app/globals.css` | 名片與後台樣式、品牌色 |
| `public/site/` | 官網圖片 |
| `public/card/` | 名片照片 |

## 資料存放

- 預約資料：`data/appointments.json`（已排除於版控外）
- 示範資料：`data/appointments.seed.json`
- 確認信預覽：`data/outbox/`（已排除於版控外）

## 正式上線注意

目前預約資料存在本機 JSON 檔。若要正式營運，建議改接具唯一鍵約束的資料庫，並補上後台身分驗證與個資保護機制。

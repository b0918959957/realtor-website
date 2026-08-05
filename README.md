# 劉羽菲（小飛）｜高雄・屏東房仲官網

高屏地區房仲個人官網，含電子名片與客戶聯絡表單，客戶送出資料後會推播到 LINE。

## 網站結構

| 路徑 | 說明 |
| --- | --- |
| `/` | 官網首頁（服務區域、戰績、服務項目、聯絡表單） |
| `/card` | 電子名片（可分享給客戶的個人入口） |
| `/api/contact` | 接收聯絡表單並推播通知 |

## 服務項目

房屋買賣租賃、家具租賃服務、影音拍攝（真人實境短影音／長影音）、稅務諮詢、簡易裝潢。

## 客戶聯絡流程

1. 客戶在官網填寫表單：姓名、電話、LINE ID、偏好聯絡方式與時段、需求、預計處理時間、備註
2. 送出後透過 LINE Messaging API 把完整資料推播到本人 LINE
3. 若同時設定 Slack，會再推一份作為備援
4. 兩個管道都失敗時，會明確告訴客戶送出失敗並請他直接來電，不會靜默漏單

網站不儲存客戶資料，僅即時轉發通知。

## 技術

- Next.js 16 (App Router) + React 19 + TypeScript
- 無資料庫、無後台，完全無狀態，適合部署在 Vercel

## 本機開發

需要 Node.js 20.9 以上。

```bash
npm ci
npm run check   # TypeScript 型別檢查
npm run build   # 正式建置
npm run dev     # 開發伺服器 http://localhost:3000
```

## 環境變數

複製 `.env.example` 為 `.env.local` 填入，或在 Vercel 專案設定中新增。

| 變數 | 必填 | 用途 |
| --- | --- | --- |
| `LINE_CHANNEL_ACCESS_TOKEN` | ✅ | LINE Messaging API 金鑰 |
| `LINE_TO_USER_ID` | ✅ | 接收通知的 LINE user ID |
| `SLACK_WEBHOOK_URL` | — | 備援通知管道 |
| `NEXT_PUBLIC_SITE_URL` | — | 正式網址，用於 SEO 與分享圖片 |

未設定 LINE 相關變數時，表單會回報送出失敗，避免客戶以為已送達。

## 自訂設定

| 檔案 | 內容 |
| --- | --- |
| `src/lib/profile.ts` | 姓名、電話、Email、服務區域、LINE 連結 |
| `src/lib/contact.ts` | 表單的需求選項、時段選項 |
| `src/lib/line-notify.ts` | 通知訊息格式 |
| `src/app/site.css` | 官網樣式（範圍化於 `.site-root`） |
| `src/app/globals.css` | 名片樣式與品牌色 |
| `public/site/` · `public/card/` | 圖片 |

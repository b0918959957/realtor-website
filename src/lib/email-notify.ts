import { buildEnquiryMessage } from "@/lib/line-notify";
import { PROFILE } from "@/lib/profile";
import {
  contactMethodLabel,
  contactTimeLabel,
  intentLabel,
  urgencyLabel,
  type ContactEnquiry
} from "@/lib/contact";

/**
 * 透過 FormSubmit 把客戶詢問寄到指定信箱。
 * 這個服務不需要 API key，第一次收信時點一次啟用連結即可。
 *
 * 預設寄到 profile 裡的信箱，可用 CONTACT_EMAIL 覆蓋。
 */
export async function notifyEmail(enquiry: ContactEnquiry) {
  const email = process.env.CONTACT_EMAIL?.trim() || PROFILE.email;
  if (!email) return { sent: false, reason: "未設定收件信箱" };

  // FormSubmit 會擋掉沒有來源標頭的請求，必須帶上網站網址
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: siteUrl,
        Referer: `${siteUrl}/`
      },
      body: JSON.stringify({
        _subject: `【網站來客】${enquiry.name}｜${enquiry.intent.map(intentLabel).join("、")}`,
        _template: "table",
        姓名: enquiry.name,
        電話: enquiry.phone,
        LINE_ID: enquiry.lineId || "未填",
        偏好聯絡方式: contactMethodLabel(enquiry.preferredMethod),
        方便聯絡時段: contactTimeLabel(enquiry.preferredTime),
        需求: enquiry.intent.map(intentLabel).join("、"),
        預計處理: urgencyLabel(enquiry.urgency),
        客戶說明: enquiry.note || "未填",
        完整內容: buildEnquiryMessage(enquiry)
      }),
      signal: AbortSignal.timeout(9000)
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[email] 寄送失敗：", response.status, detail);
      return { sent: false, reason: `信件服務回應 ${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("[email] 寄送發生錯誤：", error);
    return { sent: false, reason: "寄送發生錯誤" };
  }
}

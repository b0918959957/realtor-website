import { buildEnquiryMessage } from "@/lib/line-notify";
import type { ContactEnquiry } from "@/lib/contact";

/**
 * 把客戶詢問推到 Slack（備援通知管道）。
 * 未設定 SLACK_WEBHOOK_URL 時直接跳過。
 */
export async function notifySlack(enquiry: ContactEnquiry) {
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhook) return { sent: false, reason: "未設定 SLACK_WEBHOOK_URL" };

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: buildEnquiryMessage(enquiry) }),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[slack] 回應非 200：", response.status, detail);
      return { sent: false, reason: `Slack 回應 ${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("[slack] 發送失敗：", error);
    return { sent: false, reason: "發送失敗" };
  }
}

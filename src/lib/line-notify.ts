import {
  contactMethodLabel,
  contactTimeLabel,
  intentLabel,
  urgencyLabel,
  type ContactEnquiry
} from "@/lib/contact";

const PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

function formatTaipeiTime(iso: string) {
  const date = new Date(iso);
  const taipei = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, "0");
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${taipei.getUTCFullYear()}/${pad(taipei.getUTCMonth() + 1)}/${pad(taipei.getUTCDate())}（${
    weekdays[taipei.getUTCDay()]
  }）${pad(taipei.getUTCHours())}:${pad(taipei.getUTCMinutes())}`;
}

/** 組出要推播到 LINE 的訊息內容（包含客戶填寫的全部資料） */
export function buildEnquiryMessage(enquiry: ContactEnquiry) {
  const lines = [
    "🔔 網站有新的客戶詢問",
    "",
    `👤 姓名：${enquiry.name}`,
    `📞 電話：${enquiry.phone}`
  ];

  if (enquiry.lineId) lines.push(`💬 LINE ID：${enquiry.lineId}`);

  lines.push(
    `📲 偏好聯絡方式：${contactMethodLabel(enquiry.preferredMethod)}`,
    `🕐 方便聯絡時段：${contactTimeLabel(enquiry.preferredTime)}`,
    "",
    `🏠 需求：${enquiry.intent.map(intentLabel).join("、") || "未選"}`,
    `⏳ 預計處理：${urgencyLabel(enquiry.urgency)}`
  );

  if (enquiry.note) {
    lines.push("", "📝 客戶說明：", enquiry.note);
  }

  lines.push("", `⏰ 送出時間：${formatTaipeiTime(enquiry.submittedAt)}`);

  return lines.join("\n");
}

/**
 * 用 LINE Messaging API 把客戶資料推播到指定的 LINE 帳號。
 * 未設定金鑰時直接跳過，不會讓表單送出失敗。
 */
export async function notifyLine(enquiry: ContactEnquiry) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim();
  const to = process.env.LINE_TO_USER_ID?.trim();

  if (!token || !to) {
    return { sent: false, reason: "未設定 LINE_CHANNEL_ACCESS_TOKEN 或 LINE_TO_USER_ID" };
  }

  try {
    const response = await fetch(PUSH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text: buildEnquiryMessage(enquiry) }]
      }),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[line] 推播失敗：", response.status, detail);
      return { sent: false, reason: `LINE 回應 ${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("[line] 推播發生錯誤：", error);
    return { sent: false, reason: "推播發生錯誤" };
  }
}

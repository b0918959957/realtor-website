import { formatSlotTaipei, intentLabel, meetTypeLabel, urgencyLabel } from "@/lib/booking";
import type { Appointment } from "@/lib/appointment-store";

const HEAT_LABEL: Record<string, string> = {
  high: ":fire: 高溫",
  mid: ":sunny: 中溫",
  low: ":snowflake: 低溫"
};

/**
 * 把新預約推到 Slack。
 * 未設定 SLACK_WEBHOOK_URL 時直接跳過，不影響預約流程。
 */
export async function notifySlack(appointment: Appointment) {
  const webhook = process.env.SLACK_WEBHOOK_URL?.trim();
  if (!webhook) return { sent: false, reason: "未設定 SLACK_WEBHOOK_URL" };

  const heat = HEAT_LABEL[appointment.aiHeat] ?? appointment.aiHeat;
  const intents = appointment.intent.map(intentLabel).join("、");

  const payload = {
    text: `新預約：${appointment.name}（${formatSlotTaipei(appointment.slotIso)}）`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "📅 收到新的預約諮詢", emoji: true }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*客戶姓名*\n${appointment.name}` },
          { type: "mrkdwn", text: `*客戶溫度*\n${heat}` },
          { type: "mrkdwn", text: `*電話*\n<tel:${appointment.phone}|${appointment.phone}>` },
          { type: "mrkdwn", text: `*Email*\n${appointment.email}` },
          { type: "mrkdwn", text: `*預約時段*\n${formatSlotTaipei(appointment.slotIso)}` },
          { type: "mrkdwn", text: `*見面方式*\n${meetTypeLabel(appointment.meetType)}` },
          { type: "mrkdwn", text: `*諮詢需求*\n${intents}` },
          { type: "mrkdwn", text: `*預計處理*\n${urgencyLabel(appointment.urgency)}` }
        ]
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*客戶說明*\n>${appointment.note.replaceAll("\n", "\n>")}` }
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*建議下一步*\n${appointment.aiNextAction}` }
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: `預約編號 \`${appointment.id}\`` }]
      }
    ]
  };

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

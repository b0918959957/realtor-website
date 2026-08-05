import { NextResponse } from "next/server";
import {
  CONTACT_METHOD_KEYS,
  CONTACT_TIME_KEYS,
  INTENT_KEYS,
  URGENCY_KEYS,
  type ContactEnquiry
} from "@/lib/contact";
import { notifyLine } from "@/lib/line-notify";
import { notifySlack } from "@/lib/slack-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const lineId = String(body.lineId || "").trim();
    const preferredMethod = String(body.preferredMethod || "").trim();
    const preferredTime = String(body.preferredTime || "").trim();
    const urgency = String(body.urgency || "").trim();
    const note = String(body.note || "").trim();
    const intent = Array.isArray(body.intent) ? body.intent.map(String) : [];

    if (!name || name.length > 80) return bad("請填寫姓名。");
    if (!/^[0-9+() -]{8,20}$/.test(phone)) return bad("電話格式看起來不正確。");
    if (lineId.length > 80) return bad("LINE ID 太長了。");
    if (!CONTACT_METHOD_KEYS.includes(preferredMethod)) return bad("請選擇偏好的聯絡方式。");
    if (!CONTACT_TIME_KEYS.includes(preferredTime)) return bad("請選擇方便聯絡的時段。");
    if (!intent.length || !intent.every((key: string) => INTENT_KEYS.includes(key))) {
      return bad("請至少選擇一個需求。");
    }
    if (!URGENCY_KEYS.includes(urgency)) return bad("請選擇預計處理時間。");
    if (note.length > 2000) return bad("需求說明太長了。");

    const enquiry: ContactEnquiry = {
      name,
      phone,
      lineId,
      preferredMethod,
      preferredTime,
      intent,
      urgency,
      note,
      submittedAt: new Date().toISOString()
    };

    // 同時送往 LINE 與 Slack，任一個成功就算送達
    const [line, slack] = await Promise.all([
      notifyLine(enquiry).catch(() => ({ sent: false, reason: "例外" })),
      notifySlack(enquiry).catch(() => ({ sent: false, reason: "例外" }))
    ]);

    if (!line.sent && !slack.sent) {
      console.error("[contact] 所有通知管道皆失敗", { line, slack, name, phone });
      return NextResponse.json(
        {
          ok: false,
          error: "系統暫時無法送出，請直接來電或加 LINE 與我聯繫，造成不便敬請見諒。"
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact]", error);
    return NextResponse.json(
      { ok: false, error: "系統忙碌，請稍後重試，或直接來電與我聯繫。" },
      { status: 500 }
    );
  }
}

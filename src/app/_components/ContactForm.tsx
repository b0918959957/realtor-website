"use client";

import { useState } from "react";
import {
  CONTACT_METHODS,
  CONTACT_TIMES,
  INTENTS,
  URGENCIES,
  contactMethodLabel,
  contactTimeLabel,
  intentLabel,
  urgencyLabel
} from "@/lib/contact";
import { PROFILE } from "@/lib/profile";

/**
 * 直接從瀏覽器寄信給本人。
 *
 * 必須在瀏覽器端執行：FormSubmit 有 Cloudflare 機器人防護，
 * 從 Vercel 伺服器（資料中心 IP）發送會被擋成 403 挑戰頁，
 * 由客戶的瀏覽器發送才會通過。
 */
async function sendEmailFromBrowser(payload: Record<string, unknown>) {
  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(PROFILE.email)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    }
  );
  if (!response.ok) throw new Error(`FormSubmit ${response.status}`);
  const data = await response.json().catch(() => ({}));
  if (String(data.success) !== "true") throw new Error(data.message || "FormSubmit 失敗");
}

type Status = "idle" | "sending" | "done" | "error";

export default function ContactForm({ lineUrl }: { lineUrl: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [intent, setIntent] = useState<string[]>([]);

  const toggleIntent = (key: string) => {
    setIntent((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!intent.length) {
      setError("請至少選擇一個需求。");
      return;
    }

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      phone: String(form.get("phone") || ""),
      lineId: String(form.get("lineId") || ""),
      preferredMethod: String(form.get("preferredMethod") || ""),
      preferredTime: String(form.get("preferredTime") || ""),
      urgency: String(form.get("urgency") || ""),
      note: String(form.get("note") || ""),
      intent
    };

    setStatus("sending");

    // 兩條路並行：伺服器負責 LINE／Slack，瀏覽器直接負責寄信。
    // 任一條成功就算送達，不讓單一服務故障擋住客戶。
    const [server, mail] = await Promise.allSettled([
      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || "通知失敗");
        return data;
      }),
      sendEmailFromBrowser({
        _subject: `【網站來客】${payload.name}｜${intent.map(intentLabel).join("、")}`,
        _template: "table",
        姓名: payload.name,
        電話: payload.phone,
        LINE_ID: payload.lineId || "未填",
        偏好聯絡方式: contactMethodLabel(payload.preferredMethod),
        方便聯絡時段: contactTimeLabel(payload.preferredTime),
        需求: intent.map(intentLabel).join("、"),
        預計處理: urgencyLabel(payload.urgency),
        客戶說明: payload.note || "未填"
      })
    ]);

    if (server.status === "fulfilled" || mail.status === "fulfilled") {
      setStatus("done");
      return;
    }

    // 兩條路都失敗才顯示錯誤，並保留伺服器回傳的驗證訊息
    const serverMessage =
      server.status === "rejected" ? (server.reason as Error)?.message : "";
    setStatus("error");
    setError(
      serverMessage && !serverMessage.includes("通知失敗")
        ? serverMessage
        : "送出失敗，請直接來電 0918-959-957 或加 LINE 與我聯繫。"
    );
  };

  if (status === "done") {
    return (
      <div className="contact-card contact-done">
        <div className="contact-done-icon" aria-hidden="true">✓</div>
        <h3>已收到您的資料</h3>
        <p>感謝您的填寫，我會盡快與您聯繫。若有急件，歡迎直接加 LINE 或來電。</p>
        <a className="btn btn-line btn-block" href={lineUrl} target="_blank" rel="noopener noreferrer">
          順便加 LINE 好友
        </a>
      </div>
    );
  }

  return (
    <form className="contact-card" onSubmit={handleSubmit}>
      <h3>留下資料，我與您聯繫</h3>
      <p className="contact-lead">填寫後我會收到通知，並依您方便的時段主動聯絡。</p>

      <div className="form-row">
        <label htmlFor="name">姓名 <span className="required">*</span></label>
        <input id="name" name="name" type="text" required maxLength={80} placeholder="請輸入您的姓名" />
      </div>

      <div className="form-row">
        <label htmlFor="phone">聯絡電話 <span className="required">*</span></label>
        <input id="phone" name="phone" type="tel" required placeholder="例如 0912-345-678" />
      </div>

      <div className="form-row">
        <label htmlFor="lineId">LINE ID<span className="optional">（選填）</span></label>
        <input id="lineId" name="lineId" type="text" maxLength={80} placeholder="方便用 LINE 聯絡的話可留下" />
      </div>

      <div className="form-row">
        <span className="form-label">偏好聯絡方式 <span className="required">*</span></span>
        <div className="chip-row">
          {CONTACT_METHODS.map((method, index) => (
            <label className="chip" key={method.key}>
              <input
                type="radio"
                name="preferredMethod"
                value={method.key}
                defaultChecked={index === 0}
                required
              />
              <span>{method.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <span className="form-label">方便聯絡時段 <span className="required">*</span></span>
        <div className="chip-row">
          {CONTACT_TIMES.map((time, index) => (
            <label className="chip" key={time.key}>
              <input
                type="radio"
                name="preferredTime"
                value={time.key}
                defaultChecked={index === 0}
                required
              />
              <span>{time.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <span className="form-label">我想諮詢 <span className="required">*</span>（可複選）</span>
        <div className="chip-row">
          {INTENTS.map((item) => (
            <label className={`chip${intent.includes(item.key) ? " chip-on" : ""}`} key={item.key}>
              <input
                type="checkbox"
                checked={intent.includes(item.key)}
                onChange={() => toggleIntent(item.key)}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <span className="form-label">預計處理時間 <span className="required">*</span></span>
        <div className="chip-row">
          {URGENCIES.map((item, index) => (
            <label className="chip" key={item.key}>
              <input
                type="radio"
                name="urgency"
                value={item.key}
                defaultChecked={index === 0}
                required
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="note">想說的話<span className="optional">（選填）</span></label>
        <textarea id="note" name="note" rows={3} maxLength={2000} placeholder="例如：想在三民區找三房，預算約 1,200 萬" />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <button type="submit" className="btn btn-primary btn-block" disabled={status === "sending"}>
        {status === "sending" ? "送出中…" : "送出資料"}
      </button>

      <p className="form-note">您的資料僅用於與您聯繫，不會提供給第三方。</p>
    </form>
  );
}

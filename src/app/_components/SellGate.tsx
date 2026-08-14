"use client";

import { useState } from "react";

export default function SellGate({ lineUrl }: { lineUrl: string }) {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/sell-gate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        window.location.reload();
        return;
      }
      setError(data.error || "通關密語不正確。");
    } catch {
      setError("連線發生問題，請稍後再試。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="st-gate">
      <div className="st-gate-card">
        <p className="st-gate-eyebrow">限定工具</p>
        <h1 className="st-gate-title">小飛賣房稅費＆實拿試算</h1>
        <p className="st-gate-sub">別只看賣多少，真正重要的是最後拿回多少。</p>

        <p className="st-gate-desc">
          這個工具沒有公開，只提供給加入小飛 LINE 的屋主使用。
          <br />
          請輸入通關密語，或先加 LINE 向小飛索取。
        </p>

        <form onSubmit={submit} className="st-gate-form">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="請輸入通關密語"
            autoComplete="off"
            aria-label="通關密語"
          />
          <button type="submit" className="btn btn-primary" disabled={busy || !passcode.trim()}>
            {busy ? "確認中…" : "進入試算"}
          </button>
        </form>

        {error ? <p className="st-gate-error">{error}</p> : null}

        <a className="btn btn-line st-gate-line" href={lineUrl} target="_blank" rel="noopener noreferrer">
          加 LINE 向小飛索取密語
        </a>

        <p className="st-gate-foot">
          劉羽菲（小飛）｜高屏房仲・專業房產顧問
          <br />
          成交是結果，信任才是我的專業。
        </p>
      </div>
    </div>
  );
}

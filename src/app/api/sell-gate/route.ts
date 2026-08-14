import { NextResponse } from "next/server";
import { GATE_COOKIE, GATE_MAX_AGE, gateToken, verifyPasscode } from "@/lib/sell-gate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 同一個 IP 的錯誤次數，避免有人暴力猜密碼 */
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd ? fwd.split(",")[0] : "").trim() || "unknown";
}

export async function POST(request: Request) {
  const key = clientKey(request);
  const now = Date.now();
  const record = attempts.get(key);

  if (record && record.until > now && record.count >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { ok: false, error: "嘗試次數過多，請稍後再試，或直接聯絡小飛。" },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));

  if (!verifyPasscode(body?.passcode)) {
    const next = record && record.until > now ? record.count + 1 : 1;
    attempts.set(key, { count: next, until: now + WINDOW_MS });
    return NextResponse.json({ ok: false, error: "通關密語不正確。" }, { status: 401 });
  }

  attempts.delete(key);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE, gateToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GATE_MAX_AGE
  });
  return response;
}

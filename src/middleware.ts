import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 後台保護：/admin/* 與 /api/appointments/*（複數，管理用 API）需要帳密。
 * 客戶預約流程用的 /api/appointment/*（單數）維持公開。
 *
 * 密碼設定於環境變數 ADMIN_PASSWORD。
 * 正式環境若未設定密碼，一律拒絕存取，避免客戶個資外洩。
 */

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function unauthorized(message: string) {
  return new NextResponse(message, {
    status: 401,
    headers: {
      // HTTP header 只能是 ASCII，realm 不可使用中文
      "WWW-Authenticate": 'Basic realm="Appointment Admin", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}

export function middleware(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USER?.trim() || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD?.trim();

  if (!expectedPass) {
    // 本機開發未設密碼時放行，方便直接操作
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.next();
    }
    return new NextResponse(
      "後台尚未設定密碼（環境變數 ADMIN_PASSWORD），為保護客戶資料已停用存取。",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) {
    return unauthorized("需要登入才能檢視預約管理後台。");
  }

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized("認證資訊格式不正確。");
  }

  const separator = decoded.indexOf(":");
  if (separator < 0) return unauthorized("認證資訊格式不正確。");

  const user = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);

  if (safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)) {
    return NextResponse.next();
  }

  return unauthorized("帳號或密碼不正確。");
}

export const config = {
  matcher: ["/admin/:path*", "/api/appointments/:path*"]
};

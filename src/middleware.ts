import { NextResponse, type NextRequest } from "next/server";

/**
 * 網址大小寫容錯。
 *
 * 手機鍵盤會自動把網址第一個字母變大寫，屋主手打 /Sell 會吃到 404。
 *
 * ⚠️ 不要改用 next.config.ts 的 redirects() 做這件事 ——
 *    它的 source 比對「不分大小寫」，寫 /Sell 會連 /sell 自己一起命中，
 *    造成無限重導，整個工具會打不開（2026-08-14 踩過這個坑）。
 *    這裡用 JS 的 !== 比對，是分大小寫的，只有真的有大寫時才導向。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lower = pathname.toLowerCase();

  if (pathname !== lower) {
    const url = request.nextUrl.clone();
    url.pathname = lower;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // 只看一般頁面路徑，跳過 API、Next 靜態資源與有副檔名的檔案
  matcher: ["/((?!api|_next/static|_next/image|.*\\.).*)"]
};

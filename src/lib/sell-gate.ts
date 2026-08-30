/**
 * /sell 試算工具的密碼閘門。
 *
 * 設計重點：
 *  1. 密碼比對在「伺服器端」做，前端拿不到密碼，看原始碼也挖不出來。
 *  2. Cookie 存的是由密碼推導出來的雜湊 token，不是密碼本身。
 *     → 只要換掉密碼，所有舊 Cookie 立刻失效，不用一個一個踢人。
 *  3. 密碼只讀環境變數 SELL_TOOL_PASSCODE，程式碼裡不留預設密碼。
 *     沒設定時 isGateConfigured() 會是 false，頁面顯示「維護中」而不是放行。
 *     → 門壞掉時應該是「打不開」，不是「自動敞開」。
 *       （原本有一組寫死的預設密碼，但 GitHub 是公開的，等於門上貼著鑰匙。）
 */

import { createHmac, timingSafeEqual } from "crypto";

export const GATE_COOKIE = "xf_sell_pass";
/** Cookie 有效期：90 天 */
export const GATE_MAX_AGE = 60 * 60 * 24 * 90;

function currentPasscode(): string | null {
  const v = process.env.SELL_TOOL_PASSCODE?.trim();
  return v && v.length > 0 ? v : null;
}

/** 環境變數有沒有設好。false 代表工具應該關閉，不是放行 */
export function isGateConfigured(): boolean {
  return currentPasscode() !== null;
}

function secret(): string {
  return process.env.SELL_TOOL_SECRET?.trim() || "xiaofei-sell-tool-v1";
}

/** 由目前密碼推導出的 token；密碼一改，token 就變，舊 Cookie 自動失效。
 *  沒設定密碼時回傳空字串，代表沒有任何 token 有效。 */
export function gateToken(): string {
  const pass = currentPasscode();
  if (!pass) return "";
  return createHmac("sha256", secret()).update(pass).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** 驗證使用者輸入的密碼（忽略大小寫與前後空白） */
export function verifyPasscode(input: unknown): boolean {
  const pass = currentPasscode();
  if (!pass) return false;
  const given = String(input ?? "").trim().toLowerCase();
  if (!given) return false;
  return safeEqual(given, pass.toLowerCase());
}

/** 驗證 Cookie 裡的 token */
export function verifyToken(token: unknown): boolean {
  const given = String(token ?? "");
  const real = gateToken();
  if (!given || !real) return false;
  return safeEqual(given, real);
}

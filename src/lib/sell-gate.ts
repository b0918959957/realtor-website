/**
 * /sell 試算工具的密碼閘門。
 *
 * 設計重點：
 *  1. 密碼比對在「伺服器端」做，前端拿不到密碼，看原始碼也挖不出來。
 *  2. Cookie 存的是由密碼推導出來的雜湊 token，不是密碼本身。
 *     → 只要換掉密碼，所有舊 Cookie 立刻失效，不用一個一個踢人。
 *  3. 密碼優先讀環境變數 SELL_TOOL_PASSCODE；沒設定時用預設值，
 *     這樣即使忘了設環境變數，工具也不會整個打不開。
 */

import { createHmac, timingSafeEqual } from "crypto";

/** 沒有設定環境變數時的預設通關密語 */
const DEFAULT_PASSCODE = "feifei2026";

export const GATE_COOKIE = "xf_sell_pass";
/** Cookie 有效期：90 天 */
export const GATE_MAX_AGE = 60 * 60 * 24 * 90;

function currentPasscode(): string {
  const v = process.env.SELL_TOOL_PASSCODE?.trim();
  return v && v.length > 0 ? v : DEFAULT_PASSCODE;
}

function secret(): string {
  return process.env.SELL_TOOL_SECRET?.trim() || "xiaofei-sell-tool-v1";
}

/** 由目前密碼推導出的 token；密碼一改，token 就變，舊 Cookie 自動失效 */
export function gateToken(): string {
  return createHmac("sha256", secret()).update(currentPasscode()).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** 驗證使用者輸入的密碼（忽略大小寫與前後空白） */
export function verifyPasscode(input: unknown): boolean {
  const given = String(input ?? "").trim().toLowerCase();
  const real = currentPasscode().toLowerCase();
  if (!given) return false;
  return safeEqual(given, real);
}

/** 驗證 Cookie 裡的 token */
export function verifyToken(token: unknown): boolean {
  const given = String(token ?? "");
  if (!given) return false;
  return safeEqual(given, gateToken());
}

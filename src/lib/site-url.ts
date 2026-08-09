/**
 * 取得網站的正式網址。
 *
 * 注意：Vercel 的 VERCEL_URL 是「每次部署都會變」的專屬網址
 * （例如 realtor-website-ari4j73vt-fei18.vercel.app），
 * 不能拿來當對外網址 —— FormSubmit 這類服務會依網域驗證，
 * 網域一直變就會一直被要求重新啟用。
 *
 * VERCEL_PROJECT_PRODUCTION_URL 看似是正式網域，但實測（2026-08-09 接上自訂網域後）
 * 它回傳的仍是 .vercel.app 的舊網址，不會跟著自訂網域走，所以不能用。
 * 正式網域已買斷、不會再變，直接寫死最可靠。
 */
const PRODUCTION_URL = "https://yufeihouse.com";

export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  if (process.env.VERCEL_ENV === "production") return PRODUCTION_URL;

  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return `https://${deployment}`;

  return "http://localhost:3000";
}

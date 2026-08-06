/**
 * 取得網站的正式網址。
 *
 * 注意：Vercel 的 VERCEL_URL 是「每次部署都會變」的專屬網址
 * （例如 realtor-website-ari4j73vt-fei18.vercel.app），
 * 不能拿來當對外網址 —— FormSubmit 這類服務會依網域驗證，
 * 網域一直變就會一直被要求重新啟用。
 *
 * VERCEL_PROJECT_PRODUCTION_URL 才是固定的正式網域。
 */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production}`;

  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return `https://${deployment}`;

  return "http://localhost:3000";
}

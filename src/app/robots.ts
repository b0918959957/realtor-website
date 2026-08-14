import type { MetadataRoute } from "next";

/**
 * 官網其餘頁面照常開放收錄；
 * /sell（賣房實拿試算）是不公開工具，明確擋掉搜尋引擎。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/sell", "/sell/", "/api/"]
      }
    ]
  };
}

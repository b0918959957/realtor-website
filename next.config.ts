import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 課堂上常直接開 127.0.0.1；允許本機開發資源，不放寬外部網域。
  allowedDevOrigins: ["127.0.0.1"],

  /**
   * 手機鍵盤會自動把網址第一個字母變大寫，屋主手打 /Sell 會吃到 404。
   * 這裡把常見的大小寫寫法通通導回正確路徑。
   */
  async redirects() {
    const caseVariants = (path: string) => {
      const lower = path.toLowerCase();
      const upperFirst = lower.charAt(0).toUpperCase() + lower.slice(1);
      const allUpper = lower.toUpperCase();
      return [upperFirst, allUpper].map((variant) => ({
        source: `/${variant}`,
        destination: `/${lower}`,
        permanent: false
      }));
    };

    return [...caseVariants("sell"), ...caseVariants("loan"), ...caseVariants("card")];
  }
};

export default nextConfig;

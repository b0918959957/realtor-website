"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ContactForm from "@/app/_components/ContactForm";
import LoanCalculator from "@/app/_components/LoanCalculator";
import { PROFILE } from "@/lib/profile";

const LINE_URL = PROFILE.social.line;

/** 自我介紹短影音（委託前先認識我） */
const ABOUT_ME_URL = "https://www.instagram.com/reel/DQyFQoxEe72/";

function LineIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 5.94 2 10.8c0 3.15 2.13 5.9 5.36 7.47-.16.55-.83 2.84-.85 3.06 0 0-.02.16.08.22.1.06.22.02.22.02.29-.04 3.36-2.2 3.9-2.59.7.1 1.44.15 2.29.15 5.52 0 10-3.94 10-8.8S17.52 2 12 2z" />
    </svg>
  );
}

function PhoneIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.7 21 3 13.3 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8z" />
    </svg>
  );
}

function PinIcon({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 21s-7-6.5-7-11.5A7 7 0 0 1 19 9.5C19 14.5 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function GlobeIcon({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-6-3.8-9s1.3-6.4 3.8-9z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" />
    </svg>
  );
}

const STATS = [
  { count: 34, suffix: "萬+", label: "單支影片最高觀看次數" },
  { count: 132, suffix: "萬+", label: "精選 10 支影片累積觀看" },
  { count: 5, suffix: "大", label: "社群平台同步曝光" },
  { count: 10, suffix: "項", label: "一站式服務內容" }
];

/** 獲獎紀錄。url 填入後該張卡片會變成可點擊連結。 */
const AWARDS: { org: string; title: string; url?: string }[] = [
  {
    org: "住商不動產",
    title: "2026年高屏澎東短影音 第二名",
    url: "https://www.instagram.com/p/DbKVJbTkQi4/"
  },
  {
    org: "住商不動產",
    title: "年度風雲經紀人獎",
    url: "https://www.instagram.com/reel/C43Bs67pUKs/"
  }
];

const FEATURES = [
  {
    title: "多平台強力曝光",
    text: "YouTube、Facebook、Instagram、Threads、TikTok 五大平台同步曝光，讓更多潛在買方看見您的房子。",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.8 6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-6-3.8-9s1.3-6.4 3.8-9z" />
      </svg>
    )
  },
  {
    title: "每份物件皆提供市場分析報告",
    text: "依據實價登錄、行情趨勢與競品分析，擬定最適合的銷售策略。",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M4 19V6M10 19V10M16 19V4M4 19h16" />
      </svg>
    )
  },
  {
    title: "誠信服務・全程陪伴",
    text: "從委託、行銷、帶看、議價到交屋，主動回報每個進度，讓您安心每一步。",
    icon: (
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M12 21s-7-4.35-9.5-9C.6 8.1 2.6 4 6.5 4 9 4 11 5.7 12 7c1-1.3 3-3 5.5-3 3.9 0 5.9 4.1 4 8-2.5 4.65-9.5 9-9.5 9z" />
      </svg>
    )
  }
];

/**
 * 影音作品（依觀看數由高至低排序）。
 * url 填入後卡片可點擊；views 留空則不顯示觀看數。
 */
const VIDEOS: { name: string; views?: string; url?: string }[] = [
  {
    name: "房東一定要知道的租屋四大新制",
    views: "34萬",
    url: "https://www.facebook.com/share/r/1BejFksdcH/"
  },
  {
    name: "房貸繳完不等於房子歸你",
    views: "26.6萬",
    url: "https://www.facebook.com/share/v/1CEULtobNu/"
  },
  {
    name: "新屋為何沒瓦斯・保命設計揭秘",
    views: "18萬",
    url: "https://www.facebook.com/share/r/1FDe5MTthN/"
  },
  {
    name: "千萬不要隨便辦印鑑證明",
    views: "13.8萬",
    url: "https://www.instagram.com/reel/DRRxKPaEYg6/"
  },
  {
    name: "高雄左營人必吃清單公開",
    views: "11.6萬",
    url: "https://www.instagram.com/reel/DQG73BEkXF-/"
  },
  {
    name: "首購族的 20 個注意事項",
    views: "8.8萬",
    url: "https://www.instagram.com/reel/DMcxRkozhQq/"
  },
  {
    name: "黑心房仲不告訴你的事",
    views: "7萬",
    url: "https://vt.tiktok.com/ZS4x9DcKQ/"
  },
  {
    name: "近義享輕軌車庫透天・3房2廳",
    views: "5.5萬",
    url: "https://www.instagram.com/reel/DauwkNLxY8q/"
  },
  {
    name: "如何合法處理遺產與銀行帳戶",
    views: "3.9萬",
    url: "https://vt.tiktok.com/ZS4x9XvxY/"
  },
  {
    name: "第一次斡旋要注意什麼？",
    views: "3萬",
    url: "https://www.facebook.com/share/r/1GRcsptm5Y/"
  }
];

/* 各社群平台的品牌圖示 */
const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M16.4 11.1c-.1 0-.2-.1-.3-.1-.2-3.2-1.9-5-4.8-5-2.6 0-4.3 1.2-4.9 3l1.8.6c.4-1.2 1.4-1.8 3-1.8 1.8 0 2.8 1 3 2.8-.7-.2-1.5-.3-2.3-.3-2.9 0-4.9 1.5-4.9 3.7 0 2.1 1.7 3.4 3.8 3.4 2.3 0 3.6-1.3 4.2-2.9.6.6 1 1.4 1.2 2.4l1.8-.5c-.3-1.4-1-2.6-1.9-3.4.3-1 .3-1.5.3-1.9zM11.6 15.6c-.9 0-1.9-.4-1.9-1.5 0-1.1 1.1-1.8 2.9-1.8.7 0 1.4.1 2 .3-.2 1.6-1.1 3-3 3z" />
    <path d="M12 1.5C5.6 1.5 1.5 5.6 1.5 12S5.6 22.5 12 22.5 22.5 18.4 22.5 12 18.4 1.5 12 1.5zm0 19.2c-5.3 0-8.7-3.4-8.7-8.7S6.7 3.3 12 3.3s8.7 3.4 8.7 8.7-3.4 8.7-8.7 8.7z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
    <path d="M16.6 2h-3v13.1a2.6 2.6 0 1 1-2.2-2.6V9.4a5.7 5.7 0 1 0 5.2 5.7V8.5a6.9 6.9 0 0 0 4 1.3V6.7a3.9 3.9 0 0 1-4-4.7z" />
  </svg>
);

/** 經營中的社群平台，url 填入後才會顯示（網址已去除分享用的追蹤參數） */
const PLATFORMS: { name: string; url?: string; key: string; icon: React.ReactNode }[] = [
  {
    name: "YouTube",
    key: "youtube",
    icon: <YouTubeIcon />,
    url: "https://www.youtube.com/channel/UCJsR5swTU7oMCotIEl4L84g"
  },
  {
    name: "Facebook",
    key: "facebook",
    icon: <FacebookIcon />,
    url: "https://www.facebook.com/liu.yu.fei.354146"
  },
  {
    name: "Instagram",
    key: "instagram",
    icon: <InstagramIcon />,
    url: "https://www.instagram.com/taiwandim/"
  },
  {
    name: "Threads",
    key: "threads",
    icon: <ThreadsIcon />,
    url: "https://www.threads.com/@taiwandim"
  },
  {
    name: "TikTok",
    key: "tiktok",
    icon: <TikTokIcon />,
    url: "https://www.tiktok.com/@user7450875561295"
  }
];

/** 受邀專訪影片（賣厝阿明 知識+ 頻道） */
const INTERVIEWS = [
  {
    title: "屏東租屋注意事項",
    url: "https://www.youtube.com/watch?v=3SDgxNTx09c"
  },
  {
    title: "只要我想飛，沒有過不了的峰・小美專訪",
    url: "https://www.youtube.com/watch?v=a6K26AnXE3s"
  }
];

const SERVICES = [
  {
    title: "買賣租賃",
    accent: "#003C7D", // 核心信賴・品牌深藍
    text: "高雄・屏東在地物件買賣與租賃仲介，從看屋、議價到過戶，全程為您把關。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
      </svg>
    )
  },
  {
    title: "房屋估價",
    accent: "#0A6EA8", // 數據分析・亮藍
    text: "依實價登錄、行情趨勢與周邊競品分析，提供合理且有依據的價格評估。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M4 19V6M10 19V10M16 19V4M4 19h16" />
      </svg>
    )
  },
  {
    title: "貸款規劃",
    accent: "#2E8B57", // 金流・綠
    text: "協助評估貸款成數與利率方案，協助銀行對接，讓資金安排更輕鬆。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="3" y="7" width="18" height="12" rx="2" />
        <circle cx="12" cy="13" r="2.5" />
        <path d="M7 7V5h10v2" />
      </svg>
    )
  },
  {
    title: "稅務諮詢",
    accent: "#12897E", // 帳務・青綠
    text: "協助釐清房地合一稅、契稅、印花稅等相關規定，讓交易過程安心透明。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M4 4h16v16H4z" />
        <path d="M8 9h8M8 13h5M8 17h8" />
      </svg>
    )
  },
  {
    title: "空屋家具租賃",
    accent: "#C98A3C", // 木質・暖金
    text: "空屋佈置家具租賃，屋主出租房子免買家具即可招租；也讓待售物件更有生活感，提升買方第一眼的好感度。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 12h18M5 12V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v5M4 12v6a1 1 0 0 0 1 1h1v2M18 19v2M19 12v6a1 1 0 0 1-1 1h-1" />
        <path d="M7 12v3M17 12v3" />
      </svg>
    )
  },
  {
    title: "樣品屋家具租賃",
    accent: "#D9A441", // 樣品屋・淺金
    text: "建案樣品屋家具租賃（僅提供家具租賃，不含軟裝），用合理成本呈現空間質感，加速成交。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M4 20h16M6 20V10l6-4 6 4v10" />
        <path d="M9 20v-5h6v5M10 11h4" />
      </svg>
    )
  },
  {
    title: "影音拍攝",
    accent: "#E4572E", // 影音活力・橘紅
    text: "真人實境短影音、長影音拍攝，用真實生活場景與第一人稱視角介紹物件，拉近與客戶的距離。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="2.5" y="6" width="13" height="12" rx="1.5" />
        <path d="M15.5 10.5 21 7v10l-5.5-3.5" />
      </svg>
    )
  },
  {
    title: "居家淨水規劃",
    accent: "#1BA5C4", // 水・水藍
    text: "依水質與居家格局評估合適的淨水配置，讓全家用水更安心。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3z" />
        <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" />
      </svg>
    )
  },
  {
    title: "裝潢設計",
    accent: "#8E6BAF", // 設計感・紫
    text: "從簡易輕裝修到設計師整體規劃都能承接，整合信賴施工團隊，依預算打造理想空間。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M14 6l4 4M3 21l4-1 11-11a2.83 2.83 0 0 0-4-4L3 16l-1 4z" />
      </svg>
    )
  },
  {
    title: "自地自建",
    accent: "#A8623A", // 建築土地・磚土色
    text: "有土地想蓋房？從法規評估、營造團隊到工程進度，陪您把想像蓋成家。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 21h18M6 21V11l6-5 6 5v10" />
        <path d="M10 21v-5h4v5M4 11l8-7 8 7" />
      </svg>
    )
  }
];

function StatNumber({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.unobserve(entry.target);
          const duration = 1400;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span className="stat-number" ref={ref}>{value}</span>;
}

export default function SiteHome() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  const closeNav = () => setNavOpen(false);

  return (
    <div className="site-root">
      <a className="skip-link" href="#contact">跳至聯絡我</a>

      <header className={`site-header${scrolled ? " scrolled" : ""}`}>
        <div className="container header-inner">
          <a href="#top" className="logo">劉羽菲<span>・房仲服務</span></a>
          <nav className={`main-nav${navOpen ? " open" : ""}`}>
            <a href="#service-area" onClick={closeNav}>服務區域</a>
            <a href="#achievements" onClick={closeNav}>我的戰績</a>
            <a href="#services" onClick={closeNav}>服務項目</a>
            <a href="#calculator" onClick={closeNav}>房貸試算</a>
            <a href="#contact" onClick={closeNav}>聯絡我</a>
            <a
              className="btn btn-line nav-line-btn"
              href={LINE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeNav}
            >
              <LineIcon size={18} />
              加 LINE 諮詢
            </a>
          </nav>
          <div className="header-cta">
            <a className="btn btn-line" href={LINE_URL} target="_blank" rel="noopener noreferrer">
              <LineIcon size={18} />
              加 LINE 諮詢
            </a>
          </div>
          <button
            className={`nav-toggle${navOpen ? " open" : ""}`}
            aria-label="開啟選單"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="hero" id="hero">
          <div className="container hero-inner">
            <div className="hero-text">
              <p className="hero-eyebrow">高屏房仲・專業房產顧問</p>
              <h1>您的在地房產夥伴<br /><span className="accent">劉羽菲（小飛）</span></h1>
              <p className="hero-desc">
                用心對待每一次託付，替您找到最適合的新主人。深耕高雄市、屏東市房產市場，從買賣租賃、房屋估價、貸款規劃到稅務諮詢、家具租賃、影音拍攝、居家淨水、裝潢設計與自地自建，一次為您搞定安家大小事。
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#contact">
                  免費諮詢・留下資料
                </a>
                <a className="btn btn-outline" href={`tel:${PROFILE.phoneRaw}`}>
                  <PhoneIcon />
                  {PROFILE.phone}
                </a>
              </div>
              <a
                className="hero-intro-link"
                href={ABOUT_ME_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="hero-intro-play" aria-hidden="true">▶</span>
                決定委託前，先花一分鐘認識我
              </a>
            </div>
            <div className="hero-photo">
              <div className="hero-photo-glow" />
              <Image
                src="/site/hero-liu.jpg"
                alt="劉羽菲（小飛）高屏房仲・專業房產顧問"
                width={1045}
                height={1567}
                priority
              />
            </div>
          </div>
          <a href="#service-area" className="scroll-indicator" aria-label="向下捲動"><span /></a>
        </section>

        {/* Service Area */}
        <section className="service-area" id="service-area">
          <div className="container">
            <p className="section-eyebrow">SERVICE AREA</p>
            <h2 className="section-title">我服務的區域</h2>
            <p className="section-desc">高雄・屏東在地深耕，熟悉行情與眉角；外縣市的需求，一樣可以交給我服務。</p>
            <div className="area-grid">
              <div className="area-card" style={{ "--accent": "#003C7D" } as React.CSSProperties}>
                <div className="area-icon"><PinIcon /></div>
                <h3>高雄市</h3>
                <p>在地深耕、實戰經驗豐富，掌握市區最新脈動與重劃區、捷運沿線行情變化。</p>
              </div>
              <div className="area-card" style={{ "--accent": "#12897E" } as React.CSSProperties}>
                <div className="area-icon"><PinIcon /></div>
                <h3>屏東市</h3>
                <p>在地經營、口碑扎根，提供屏東市買賣租賃第一手物件資訊與客製化服務。</p>
              </div>
              <div className="area-card" style={{ "--accent": "#E4572E" } as React.CSSProperties}>
                <div className="area-icon"><GlobeIcon /></div>
                <h3>外縣市</h3>
                <p>不在高屏也沒問題，買賣、委託、行情評估與後續流程一樣由我親自為您處理。</p>
              </div>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="achievements" id="achievements">
          <div className="container">
            <p className="section-eyebrow section-eyebrow-light">TRACK RECORD</p>
            <h2 className="section-title section-title-light">我的戰績</h2>
            <p className="section-desc section-desc-light">用專業與誠信累積每一份客戶的信任，用行動創造成交。</p>

            <div className="stats-grid">
              {STATS.map((stat) => (
                <div className="stat-item" key={stat.label}>
                  <StatNumber target={stat.count} />
                  <span className="stat-suffix">{stat.suffix}</span>
                  <p className="stat-label">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="awards-grid">
              {AWARDS.map((award) => {
                const inner = (
                  <>
                    <div className="award-icon"><TrophyIcon /></div>
                    <div className="award-body">
                      <p className="award-org">{award.org}</p>
                      <h3>{award.title}</h3>
                      {award.url && <span className="award-view">▶ 點我看得獎影片</span>}
                    </div>
                  </>
                );
                return award.url ? (
                  <a
                    className="award-card"
                    key={award.title}
                    href={award.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="award-card" key={award.title}>{inner}</div>
                );
              })}
            </div>

            <div className="feature-list">
              {FEATURES.map((feature) => (
                <div className="feature-item" key={feature.title}>
                  <div className="feature-icon">{feature.icon}</div>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="testimonial-block">
              <p className="testimonial-eyebrow">屋主真實回饋</p>
              <div className="testimonial-stars" aria-label="五星評價">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span className="star" key={i}>★</span>
                ))}
              </div>
              <blockquote>
                太好了！小飛，很感謝妳，也很高興妳幫我們的房子找到新主人，一切都是很好的緣份，皆大歡喜～
              </blockquote>
              <p className="testimonial-author">— 成交屋主</p>
              <div className="testimonial-mine">
                <span className="testimonial-mine-label">小飛的回覆</span>
                <p>我覺得這樣的成交，比單純賣掉更重要。謝謝您把案子交給我信任。後續由代書接手處理，群組裡有任何問題都可以隨時詢問。</p>
              </div>
            </div>

            <div className="video-showcase">
              <p className="video-showcase-title">短影音累積曝光・成績亮眼</p>
              <div className="video-grid">
                {VIDEOS.map((video) => {
                  const inner = (
                    <>
                      <span className="video-play">▶</span>
                      <p className="video-name">{video.name}</p>
                      {video.views && (
                        <p className="video-views">{video.views} 觀看次數</p>
                      )}
                    </>
                  );
                  return video.url ? (
                    <a
                      className="video-card video-card-link"
                      key={video.name}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="video-card" key={video.name}>{inner}</div>
                  );
                })}
              </div>

              {PLATFORMS.some((platform) => platform.url) && (
                <div className="platform-row">
                  <span className="platform-label">追蹤我的社群</span>
                  <div className="platform-links">
                    {PLATFORMS.filter((platform) => platform.url).map((platform) => (
                      <a
                        className={`platform-${platform.key}`}
                        key={platform.name}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {platform.icon}
                        {platform.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="media-highlight">
              <div className="media-photo">
                <Image
                  src="/site/podcast-photo.jpg"
                  alt="劉羽菲受邀出席不動產知識分享 Podcast"
                  width={1456}
                  height={1092}
                />
              </div>
              <div className="media-text">
                <h3>媒體曝光・專業口碑</h3>
                <p>受邀出席「賣厝阿明 知識+」不動產知識分享節目，與業界共同交流買房知識，持續精進專業，只為給客戶更完整的服務。</p>
                <div className="media-links">
                  {INTERVIEWS.map((item) => (
                    <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer">
                      <span className="media-play" aria-hidden="true">▶</span>
                      {item.title}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="services" id="services">
          <div className="container">
            <p className="section-eyebrow">SERVICES</p>
            <h2 className="section-title">我提供的服務項目</h2>
            <p className="section-desc">不只是買賣房屋，從搬入前到入住後，全方位守護您的居住品質。</p>
            <div className="services-grid">
              {SERVICES.map((service) => (
                <div
                  className="service-card"
                  key={service.title}
                  style={{ "--accent": service.accent } as React.CSSProperties}
                >
                  <div className="service-icon">{service.icon}</div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Loan Calculator */}
        <section className="calculator" id="calculator">
          <div className="container">
            <p className="section-eyebrow">MORTGAGE CALCULATOR</p>
            <h2 className="section-title">房貸試算</h2>
            <p className="section-desc">
              拉一拉就知道每月要繳多少、自備款要準備多少。看不懂或想知道自己實際能貸多少，直接問我。
            </p>
            <LoanCalculator contactHref="#contact" />
          </div>
        </section>

        {/* Contact */}
        <section className="booking" id="contact">
          <div className="container booking-inner">
            <div className="booking-info">
              <p className="section-eyebrow">CONTACT</p>
              <h2 className="section-title">聯絡我</h2>
              <p className="section-desc">
                不管是買屋、賣屋、租屋還是居家服務需求，留下資料或直接加 LINE，我都會盡快與您聯繫。
              </p>
              <ul className="contact-list">
                <li>
                  <span className="contact-icon"><PhoneIcon size={20} /></span>
                  <div>
                    <span className="contact-label">電話</span>
                    <a href={`tel:${PROFILE.phoneRaw}`}>{PROFILE.phone}</a>
                  </div>
                </li>
                <li>
                  <span className="contact-icon"><LineIcon size={20} /></span>
                  <div>
                    <span className="contact-label">LINE</span>
                    <a href={LINE_URL} target="_blank" rel="noopener noreferrer">@wyb2506c（點擊加好友）</a>
                  </div>
                </li>
                <li>
                  <span className="contact-icon"><PinIcon size={20} /></span>
                  <div>
                    <span className="contact-label">服務區域</span>
                    <span>{PROFILE.address}</span>
                  </div>
                </li>
              </ul>

              <a className="btn btn-line btn-block booking-line-btn" href={LINE_URL} target="_blank" rel="noopener noreferrer">
                <LineIcon />
                加 LINE 直接詢問
              </a>
            </div>

            <ContactForm lineUrl={LINE_URL} />
          </div>
        </section>
      </main>

      <p className="closing-tagline">
        我相信，每一間房子都在等待真正適合它的主人；
        <br />
        而每一次買賣，都不只是房子的流轉，更是一份信任、一個家的延續。
        <span>— 劉羽菲（小飛）</span>
      </p>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <p className="footer-name">劉羽菲（小飛）</p>
            <p>高屏房仲・專業房產顧問｜買賣租賃・房屋估價・貸款規劃・稅務諮詢・空屋與樣品屋家具租賃・影音拍攝・居家淨水規劃・裝潢設計・自地自建</p>
          </div>
          <div className="footer-contact">
            <a href={`tel:${PROFILE.phoneRaw}`}>{PROFILE.phone}</a>
            <a href={LINE_URL} target="_blank" rel="noopener noreferrer">LINE 諮詢</a>
            <Link href="/card">電子名片</Link>
          </div>
        </div>
        <p className="footer-copyright">© {new Date().getFullYear()} 劉羽菲房仲服務. All rights reserved.</p>
      </footer>

      <a className="float-line" href={LINE_URL} target="_blank" rel="noopener noreferrer" aria-label="加LINE諮詢">
        <LineIcon size={28} />
      </a>
    </div>
  );
}

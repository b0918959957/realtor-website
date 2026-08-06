"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ContactForm from "@/app/_components/ContactForm";
import { PROFILE } from "@/lib/profile";

const LINE_URL = PROFILE.social.line;

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

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4" />
    </svg>
  );
}

const STATS = [
  { count: 34, suffix: "萬+", label: "短影音最高觀看次數" },
  { count: 10, suffix: "萬+", label: "多支影片觀看突破" },
  { count: 3, suffix: "大", label: "社群平台同步曝光" },
  { count: 9, suffix: "項", label: "一站式服務內容" }
];

const AWARDS = [
  { org: "住商不動產", title: "2026年高屏澎東短影音 第二名" },
  { org: "住商不動產", title: "年度風雲經紀人獎" }
];

const FEATURES = [
  {
    title: "多平台強力曝光",
    text: "Facebook、Instagram、YouTube 等平台同步曝光，讓更多潛在買方看見您的房子。",
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

const VIDEOS = [
  { name: "房東一定要知道的租屋4大新制", views: "34萬" },
  { name: "新屋為何沒瓦斯・保命設計揭秘", views: "18萬" },
  { name: "房貸繳完別急著換屋", views: "14萬" },
  { name: "爸媽出錢別收現金", views: "12萬" },
  { name: "少一個動作房子可能就不見", views: "6.3萬" },
  { name: "新屋為何沒瓦斯・保命設計揭秘 2", views: "4.5萬" },
  { name: "看屋不踩雷10項檢查清單", views: "2.3萬" },
  { name: "鳳山超值透天", views: "1.1萬" }
];

const SERVICES = [
  {
    title: "買賣租賃",
    text: "高雄・屏東在地物件買賣與租賃仲介，從看屋、議價到過戶，全程為您把關。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
      </svg>
    )
  },
  {
    title: "房屋估價",
    text: "依實價登錄、行情趨勢與周邊競品分析，提供合理且有依據的價格評估。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M4 19V6M10 19V10M16 19V4M4 19h16" />
      </svg>
    )
  },
  {
    title: "貸款規劃",
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
    text: "空屋佈置家具租賃方案，讓物件更有生活感，提升買方第一眼的好感度。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 12h18M5 12V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v5M4 12v6a1 1 0 0 0 1 1h1v2M18 19v2M19 12v6a1 1 0 0 1-1 1h-1" />
        <path d="M7 12v3M17 12v3" />
      </svg>
    )
  },
  {
    title: "樣品屋家具租賃",
    text: "建案樣品屋整體佈置規劃，用軟裝呈現空間質感，加速成交。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M4 20h16M6 20V10l6-4 6 4v10" />
        <path d="M9 20v-5h6v5M10 11h4" />
      </svg>
    )
  },
  {
    title: "影音拍攝",
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
    text: "依水質與居家格局評估合適的淨水配置，讓全家用水更安心。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M12 3s6 6.5 6 10.5A6 6 0 0 1 6 13.5C6 9.5 12 3 12 3z" />
        <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" />
      </svg>
    )
  },
  {
    title: "簡易裝潢",
    text: "整合信賴施工團隊，提供輕裝修建議與規劃，用合理預算打造理想空間。",
    icon: (
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M14 6l4 4M3 21l4-1 11-11a2.83 2.83 0 0 0-4-4L3 16l-1 4z" />
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
                用心對待每一次託付，替您找到最適合的新主人。深耕高雄市、屏東市房產市場，從買賣租賃、房屋估價、貸款規劃到稅務諮詢、家具租賃、影音拍攝、居家淨水與簡易裝潢，一次為您搞定安家大小事。
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
            <p className="section-desc">在地深耕，熟悉每個角落的行情與眉角，提供最即時、最貼近在地生活的房產建議。</p>
            <div className="area-grid">
              <div className="area-card">
                <div className="area-icon"><PinIcon /></div>
                <h3>高雄市</h3>
                <p>熟悉三民、鳳山、左營、楠梓等各行政區行情，掌握重劃區與捷運沿線最新脈動。</p>
              </div>
              <div className="area-card">
                <div className="area-icon"><PinIcon /></div>
                <h3>屏東市</h3>
                <p>在地經營、口碑扎根，提供屏東市買賣租賃第一手物件資訊與客製化服務。</p>
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
              {AWARDS.map((award) => (
                <div className="award-card" key={award.title}>
                  <div className="award-icon"><TrophyIcon /></div>
                  <p className="award-org">{award.org}</p>
                  <h3>{award.title}</h3>
                </div>
              ))}
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
                「我覺得這樣的成交，比單純賣掉更重要。謝謝您把案子交給我信任。後續由代書接手處理，群組裡有任何問題都可以隨時詢問。」
              </blockquote>
              <p className="testimonial-reply">
                太好了！小飛 很感謝妳，也很高興妳幫我們的房子找到新主人，一切都是很好的緣份，皆大歡喜～
              </p>
            </div>

            <div className="video-showcase">
              <p className="video-showcase-title">短影音累積曝光・成績亮眼</p>
              <div className="video-grid">
                {VIDEOS.map((video) => (
                  <div className="video-card" key={video.name}>
                    <span className="video-play">▶</span>
                    <p className="video-name">{video.name}</p>
                    <p className="video-views">{video.views} 觀看次數</p>
                  </div>
                ))}
              </div>
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
                <p>受邀出席不動產知識分享 Podcast，與業界共同交流買房知識，持續精進專業，只為給客戶更完整的服務。</p>
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
                <div className="service-card" key={service.title}>
                  <div className="service-icon">{service.icon}</div>
                  <h3>{service.title}</h3>
                  <p>{service.text}</p>
                </div>
              ))}
            </div>
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
        房屋買賣，不只是成交一間房子，更是替每位屋主找到最適合的新主人。
        <span>— 劉羽菲（小飛）</span>
      </p>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <p className="footer-name">劉羽菲（小飛）</p>
            <p>高屏房仲・專業房產顧問｜買賣租賃・房屋估價・貸款規劃・稅務諮詢・空屋家具租賃・樣品屋家具租賃・影音拍攝・居家淨水規劃・簡易裝潢</p>
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

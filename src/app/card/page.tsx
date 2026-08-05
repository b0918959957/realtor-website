import Image from "next/image";
import Link from "next/link";
import Topbar from "@/app/_components/Topbar";
import { PROFILE } from "@/lib/profile";

function ContactRow({ symbol, value, href }: { symbol: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="contact-symbol" aria-hidden="true">{symbol}</span>
      <span>{value}</span>
    </>
  );
  return href ? (
    <a className="contact-row" href={href}>{content}</a>
  ) : (
    <div className="contact-row">{content}</div>
  );
}

export default function CardPage() {
  const socialLinks = [
    { label: "Facebook", href: PROFILE.social.facebook },
    { label: "Instagram", href: PROFILE.social.instagram },
    { label: "YouTube", href: PROFILE.social.youtube }
  ].filter((item) => item.href);

  return (
    <div className="site-shell">
      <Topbar />
      <main className="card-page">
        <article className="business-card">
          <div className="card-cover">高屏房仲 · 劉羽菲</div>
          <div className="portrait-wrap">
            <Image
              className="portrait"
              src={PROFILE.photoUrl}
              width={150}
              height={150}
              priority
              alt={`${PROFILE.name}個人照`}
            />
          </div>
          <div className="card-copy">
            <h1>{PROFILE.name}<span className="alias">{PROFILE.alias}</span></h1>
            <div className="card-title">{PROFILE.title}</div>
            <p className="card-slogan">{PROFILE.slogan}</p>
          </div>
          <div className="card-actions">
            <Link className="button" href="/#contact">留下資料・免費諮詢</Link>
            <a className="button line-button" href={PROFILE.social.line} target="_blank" rel="noreferrer">加入 LINE</a>
          </div>
          <div className="contact-list">
            <ContactRow symbol="T" value={PROFILE.phone} href={`tel:${PROFILE.phoneRaw}`} />
            <ContactRow symbol="@" value={PROFILE.email} href={`mailto:${PROFILE.email}`} />
            <ContactRow symbol="P" value={PROFILE.address} />
          </div>
          {socialLinks.length > 0 && (
            <div className="social-row">
              {socialLinks.map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>
              ))}
            </div>
          )}
        </article>
      </main>
    </div>
  );
}

import Link from "next/link";

export default function Topbar() {
  return (
    <header className="topbar">
      <Link className="brand" href="/">
        <span className="brand-mark">飛</span>
        <span>劉羽菲 房仲服務</span>
      </Link>
      <nav className="topnav" aria-label="主要導覽">
        <Link href="/">官網</Link>
        <Link href="/card">名片</Link>
        <Link href="/#contact">聯絡我</Link>
      </nav>
    </header>
  );
}

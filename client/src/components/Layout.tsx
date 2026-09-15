import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Shield, Star, DoorOpen, ArrowUpRight, Menu } from "lucide-react";
export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="relative text-gold">
        <Shield size={38} strokeWidth={1.3} />
        <Star
          size={16}
          className="absolute left-[11px] top-[9px]"
          fill="currentColor"
        />
      </span>
      <span className="font-display text-[31px] tracking-[.08em] font-bold leading-none">
        SHERIFF
        <span className="block text-[8px] font-sans tracking-[.32em] text-muted mt-1.5">
          เกมนี้… ความไว้ใจมีราคา
        </span>
      </span>
    </Link>
  );
}
export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="border-b border-[#e3e0d6] bg-cream/95">
      <div className="max-w-[1240px] h-24 mx-auto px-7 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-10 text-xs font-medium">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive
                ? "text-forest border-b-2 border-gold py-3"
                : "text-muted"
            }
          >
            หน้าแรก
          </NavLink>
          <NavLink
            to="/how-to-play"
            className={({ isActive }) =>
              isActive ? "text-forest" : "text-muted"
            }
          >
            วิธีเล่น
          </NavLink>
          <NavLink
            to="/goods"
            className={({ isActive }) =>
              isActive ? "text-forest" : "text-muted"
            }
          >
            การ์ดสินค้า
          </NavLink>
        </nav>
        <Link
          to="/join"
          className="hidden md:inline-flex btn-secondary text-xs px-5 py-2.5"
        >
          <DoorOpen size={15} />
          เข้าร่วมห้อง
          <ArrowUpRight size={14} />
        </Link>
        <button
          aria-label="เปิดเมนู"
          onClick={() => setOpen(!open)}
          className="md:hidden"
        >
          <Menu />
        </button>
      </div>
      {open && (
        <nav
          onClick={() => setOpen(false)}
          className="md:hidden flex gap-6 px-7 pb-5 text-sm"
        >
          <Link to="/">หน้าแรก</Link>
          <Link to="/how-to-play">วิธีเล่น</Link>
          <Link to="/goods">การ์ดสินค้า</Link>
          <Link to="/join">เข้าห้อง</Link>
        </nav>
      )}
    </header>
  );
}
export function Footer() {
  return (
    <footer className="max-w-[1184px] mx-auto border-t border-[#ddded0] py-6 flex flex-wrap items-center justify-between gap-4 text-[10px] text-muted">
      <span className="flex items-center gap-2">
        <Shield size={13} /> จริงใจบ้าง เจ้าเล่ห์บ้าง แล้วสนุกไปด้วยกัน
      </span>
      <span>สำหรับเพื่อน และคนที่โกหกได้แนบเนียน</span>
      <Link to="/how-to-play" className="flex gap-2 items-center">
        กติกาเกม <ArrowUpRight size={12} />
      </Link>
    </footer>
  );
}
export function Shell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="max-w-[1120px] mx-auto px-4 sm:px-6 py-6 sm:py-12">
      <Link to="/" className="text-xs text-muted inline-flex mb-8">
        ← กลับหน้าตลาด
      </Link>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display text-3xl sm:text-5xl leading-relaxed break-words font-semibold mt-3 mb-6 sm:mb-9">
        {title}
      </h1>
      {children}
    </main>
  );
}

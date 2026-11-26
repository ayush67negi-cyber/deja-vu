"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/#how", label: "How It Works" },
  { href: "/#experience", label: "The Experience" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="DEJAVU home"
      className={`font-display text-2xl font-semibold tracking-[0.04em] ${className}`}
      style={{ fontVariationSettings: '"opsz" 144' }}
    >
      DEJA<span style={{ color: "var(--accent)" }}>V</span>U
    </Link>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 md:px-10 md:py-6"
      >
        <Logo className="relative z-[60]" />
        <ul className="hidden items-center gap-9 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="eyebrow relative py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform hover:after:scale-x-100"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="relative z-[60] flex items-center gap-3">
          <Link href="/join" className="btn btn-solid !px-5 !py-3 !text-[0.68rem] md:!px-6">
            Find your table
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-current lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="relative block h-3 w-5">
              <span className={`absolute left-0 h-px w-5 bg-current transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`} />
              <span className={`absolute left-0 h-px w-5 bg-current transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
            </span>
          </button>
        </div>
      </nav>
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-[55] flex flex-col justify-center gap-2 px-8 transition-all duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        style={{ background: "var(--bg)" }}
      >
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className="display py-2 text-5xl sm:text-6xl"
          >
            {l.label}
          </Link>
        ))}
        <Link href="/join" onClick={() => setOpen(false)} className="btn btn-solid mt-8 self-start">
          Find your table <span className="arrow">→</span>
        </Link>
      </div>
    </header>
  );
}

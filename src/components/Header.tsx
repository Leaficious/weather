"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bookmark, Sun } from "lucide-react";
import { UnitsToggle } from "./UnitsToggle";

const links = [
  { href: "/", label: "Now" },
  { href: "/saved", label: "Saved" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-500 ${
        scrolled ? "bg-[color-mix(in_srgb,var(--sky-horizon)_80%,transparent)] backdrop-blur-lg shadow-[0_1px_0_var(--sky-surface-border)]" : ""
      }`}
      style={{ color: "var(--sky-text)" }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="Skyfield home">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-solar text-ink">
            <Sun className="h-4 w-4" aria-hidden />
          </span>
          <span className="display text-xl">Skyfield</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--sky-surface)] ${
                  active ? "after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-solar" : "opacity-80 hover:opacity-100"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/saved"
            className="btn btn-ghost h-9 w-9 justify-center sm:hidden"
            aria-label="Saved places"
          >
            <Bookmark className="h-4 w-4" aria-hidden />
          </Link>
          <UnitsToggle />
        </div>
      </div>
    </header>
  );
}

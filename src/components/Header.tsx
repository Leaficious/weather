"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sun } from "lucide-react";
import { motion } from "framer-motion";
import { UnitsToggle } from "./UnitsToggle";
import { SearchBox } from "./SearchBox";

const links = [
  { href: "/", label: "Now" },
  { href: "/saved", label: "Saved" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const isHome = pathname === "/";

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
        <Link href="/" className="group flex shrink-0 items-center gap-2 font-semibold tracking-tight" aria-label="Skyfield home">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-solar text-ink transition-transform duration-500 group-hover:rotate-90">
            <Sun className="h-4 w-4" aria-hidden />
          </span>
          <span className="display hidden text-xl min-[400px]:inline">Skyfield</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-full px-2.5 py-1.5 text-sm font-medium transition-opacity sm:px-3 ${
                  active ? "" : "opacity-75 hover:opacity-100"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-[var(--sky-surface)] shadow-[inset_0_0_0_1px_var(--sky-surface-border)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    aria-hidden
                  />
                )}
                <span className="relative">{l.label}</span>
                {active && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-solar"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    aria-hidden
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {!isHome && (
            <div className="hidden w-72 md:block lg:w-80">
              <SearchBox size="sm" compact />
            </div>
          )}
          <UnitsToggle />
        </div>
      </div>
    </header>
  );
}

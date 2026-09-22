import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-paper-2 text-ink">
      <div className="isobars pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="display text-3xl">Skyfield</p>
          <p className="mt-2 max-w-sm text-sm text-ink/70">The sky, as it is right now.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
          <Link href="/" className="hover:underline underline-offset-4">Now</Link>
          <Link href="/saved" className="hover:underline underline-offset-4">Saved places</Link>
          <Link href="/about" className="hover:underline underline-offset-4">About &amp; data</Link>
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:underline underline-offset-4"
          >
            Open-Meteo <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>
      <div className="relative border-t border-line">
        <p className="eyebrow mx-auto max-w-7xl px-4 py-4 text-ink/50 sm:px-6">
          Forecast data © Open-Meteo, CC BY 4.0 · Refreshed every 10 minutes
        </p>
      </div>
    </footer>
  );
}

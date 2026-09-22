import type { Metadata } from "next";
import Link from "next/link";
import { SkyTheme } from "@/components/SkyTheme";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { Aurora } from "@/components/motion/Aurora";
import { SpotCard } from "@/components/motion/SpotCard";
import { Magnetic } from "@/components/motion/Magnetic";

export const metadata: Metadata = { title: "About & data", description: "Where Skyfield's numbers and colours come from." };

const rows = [
  ["Source", "Open-Meteo forecast API, combining national weather models (ICON, GFS, ECMWF and others) into one best-available blend."],
  ["Refresh", "Every 10 minutes on the server. The time shown on each page is the local time of the last model reading."],
  ["Sky colour", "Sun elevation from sunrise and sunset, blended toward grey by cloud cover, precipitation and storm codes."],
  ["Motion", "Cloud drift, rain and snow are drawn on a canvas from the same condition code. Disabled when your system asks for reduced motion."],
  ["Places", "Open-Meteo geocoding. Your location is resolved in the browser and never sent to any server of ours — there is no server of ours."],
  ["Saved places", "Stored in your browser's local storage. Nothing leaves your device."],
];

export default function AboutPage() {
  return (
    <div className="bg-paper text-ink">
      <SkyTheme sky={null} />
      <section className="grain sticky top-0 z-0 overflow-hidden bg-ink pt-24 text-paper">
        <Aurora />
        <div className="isobars pointer-events-none absolute inset-0 opacity-[0.08] invert" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-10 sm:px-6 sm:pb-28 sm:pt-16">
          <h1 className="display text-sweep rise text-4xl sm:text-6xl" style={{ animationDelay: "0.2s" }}>
            Weather, painted honestly.
          </h1>
          <p className="rise mt-6 max-w-2xl text-lg leading-relaxed text-paper/75" style={{ animationDelay: "0.35s" }}>
            Most weather apps show a photo of a sky that isn&apos;t yours. Skyfield draws the one above you, from the measurements themselves.
            The colour, the drifting clouds, the position of the sun on its arc — all of it is derived, none of it is decoration.
          </p>
        </div>
      </section>

      <div className="sheet bg-paper">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
          <dl className="grid gap-4 sm:grid-cols-2">
            {rows.map(([k, v], i) => (
              <SpotCard as="div" index={i} key={k} className="rounded-3xl border border-line bg-paper-2/60 p-5">
                <dt className="eyebrow text-ink/55">{k}</dt>
                <dd className="mt-3 text-ink/80">{v}</dd>
              </SpotCard>
            ))}
          </dl>

          <Reveal className="mt-12 flex flex-wrap gap-3">
            <Magnetic>
              <Link href="/" className="btn btn-solar h-12 px-6">
                Look up a place <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Magnetic>
            <Magnetic>
              <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer" className="btn btn-ink h-12 px-6">
                Open-Meteo docs <ArrowUpRight className="h-4 w-4" aria-hidden />
              </a>
            </Magnetic>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

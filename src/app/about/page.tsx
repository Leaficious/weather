import type { Metadata } from "next";
import Link from "next/link";
import { SkyTheme } from "@/components/SkyTheme";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

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
    <div className="bg-paper pt-24 text-ink">
      <SkyTheme sky={null} />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
        <Reveal>
          <h1 className="display text-4xl sm:text-6xl">Weather, painted honestly.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">
            Most weather apps show a photo of a sky that isn&apos;t yours. Skyfield draws the one above you, from the measurements themselves.
            The colour, the drifting clouds, the position of the sun on its arc — all of it is derived, none of it is decoration.
          </p>
        </Reveal>

        <dl className="mt-12 divide-y divide-line rounded-3xl border border-line bg-paper-2/60">
          {rows.map(([k, v], i) => (
            <Reveal as="div" index={i} key={k} className="grid gap-2 p-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <dt className="eyebrow pt-1 text-ink/55">{k}</dt>
              <dd className="text-ink/80">{v}</dd>
            </Reveal>
          ))}
        </dl>

        <Reveal className="mt-12 flex flex-wrap gap-3">
          <Link href="/" className="btn btn-solar h-12 px-6">
            Look up a place <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer" className="btn btn-ink h-12 px-6">
            Open-Meteo docs <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
        </Reveal>
      </div>
    </div>
  );
}

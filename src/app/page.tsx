import Link from "next/link";
import { ArrowRight, Compass, Palette, Waves } from "lucide-react";
import { FEATURED, fetchForecast, type Forecast } from "@/lib/weather";
import { HomeHero } from "@/components/HomeHero";
import { CityTile } from "@/components/CityTile";
import { Reveal } from "@/components/Reveal";
import { Ticker } from "@/components/motion/Ticker";
import { Aurora } from "@/components/motion/Aurora";
import { SpotCard } from "@/components/motion/SpotCard";
import { Magnetic } from "@/components/motion/Magnetic";

export const revalidate = 600;

async function loadFeatured(): Promise<Forecast[]> {
  const settled = await Promise.allSettled(FEATURED.map((p) => fetchForecast(p)));
  return settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
}

const COUNT_WORDS = ["No", "One", "Two", "Three", "Four", "Five", "Six"];

const principles = [
  {
    icon: Palette,
    title: "Colour is data",
    body: "The gradient behind every number is computed from sun elevation, cloud cover and precipitation at that exact place. Two cities never look the same unless their skies are.",
  },
  {
    icon: Waves,
    title: "Motion is weather",
    body: "Rain falls, snow drifts, clouds cross the horizon at the pace the wind is actually blowing. Nothing loops for decoration.",
  },
  {
    icon: Compass,
    title: "Numbers you can act on",
    body: "Feels-like, gusts, UV, pressure trend and the hour-by-hour rain chance — set in a face designed for reading figures, not for showing off.",
  },
];

export default async function HomePage() {
  const forecasts = await loadFeatured();

  return (
    <>
      <HomeHero forecasts={forecasts} />

      {/* Everything below slides up over the sticky sky. */}
      <div className="sheet bg-paper text-ink">
        <div className="overflow-hidden rounded-[inherit]">
          <Ticker forecasts={forecasts} />
        </div>

        <section id="world" className="relative scroll-mt-16" aria-labelledby="world-heading">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
            <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="world-heading" className="display text-4xl sm:text-6xl">
                {COUNT_WORDS[forecasts.length] ?? forecasts.length} {forecasts.length === 1 ? "sky" : "skies"}, right now.
              </h2>
              <p className="max-w-sm text-sm text-ink/65">Painted from each city&apos;s live conditions. Open one for the full forecast.</p>
            </Reveal>

            {forecasts.length ? (
              <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {forecasts.map((f, i) => (
                  <CityTile key={f.place.name} forecast={f} index={i} />
                ))}
              </ul>
            ) : (
              <div className="mt-10 rounded-3xl border border-dashed border-line p-10 text-center">
                <p className="font-semibold">The weather service didn&apos;t answer.</p>
                <p className="mt-1 text-sm text-ink/60">Search for a place above, or refresh in a moment.</p>
              </div>
            )}
          </div>
        </section>

        <section className="grain relative overflow-hidden bg-ink text-paper" aria-labelledby="how-heading">
          <Aurora />
          <div className="isobars pointer-events-none absolute inset-0 opacity-[0.08] invert" aria-hidden />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
            <Reveal>
              <h2 id="how-heading" className="display text-sweep max-w-3xl text-4xl sm:text-6xl">
                A forecast you can feel before you read it.
              </h2>
            </Reveal>
            <ul className="mt-12 grid gap-5 md:grid-cols-3">
              {principles.map((p, i) => (
                <SpotCard as="li" index={i} key={p.title} className="group rounded-3xl border border-paper/10 bg-paper/[0.03] p-6 backdrop-blur-sm transition-colors hover:bg-paper/[0.06]">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-solar/10 text-solar transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                    <p.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper/70">{p.body}</p>
                  <span className="mt-6 block h-px w-10 bg-solar/60 transition-all duration-500 group-hover:w-full" aria-hidden />
                </SpotCard>
              ))}
            </ul>
            <Reveal className="mt-14">
              <Magnetic>
                <Link href="/about" className="btn btn-solar h-12 px-6">
                  About the data <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Magnetic>
            </Reveal>
          </div>
        </section>
      </div>
    </>
  );
}

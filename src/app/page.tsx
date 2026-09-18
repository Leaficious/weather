import Link from "next/link";
import { ArrowRight, Compass, Palette, Waves } from "lucide-react";
import { FEATURED, fetchForecast, type Forecast } from "@/lib/weather";
import { HomeHero } from "@/components/HomeHero";
import { CityTile } from "@/components/CityTile";
import { Reveal } from "@/components/Reveal";

export const revalidate = 600;

async function loadFeatured(): Promise<Forecast[]> {
  const settled = await Promise.allSettled(FEATURED.map((p) => fetchForecast(p)));
  return settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
}

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

      <section className="relative bg-paper text-ink" aria-labelledby="world-heading">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow text-ink/50">Around the world</p>
              <h2 id="world-heading" className="display mt-2 text-4xl sm:text-6xl">
                Six skies, one minute.
              </h2>
            </div>
            <p className="max-w-sm text-sm text-ink/65">
              Each tile is painted from that city&apos;s live conditions. Tap one to open the full forecast.
            </p>
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

      <section className="relative overflow-hidden bg-ink text-paper" aria-labelledby="how-heading">
        <div className="isobars pointer-events-none absolute inset-0 opacity-[0.08] invert" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <Reveal>
            <p className="eyebrow text-paper/50">How it reads</p>
            <h2 id="how-heading" className="display mt-2 max-w-3xl text-4xl sm:text-6xl">
              A forecast you can feel before you read it.
            </h2>
          </Reveal>
          <ul className="mt-12 grid gap-8 md:grid-cols-3">
            {principles.map((p, i) => (
              <Reveal as="li" index={i} key={p.title} className="rounded-3xl border border-paper/10 p-6 transition-colors hover:border-solar/60">
                <p.icon className="h-6 w-6 text-solar" aria-hidden />
                <h3 className="mt-5 text-xl font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">{p.body}</p>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-14">
            <Link href="/about" className="btn btn-solar h-12 px-6">
              About the data <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

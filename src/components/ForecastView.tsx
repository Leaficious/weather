"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Bookmark, BookmarkCheck, Check, Droplets, Eye, Gauge, Share2, Sun, Wind } from "lucide-react";
import { computeSky } from "@/lib/sky";
import {
  compass,
  dayLabel,
  describeCode,
  fmtDistance,
  fmtSpeed,
  fmtTemp,
  hourLabel,
  timeLabel,
  toUnitTemp,
  type Forecast,
} from "@/lib/weather";
import { SkyCanvas } from "./SkyCanvas";
import { SkyTheme } from "./SkyTheme";
import { Reveal } from "./Reveal";
import { WeatherIcon } from "./WeatherIcon";
import { useFavorites, useToast, useUnits } from "./Providers";
import { HourlyChart } from "./HourlyChart";
import { SunArc } from "./SunArc";

export function ForecastView({ forecast }: { forecast: Forecast }) {
  const { units } = useUnits();
  const { isSaved, toggleSave, hydrated } = useFavorites();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const { current, place } = forecast;

  const sky = useMemo(
    () =>
      computeSky({
        code: current.code,
        isDay: current.isDay,
        localTime: current.time,
        sunrise: forecast.sunrise,
        sunset: forecast.sunset,
      }),
    [current, forecast.sunrise, forecast.sunset],
  );
  const cond = describeCode(current.code);
  const saved = hydrated && isSaved(place);

  async function share() {
    const url = window.location.href;
    const title = `${place.name}: ${fmtTemp(current.temp, units)} and ${cond.label.toLowerCase()} · Skyfield`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied to clipboard", "success");
      window.setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      toast("Couldn't copy the link. Copy it from the address bar.", "error");
    }
  }

  function save() {
    const nowSaved = toggleSave(place);
    toast(nowSaved ? `Saved ${place.name}` : `Removed ${place.name} from saved places`, nowSaved ? "success" : "neutral");
  }

  const stagger = (i: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.1 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } };

  const details = [
    { icon: Wind, label: "Wind", value: fmtSpeed(current.windSpeed, units), sub: `${compass(current.windDir)} · gusts ${fmtSpeed(current.windGust, units)}` },
    { icon: Droplets, label: "Humidity", value: `${current.humidity}%`, sub: `Feels like ${fmtTemp(current.feelsLike, units)}` },
    { icon: Sun, label: "UV index", value: current.uv.toFixed(1), sub: uvLabel(current.uv) },
    { icon: Gauge, label: "Pressure", value: `${Math.round(current.pressure)} hPa`, sub: pressureLabel(current.pressure) },
    { icon: Eye, label: "Visibility", value: fmtDistance(current.visibility, units), sub: `${current.cloudCover}% cloud cover` },
  ];

  return (
    <>
      <SkyTheme sky={sky} />

      {/* HERO */}
      <section className="sky-bg relative overflow-hidden pt-24" style={{ color: "var(--sky-text)" }}>
        <SkyCanvas sky={sky} />
        <div className="isobars pointer-events-none absolute inset-0 opacity-[0.12] [mask-image:linear-gradient(to_top,black,transparent_70%)]" aria-hidden />
        <div className="relative mx-auto flex min-h-[78svh] max-w-7xl flex-col justify-between px-4 pb-8 sm:px-6">
          <motion.div {...stagger(0)} className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="btn btn-ghost h-10 px-4 text-sm">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Search
            </Link>
            <div className="flex gap-2">
              <button type="button" onClick={share} className="btn btn-ghost h-10 px-4 text-sm" aria-label="Share this forecast">
                {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Share2 className="h-4 w-4" aria-hidden />}
                <span className="hidden sm:inline">{copied ? "Copied" : "Share"}</span>
              </button>
              <button
                type="button"
                onClick={save}
                aria-pressed={saved}
                className={`btn h-10 px-4 text-sm ${saved ? "btn-solar" : "btn-ghost"}`}
              >
                {saved ? <BookmarkCheck className="h-4 w-4" aria-hidden /> : <Bookmark className="h-4 w-4" aria-hidden />}
                {saved ? "Saved" : "Save"}
              </button>
            </div>
          </motion.div>

          <div className="grid gap-8 py-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <motion.p {...stagger(1)} className="eyebrow" style={{ color: "var(--sky-text-muted)" }}>
                {[place.admin, place.country].filter(Boolean).join(" · ") || "Coordinates"} · {timeLabel(current.time)} local
              </motion.p>
              <motion.h1 {...stagger(2)} className="display mt-3 text-[clamp(2.75rem,8vw,6.5rem)]">
                {place.name}
              </motion.h1>
              <motion.div {...stagger(3)} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
                <p className="display num text-[clamp(5rem,16vw,11rem)] leading-[0.85]">{fmtTemp(current.temp, units)}</p>
                <div className="pb-2">
                  <p className="flex items-center gap-2 text-xl font-medium">
                    <WeatherIcon code={current.code} isDay={current.isDay} className="h-7 w-7" strokeWidth={1.5} />
                    {cond.label}
                  </p>
                  <p className="mt-1 text-base" style={{ color: "var(--sky-text-muted)" }}>
                    Feels like {fmtTemp(current.feelsLike, units)} · H {fmtTemp(forecast.daily[0]?.max ?? current.temp, units)} L{" "}
                    {fmtTemp(forecast.daily[0]?.min ?? current.temp, units)}
                  </p>
                </div>
              </motion.div>
            </div>

            <motion.div {...stagger(4)} className="surface w-full max-w-sm rounded-3xl p-5 lg:w-80">
              <SunArc sunrise={forecast.sunrise} sunset={forecast.sunset} progress={sky.sunProgress} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOURLY */}
      <section className="relative bg-paper text-ink" aria-labelledby="hourly-heading">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-ink/50">Next 24 hours</p>
              <h2 id="hourly-heading" className="display mt-2 text-3xl sm:text-5xl">
                The curve.
              </h2>
            </div>
            <p className="hidden max-w-xs text-sm text-ink/60 sm:block">Temperature line, rain chance as bars beneath. Scroll sideways on small screens.</p>
          </Reveal>
          <Reveal index={1} className="mt-8">
            <HourlyChart hours={forecast.hourly} units={units} />
          </Reveal>
        </div>
      </section>

      {/* DAILY + DETAILS */}
      <section className="relative bg-paper-2 text-ink" aria-labelledby="daily-heading">
        <div className="isobars pointer-events-none absolute inset-0 opacity-30" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Reveal>
              <p className="eyebrow text-ink/50">Seven days</p>
              <h2 id="daily-heading" className="display mt-2 text-3xl sm:text-5xl">
                The week.
              </h2>
            </Reveal>
            <ol className="mt-8 divide-y divide-line rounded-3xl border border-line bg-paper/70 backdrop-blur">
              {forecast.daily.map((d, i) => {
                const range = tempRange(forecast.daily);
                return (
                  <Reveal as="li" index={i} key={d.date} className="grid grid-cols-[3.5rem_1.75rem_1fr_auto] items-center gap-3 px-4 py-3.5 sm:grid-cols-[4.5rem_2rem_6rem_1fr_auto] sm:gap-4 sm:px-5">
                    <span className="font-semibold">{dayLabel(d.date, i)}</span>
                    <WeatherIcon code={d.code} isDay className="h-5 w-5 text-ink/80" strokeWidth={1.6} />
                    <span className="num hidden text-xs text-ink/55 sm:block">
                      {d.precipProb > 0 ? `${d.precipProb}% rain` : describeCode(d.code).label}
                    </span>
                    <TempBar min={d.min} max={d.max} lo={range[0]} hi={range[1]} units={units} />
                    <span className="num text-right text-sm">
                      <span className="text-ink/50">{fmtTemp(d.min, units)}</span>{" "}
                      <span className="font-semibold">{fmtTemp(d.max, units)}</span>
                    </span>
                  </Reveal>
                );
              })}
            </ol>
          </div>

          <div>
            <Reveal>
              <p className="eyebrow text-ink/50">Right now</p>
              <h2 className="display mt-2 text-3xl sm:text-5xl">The instruments.</h2>
            </Reveal>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {details.map((d, i) => (
                <Reveal as="li" index={i} key={d.label} className="group rounded-3xl border border-line bg-paper/70 p-5 backdrop-blur transition-colors hover:border-ink/40">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow text-ink/55">{d.label}</p>
                    <d.icon className="h-4 w-4 text-ink/40 transition-colors group-hover:text-solar" aria-hidden />
                  </div>
                  <p className="display num mt-4 text-3xl">{d.value}</p>
                  <p className="mt-1 text-xs text-ink/60">{d.sub}</p>
                </Reveal>
              ))}
              <Reveal as="li" index={5} className="rounded-3xl bg-ink p-5 text-paper">
                <p className="eyebrow text-paper/55">Precipitation</p>
                <p className="display num mt-4 text-3xl">{current.precipitation.toFixed(1)} mm</p>
                <p className="mt-1 text-xs text-paper/60">in the last hour · {forecast.hourly[0]?.precipProb ?? 0}% chance next hour</p>
              </Reveal>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

function TempBar({ min, max, lo, hi, units }: { min: number; max: number; lo: number; hi: number; units: "metric" | "imperial" }) {
  const span = Math.max(1, hi - lo);
  const left = ((min - lo) / span) * 100;
  const width = ((max - min) / span) * 100;
  return (
    <div
      className="relative h-2 w-full rounded-full bg-ink/10"
      role="img"
      aria-label={`Low ${toUnitTemp(min, units)}°, high ${toUnitTemp(max, units)}°`}
    >
      <motion.span
        className="absolute inset-y-0 rounded-full"
        style={{ left: `${left}%`, background: "linear-gradient(90deg, var(--ice), var(--solar))" }}
        initial={{ width: 0 }}
        whileInView={{ width: `${Math.max(6, width)}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

function tempRange(days: Forecast["daily"]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const d of days) {
    lo = Math.min(lo, d.min);
    hi = Math.max(hi, d.max);
  }
  return [lo, hi];
}

function uvLabel(uv: number): string {
  if (uv < 3) return "Low — no protection needed";
  if (uv < 6) return "Moderate — shade at midday";
  if (uv < 8) return "High — cover up";
  if (uv < 11) return "Very high — limit sun";
  return "Extreme — stay indoors at noon";
}
function pressureLabel(p: number): string {
  if (p >= 1022) return "High — settled";
  if (p <= 1005) return "Low — unsettled";
  return "Normal";
}
export { hourLabel };

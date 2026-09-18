"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { computeSky } from "@/lib/sky";
import { describeCode, fetchForecast, fmtTemp, placeHref, placeKey, timeLabel, type Forecast, type Place } from "@/lib/weather";
import { useFavorites, useToast, useUnits } from "./Providers";
import { SearchBox } from "./SearchBox";
import { WeatherIcon } from "./WeatherIcon";

type Entry = { place: Place; status: "loading" | "ok" | "error"; forecast?: Forecast };

export function SavedList() {
  const { favorites, remove, hydrated } = useFavorites();
  const { units } = useUnits();
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [refreshing, setRefreshing] = useState(false);

  async function load(places: Place[]) {
    await Promise.all(
      places.map(async (p) => {
        try {
          const f = await fetchForecast(p);
          setEntries((e) => ({ ...e, [placeKey(p)]: { place: p, status: "ok", forecast: f } }));
        } catch {
          setEntries((e) => ({ ...e, [placeKey(p)]: { place: p, status: "error" } }));
        }
      }),
    );
  }

  useEffect(() => {
    if (!hydrated) return;
    const missing = favorites.filter((p) => !entries[placeKey(p)]);
    if (missing.length) void load(missing);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites, hydrated]);

  async function refreshAll() {
    setRefreshing(true);
    await load(favorites);
    setRefreshing(false);
    toast("Forecasts refreshed", "success");
  }

  if (!hydrated) {
    return (
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
        {[0, 1, 2].map((k) => (
          <div key={k} className="h-52 animate-pulse rounded-3xl bg-ink/10" />
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="mt-10 rounded-3xl border border-dashed border-ink/30 p-8 sm:p-12">
        <p className="text-xl font-semibold">Nothing saved yet.</p>
        <p className="mt-2 max-w-md text-ink/65">
          Open any forecast and press <span className="font-semibold">Save</span>. Saved places live in this browser only — no account needed.
        </p>
        <div className="mt-6 max-w-lg">
          <SearchBox size="sm" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-sm text-ink/60">
          {favorites.length} {favorites.length === 1 ? "place" : "places"} · stored in this browser
        </p>
        <button type="button" onClick={refreshAll} disabled={refreshing} className="btn btn-ink h-10 px-4 text-sm">
          {refreshing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
          Refresh all
        </button>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {favorites.map((p) => {
            const e = entries[placeKey(p)];
            const f = e?.forecast;
            const sky = f
              ? computeSky({ code: f.current.code, isDay: f.current.isDay, localTime: f.current.time, sunrise: f.sunrise, sunset: f.sunset })
              : null;
            return (
              <motion.li
                key={placeKey(p)}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="tile relative overflow-hidden rounded-3xl p-5"
                style={
                  sky
                    ? { background: `linear-gradient(170deg, ${sky.colors.top}, ${sky.colors.mid} 60%, ${sky.colors.horizon})`, color: sky.colors.text }
                    : { background: "var(--paper-2)", color: "var(--ink)" }
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="eyebrow truncate opacity-70">{[p.admin, p.country].filter(Boolean).join(" · ") || "Coordinates"}</p>
                    <p className="display mt-1 truncate text-2xl sm:text-3xl">{p.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      remove(p);
                      toast(`Removed ${p.name}`);
                    }}
                    aria-label={`Remove ${p.name} from saved places`}
                    className="btn btn-ghost h-9 w-9 justify-center hover:!bg-error hover:!text-paper"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <div className="mt-8 flex items-end justify-between">
                  {e?.status === "ok" && f ? (
                    <div>
                      <p className="display num text-6xl">{fmtTemp(f.current.temp, units)}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm" style={{ color: sky?.colors.textMuted }}>
                        <WeatherIcon code={f.current.code} isDay={f.current.isDay} className="h-4 w-4" />
                        {describeCode(f.current.code).label} · {timeLabel(f.current.time)}
                      </p>
                    </div>
                  ) : e?.status === "error" ? (
                    <div>
                      <p className="font-semibold">Couldn&apos;t load</p>
                      <button type="button" onClick={() => load([p])} className="mt-1 text-sm underline underline-offset-4">
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="animate-pulse">
                      <div className="h-14 w-24 rounded-xl bg-current opacity-10" />
                      <div className="mt-2 h-4 w-32 rounded bg-current opacity-10" />
                    </div>
                  )}
                  <Link
                    href={placeHref(p)}
                    aria-label={`Open forecast for ${p.name}`}
                    className="grid h-10 w-10 place-items-center rounded-full border transition-transform duration-500 hover:rotate-45"
                    style={{ borderColor: sky?.colors.surfaceBorder ?? "var(--line)", background: sky?.colors.surface ?? "transparent" }}
                  >
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </>
  );
}

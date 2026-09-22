"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import { geocode, placeHref, reverseGeocode, type Place } from "@/lib/weather";
import { useToast } from "./Providers";

const schema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Type at least 2 characters")
    .max(80, "Keep it under 80 characters")
    .regex(/^[\p{L}\p{M}\s.'’\-,]+$/u, "Only letters, spaces, commas, hyphens and apostrophes"),
});
type Form = z.infer<typeof schema>;

export function SearchBox({
  size = "lg",
  compact = false,
}: {
  size?: "lg" | "sm";
  /** Header variant: icon-only locate button, no submit button, results open below. */
  compact?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const listId = useId();
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema), mode: "onSubmit", defaultValues: { query: "" } });
  const query = useWatch({ control, name: "query" });

  // Debounced live suggestions. All state updates happen inside the timer callback.
  useEffect(() => {
    const q = query.trim();
    const valid = q.length >= 2 && schema.safeParse({ query: q }).success;
    const handle = window.setTimeout(async () => {
      if (!valid) {
        setResults([]);
        setSearching(false);
        setLookupError(null);
        return;
      }
      setSearching(true);
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const r = await geocode(q, ctrl.signal);
        if (ctrl.signal.aborted) return;
        setResults(r);
        setLookupError(null);
        setOpen(true);
        setActive(r.length ? 0 : -1);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setLookupError("Couldn't reach the place search. Check your connection and try again.");
        setResults([]);
      } finally {
        if (!ctrl.signal.aborted) setSearching(false);
      }
    }, valid ? 280 : 0);
    return () => window.clearTimeout(handle);
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function go(p: Place) {
    setNavigating(true);
    setOpen(false);
    setValue("query", `${p.name}${p.country ? `, ${p.country}` : ""}`);
    router.push(placeHref(p));
  }

  async function onSubmit(data: Form) {
    if (active >= 0 && results[active]) {
      go(results[active]);
      return;
    }
    try {
      const r = await geocode(data.query);
      if (!r.length) {
        setLookupError(`No place called “${data.query}” found. Try a nearby city.`);
        return;
      }
      go(r[0]);
    } catch {
      setLookupError("Couldn't reach the place search. Check your connection and try again.");
    }
  }

  function locate() {
    if (!("geolocation" in navigator)) {
      toast("Your browser doesn't support location.", "error");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        const named = await reverseGeocode(lat, lon);
        setLocating(false);
        go(named ?? { name: "Your location", country: "", lat, lon });
      },
      (err) => {
        setLocating(false);
        toast(
          err.code === err.PERMISSION_DENIED
            ? "Location access was denied. Search for a place instead."
            : "Couldn't get your location. Search for a place instead.",
          "error",
        );
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const big = size === "lg";
  const error = errors.query?.message ?? lookupError;
  const busy = isSubmitting || navigating;

  return (
    <div ref={wrapRef} className="relative w-full min-w-0">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search for a place
        </label>
        <div
          className={`surface flex items-center gap-2 rounded-full pr-2 transition-shadow focus-within:shadow-[0_0_0_3px_var(--solar)] ${
            big ? "h-16 pl-5" : "h-12 pl-4"
          } ${error ? "!border-error" : ""}`}
        >
          <Search className={`shrink-0 opacity-60 ${big ? "h-5 w-5" : "h-4 w-4"}`} aria-hidden />
          <input
            id={`${listId}-input`}
            type="text"
            autoComplete="off"
            role="combobox"
            aria-expanded={open && results.length > 0}
            aria-controls={`${listId}-list`}
            aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
            aria-invalid={!!error}
            aria-describedby={error ? `${listId}-err` : undefined}
            placeholder="Find a place"
            onKeyDown={onKeyDown}
            onFocus={() => results.length && setOpen(true)}
            size={1}
            className={`w-full min-w-0 flex-1 bg-transparent outline-none placeholder:opacity-50 ${big ? "text-lg" : "text-sm"}`}
            style={{ color: "var(--sky-text)" }}
            {...register("query")}
          />
          {(searching || busy) && (
            <Loader2 className="h-4 w-4 animate-spin opacity-70" role="img" aria-label={busy ? "Opening forecast" : "Searching"} />
          )}
          <button
            type="button"
            onClick={locate}
            disabled={locating || busy}
            aria-label="Use my location"
            title="Use my location"
            className={`btn btn-ghost justify-center ${big ? "h-11 w-11 sm:w-auto sm:px-4" : "h-8 w-8"}`}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LocateFixed className="h-4 w-4" aria-hidden />}
            {big && <span className="hidden text-sm sm:inline">{locating ? "Locating…" : "My location"}</span>}
          </button>
          {!compact && (
            <button type="submit" disabled={busy} className={`btn btn-solar ${big ? "h-11 px-5" : "h-8 px-3 text-sm"}`}>
              {busy ? "Opening…" : "Look up"}
            </button>
          )}
        </div>
        <AnimatePresence>
          {error && (
            <motion.p
              id={`${listId}-err`}
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 pl-4 text-sm font-medium text-error"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            id={`${listId}-list`}
            role="listbox"
            aria-label="Matching places"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl bg-ink p-1.5 text-paper shadow-2xl shadow-ink/40"
          >
            {results.map((p, i) => (
              <li
                key={`${p.lat},${p.lon}`}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(p)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                  i === active ? "bg-paper/12" : "hover:bg-paper/8"
                }`}
              >
                <MapPin className="h-4 w-4 shrink-0 text-solar" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-paper/60">
                    {p.admin ? `, ${p.admin}` : ""}
                    {p.country ? ` · ${p.country}` : ""}
                  </span>
                </span>
                <span className="num hidden text-xs text-paper/40 sm:block">
                  {p.lat.toFixed(2)}, {p.lon.toFixed(2)}
                </span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ForecastView } from "@/components/ForecastView";
import { describeCode, fetchForecast, parseCoords, type Place } from "@/lib/weather";

export const revalidate = 600;

type Params = { coords: string };
type Search = { name?: string; country?: string; admin?: string };

function placeFrom(params: Params, search: Search): Place | null {
  const c = parseCoords(params.coords);
  if (!c) return null;
  const name = (search.name ?? "").toString().slice(0, 80).trim() || `${c.lat.toFixed(2)}, ${c.lon.toFixed(2)}`;
  return {
    name,
    country: (search.country ?? "").toString().slice(0, 60),
    admin: search.admin ? search.admin.toString().slice(0, 60) : undefined,
    lat: c.lat,
    lon: c.lon,
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const place = placeFrom(await params, await searchParams);
  if (!place) return { title: "Place not found" };
  try {
    const f = await fetchForecast(place);
    const c = describeCode(f.current.code);
    return {
      title: `${place.name} — ${Math.round(f.current.temp)}°C, ${c.label}`,
      description: `Live weather over ${place.name}: ${c.label.toLowerCase()}, ${Math.round(f.current.temp)}°C, feels like ${Math.round(f.current.feelsLike)}°C. Hourly curve and seven-day outlook.`,
    };
  } catch {
    return { title: place.name };
  }
}

export default async function ForecastPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const place = placeFrom(await params, await searchParams);
  if (!place) notFound();
  const forecast = await fetchForecast(place);
  return <ForecastView forecast={forecast} />;
}

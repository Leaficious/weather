export type Units = "metric" | "imperial";

export interface Place {
  name: string;
  country: string;
  admin?: string;
  lat: number;
  lon: number;
  timezone?: string;
}

export interface CurrentWeather {
  time: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  code: number;
  isDay: boolean;
  windSpeed: number;
  windDir: number;
  windGust: number;
  pressure: number;
  cloudCover: number;
  precipitation: number;
  uv: number;
  visibility: number;
}

export interface HourPoint {
  time: string;
  temp: number;
  code: number;
  precipProb: number;
  isDay: boolean;
}

export interface DayPoint {
  date: string;
  code: number;
  max: number;
  min: number;
  precipProb: number;
  sunrise: string;
  sunset: string;
  uv: number;
  windMax: number;
}

export interface Forecast {
  place: Place;
  timezone: string;
  utcOffsetSeconds: number;
  current: CurrentWeather;
  hourly: HourPoint[];
  daily: DayPoint[];
  sunrise: string;
  sunset: string;
  fetchedAt: string;
}

/** WMO weather interpretation codes → human label + a coarse family used for art direction. */
export type ConditionFamily =
  | "clear"
  | "partly"
  | "cloudy"
  | "fog"
  | "drizzle"
  | "rain"
  | "snow"
  | "storm";

export interface Condition {
  label: string;
  family: ConditionFamily;
}

export function describeCode(code: number): Condition {
  if (code === 0) return { label: "Clear sky", family: "clear" };
  if (code === 1) return { label: "Mainly clear", family: "clear" };
  if (code === 2) return { label: "Partly cloudy", family: "partly" };
  if (code === 3) return { label: "Overcast", family: "cloudy" };
  if (code === 45 || code === 48) return { label: "Fog", family: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", family: "drizzle" };
  if (code >= 61 && code <= 67) return { label: code >= 66 ? "Freezing rain" : "Rain", family: "rain" };
  if (code >= 71 && code <= 77) return { label: "Snow", family: "snow" };
  if (code >= 80 && code <= 82) return { label: "Rain showers", family: "rain" };
  if (code === 85 || code === 86) return { label: "Snow showers", family: "snow" };
  if (code === 95) return { label: "Thunderstorm", family: "storm" };
  if (code === 96 || code === 99) return { label: "Thunderstorm with hail", family: "storm" };
  return { label: "Unknown", family: "cloudy" };
}

const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const API = "https://api.open-meteo.com/v1/forecast";

interface GeoResult {
  name: string;
  country?: string;
  country_code?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export async function geocode(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `${GEO}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
  const data = (await res.json()) as { results?: GeoResult[] };
  return (data.results ?? []).map((r) => ({
    name: r.name,
    country: r.country ?? r.country_code ?? "",
    admin: r.admin1,
    lat: r.latitude,
    lon: r.longitude,
    timezone: r.timezone,
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<Place | null> {
  // Open-Meteo has no reverse geocoder; fall back to BigDataCloud's free, keyless endpoint.
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    );
    if (!res.ok) return null;
    const d = (await res.json()) as { city?: string; locality?: string; countryName?: string; principalSubdivision?: string };
    const name = d.city || d.locality;
    if (!name) return null;
    return { name, country: d.countryName ?? "", admin: d.principalSubdivision, lat, lon };
  } catch {
    return null;
  }
}

interface RawForecast {
  timezone: string;
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    is_day: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    surface_pressure: number;
    cloud_cover: number;
    precipitation: number;
    uv_index: number;
    visibility: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    wind_speed_10m_max: number[];
  };
}

export async function fetchForecast(place: Place): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: place.lat.toString(),
    longitude: place.lon.toString(),
    timezone: "auto",
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "is_day",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "surface_pressure",
      "cloud_cover",
      "precipitation",
      "uv_index",
      "visibility",
    ].join(","),
    hourly: "temperature_2m,weather_code,precipitation_probability,is_day",
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "sunrise",
      "sunset",
      "uv_index_max",
      "wind_speed_10m_max",
    ].join(","),
    forecast_days: "7",
  });
  const res = await fetch(`${API}?${params}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Forecast failed (${res.status})`);
  const raw = (await res.json()) as RawForecast;

  const nowIndex = Math.max(
    0,
    raw.hourly.time.findIndex((t) => t >= raw.current.time.slice(0, 13)),
  );
  const hourly: HourPoint[] = raw.hourly.time.slice(nowIndex, nowIndex + 24).map((time, i) => {
    const j = nowIndex + i;
    return {
      time,
      temp: raw.hourly.temperature_2m[j],
      code: raw.hourly.weather_code[j],
      precipProb: raw.hourly.precipitation_probability[j] ?? 0,
      isDay: raw.hourly.is_day[j] === 1,
    };
  });

  const daily: DayPoint[] = raw.daily.time.map((date, i) => ({
    date,
    code: raw.daily.weather_code[i],
    max: raw.daily.temperature_2m_max[i],
    min: raw.daily.temperature_2m_min[i],
    precipProb: raw.daily.precipitation_probability_max[i] ?? 0,
    sunrise: raw.daily.sunrise[i],
    sunset: raw.daily.sunset[i],
    uv: raw.daily.uv_index_max[i],
    windMax: raw.daily.wind_speed_10m_max[i],
  }));

  const c = raw.current;
  return {
    place: { ...place, timezone: raw.timezone },
    timezone: raw.timezone,
    utcOffsetSeconds: raw.utc_offset_seconds,
    current: {
      time: c.time,
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      code: c.weather_code,
      isDay: c.is_day === 1,
      windSpeed: c.wind_speed_10m,
      windDir: c.wind_direction_10m,
      windGust: c.wind_gusts_10m,
      pressure: c.surface_pressure,
      cloudCover: c.cloud_cover,
      precipitation: c.precipitation,
      uv: c.uv_index,
      visibility: c.visibility,
    },
    hourly,
    daily,
    sunrise: daily[0]?.sunrise ?? "",
    sunset: daily[0]?.sunset ?? "",
    fetchedAt: new Date().toISOString(),
  };
}

/* ---------- formatting helpers ---------- */

export function toUnitTemp(c: number, units: Units): number {
  return units === "metric" ? Math.round(c) : Math.round((c * 9) / 5 + 32);
}
export function fmtTemp(c: number, units: Units): string {
  return `${toUnitTemp(c, units)}°`;
}
export function fmtSpeed(kmh: number, units: Units): string {
  return units === "metric" ? `${Math.round(kmh)} km/h` : `${Math.round(kmh * 0.621371)} mph`;
}
export function fmtDistance(m: number, units: Units): string {
  return units === "metric" ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km` : `${(m / 1609.34).toFixed(m >= 16093 ? 0 : 1)} mi`;
}
export function compass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}
/** Hour label from a local ISO string like 2026-09-18T14:00 */
export function hourLabel(iso: string): string {
  const h = Number(iso.slice(11, 13));
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}
export function timeLabel(iso: string): string {
  const h = Number(iso.slice(11, 13));
  const m = iso.slice(14, 16);
  const ampm = h < 12 ? "am" : "pm";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m} ${ampm}`;
}
export function dayLabel(date: string, index: number): string {
  if (index === 0) return "Today";
  const d = new Date(`${date}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}
/** Fraction [0,1] through the local day, from a local ISO string. */
export function dayFraction(iso: string): number {
  const h = Number(iso.slice(11, 13));
  const m = Number(iso.slice(14, 16));
  return (h * 60 + m) / 1440;
}

/* ---------- routing helpers ---------- */

export function placeHref(p: Place): string {
  const coords = `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
  const q = new URLSearchParams({ name: p.name });
  if (p.country) q.set("country", p.country);
  if (p.admin) q.set("admin", p.admin);
  return `/w/${coords}?${q.toString()}`;
}

export function parseCoords(coords: string): { lat: number; lon: number } | null {
  const [a, b] = decodeURIComponent(coords).split(",");
  const lat = Number(a);
  const lon = Number(b);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

export function placeKey(p: Pick<Place, "lat" | "lon">): string {
  return `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`;
}

export const FEATURED: Place[] = [
  { name: "Reykjavík", country: "Iceland", lat: 64.1466, lon: -21.9426 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503 },
  { name: "Cape Town", country: "South Africa", lat: -33.9249, lon: 18.4241 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lon: -46.6333 },
  { name: "Mumbai", country: "India", lat: 19.076, lon: 72.8777 },
  { name: "Lisbon", country: "Portugal", lat: 38.7223, lon: -9.1393 },
];

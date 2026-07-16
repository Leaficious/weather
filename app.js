/* ============================================================
   Aloft — weather logic
   Open-Meteo geocoding + forecast (no API key required).
   ============================================================ */
"use strict";

const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const STORE_KEY = "aloft:lastPlace";

const $ = (id) => document.getElementById(id);
const el = {
  html: document.documentElement,
  sky: document.querySelector(".sky"),
  form: $("searchForm"), input: $("cityInput"), geoBtn: $("geoBtn"),
  results: $("searchResults"),
  status: $("status"), statusText: $("statusText"), retry: $("retryBtn"),
  report: $("report"),
  place: $("place"), localTime: $("localTime"),
  heroIcon: $("heroIcon"), temp: $("temp"), condition: $("condition"), feels: $("feels"),
  wind: $("wind"), humidity: $("humidity"), uv: $("uv"), uvLabel: $("uvLabel"),
  precip: $("precip"), sunrise: $("sunrise"), sunset: $("sunset"),
  hourly: $("hourly"), daily: $("daily"),
};

/* ---- WMO weather code → { label, kind } ------------------- */
function decode(code) {
  const m = {
    0: ["Clear sky", "clear"],
    1: ["Mainly clear", "clear"], 2: ["Partly cloudy", "cloud"], 3: ["Overcast", "cloud"],
    45: ["Fog", "fog"], 48: ["Rime fog", "fog"],
    51: ["Light drizzle", "rain"], 53: ["Drizzle", "rain"], 55: ["Heavy drizzle", "rain"],
    56: ["Freezing drizzle", "rain"], 57: ["Freezing drizzle", "rain"],
    61: ["Light rain", "rain"], 63: ["Rain", "rain"], 65: ["Heavy rain", "rain"],
    66: ["Freezing rain", "rain"], 67: ["Freezing rain", "rain"],
    71: ["Light snow", "snow"], 73: ["Snow", "snow"], 75: ["Heavy snow", "snow"], 77: ["Snow grains", "snow"],
    80: ["Rain showers", "rain"], 81: ["Rain showers", "rain"], 82: ["Violent showers", "rain"],
    85: ["Snow showers", "snow"], 86: ["Snow showers", "snow"],
    95: ["Thunderstorm", "storm"], 96: ["Thunderstorm, hail", "storm"], 99: ["Thunderstorm, hail", "storm"],
  };
  return m[code] || ["Unknown", "cloud"];
}

/* condition token used for the sky theme in CSS */
function themeToken(kind, isDay) {
  if (kind === "clear") return isDay ? "clear-day" : "clear-night";
  if (kind === "cloud") return isDay ? "cloud-day" : "cloud-night";
  return kind; // rain | snow | storm | fog
}

/* ---- SVG icons -------------------------------------------- */
const S = 'stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"';
const sun = (c = "#ffd36b") => `<circle cx="12" cy="12" r="4.4" fill="${c}" stroke="none"/>` +
  [...Array(8)].map((_, i) => { const a = i * Math.PI / 4, r1 = 7.4, r2 = 9.6;
    return `<line x1="${(12 + Math.cos(a) * r1).toFixed(1)}" y1="${(12 + Math.sin(a) * r1).toFixed(1)}" x2="${(12 + Math.cos(a) * r2).toFixed(1)}" y2="${(12 + Math.sin(a) * r2).toFixed(1)}" stroke="${c}" stroke-width="1.7" stroke-linecap="round"/>`; }).join("");
const moon = `<path d="M17 15.5A6.5 6.5 0 0 1 9.2 6a6.5 6.5 0 1 0 8.8 9.5Z" fill="#dfe7ff" stroke="none"/>`;
const cloud = (c = "#dfe7ff") => `<path d="M7.2 18h9.3a3.6 3.6 0 0 0 .3-7.2A5.2 5.2 0 0 0 6.7 11 3.5 3.5 0 0 0 7.2 18Z" fill="${c}" stroke="none"/>`;

const ICONS = {
  clear: (day) => day ? svg(sun()) : svg(moon),
  cloud: (day) => svg((day
      ? `<g transform="translate(-2,-3) scale(.8)">${sun()}</g>`
      : `<g transform="translate(1,-1) scale(.7)">${moon}</g>`) + cloud()),
  fog: () => svg(cloud("#c7cfdd") + `<line x1="6" y1="20" x2="16" y2="20" ${S}/><line x1="9" y1="22.4" x2="18" y2="22.4" ${S}/>`),
  rain: () => svg(cloud() + `<line x1="9" y1="19.5" x2="8" y2="22.5" stroke="#7fc4ff" stroke-width="1.8" stroke-linecap="round"/><line x1="12.5" y1="19.5" x2="11.5" y2="22.5" stroke="#7fc4ff" stroke-width="1.8" stroke-linecap="round"/><line x1="16" y1="19.5" x2="15" y2="22.5" stroke="#7fc4ff" stroke-width="1.8" stroke-linecap="round"/>`),
  snow: () => svg(cloud() + `<g fill="#eaf2ff">${[9, 12.5, 16].map((x) => `<circle cx="${x}" cy="21" r="1.1"/>`).join("")}</g>`),
  storm: () => svg(cloud("#c3ccdd") + `<path d="M12.5 19l-2 3h2.4l-1.4 3 3.4-4h-2.2l1.6-2Z" fill="#ffd36b" stroke="none"/>`),
};
function svg(inner) { return `<svg class="wx" viewBox="0 0 24 24" role="img">${inner}</svg>`; }
function iconFor(kind, isDay) {
  if (kind === "clear" || kind === "cloud") return ICONS[kind](isDay);
  return (ICONS[kind] || ICONS.cloud)(isDay);
}

/* ---- helpers ---------------------------------------------- */
const round = (n) => (n == null ? "–" : Math.round(n));
// Open-Meteo (timezone=auto) returns naive LOCAL timestamps with no offset,
// e.g. "2026-07-16T05:03". Parse the digits directly — never re-apply a timezone.
function clock(iso, withMinutes) {
  let [h, m] = iso.slice(11, 16).split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  h = h % 12 || 12;
  return withMinutes ? `${h}:${String(m).padStart(2, "0")} ${ampm}` : `${h} ${ampm}`;
}
const fmtTime = (iso) => clock(iso, true);
const fmtHour = (iso) => clock(iso, false);
function weekday(iso, i) {
  if (i === 0) return "Today";
  // date-only string → format at local noon so the day never rolls over
  return new Date(iso + "T12:00:00").toLocaleDateString([], { weekday: "short" });
}
function longStamp(iso) {
  const day = new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString([], { weekday: "long" });
  return `${day} ${fmtTime(iso)}`;
}
function uvWord(u) {
  if (u == null) return "";
  if (u < 3) return "Low"; if (u < 6) return "Moderate"; if (u < 8) return "High";
  if (u < 11) return "Very high"; return "Extreme";
}

function showStatus(msg, canRetry = false) {
  el.statusText.textContent = msg;
  el.retry.hidden = !canRetry;
  el.status.hidden = false;
  el.report.hidden = true;
}
function hideStatus() { el.status.hidden = true; }

/* ---- sky theming ------------------------------------------ */
function applyTheme(kind, isDay) {
  el.html.dataset.condition = themeToken(kind, isDay);
  el.sky.classList.toggle("sky--rain", kind === "rain" || kind === "storm");
  el.sky.classList.toggle("sky--snow", kind === "snow");
  // Move the light source: high for day, low/absent for night.
  el.html.style.setProperty("--glow-y", isDay ? "14%" : "40%");
}

/* ============================================================
   Fetch + render
   ============================================================ */
async function loadWeather(place) {
  showStatus(`Reading the sky over ${place.name}…`);
  const url = `${FORECAST}?latitude=${place.latitude}&longitude=${place.longitude}`
    + `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day,precipitation`
    + `&hourly=temperature_2m,weather_code,precipitation_probability,is_day`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max`
    + `&timezone=auto&forecast_days=7`;

  let data;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("bad status " + res.status);
    data = await res.json();
  } catch (err) {
    showStatus("Couldn't reach the weather service. Check your connection.", true);
    return;
  }

  render(place, data);
  try { localStorage.setItem(STORE_KEY, JSON.stringify(place)); } catch {}
}

function render(place, data) {
  const c = data.current;
  const [condLabel, kind] = decode(c.weather_code);
  const isDay = c.is_day === 1;

  applyTheme(kind, isDay);

  el.place.textContent = place.label || place.name;
  el.localTime.textContent = longStamp(c.time);

  el.heroIcon.innerHTML = iconFor(kind, isDay);
  el.temp.textContent = round(c.temperature_2m);
  el.condition.textContent = condLabel;
  el.feels.textContent = round(c.apparent_temperature);

  el.wind.textContent = round(c.wind_speed_10m);
  el.humidity.textContent = round(c.relative_humidity_2m);
  el.uv.textContent = round(data.daily.uv_index_max[0]);
  el.uvLabel.textContent = uvWord(data.daily.uv_index_max[0]) || " ";
  el.precip.textContent = round(data.daily.precipitation_probability_max[0]);
  el.sunrise.textContent = fmtTime(data.daily.sunrise[0]);
  el.sunset.textContent = fmtTime(data.daily.sunset[0]);

  renderHourly(data.hourly, c.time);
  renderDaily(data.daily);

  hideStatus();
  el.report.hidden = false;
  // restart entrance animation
  el.report.style.animation = "none"; void el.report.offsetWidth; el.report.style.animation = "";
}

function renderHourly(h, currentIso) {
  const start = h.time.findIndex((t) => t >= currentIso.slice(0, 13));
  const from = start < 0 ? 0 : start;
  const items = [];
  for (let i = from; i < from + 24 && i < h.time.length; i++) {
    const [, kind] = decode(h.weather_code[i]);
    const isDay = h.is_day[i] === 1;
    const p = h.precipitation_probability[i];
    items.push(`<li>
      <span class="h__t">${i === from ? "Now" : fmtHour(h.time[i])}</span>
      <span class="h__i">${iconFor(kind, isDay)}</span>
      <span class="h__deg">${round(h.temperature_2m[i])}°</span>
      <span class="h__p">${p >= 20 ? p + "%" : ""}</span>
    </li>`);
  }
  el.hourly.innerHTML = items.join("");
}

function renderDaily(d) {
  // shared temperature scale across the week for comparable bars
  const lo = Math.min(...d.temperature_2m_min);
  const hi = Math.max(...d.temperature_2m_max);
  const span = Math.max(hi - lo, 1);

  el.daily.innerHTML = d.time.map((iso, i) => {
    const [, kind] = decode(d.weather_code[i]);
    const dayLo = d.temperature_2m_min[i], dayHi = d.temperature_2m_max[i];
    const left = ((dayLo - lo) / span) * 100;
    const width = Math.max(((dayHi - dayLo) / span) * 100, 8);
    return `<li>
      <span class="d__day">${weekday(iso, i)}</span>
      <span class="d__i">${iconFor(kind, true)}</span>
      <span class="d__bar"><span class="d__fill" style="left:${left}%;width:${width}%"></span></span>
      <span class="d__temps"><span class="d__hi">${round(dayHi)}°</span> <span class="d__lo">${round(dayLo)}°</span></span>
    </li>`;
  }).join("");
}

/* ============================================================
   Search (geocoding) + geolocation
   ============================================================ */
let searchTimer, activeResults = [];

async function geocode(q) {
  const res = await fetch(`${GEO}?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    name: r.name,
    label: [r.name, r.admin1, r.country_code].filter(Boolean).join(", "),
    meta: [r.admin1, r.country].filter(Boolean).join(", "),
    latitude: r.latitude, longitude: r.longitude,
  }));
}

function renderResults(list) {
  activeResults = list;
  if (!list.length) { el.results.hidden = true; return; }
  el.results.innerHTML = list.map((r, i) =>
    `<li role="option" data-i="${i}"><span class="res__name">${r.name}</span><span class="res__meta">${r.meta}</span></li>`
  ).join("");
  el.results.hidden = false;
}

el.input.addEventListener("input", () => {
  const q = el.input.value.trim();
  clearTimeout(searchTimer);
  if (q.length < 2) { el.results.hidden = true; return; }
  searchTimer = setTimeout(async () => {
    try { renderResults(await geocode(q)); } catch { el.results.hidden = true; }
  }, 250);
});

el.results.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-i]");
  if (!li) return;
  choosePlace(activeResults[+li.dataset.i]);
});

function choosePlace(place) {
  if (!place) return;
  el.results.hidden = true;
  el.input.value = place.label;
  el.input.blur();
  loadWeather(place);
}

el.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = el.input.value.trim();
  if (!q) return;
  if (activeResults.length) { choosePlace(activeResults[0]); return; }
  showStatus(`Searching for ${q}…`);
  try {
    const list = await geocode(q);
    if (!list.length) { showStatus(`No place found for "${q}". Try another spelling.`, false); return; }
    choosePlace(list[0]);
  } catch { showStatus("Search failed. Please try again.", true); }
});

// dismiss results on outside click / Escape
document.addEventListener("click", (e) => { if (!el.form.contains(e.target)) el.results.hidden = true; });
el.input.addEventListener("keydown", (e) => { if (e.key === "Escape") el.results.hidden = true; });

el.geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) { showStatus("Location isn't available on this device.", false); return; }
  showStatus("Finding your location…");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      let label = "Your location";
      try {
        const r = await fetch(`${GEO}?latitude=${latitude}&longitude=${longitude}&count=1`).then((x) => x.json());
        if (r.results && r.results[0]) label = r.results[0].name;
      } catch {}
      choosePlace({ name: label, label, latitude, longitude });
    },
    () => showStatus("Location permission denied. Search for a city instead.", false),
    { timeout: 8000 }
  );
});

el.retry.addEventListener("click", () => {
  const saved = loadSaved();
  if (saved) loadWeather(saved);
});

/* ---- boot ------------------------------------------------- */
function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; }
}

(function init() {
  const saved = loadSaved();
  if (saved) { el.input.value = saved.label || saved.name; loadWeather(saved); }
  else loadWeather({ name: "London", label: "London, England, GB", latitude: 51.5072, longitude: -0.1276 });
})();

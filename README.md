# Skyfield

The sky, as it is right now. A weather site that paints the actual sky above any place from live measurements (Open-Meteo), with an hourly curve, seven-day outlook and instrument readings.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

No API key needed. Set `NEXT_PUBLIC_SITE_URL` for correct Open Graph URLs in production.

## Stack

Next.js (App Router) · TypeScript strict · Tailwind v4 · Framer Motion · Lucide · React Hook Form + Zod · next/font (Bricolage Grotesque, Instrument Sans, JetBrains Mono).

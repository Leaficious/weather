import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudMoon,
  Moon,
  Sun,
  type LucideProps,
} from "lucide-react";
import { describeCode } from "@/lib/weather";

export function WeatherIcon({ code, isDay, ...props }: { code: number; isDay: boolean } & LucideProps) {
  const { family, label } = describeCode(code);
  const common = { "aria-label": label, role: "img", ...props };
  switch (family) {
    case "clear":
      return isDay ? <Sun {...common} /> : <Moon {...common} />;
    case "partly":
      return isDay ? <CloudSun {...common} /> : <CloudMoon {...common} />;
    case "cloudy":
      return <Cloud {...common} />;
    case "fog":
      return <CloudFog {...common} />;
    case "drizzle":
      return <CloudDrizzle {...common} />;
    case "rain":
      return <CloudRain {...common} />;
    case "snow":
      return <CloudSnow {...common} />;
    case "storm":
      return <CloudLightning {...common} />;
  }
}

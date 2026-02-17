// ============================================
// Weather-Based Greeting Generator
// Fetches weather via Open-Meteo (free, no key),
// combines with time-of-day for witty bilingual
// greetings. Falls back to Berkeley, CA.
// ============================================

import { getTimePeriod, type TimePeriod } from './greeting';

export interface WeatherGreeting {
  en: string;
  zh: string;
}

// === Weather Categories ===

type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'foggy';

/** Map WMO weather codes to simple categories */
function categorizeWeather(code: number): WeatherType {
  if (code <= 1) return 'sunny';        // Clear / mainly clear
  if (code <= 3) return 'cloudy';       // Partly cloudy / overcast
  if (code <= 49) return 'foggy';       // Fog / depositing rime fog
  if (code <= 69) return 'rainy';       // Drizzle / rain
  if (code <= 79) return 'snowy';       // Snow fall
  if (code <= 82) return 'rainy';       // Rain showers
  if (code <= 86) return 'snowy';       // Snow showers
  return 'rainy';                       // Thunderstorm
}

// === Greeting Templates ===

const BERKELEY_FALLBACK = true;

type GreetingPool = Record<TimePeriod, Record<WeatherType, WeatherGreeting[]>>;

/** Greetings when we know the user's location */
const GREETINGS: GreetingPool = {
  morning: {
    sunny:  [
      { en: 'Sunny morning! Even the sun showed up to work today.', zh: '阳光明媚的早晨！连太阳都来打卡了。' },
      { en: 'Rise and shine — the weather is being suspiciously perfect.', zh: '阳光正好 — 天气好得有点可疑。' },
    ],
    cloudy: [
      { en: 'Cloudy morning. The sky is still making up its mind.', zh: '多云的早晨。天空还没想好今天穿什么。' },
      { en: 'Overcast vibes — great day to focus on something creative.', zh: '阴天的氛围 — 适合搞点创作。' },
    ],
    rainy:  [
      { en: 'Rainy morning — grab a warm drink and stay a while.', zh: '下雨的早晨 — 来杯热饮坐坐吧。' },
      { en: 'Rain outside! Perfect excuse to mix something indoors.', zh: '外面下雨！正好在这里调杯酒。' },
    ],
    snowy:  [
      { en: 'Snowy morning! Everything looks like a postcard.', zh: '下雪的早晨！外面像明信片一样。' },
    ],
    foggy:  [
      { en: 'Foggy morning. Mysterious — just like good design.', zh: '雾蒙蒙的早晨。神秘 — 就像好的设计一样。' },
    ],
  },
  afternoon: {
    sunny:  [
      { en: 'Sunny afternoon! Hope you\'re enjoying it as much as I am.', zh: '阳光灿烂的下午！希望你跟我一样开心。' },
      { en: 'Beautiful day out there. But also beautiful in here.', zh: '外面天气真好。不过这里也不错。' },
    ],
    cloudy: [
      { en: 'Cloudy afternoon — a good time to explore.', zh: '多云的下午 — 适合到处逛逛。' },
    ],
    rainy:  [
      { en: 'Rainy afternoon — perfect weather for mixing drinks.', zh: '下雨天的下午 — 调酒的完美天气。' },
      { en: 'Rain keeps falling. Might as well stay and browse.', zh: '雨一直下。不如留下来看看。' },
    ],
    snowy:  [
      { en: 'Snowy afternoon! The world is quieter today.', zh: '下雪的下午！世界今天安静了不少。' },
    ],
    foggy:  [
      { en: 'Foggy afternoon. Everything feels a bit dreamlike.', zh: '起雾的下午。一切都有点像在做梦。' },
    ],
  },
  evening: {
    sunny:  [
      { en: 'Golden hour! The light is painting everything warm.', zh: '黄金时刻！光线把一切都染暖了。' },
    ],
    cloudy: [
      { en: 'Cloudy evening. Cozy vibes all around.', zh: '多云的夜晚。到处都是温馨的感觉。' },
    ],
    rainy:  [
      { en: 'Rainy evening — the city sounds different tonight.', zh: '下雨的晚上 — 城市今晚听起来不一样。' },
    ],
    snowy:  [
      { en: 'Snowy evening! Somewhere, a snowman is being built.', zh: '下雪的夜晚！某处正有人在堆雪人。' },
    ],
    foggy:  [
      { en: 'Foggy evening. Very noir, very atmospheric.', zh: '起雾的夜晚。很黑色电影，很有氛围感。' },
    ],
  },
  lateNight: {
    sunny:  [
      { en: 'Late night under clear skies. Stars are showing off.', zh: '深夜晴空。星星在炫耀。' },
    ],
    cloudy: [
      { en: 'Late night, cloudy skies. The world is asleep but we\'re not.', zh: '深夜多云。世界睡着了但我们还没。' },
    ],
    rainy:  [
      { en: 'Rain at night. Best soundtrack for browsing portfolios.', zh: '夜雨。浏览作品集的最佳 BGM。' },
    ],
    snowy:  [
      { en: 'Snow falling at night. Pure magic.', zh: '夜里下雪。纯粹的魔法。' },
    ],
    foggy:  [
      { en: 'Foggy late night. Very mysterious. I like it.', zh: '起雾的深夜。很神秘。我喜欢。' },
    ],
  },
};

/** What Kun is probably doing (Berkeley fallback, time-based) */
const KUN_ACTIVITIES: Record<TimePeriod, WeatherGreeting[]> = {
  morning: [
    { en: 'Kun is probably having coffee and pretending to be productive.', zh: 'Kun 大概正在喝咖啡假装自己很高效。' },
    { en: 'Kun might be walking to campus right about now.', zh: 'Kun 现在可能正走在去学校的路上。' },
  ],
  afternoon: [
    { en: 'Kun is probably in a meeting, nodding thoughtfully.', zh: 'Kun 大概正在开会，若有所思地点头。' },
    { en: 'Kun might be staring at a dashboard, looking for insights.', zh: 'Kun 可能正盯着仪表盘找 insight。' },
  ],
  evening: [
    { en: 'Kun is probably cooking dinner. Or ordering takeout. Probably takeout.', zh: 'Kun 大概在做饭。或者叫外卖。大概是外卖。' },
    { en: 'Kun might be sketching UI ideas on a napkin.', zh: 'Kun 可能正在纸巾上画 UI 草图。' },
  ],
  lateNight: [
    { en: 'Kun is either coding or asleep. Probably coding.', zh: 'Kun 要么在写代码，要么在睡觉。大概是写代码。' },
    { en: 'Kun is debugging. At this hour. Classic.', zh: 'Kun 在 debug。都这个点了。经典。' },
  ],
};

// === Location ===

const BERKELEY = { lat: 37.87, lon: -122.27 };

interface Coords { lat: number; lon: number; }

async function getUserCoords(timeoutMs = 3000): Promise<Coords | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }); },
      () => { clearTimeout(timer); resolve(null); },
      { timeout: timeoutMs, maximumAge: 300_000 }, // cache for 5min
    );
  });
}

// === Weather Fetch ===

async function fetchWeatherCode(coords: Coords): Promise<number | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.current?.weather_code ?? null;
  } catch {
    return null;
  }
}

// === Public API ===

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Cache the result so lang switch can re-read without refetch */
let cached: { greeting: WeatherGreeting; kunActivity: WeatherGreeting | null } | null = null;

export async function getWeatherGreeting(): Promise<WeatherGreeting> {
  if (cached) return cached.greeting;

  const hour = new Date().getHours();
  const period = getTimePeriod(hour);

  // Try user location, fall back to Berkeley
  const userCoords = await getUserCoords();
  const isFallback = !userCoords;
  const coords = userCoords ?? BERKELEY;

  const weatherCode = await fetchWeatherCode(coords);
  const weather: WeatherType = weatherCode !== null ? categorizeWeather(weatherCode) : 'cloudy';

  const pool = GREETINGS[period][weather];
  const greeting = pick(pool);

  // If using Berkeley fallback, append "Kun is probably..." activity
  let kunActivity: WeatherGreeting | null = null;
  if (isFallback) {
    kunActivity = pick(KUN_ACTIVITIES[period]);
  }

  const result: WeatherGreeting = kunActivity
    ? { en: `${greeting.en} ${kunActivity.en}`, zh: `${greeting.zh} ${kunActivity.zh}` }
    : greeting;

  cached = { greeting: result, kunActivity };
  return result;
}

/** Get cached greeting in a specific language (for lang switch) */
export function getCachedGreeting(lang: 'en' | 'zh'): string | null {
  return cached?.greeting[lang] ?? null;
}

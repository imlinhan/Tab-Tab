import { getMessage } from './locale';

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  cachedAt: number;
}

const CACHE_TTL = 30 * 60 * 1000;

async function getCachedWeather(): Promise<WeatherData | null> {
  try {
    const { weatherCache } = await chrome.storage.local.get('weatherCache');
    if (weatherCache && Date.now() - weatherCache.cachedAt < CACHE_TTL) {
      return weatherCache;
    }
  } catch { /* ignore */ }
  return null;
}

async function cacheWeather(data: WeatherData): Promise<void> {
  try { await chrome.storage.local.set({ weatherCache: data }); } catch { /* ignore */ }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
  });
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const resp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    );
    const data = await resp.json();
    const current = data.current;
    const code = current.weather_code as number;
    const temp = Math.round(current.temperature_2m as number);

    const descKeys: Record<number, string> = {
      0: 'weather_clear', 1: 'weather_mainly_clear', 2: 'weather_partly_cloudy', 3: 'weather_overcast',
      45: 'weather_foggy', 48: 'weather_freezing_fog', 51: 'weather_light_drizzle', 53: 'weather_drizzle',
      55: 'weather_heavy_drizzle', 61: 'weather_light_rain', 63: 'weather_rain', 65: 'weather_heavy_rain',
      71: 'weather_light_snow', 73: 'weather_snow', 75: 'weather_heavy_snow', 80: 'weather_rain_showers',
      81: 'weather_rain_showers', 82: 'weather_heavy_rain_showers', 95: 'weather_thunderstorm',
    };
    const descriptions: Record<number, string> = Object.fromEntries(
      Object.entries(descKeys).map(([k, key]) => [k, getMessage(key)])
    );

    const icons: Record<number, string> = {
      0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 45: '🌫️', 48: '🌫️',
      51: '🌦️', 53: '🌧️', 55: '🌧️', 61: '🌦️', 63: '🌧️', 65: '🌧️',
      71: '🌨️', 73: '❄️', 75: '❄️', 80: '🌦️', 81: '🌧️', 82: '🌧️', 95: '⛈️',
    };

    return {
      temp,
      description: descriptions[code] || 'Unknown',
      icon: icons[code] || '🌡️',
      cachedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

function renderWeather(data: WeatherData): void {
  const iconEl = document.getElementById('weatherIcon');
  const tempEl = document.getElementById('weatherTemp');
  const descEl = document.getElementById('weatherDesc');
  if (iconEl) iconEl.textContent = data.icon;
  if (tempEl) tempEl.textContent = `${data.temp}°C`;
  if (descEl) descEl.textContent = data.description;

  const el = document.getElementById('weatherWidget');
  if (el) el.classList.add('weather-loaded');
}

export async function initWeather(): Promise<void> {
  const cached = await getCachedWeather();
  if (cached) {
    renderWeather(cached);
    return;
  }

  try {
    const pos = await getPosition();
    const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
    if (data) {
      await cacheWeather(data);
      renderWeather(data);
    }
  } catch { /* geolocation denied or network error — widget stays hidden */ }
}

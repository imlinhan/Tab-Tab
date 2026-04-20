import { t } from './i18n';

interface SearchEngine {
  name: string;
  url: string;
  icon: string;
}

const ENGINES: SearchEngine[] = [
  {
    name: 'Google',
    url: 'https://www.google.com/search?q=',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>`,
  },
  {
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#00809d" d="M5 3v16.5l4.67 2.5 7.33-4.18V13.5L11 11V5.5L5 3zm4.67 14.08L7 15.76V7.5l2.67 1v8.58zM17 15.32l-5.33 3.01V12l5.33 3.32z"/></svg>`,
  },
  {
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#DE5833"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">D</text></svg>`,
  },
  {
    name: 'Baidu',
    url: 'https://www.baidu.com/s?wd=',
    icon: `<svg width="16" height="16" viewBox="0 0 24 24"><path fill="#2319DC" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold">B</text></svg>`,
  },
];

let currentEngineIndex = 0;

export async function initSearch(): Promise<void> {
  try {
    const { searchEngine = 'Google' } = await chrome.storage.local.get('searchEngine');
    const idx = ENGINES.findIndex((e) => e.name === searchEngine);
    if (idx !== -1) currentEngineIndex = idx;
  } catch {
    /* default to Google */
  }

  const input = document.getElementById('searchInput') as HTMLInputElement | null;
  const engineBtn = document.getElementById('searchEngine');

  if (engineBtn) {
    engineBtn.innerHTML = ENGINES[currentEngineIndex].icon;
    engineBtn.title = ENGINES[currentEngineIndex].name;
    engineBtn.addEventListener('click', cycleEngine);
  }

  if (input) {
    input.placeholder = t('search_placeholder', ENGINES[currentEngineIndex].name);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim();
        if (query) {
          window.location.href = ENGINES[currentEngineIndex].url + encodeURIComponent(query);
        }
      }
    });
  }
}

async function cycleEngine(): Promise<void> {
  currentEngineIndex = (currentEngineIndex + 1) % ENGINES.length;
  const engine = ENGINES[currentEngineIndex];

  const engineBtn = document.getElementById('searchEngine');
  const input = document.getElementById('searchInput') as HTMLInputElement | null;
  if (engineBtn) {
    engineBtn.innerHTML = engine.icon;
    engineBtn.title = engine.name;
  }
  if (input) {
    input.placeholder = t('search_placeholder', engine.name);
  }

  try {
    await chrome.storage.local.set({ searchEngine: engine.name });
  } catch {
    /* ignore */
  }
}

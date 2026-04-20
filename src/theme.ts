export type ThemeMode = 'system' | 'light' | 'dark';

let currentMode: ThemeMode = 'system';

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode: ThemeMode): void {
  const resolved = mode === 'system' ? getSystemTheme() : mode;
  document.documentElement.setAttribute('data-theme', resolved);
}

export function getCurrentTheme(): ThemeMode {
  return currentMode;
}

export function setTheme(mode: ThemeMode): void {
  currentMode = mode;
  applyTheme(currentMode);
  updateToggleIcon();
  chrome.storage.local.set({ theme: currentMode }).catch(() => {});
}

export async function initTheme(): Promise<void> {
  try {
    const { theme = 'system' } = await chrome.storage.local.get('theme');
    currentMode = theme as ThemeMode;
  } catch {
    currentMode = 'system';
  }
  applyTheme(currentMode);
  updateToggleIcon();

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentMode === 'system') applyTheme('system');
  });
}

export async function cycleTheme(): Promise<void> {
  const order: ThemeMode[] = ['system', 'light', 'dark'];
  const idx = order.indexOf(currentMode);
  currentMode = order[(idx + 1) % order.length];
  applyTheme(currentMode);
  updateToggleIcon();
  try {
    await chrome.storage.local.set({ theme: currentMode });
  } catch {}
}

function updateToggleIcon(): void {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const resolved = currentMode === 'system' ? getSystemTheme() : currentMode;

  const icons: Record<string, string> = {
    light: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    dark: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  };

  btn.innerHTML = icons[resolved];
  btn.title = `Theme: ${currentMode} (click to cycle)`;
}

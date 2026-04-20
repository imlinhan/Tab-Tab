export interface ColorScheme {
  name: string;
  lightStart: string;
  lightEnd: string;
  darkStart: string;
  darkEnd: string;
  accent: string;
  accentLight: string;
}

export const SCHEMES: ColorScheme[] = [
  { name: 'Indigo',  lightStart: '#dfe7fd', lightEnd: '#e5d9f5', darkStart: '#111111', darkEnd: '#1a1a1a', accent: '#6366f1', accentLight: '#818cf8' },
  { name: 'Emerald', lightStart: '#d1fae5', lightEnd: '#dff5e3', darkStart: '#111111', darkEnd: '#1a1a1a', accent: '#10b981', accentLight: '#34d399' },
  { name: 'Rose',    lightStart: '#ffe4e6', lightEnd: '#fce7f3', darkStart: '#111111', darkEnd: '#1a1a1a', accent: '#f43f5e', accentLight: '#fb7185' },
  { name: 'Amber',   lightStart: '#fef3c7', lightEnd: '#fde68a', darkStart: '#111111', darkEnd: '#1a1a1a', accent: '#f59e0b', accentLight: '#fbbf24' },
  { name: 'Cyan',    lightStart: '#cffafe', lightEnd: '#d5f5f6', darkStart: '#111111', darkEnd: '#1a1a1a', accent: '#06b6d4', accentLight: '#22d3ee' },
  { name: 'Slate',   lightStart: '#e2e8f0', lightEnd: '#f1f5f9', darkStart: '#111111', darkEnd: '#1a1a1a', accent: '#64748b', accentLight: '#94a3b8' },
];

let currentIndex = 0;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function apply(scheme: ColorScheme): void {
  const root = document.documentElement;
  root.style.setProperty('--bg-start-light', scheme.lightStart);
  root.style.setProperty('--bg-end-light', scheme.lightEnd);
  root.style.setProperty('--bg-start-dark', scheme.darkStart);
  root.style.setProperty('--bg-end-dark', scheme.darkEnd);
  root.style.setProperty('--accent', scheme.accent);
  root.style.setProperty('--accent-light', scheme.accentLight);
  root.style.setProperty('--badge-bg', hexToRgba(scheme.accent, 0.1));
  root.style.setProperty('--badge-color', scheme.accent);

  const theme = root.getAttribute('data-theme');
  if (theme === 'dark') {
    root.style.setProperty('--bg-start', scheme.darkStart);
    root.style.setProperty('--bg-end', scheme.darkEnd);
    root.style.setProperty('--badge-color', scheme.accentLight);
    root.style.setProperty('--badge-bg', hexToRgba(scheme.accentLight, 0.15));
  } else {
    root.style.setProperty('--bg-start', scheme.lightStart);
    root.style.setProperty('--bg-end', scheme.lightEnd);
  }
}

export function getCurrentScheme(): number {
  return currentIndex;
}

export function applyScheme(index: number): void {
  if (index < 0 || index >= SCHEMES.length) return;
  currentIndex = index;
  apply(SCHEMES[currentIndex]);
  chrome.storage.local.set({ colorScheme: currentIndex }).catch(() => {});
}

export async function initColorScheme(): Promise<void> {
  try {
    const { colorScheme = 0 } = await chrome.storage.local.get('colorScheme');
    currentIndex = typeof colorScheme === 'number' ? colorScheme : 0;
  } catch { currentIndex = 0; }

  apply(SCHEMES[currentIndex]);

  const observer = new MutationObserver(() => {
    apply(SCHEMES[currentIndex]);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

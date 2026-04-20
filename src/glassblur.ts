import { getSkin } from './skin';

let blurLevel = 16;

function apply(): void {
  const root = document.documentElement;
  if (getSkin() === 'glass') {
    const blur = `blur(${blurLevel}px)`;
    root.style.setProperty('--card-backdrop', blur);
    root.style.setProperty('--search-backdrop', blur);
    root.style.setProperty('--glass-blur', `${blurLevel}px`);
  } else {
    root.style.removeProperty('--card-backdrop');
    root.style.removeProperty('--search-backdrop');
    root.style.removeProperty('--glass-blur');
  }
}

export function getBlur(): number {
  return blurLevel;
}

export function setBlur(px: number): void {
  blurLevel = Math.max(0, Math.min(40, px));
  apply();
  chrome.storage.local.set({ glassBlur: blurLevel }).catch(() => {});
}

export function reapplyBlur(): void {
  apply();
}

export async function initGlassBlur(): Promise<void> {
  try {
    const { glassBlur } = await chrome.storage.local.get('glassBlur');
    if (typeof glassBlur === 'number') blurLevel = glassBlur;
  } catch {}
  apply();
}

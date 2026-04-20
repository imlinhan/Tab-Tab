export type MotionLevel = 'subtle' | 'smooth' | 'bouncy';

let currentMotion: MotionLevel = 'smooth';

export function getMotionDuration(varName: string): number {
  const ms = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return parseInt(ms, 10) || 0;
}

export function setMotion(level: MotionLevel): void {
  currentMotion = level;
  document.documentElement.setAttribute('data-motion', level);
  chrome.storage.local.set({ motion: level }).catch(() => {});
}

export function getMotion(): MotionLevel {
  return currentMotion;
}

export async function initMotion(): Promise<void> {
  try {
    const { motion = 'smooth' } = await chrome.storage.local.get('motion');
    currentMotion = motion as MotionLevel;
  } catch {
    currentMotion = 'smooth';
  }
  document.documentElement.setAttribute('data-motion', currentMotion);
}

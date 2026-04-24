import { initWallpaperOverlay } from './wallpaper-overlay';

let wallpaperUrl = '';

export type OsWallpaperInfo = {
  os: 'mac' | 'windows' | 'other';
  paths: string[];
};

export function getOsWallpaperInfo(): OsWallpaperInfo {
  const ua = navigator.userAgent;
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return {
      os: 'mac',
      paths: [
        '~/Library/Application Support/com.apple.wallpaper/',
        '/Library/Desktop Pictures/',
      ],
    };
  }
  if (/Windows/i.test(ua)) {
    return {
      os: 'windows',
      paths: [
        '%AppData%\\Microsoft\\Windows\\Themes\\CachedFiles\\',
        'C:\\Windows\\Web\\Wallpaper\\',
        '%LocalAppData%\\Microsoft\\Windows\\Themes\\',
      ],
    };
  }
  return { os: 'other', paths: [] };
}

function apply(): void {
  const bg = document.querySelector<HTMLElement>('.bg-gradient');
  if (!bg) return;
  if (wallpaperUrl) {
    bg.style.backgroundImage = `url(${wallpaperUrl})`;
    bg.style.backgroundSize = 'cover';
    bg.style.backgroundPosition = 'center';
    bg.classList.add('has-wallpaper');
  } else {
    bg.style.backgroundImage = '';
    bg.style.backgroundSize = '';
    bg.style.backgroundPosition = '';
    bg.classList.remove('has-wallpaper');
  }
}

export function hasWallpaper(): boolean {
  return wallpaperUrl !== '';
}

export function uploadWallpaper(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      wallpaperUrl = reader.result as string;
      apply();
      await initWallpaperOverlay();
      try { await chrome.storage.local.set({ wallpaper: wallpaperUrl }); } catch {}
    };
    reader.readAsDataURL(file);
  });
  input.click();
}

export function clearWallpaper(): void {
  wallpaperUrl = '';
  apply();
  chrome.storage.local.set({ wallpaper: '' }).catch(() => {});
}

export async function initWallpaper(): Promise<void> {
  try {
    const { wallpaper = '' } = await chrome.storage.local.get('wallpaper');
    wallpaperUrl = wallpaper;
  } catch { wallpaperUrl = ''; }
  apply();
}

let cachedBrightness: number | null = null;
let themeObserver: MutationObserver | null = null;

function measureBrightness(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 64;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(128); return; }

      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      let total = 0;
      const pixels = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        total += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      }

      resolve(total / pixels);
    };
    img.onerror = () => resolve(128);
    img.src = dataUrl;
  });
}

function applyOverlay(): void {
  const overlay = document.querySelector<HTMLElement>('.bg-overlay');
  if (!overlay) return;

  if (cachedBrightness === null) {
    overlay.style.background = '';
    return;
  }

  const theme = document.documentElement.getAttribute('data-theme');
  const isLight = theme !== 'dark';

  if (isLight && cachedBrightness < 140) {
    const strength = Math.min(0.7, (140 - cachedBrightness) / 200);
    overlay.style.background = `rgba(255,255,255,${strength.toFixed(2)})`;
  } else if (!isLight && cachedBrightness > 140) {
    const strength = Math.min(0.7, (cachedBrightness - 140) / 200);
    overlay.style.background = `rgba(0,0,0,${strength.toFixed(2)})`;
  } else {
    overlay.style.background = '';
  }
}

function ensureOverlayEl(): void {
  if (document.querySelector('.bg-overlay')) return;
  const bg = document.querySelector('.bg-gradient');
  if (!bg) return;
  const el = document.createElement('div');
  el.className = 'bg-overlay';
  bg.insertAdjacentElement('afterend', el);
}

export async function initWallpaperOverlay(): Promise<void> {
  ensureOverlayEl();

  const bg = document.querySelector<HTMLElement>('.bg-gradient');
  if (!bg || !bg.classList.contains('has-wallpaper')) {
    cachedBrightness = null;
    applyOverlay();
    return;
  }

  const img = bg.style.backgroundImage;
  const match = img.match(/url\(["']?(data:.*?)["']?\)/);
  if (!match) {
    cachedBrightness = null;
    applyOverlay();
    return;
  }

  cachedBrightness = await measureBrightness(match[1]);
  applyOverlay();

  if (!themeObserver) {
    themeObserver = new MutationObserver(() => applyOverlay());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
}

import { type SkinName, getSkin, setSkin } from './skin';
import { type MotionLevel, getMotion, setMotion } from './motion';
import { SCHEMES, getCurrentScheme, applyScheme } from './colorscheme';
import { uploadWallpaper, clearWallpaper } from './wallpaper';
import { setMode, isFullMode } from './mode';
import { type ThemeMode, getCurrentTheme, setTheme } from './theme';
import { mergeAllWindows } from './windowmerge';
import { getBlur, setBlur, reapplyBlur } from './glassblur';

function renderBody(): void {
  const body = document.getElementById('settingsBody');
  if (!body) return;

  const skin = getSkin();
  const theme = getCurrentTheme();
  const motion = getMotion();
  const scheme = getCurrentScheme();
  const fullMode = isFullMode();

  function skinBtn(name: SkinName, label: string): string {
    return `<button data-action="set-skin" data-value="${name}" class="${skin === name ? 'active' : ''}">${label}</button>`;
  }

  function themeBtn(mode: ThemeMode, label: string): string {
    return `<button data-action="set-theme" data-value="${mode}" class="${theme === mode ? 'active' : ''}">${label}</button>`;
  }

  function motionBtn(level: MotionLevel, label: string): string {
    return `<button data-action="set-motion" data-value="${level}" class="${motion === level ? 'active' : ''}">${label}</button>`;
  }

  const colorDots = SCHEMES.map((s, i) =>
    `<button class="settings-color-dot${i === scheme ? ' active' : ''}" data-action="set-color" data-index="${i}" title="${s.name}" style="background:${s.accent}"></button>`
  ).join('');

  const blur = getBlur();
  const blurRow = skin === 'glass' ? `
      <div class="settings-row">
        <span class="settings-row-label">Blur</span>
        <div class="settings-range-wrap">
          <input type="range" class="settings-range" id="settingsBlur" min="0" max="40" step="1" value="${blur}">
          <span class="settings-range-value" id="settingsBlurValue">${blur}px</span>
        </div>
      </div>` : '';

  body.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">Appearance</div>
      <div class="settings-row">
        <span class="settings-row-label">Style</span>
        <div class="settings-btn-group">
          ${skinBtn('minimal', 'Minimal')}
          ${skinBtn('glass', 'Glass')}
          ${skinBtn('material', 'Material')}
        </div>
      </div>${blurRow}
      <div class="settings-row">
        <span class="settings-row-label">Color</span>
        <div class="settings-colors">${colorDots}</div>
      </div>
      <div class="settings-row">
        <span class="settings-row-label">Theme</span>
        <div class="settings-btn-group">
          ${themeBtn('system', 'System')}
          ${themeBtn('light', 'Light')}
          ${themeBtn('dark', 'Dark')}
        </div>
      </div>
      <div class="settings-row">
        <span class="settings-row-label">Animation</span>
        <div class="settings-btn-group">
          ${motionBtn('subtle', 'Subtle')}
          ${motionBtn('smooth', 'Smooth')}
          ${motionBtn('bouncy', 'Bouncy')}
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Background</div>
      <div class="settings-row">
        <span class="settings-row-label">Wallpaper</span>
        <div class="settings-btn-group">
          <button data-action="upload-wallpaper">Upload</button>
          <button data-action="clear-wallpaper">Clear</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Layout</div>
      <div class="settings-row">
        <span class="settings-row-label">Dashboard mode</span>
        <label class="settings-toggle">
          <input type="checkbox" id="settingsFullMode" ${fullMode ? 'checked' : ''}>
          <span class="settings-toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">Actions</div>
      <button class="settings-action-btn" data-action="merge-windows">Merge all windows</button>
      <button class="settings-action-btn" data-action="export-settings">Export settings</button>
      <button class="settings-action-btn danger" data-action="reset-all" id="resetAllBtn">Reset all settings</button>
    </div>
  `;
}

function open(): void {
  renderBody();
  document.getElementById('settingsOverlay')?.classList.add('open');
  document.getElementById('settingsPanel')?.classList.add('open');
}

function close(): void {
  document.getElementById('settingsOverlay')?.classList.remove('open');
  document.getElementById('settingsPanel')?.classList.remove('open');
}

async function exportSettings(): Promise<void> {
  try {
    const data = await chrome.storage.local.get(null);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tab-tab-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch {}
}

let resetTimeout: ReturnType<typeof setTimeout> | null = null;

function handleResetAll(): void {
  const btn = document.getElementById('resetAllBtn');
  if (!btn) return;

  if (btn.dataset.confirm === 'true') {
    chrome.storage.local.clear().then(() => {
      location.reload();
    }).catch(() => {});
    return;
  }

  btn.textContent = 'Confirm reset?';
  btn.dataset.confirm = 'true';

  if (resetTimeout) clearTimeout(resetTimeout);
  resetTimeout = setTimeout(() => {
    btn.textContent = 'Reset all settings';
    delete btn.dataset.confirm;
  }, 3000);
}

export function initSettings(): void {
  document.getElementById('settingsBtn')?.addEventListener('click', open);
  document.getElementById('settingsClose')?.addEventListener('click', close);
  document.getElementById('settingsOverlay')?.addEventListener('click', close);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  document.getElementById('settingsPanel')?.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'set-skin') {
      setSkin(el.dataset.value as SkinName);
      reapplyBlur();
      renderBody();
    } else if (action === 'set-theme') {
      setTheme(el.dataset.value as ThemeMode);
      renderBody();
    } else if (action === 'set-motion') {
      setMotion(el.dataset.value as MotionLevel);
      renderBody();
    } else if (action === 'set-color') {
      const idx = parseInt(el.dataset.index || '', 10);
      if (!isNaN(idx)) {
        applyScheme(idx);
        renderBody();
      }
    } else if (action === 'upload-wallpaper') {
      uploadWallpaper();
    } else if (action === 'clear-wallpaper') {
      clearWallpaper();
    } else if (action === 'merge-windows') {
      mergeAllWindows().catch(() => {});
    } else if (action === 'export-settings') {
      exportSettings();
    } else if (action === 'reset-all') {
      handleResetAll();
    }
  });

  document.getElementById('settingsPanel')?.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'settingsFullMode') {
      setMode(target.checked);
    }
  });

  document.getElementById('settingsPanel')?.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.id === 'settingsBlur') {
      const val = parseInt(target.value, 10);
      setBlur(val);
      const label = document.getElementById('settingsBlurValue');
      if (label) label.textContent = val + 'px';
    }
  });
}

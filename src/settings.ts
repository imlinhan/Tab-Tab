import { type SkinName, getSkin, setSkin } from './skin';
import { type MotionLevel, getMotion, setMotion } from './motion';
import { SCHEMES, getCurrentScheme, applyScheme } from './colorscheme';
import { uploadWallpaper, clearWallpaper } from './wallpaper';
import { setMode, isFullMode } from './mode';
import { type ThemeMode, getCurrentTheme, setTheme } from './theme';
import { mergeAllWindows } from './windowmerge';
import { getBlur, setBlur, reapplyBlur } from './glassblur';
import { t } from './i18n';
import { type LocalePref, getLocalePref, setLocale } from './locale';
import { applyI18n } from './i18n';
import { renderDashboard } from './render';

function renderBody(): void {
  const body = document.getElementById('settingsBody');
  if (!body) return;

  const skin = getSkin();
  const theme = getCurrentTheme();
  const motion = getMotion();
  const scheme = getCurrentScheme();
  const fullMode = isFullMode();
  const locale = getLocalePref();

  function skinBtn(name: SkinName, label: string): string {
    return `<button data-action="set-skin" data-value="${name}" class="${skin === name ? 'active' : ''}">${label}</button>`;
  }

  function themeBtn(mode: ThemeMode, label: string): string {
    return `<button data-action="set-theme" data-value="${mode}" class="${theme === mode ? 'active' : ''}">${label}</button>`;
  }

  function localeBtn(value: LocalePref, label: string): string {
    return `<button data-action="set-locale" data-value="${value}" class="${locale === value ? 'active' : ''}">${label}</button>`;
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
        <span class="settings-row-label">${t('settings_blur')}</span>
        <div class="settings-range-wrap">
          <input type="range" class="settings-range" id="settingsBlur" min="0" max="40" step="1" value="${blur}">
          <span class="settings-range-value" id="settingsBlurValue">${blur}px</span>
        </div>
      </div>` : '';

  body.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">${t('settings_appearance')}</div>
      <div class="settings-row">
        <span class="settings-row-label">${t('settings_style')}</span>
        <div class="settings-btn-group">
          ${skinBtn('minimal', t('settings_skin_minimal'))}
          ${skinBtn('glass', t('settings_skin_glass'))}
          ${skinBtn('material', t('settings_skin_material'))}
        </div>
      </div>${blurRow}
      <div class="settings-row">
        <span class="settings-row-label">${t('settings_color')}</span>
        <div class="settings-colors">${colorDots}</div>
      </div>
      <div class="settings-row">
        <span class="settings-row-label">${t('settings_theme')}</span>
        <div class="settings-btn-group">
          ${themeBtn('system', t('settings_theme_system'))}
          ${themeBtn('light', t('settings_theme_light'))}
          ${themeBtn('dark', t('settings_theme_dark'))}
        </div>
      </div>
      <div class="settings-row">
        <span class="settings-row-label">${t('settings_animation')}</span>
        <div class="settings-btn-group">
          ${motionBtn('subtle', t('settings_motion_subtle'))}
          ${motionBtn('smooth', t('settings_motion_smooth'))}
          ${motionBtn('bouncy', t('settings_motion_bouncy'))}
        </div>
      </div>
      <div class="settings-row">
        <span class="settings-row-label">${t('settings_language')}</span>
        <div class="settings-btn-group">
          ${localeBtn('system', t('settings_lang_system'))}
          ${localeBtn('en', t('settings_lang_en'))}
          ${localeBtn('zh_CN', t('settings_lang_zh_CN'))}
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">${t('settings_background')}</div>
      <div class="settings-row">
        <span class="settings-row-label">${t('settings_wallpaper')}</span>
        <div class="settings-btn-group">
          <button data-action="upload-wallpaper">${t('settings_wallpaper_upload')}</button>
          <button data-action="clear-wallpaper">${t('settings_wallpaper_clear')}</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">${t('settings_layout')}</div>
      <div class="settings-row">
        <span class="settings-row-label">${t('settings_dashboard_mode')}</span>
        <label class="settings-toggle">
          <input type="checkbox" id="settingsFullMode" ${fullMode ? 'checked' : ''}>
          <span class="settings-toggle-slider"></span>
        </label>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-title">${t('settings_actions')}</div>
      <button class="settings-action-btn" data-action="merge-windows">${t('settings_merge_windows')}</button>
      <button class="settings-action-btn" data-action="export-settings">${t('settings_export')}</button>
      <button class="settings-action-btn danger" data-action="reset-all" id="resetAllBtn">${t('settings_reset')}</button>
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

  btn.textContent = t('settings_reset_confirm');
  btn.dataset.confirm = 'true';

  if (resetTimeout) clearTimeout(resetTimeout);
  resetTimeout = setTimeout(() => {
    btn.textContent = t('settings_reset');
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

  document.getElementById('settingsPanel')?.addEventListener('click', async (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'set-locale') {
      await setLocale(el.dataset.value as LocalePref);
      applyI18n();
      await renderDashboard();
      renderBody();
    } else if (action === 'set-skin') {
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

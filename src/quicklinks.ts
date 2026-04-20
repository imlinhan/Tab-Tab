import { t } from './i18n';

export interface QuickLink {
  name: string;
  url: string;
}

const DEFAULT_LINKS: QuickLink[] = [
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'YouTube', url: 'https://www.youtube.com' },
  { name: 'Gmail', url: 'https://mail.google.com' },
];

let links: QuickLink[] = [];

async function loadLinks(): Promise<QuickLink[]> {
  try {
    const { quickLinks } = await chrome.storage.local.get('quickLinks');
    return quickLinks && quickLinks.length > 0 ? quickLinks : DEFAULT_LINKS;
  } catch {
    return DEFAULT_LINKS;
  }
}

async function saveLinks(): Promise<void> {
  try {
    await chrome.storage.local.set({ quickLinks: links });
  } catch { /* ignore */ }
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function getColor(name: string): string {
  const colors = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function render(): void {
  const container = document.getElementById('quickLinks');
  if (!container) return;

  container.innerHTML = links.map((link, i) => {
    const color = getColor(link.name);
    return `<a class="quick-link" href="${escapeHtml(link.url)}" title="${escapeHtml(link.name)}">
      <span class="quick-link-letter" style="background:${color}">${getInitial(link.name)}</span>
      <span class="quick-link-name">${escapeHtml(link.name)}</span>
      <button class="quick-link-remove" data-action="remove-quick-link" data-index="${i}" title="${t('quicklink_remove_title')}">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </a>`;
  }).join('') + `<button class="quick-link quick-link-add" data-action="add-quick-link" title="${t('quicklink_add_title')}">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  </button>`;
}

export async function initQuickLinks(): Promise<void> {
  links = await loadLinks();
  render();

  document.addEventListener('click', async (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el) return;

    if (el.dataset.action === 'remove-quick-link') {
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(el.dataset.index || '', 10);
      if (!isNaN(idx) && idx >= 0 && idx < links.length) {
        links.splice(idx, 1);
        await saveLinks();
        render();
      }
    }

    if (el.dataset.action === 'add-quick-link') {
      e.preventDefault();
      const name = prompt(t('quicklink_prompt_name'));
      if (!name) return;
      const url = prompt(t('quicklink_prompt_url'), 'https://');
      if (!url) return;
      links.push({ name, url });
      await saveLinks();
      render();
    }
  });
}

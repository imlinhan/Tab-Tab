import { t } from './i18n';

interface HibernatedGroup {
  id: string;
  name: string;
  tabs: { url: string; title: string }[];
  savedAt: string;
}

async function loadHibernated(): Promise<HibernatedGroup[]> {
  try {
    const { hibernated = [] } = await chrome.storage.local.get('hibernated');
    return hibernated;
  } catch {
    return [];
  }
}

async function saveHibernated(groups: HibernatedGroup[]): Promise<void> {
  try { await chrome.storage.local.set({ hibernated: groups }); } catch { /* ignore */ }
}

function render(groups: HibernatedGroup[]): void {
  const list = document.getElementById('hibernateList');
  const empty = document.getElementById('hibernateEmpty');
  if (!list) return;

  if (groups.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  list.innerHTML = groups.map((g) => `
    <div class="hibernate-group" data-hibernate-id="${g.id}">
      <div class="hibernate-header">
        <span class="hibernate-name">${escapeHtml(g.name)}</span>
        <span class="hibernate-count">${t('hibernate_count_tabs', String(g.tabs.length))}</span>
      </div>
      <div class="hibernate-actions">
        <button class="card-btn" data-action="restore-hibernate" data-hibernate-id="${g.id}">${t('btn_restore')}</button>
        <button class="card-btn card-btn-close" data-action="delete-hibernate" data-hibernate-id="${g.id}">${t('btn_delete')}</button>
      </div>
    </div>
  `).join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function hibernateGroup(name: string, tabs: { url: string; title: string }[]): Promise<void> {
  const groups = await loadHibernated();
  groups.push({
    id: Date.now().toString(),
    name,
    tabs,
    savedAt: new Date().toISOString(),
  });
  await saveHibernated(groups);
}

export async function refreshHibernateWidget(): Promise<void> {
  const groups = await loadHibernated();
  render(groups);
}

export async function initHibernate(): Promise<void> {
  const groups = await loadHibernated();
  render(groups);

  document.addEventListener('click', async (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el) return;

    if (el.dataset.action === 'restore-hibernate') {
      const id = el.dataset.hibernateId;
      const allGroups = await loadHibernated();
      const group = allGroups.find((g) => g.id === id);
      if (!group) return;

      for (const tab of group.tabs) {
        await chrome.tabs.create({ url: tab.url, active: false });
      }

      const remaining = allGroups.filter((g) => g.id !== id);
      await saveHibernated(remaining);
      render(remaining);
    }

    if (el.dataset.action === 'delete-hibernate') {
      const id = el.dataset.hibernateId;
      const allGroups = await loadHibernated();
      const remaining = allGroups.filter((g) => g.id !== id);
      await saveHibernated(remaining);
      render(remaining);
    }
  });
}

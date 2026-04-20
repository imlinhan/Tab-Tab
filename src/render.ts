import {
  type DomainGroup,
  type TabInfo,
  fetchOpenTabs,
  getOpenTabs,
  getRealTabs,
  groupTabsByDomain,
  closeTabsByUrls,
  closeTabsExact,
  closeSingleTab,
  focusTab,
  closeDuplicateTabs,
  closeTabTabDups,
} from './tabs';
import { saveTabForLater, getSavedTabs, checkOffSavedTab, dismissSavedTab } from './storage';
import { recordClose, recordSave } from './stats';
import { enableDragOnCards } from './dragdrop';
import { hibernateGroup, refreshHibernateWidget } from './hibernate';
import { bindCardHover } from './cardhover';
import {
  friendlyDomain,
  stripTitleNoise,
  cleanTitle,
  smartTitle,
  getGreeting,
  getDateDisplay,
  timeAgo,
  escapeHtml,
} from './utils';

let domainGroups: DomainGroup[] = [];

function showToast(message: string): void {
  const toast = document.getElementById('toast');
  const text = document.getElementById('toastText');
  if (!toast || !text) return;
  text.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2500);
}

function animateCardOut(card: HTMLElement): void {
  card.classList.add('closing');
  setTimeout(() => {
    card.remove();
    checkAndShowEmptyState();

  }, 300);
}

function checkAndShowEmptyState(): void {
  const missionsEl = document.getElementById('openTabsMissions');
  if (!missionsEl) return;
  const remaining = missionsEl.querySelectorAll('.mission-card:not(.closing)').length;
  if (remaining > 0) return;

  missionsEl.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m4.5 12.75 6 6 9-13.5"/>
        </svg>
      </div>
      <div class="empty-title">All clear</div>
      <div class="empty-subtitle">No open tabs to manage.</div>
    </div>`;

  const countEl = document.getElementById('openTabsSectionCount');
  if (countEl) countEl.textContent = '0 sites';
}

function getUrlCounts(tabs: TabInfo[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tab of tabs) counts[tab.url] = (counts[tab.url] || 0) + 1;
  return counts;
}

function renderTabRow(
  tab: TabInfo,
  dupCount: number,
  hostname: string,
): string {
  let label = cleanTitle(smartTitle(stripTitleNoise(tab.title), tab.url), hostname);
  try {
    const parsed = new URL(tab.url);
    if (parsed.hostname === 'localhost' && parsed.port) label = `${parsed.port} ${label}`;
  } catch {
    /* ignore */
  }

  const dupTag = dupCount > 1 ? ` <span class="chip-dup">${dupCount} duplicates</span>` : '';
  const dupClass = dupCount > 1 ? ' chip-has-dups' : '';
  const safeUrl = escapeHtml(tab.url);
  const safeTitle = escapeHtml(label);
  const favicon = tab.favIconUrl;

  return `<div class="tab-row clickable${dupClass}" data-action="focus-tab" data-tab-url="${safeUrl}" title="${safeTitle}">
    ${favicon ? `<img class="tab-favicon" src="${escapeHtml(favicon)}" alt="">` : '<span class="tab-favicon-placeholder"></span>'}
    <span class="tab-title">${escapeHtml(label)}</span>${dupTag}
    <div class="tab-actions">
      <button class="tab-btn tab-save" data-action="defer-single-tab" data-tab-url="${safeUrl}" data-tab-title="${safeTitle}" title="Save for later">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      </button>
      <button class="tab-btn tab-close" data-action="close-single-tab" data-tab-url="${safeUrl}" title="Close tab">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  </div>`;
}

function renderDomainCard(group: DomainGroup): string {
  const tabs = group.tabs;
  const tabCount = tabs.length;
  const isLanding = group.domain === '__landing-pages__';
  const stableId = 'domain-' + group.domain.replace(/[^a-z0-9]/g, '-');

  const urlCounts = getUrlCounts(tabs);
  const dupUrls = Object.entries(urlCounts).filter(([, c]) => c > 1);
  const hasDups = dupUrls.length > 0;
  const totalExtras = dupUrls.reduce((s, [, c]) => s + c - 1, 0);

  const seen = new Set<string>();
  const uniqueTabs: TabInfo[] = [];
  for (const tab of tabs) {
    if (!seen.has(tab.url)) {
      seen.add(tab.url);
      uniqueTabs.push(tab);
    }
  }

  const visibleTabs = uniqueTabs.slice(0, 8);
  const hiddenTabs = uniqueTabs.slice(8);

  const tabRows = visibleTabs
    .map((tab) => renderTabRow(tab, urlCounts[tab.url], group.domain))
    .join('');

  const overflowHtml =
    hiddenTabs.length > 0
      ? `<div class="overflow-tabs" style="display:none">${hiddenTabs.map((tab) => renderTabRow(tab, urlCounts[tab.url], group.domain)).join('')}</div>
         <div class="tab-row overflow-toggle" data-action="expand-chips"><span class="tab-title">+${hiddenTabs.length} more</span></div>`
      : '';

  const dupBadge = hasDups
    ? `<span class="badge badge-warn">${totalExtras} duplicate${totalExtras !== 1 ? 's' : ''}</span>`
    : '';

  let actionsHtml = `
    <button class="card-btn card-btn-close" data-action="close-domain-tabs" data-domain-id="${stableId}">
      Close all ${tabCount}
    </button>
    <button class="card-btn" data-action="hibernate-domain" data-domain-id="${stableId}">
      Save &amp; close
    </button>`;

  if (hasDups) {
    const dupUrlsEncoded = dupUrls.map(([url]) => encodeURIComponent(url)).join(',');
    actionsHtml += `
      <button class="card-btn" data-action="dedup-keep-one" data-dup-urls="${dupUrlsEncoded}">
        Close ${totalExtras} duplicate${totalExtras !== 1 ? 's' : ''}
      </button>`;
  }

  const cardName = isLanding
    ? 'Homepages'
    : group.label || friendlyDomain(group.domain);

  return `
    <div class="mission-card glass-card${hasDups ? ' has-dups' : ''}" data-domain-id="${stableId}">
      <div class="card-header">
        <span class="card-name">${escapeHtml(cardName)}</span>
        <span class="badge">${tabCount} tab${tabCount !== 1 ? 's' : ''}</span>
        ${dupBadge}
      </div>
      <div class="card-tabs">${tabRows}${overflowHtml}</div>
      <div class="card-actions">${actionsHtml}</div>
    </div>`;
}

async function renderDeferredColumn(): Promise<void> {
  const column = document.getElementById('deferredColumn');
  const list = document.getElementById('deferredList');
  const empty = document.getElementById('deferredEmpty');
  const countEl = document.getElementById('deferredCount');
  const archiveEl = document.getElementById('deferredArchive');
  const archiveCountEl = document.getElementById('archiveCount');
  const archiveList = document.getElementById('archiveList');

  if (!column) return;

  try {
    const { active, archived } = await getSavedTabs();

    if (active.length === 0 && archived.length === 0) {
      column.style.display = 'none';
      return;
    }

    column.style.display = 'block';

    if (list && countEl && empty) {
      if (active.length > 0) {
        countEl.textContent = `${active.length} item${active.length !== 1 ? 's' : ''}`;
        list.innerHTML = active
          .map((item) => {
            let domain = '';
            try {
              domain = new URL(item.url).hostname.replace(/^www\./, '');
            } catch {
              /* ignore */
            }
            const ago = timeAgo(item.savedAt);
            return `
            <div class="deferred-item" data-deferred-id="${item.id}">
              <input type="checkbox" class="deferred-checkbox" data-action="check-deferred" data-deferred-id="${item.id}">
              <div class="deferred-info">
                <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="deferred-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title || item.url)}</a>
                <div class="deferred-meta">
                  <span>${escapeHtml(domain)}</span>
                  <span>${ago}</span>
                </div>
              </div>
              <button class="deferred-dismiss" data-action="dismiss-deferred" data-deferred-id="${item.id}" title="Dismiss">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>`;
          })
          .join('');
        list.style.display = 'block';
        empty.style.display = 'none';
      } else {
        list.style.display = 'none';
        countEl.textContent = '';
        empty.style.display = 'block';
      }
    }

    if (archiveEl && archiveCountEl && archiveList) {
      if (archived.length > 0) {
        archiveCountEl.textContent = `(${archived.length})`;
        archiveList.innerHTML = archived
          .map((item) => {
            const ago = item.completedAt ? timeAgo(item.completedAt) : timeAgo(item.savedAt);
            return `<div class="archive-item">
              <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="archive-item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title || item.url)}</a>
              <span class="archive-item-date">${ago}</span>
              <button class="archive-item-delete" data-action="dismiss-deferred" data-deferred-id="${item.id}" title="Delete">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>`;
          })
          .join('');
        archiveEl.style.display = 'block';
      } else {
        archiveEl.style.display = 'none';
      }
    }
  } catch {
    if (column) column.style.display = 'none';
  }
}

function checkTabTabDupeBanner(): void {
  const tabTabTabs = getOpenTabs().filter((t) => t.isTabTab);
  const banner = document.getElementById('tabTabDupeBanner');
  const countEl = document.getElementById('tabTabDupeCount');
  if (!banner) return;

  if (tabTabTabs.length > 1) {
    if (countEl) countEl.textContent = String(tabTabTabs.length);
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

export async function renderDashboard(): Promise<void> {
  const greetingEl = document.getElementById('greeting');
  const dateEl = document.getElementById('dateDisplay');
  if (greetingEl) greetingEl.textContent = getGreeting();
  if (dateEl) dateEl.textContent = getDateDisplay();

  await fetchOpenTabs();
  const realTabs = getRealTabs();

  domainGroups = groupTabsByDomain(realTabs);

  const openTabsSection = document.getElementById('openTabsSection');
  const openTabsMissionsEl = document.getElementById('openTabsMissions');
  const openTabsSectionCount = document.getElementById('openTabsSectionCount');

  if (domainGroups.length > 0 && openTabsSection && openTabsMissionsEl && openTabsSectionCount) {
    openTabsSectionCount.innerHTML = `${domainGroups.length} site${domainGroups.length !== 1 ? 's' : ''} &middot; <button class="card-btn card-btn-close" data-action="close-all-open-tabs" style="font-size:11px;padding:2px 8px;">Close all ${realTabs.length}</button>`;
    openTabsMissionsEl.innerHTML = domainGroups.map(renderDomainCard).join('');
    openTabsSection.style.display = 'block';
    enableDragOnCards();
    bindCardHover();

  } else if (openTabsSection) {
    openTabsSection.style.display = 'none';
  }

  const statTabs = document.getElementById('statTabs');
  if (statTabs) statTabs.textContent = String(getOpenTabs().length);

  checkTabTabDupeBanner();
  await renderDeferredColumn();
}

export function setupEventListeners(): void {
  // Hide broken favicon images
  document.addEventListener('error', (e) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLImageElement && target.classList.contains('tab-favicon')) {
      target.style.display = 'none';
    }
  }, true);

  document.addEventListener('click', async (e) => {
    const actionEl = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!actionEl) return;
    const action = actionEl.dataset.action;

    if (action === 'close-tabout-dups') {
      await closeTabTabDups();
      const banner = document.getElementById('tabTabDupeBanner');
      if (banner) {
        banner.style.transition = 'opacity 0.4s';
        banner.style.opacity = '0';
        setTimeout(() => {
          banner.style.display = 'none';
          banner.style.opacity = '1';
        }, 400);
      }
      showToast('Closed extra Tab-Tab pages');
      return;
    }

    if (action === 'expand-chips') {
      const overflow = actionEl.parentElement?.querySelector<HTMLElement>('.overflow-tabs');
      if (overflow) {
        overflow.style.display = 'contents';
        actionEl.remove();
      }
      return;
    }

    if (action === 'focus-tab') {
      const tabUrl = actionEl.dataset.tabUrl;
      if (tabUrl) await focusTab(tabUrl);
      return;
    }

    if (action === 'close-single-tab') {
      e.stopPropagation();
      const tabUrl = actionEl.dataset.tabUrl;
      if (!tabUrl) return;

      await closeSingleTab(tabUrl);
      const row = actionEl.closest<HTMLElement>('.tab-row');
      if (row) {
        row.style.transition = 'opacity 0.2s, transform 0.2s';
        row.style.opacity = '0';
        row.style.transform = 'scale(0.95)';
        setTimeout(() => {
          row.remove();
      
          document.querySelectorAll<HTMLElement>('.mission-card').forEach((c) => {
            if (c.querySelectorAll('.tab-row[data-action="focus-tab"]').length === 0) {
              animateCardOut(c);
            }
          });
        }, 200);
      }
      const statTabs = document.getElementById('statTabs');
      if (statTabs) statTabs.textContent = String(getOpenTabs().length);
      recordClose();
      showToast('Tab closed');
      return;
    }

    if (action === 'defer-single-tab') {
      e.stopPropagation();
      const tabUrl = actionEl.dataset.tabUrl;
      const tabTitle = actionEl.dataset.tabTitle || tabUrl || '';
      if (!tabUrl) return;

      await saveTabForLater({ url: tabUrl, title: tabTitle });
      await closeSingleTab(tabUrl);

      const row = actionEl.closest<HTMLElement>('.tab-row');
      if (row) {
        row.style.transition = 'opacity 0.2s, transform 0.2s';
        row.style.opacity = '0';
        row.style.transform = 'scale(0.95)';
        setTimeout(() => row.remove(), 200);
      }
      recordSave();
      showToast('Saved for later');
      await renderDeferredColumn();
      return;
    }

    if (action === 'check-deferred') {
      const id = actionEl.dataset.deferredId;
      if (!id) return;
      await checkOffSavedTab(id);
      const item = actionEl.closest<HTMLElement>('.deferred-item');
      if (item) {
        item.classList.add('checked');
        setTimeout(() => {
          item.classList.add('removing');
          setTimeout(() => {
            item.remove();
            renderDeferredColumn();
          }, 300);
        }, 600);
      }
      return;
    }

    if (action === 'dismiss-deferred') {
      const id = actionEl.dataset.deferredId;
      if (!id) return;
      await dismissSavedTab(id);
      const deferredItem = actionEl.closest<HTMLElement>('.deferred-item');
      const archiveItem = actionEl.closest<HTMLElement>('.archive-item');
      const target = deferredItem || archiveItem;
      if (target) {
        target.classList.add('removing');
        setTimeout(() => {
          target.remove();
          renderDeferredColumn();
        }, 300);
      }
      return;
    }

    const card = actionEl.closest<HTMLElement>('.mission-card');

    if (action === 'close-domain-tabs') {
      const domainId = actionEl.dataset.domainId;
      const group = domainGroups.find(
        (g) => 'domain-' + g.domain.replace(/[^a-z0-9]/g, '-') === domainId,
      );
      if (!group) return;

      const urls = group.tabs.map((t) => t.url);
      const useExact = group.domain === '__landing-pages__' || !!group.label;
      if (useExact) {
        await closeTabsExact(urls);
      } else {
        await closeTabsByUrls(urls);
      }

      if (card) animateCardOut(card);

      const idx = domainGroups.indexOf(group);
      if (idx !== -1) domainGroups.splice(idx, 1);

      const groupLabel =
        group.domain === '__landing-pages__'
          ? 'Homepages'
          : group.label || friendlyDomain(group.domain);
      recordClose(urls.length);
      showToast(`Closed ${urls.length} tab${urls.length !== 1 ? 's' : ''} from ${groupLabel}`);

      const statTabs = document.getElementById('statTabs');
      if (statTabs) statTabs.textContent = String(getOpenTabs().length);
      return;
    }

    if (action === 'hibernate-domain') {
      const domainId = actionEl.dataset.domainId;
      const group = domainGroups.find(
        (g) => 'domain-' + g.domain.replace(/[^a-z0-9]/g, '-') === domainId,
      );
      if (!group) return;

      const groupLabel =
        group.domain === '__landing-pages__'
          ? 'Homepages'
          : group.label || friendlyDomain(group.domain);

      const tabs = group.tabs.map((t) => ({ url: t.url, title: t.title }));
      await hibernateGroup(groupLabel, tabs);

      const urls = group.tabs.map((t) => t.url);
      const useExact = group.domain === '__landing-pages__' || !!group.label;
      if (useExact) {
        await closeTabsExact(urls);
      } else {
        await closeTabsByUrls(urls);
      }

      if (card) animateCardOut(card);
      const idx = domainGroups.indexOf(group);
      if (idx !== -1) domainGroups.splice(idx, 1);

      recordClose(urls.length);
      showToast(`Saved and closed ${tabs.length} tab${tabs.length !== 1 ? 's' : ''} from ${groupLabel}`);
      await refreshHibernateWidget();

      const statTabs2 = document.getElementById('statTabs');
      if (statTabs2) statTabs2.textContent = String(getOpenTabs().length);
      return;
    }

    if (action === 'dedup-keep-one') {
      const urlsEncoded = actionEl.dataset.dupUrls || '';
      const urls = urlsEncoded
        .split(',')
        .map((u) => decodeURIComponent(u))
        .filter(Boolean);
      if (urls.length === 0) return;

      await closeDuplicateTabs(urls, true);

      actionEl.style.transition = 'opacity 0.2s';
      actionEl.style.opacity = '0';
      setTimeout(() => actionEl.remove(), 200);

      if (card) {
        card.querySelectorAll<HTMLElement>('.chip-dup').forEach((b) => {
          b.style.transition = 'opacity 0.2s';
          b.style.opacity = '0';
          setTimeout(() => b.remove(), 200);
        });
        card.querySelectorAll<HTMLElement>('.badge-warn').forEach((b) => {
          b.style.transition = 'opacity 0.2s';
          b.style.opacity = '0';
          setTimeout(() => b.remove(), 200);
        });
        card.classList.remove('has-dups');
      }

      showToast('Closed duplicates, kept one copy each');
      return;
    }

    if (action === 'close-all-open-tabs') {
      const allUrls = getOpenTabs()
        .filter(
          (t) =>
            t.url &&
            !t.url.startsWith('chrome') &&
            !t.url.startsWith('about:'),
        )
        .map((t) => t.url);
      await closeTabsByUrls(allUrls);
      recordClose(allUrls.length);
      document
        .querySelectorAll<HTMLElement>('#openTabsMissions .mission-card')
        .forEach(animateCardOut);
      showToast('All tabs closed.');
      return;
    }
  });

  // Archive toggle
  document.addEventListener('click', (e) => {
    const toggle = (e.target as HTMLElement).closest('#archiveToggle');
    if (!toggle) return;
    toggle.classList.toggle('open');
    const body = document.getElementById('archiveBody');
    if (body) {
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
    }
  });

  // Archive search
  document.addEventListener('input', async (e) => {
    const target = e.target as HTMLElement;
    if (target.id !== 'archiveSearch') return;

    const q = (target as HTMLInputElement).value.trim().toLowerCase();
    const archiveList = document.getElementById('archiveList');
    if (!archiveList) return;

    const { archived } = await getSavedTabs();

    function renderArchiveItem(item: { id: string; url: string; title: string; completedAt?: string; savedAt: string }) {
      const ago = item.completedAt ? timeAgo(item.completedAt) : timeAgo(item.savedAt);
      return `<div class="archive-item">
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener" class="archive-item-title">${escapeHtml(item.title || item.url)}</a>
        <span class="archive-item-date">${ago}</span>
        <button class="archive-item-delete" data-action="dismiss-deferred" data-deferred-id="${item.id}" title="Delete">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>`;
    }

    if (q.length < 2) {
      archiveList.innerHTML = archived.map(renderArchiveItem).join('');
      return;
    }

    const results = archived.filter(
      (item) =>
        (item.title || '').toLowerCase().includes(q) ||
        (item.url || '').toLowerCase().includes(q),
    );
    archiveList.innerHTML =
      results.map(renderArchiveItem).join('') || '<div style="font-size:12px;opacity:0.5;padding:8px 0">No results</div>';
  });
}

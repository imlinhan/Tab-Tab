interface TabStats {
  totalClosed: number;
  totalSaved: number;
  dailyCounts: Record<string, number>;
}

async function loadStats(): Promise<TabStats> {
  try {
    const { tabStats } = await chrome.storage.local.get('tabStats');
    return tabStats || { totalClosed: 0, totalSaved: 0, dailyCounts: {} };
  } catch {
    return { totalClosed: 0, totalSaved: 0, dailyCounts: {} };
  }
}

function pruneOldEntries(counts: Record<string, number>): Record<string, number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  const pruned: Record<string, number> = {};
  for (const [key, val] of Object.entries(counts)) {
    if (key >= cutoffKey) pruned[key] = val;
  }
  return pruned;
}

async function saveStats(stats: TabStats): Promise<void> {
  stats.dailyCounts = pruneOldEntries(stats.dailyCounts);
  try { await chrome.storage.local.set({ tabStats: stats }); } catch { /* ignore */ }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function recordClose(count = 1): Promise<void> {
  const stats = await loadStats();
  stats.totalClosed += count;
  const key = todayKey();
  stats.dailyCounts[key] = (stats.dailyCounts[key] || 0) + count;
  await saveStats(stats);
}

export async function recordSave(count = 1): Promise<void> {
  const stats = await loadStats();
  stats.totalSaved += count;
  await saveStats(stats);
}

function renderMiniBar(counts: Record<string, number>): string {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const values = days.map((d) => counts[d] || 0);
  const max = Math.max(...values, 1);

  return days.map((d, i) => {
    const h = Math.max(4, Math.round((values[i] / max) * 40));
    const label = d.slice(5);
    return `<div class="stats-bar-col" title="${label}: ${values[i]} tabs">
      <div class="stats-bar" style="height:${h}px"></div>
      <span class="stats-bar-label">${label.slice(3)}</span>
    </div>`;
  }).join('');
}

export async function initStats(): Promise<void> {
  const container = document.getElementById('statsWidget');
  if (!container) return;

  const stats = await loadStats();
  const totalEl = document.getElementById('statsTotalClosed');
  const savedEl = document.getElementById('statsTotalSaved');
  const chartEl = document.getElementById('statsChart');

  if (totalEl) totalEl.textContent = String(stats.totalClosed);
  if (savedEl) savedEl.textContent = String(stats.totalSaved);
  if (chartEl) chartEl.innerHTML = renderMiniBar(stats.dailyCounts);
}

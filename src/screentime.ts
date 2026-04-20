interface ScreenTimeData {
  daily: Record<string, number>;
}

const STORAGE_KEY = 'screenTime';
let startTime = Date.now();

async function loadData(): Promise<ScreenTimeData> {
  try {
    const { [STORAGE_KEY]: data } = await chrome.storage.local.get(STORAGE_KEY);
    return data || { daily: {} };
  } catch {
    return { daily: {} };
  }
}

async function saveData(data: ScreenTimeData): Promise<void> {
  try { await chrome.storage.local.set({ [STORAGE_KEY]: data }); } catch { /* ignore */ }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

async function flush(): Promise<void> {
  const elapsed = Math.floor((Date.now() - startTime) / 60000);
  if (elapsed < 1) return;
  const data = await loadData();
  const key = todayKey();
  data.daily[key] = (data.daily[key] || 0) + elapsed;
  await saveData(data);
  startTime = Date.now();
}

function render(data: ScreenTimeData): void {
  const todayEl = document.getElementById('screenTimeToday');
  const weekEl = document.getElementById('screenTimeWeek');
  if (!todayEl || !weekEl) return;

  const today = new Date();
  const key = todayKey();
  const todayMins = data.daily[key] || 0;
  todayEl.textContent = formatMinutes(todayMins);

  let weekTotal = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    weekTotal += data.daily[k] || 0;
  }
  weekEl.textContent = formatMinutes(weekTotal);
}

export async function initScreenTime(): Promise<void> {
  const container = document.getElementById('screenTimeWidget');
  if (!container) return;

  startTime = Date.now();
  const data = await loadData();
  render(data);

  setInterval(async () => {
    await flush();
    const updated = await loadData();
    render(updated);
  }, 60000);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush();
  });
}

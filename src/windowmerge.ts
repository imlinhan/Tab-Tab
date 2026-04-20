export async function mergeAllWindows(): Promise<number> {
  const windows = await chrome.windows.getAll({ populate: true });
  if (windows.length <= 1) return 0;

  const targetWindow = windows.reduce((a, b) =>
    (a.tabs?.length || 0) >= (b.tabs?.length || 0) ? a : b
  );

  let moved = 0;
  for (const win of windows) {
    if (win.id === targetWindow.id) continue;
    for (const tab of win.tabs || []) {
      if (tab.id) {
        await chrome.tabs.move(tab.id, { windowId: targetWindow.id!, index: -1 });
        moved++;
      }
    }
  }
  return moved;
}

export function initWindowMerge(): void {
  document.getElementById('mergeWindowsBtn')?.addEventListener('click', async () => {
    const count = await mergeAllWindows();
    const toast = document.getElementById('toast');
    const text = document.getElementById('toastText');
    if (toast && text) {
      text.textContent = count > 0 ? `Merged ${count} tabs into one window` : 'All tabs already in one window';
      toast.classList.add('visible');
      setTimeout(() => toast.classList.remove('visible'), 2500);
    }
  });
}

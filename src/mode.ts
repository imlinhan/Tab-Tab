export function isFullMode(): boolean {
  return document.body.classList.contains('full-mode');
}

export function setMode(full: boolean): void {
  document.body.classList.toggle('full-mode', full);
  chrome.storage.local.set({ fullMode: full }).catch(() => {});
}

export async function initMode(): Promise<void> {
  try {
    const { fullMode = false } = await chrome.storage.local.get('fullMode');
    if (fullMode) document.body.classList.add('full-mode');
  } catch {}
}

export interface SavedTab {
  id: string;
  url: string;
  title: string;
  savedAt: string;
  completed: boolean;
  completedAt?: string;
  dismissed: boolean;
}

async function getDeferred(): Promise<SavedTab[]> {
  const { deferred = [] } = await chrome.storage.local.get('deferred');
  return deferred;
}

async function setDeferred(deferred: SavedTab[]): Promise<void> {
  await chrome.storage.local.set({ deferred });
}

export async function saveTabForLater(tab: { url: string; title: string }): Promise<void> {
  const deferred = await getDeferred();
  deferred.push({
    id: Date.now().toString(),
    url: tab.url,
    title: tab.title,
    savedAt: new Date().toISOString(),
    completed: false,
    dismissed: false,
  });
  await setDeferred(deferred);
}

export async function getSavedTabs(): Promise<{
  active: SavedTab[];
  archived: SavedTab[];
}> {
  const deferred = await getDeferred();
  const visible = deferred.filter((t) => !t.dismissed);
  return {
    active: visible.filter((t) => !t.completed),
    archived: visible.filter((t) => t.completed),
  };
}

export async function checkOffSavedTab(id: string): Promise<void> {
  const deferred = await getDeferred();
  const tab = deferred.find((t) => t.id === id);
  if (tab) {
    tab.completed = true;
    tab.completedAt = new Date().toISOString();
    await setDeferred(deferred);
  }
}

export async function dismissSavedTab(id: string): Promise<void> {
  const deferred = await getDeferred();
  const tab = deferred.find((t) => t.id === id);
  if (tab) {
    tab.dismissed = true;
    await setDeferred(deferred);
  }
}

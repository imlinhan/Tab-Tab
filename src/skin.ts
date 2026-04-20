export type SkinName = 'minimal' | 'glass' | 'material';

let currentSkin: SkinName = 'glass';

export function getSkin(): SkinName {
  return currentSkin;
}

export function setSkin(name: SkinName): void {
  currentSkin = name;
  document.documentElement.setAttribute('data-skin', name);
  chrome.storage.local.set({ skin: name }).catch(() => {});
}

export async function initSkin(): Promise<void> {
  try {
    const { skin = 'glass' } = await chrome.storage.local.get('skin');
    currentSkin = skin as SkinName;
  } catch {
    currentSkin = 'glass';
  }
  document.documentElement.setAttribute('data-skin', currentSkin);
}

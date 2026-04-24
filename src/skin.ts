export type SkinName = 'minimal' | 'glass' | 'material' | 'mb-star' | 'mb-purity' | 'mb-amg';

let currentSkin: SkinName = 'glass';

export function getSkin(): SkinName {
  return currentSkin;
}

export function setSkin(name: SkinName): void {
  currentSkin = name;
  const html = document.documentElement;
  html.classList.add('skin-switching');
  setTimeout(() => {
    html.setAttribute('data-skin', name);
    html.classList.remove('skin-switching');
  }, 180);
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

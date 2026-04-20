export interface TabInfo {
  id: number;
  url: string;
  title: string;
  favIconUrl: string;
  windowId: number;
  active: boolean;
  isTabTab: boolean;
}

export interface DomainGroup {
  domain: string;
  label?: string;
  tabs: TabInfo[];
}

let openTabs: TabInfo[] = [];

export function getOpenTabs(): TabInfo[] {
  return openTabs;
}

export async function fetchOpenTabs(): Promise<void> {
  try {
    const extensionId = chrome.runtime.id;
    const newtabUrl = `chrome-extension://${extensionId}/index.html`;
    const tabs = await chrome.tabs.query({});
    openTabs = tabs.map((t) => ({
      id: t.id!,
      url: t.url || '',
      title: t.title || '',
      favIconUrl: t.favIconUrl || '',
      windowId: t.windowId,
      active: t.active || false,
      isTabTab: t.url === newtabUrl || t.url === 'chrome://newtab/',
    }));
  } catch {
    openTabs = [];
  }
}

export function getRealTabs(): TabInfo[] {
  return openTabs.filter((t) => {
    const url = t.url;
    return (
      !url.startsWith('chrome://') &&
      !url.startsWith('chrome-extension://') &&
      !url.startsWith('about:') &&
      !url.startsWith('edge://') &&
      !url.startsWith('brave://')
    );
  });
}

export async function closeTabsByUrls(urls: string[]): Promise<void> {
  if (!urls.length) return;
  const targetHostnames: string[] = [];
  const exactUrls = new Set<string>();

  for (const u of urls) {
    if (u.startsWith('file://')) {
      exactUrls.add(u);
    } else {
      try {
        targetHostnames.push(new URL(u).hostname);
      } catch {
        /* skip */
      }
    }
  }

  const allTabs = await chrome.tabs.query({});
  const toClose = allTabs
    .filter((tab) => {
      const tabUrl = tab.url || '';
      if (tabUrl.startsWith('file://') && exactUrls.has(tabUrl)) return true;
      try {
        const tabHostname = new URL(tabUrl).hostname;
        return tabHostname !== '' && targetHostnames.includes(tabHostname);
      } catch {
        return false;
      }
    })
    .map((tab) => tab.id!)
    .filter(Boolean);

  if (toClose.length > 0) await chrome.tabs.remove(toClose);
  await fetchOpenTabs();
}

export async function closeTabsExact(urls: string[]): Promise<void> {
  if (!urls.length) return;
  const urlSet = new Set(urls);
  const allTabs = await chrome.tabs.query({});
  const toClose = allTabs.filter((t) => urlSet.has(t.url || '')).map((t) => t.id!).filter(Boolean);
  if (toClose.length > 0) await chrome.tabs.remove(toClose);
  await fetchOpenTabs();
}

export async function closeSingleTab(url: string): Promise<void> {
  const allTabs = await chrome.tabs.query({});
  const match = allTabs.find((t) => t.url === url);
  if (match?.id) await chrome.tabs.remove(match.id);
  await fetchOpenTabs();
}

export async function focusTab(url: string): Promise<void> {
  if (!url) return;
  const allTabs = await chrome.tabs.query({});
  const currentWindow = await chrome.windows.getCurrent();

  let matches = allTabs.filter((t) => t.url === url);

  if (matches.length === 0) {
    try {
      const targetHost = new URL(url).hostname;
      matches = allTabs.filter((t) => {
        try {
          return new URL(t.url || '').hostname === targetHost;
        } catch {
          return false;
        }
      });
    } catch {
      /* skip */
    }
  }

  if (matches.length === 0) return;

  const match = matches.find((t) => t.windowId !== currentWindow.id) || matches[0];
  if (match.id) {
    await chrome.tabs.update(match.id, { active: true });
    await chrome.windows.update(match.windowId, { focused: true });
  }
}

export async function closeDuplicateTabs(
  urls: string[],
  keepOne = true,
): Promise<void> {
  const allTabs = await chrome.tabs.query({});
  const toClose: number[] = [];

  for (const url of urls) {
    const matching = allTabs.filter((t) => t.url === url);
    if (keepOne) {
      const keep = matching.find((t) => t.active) || matching[0];
      for (const tab of matching) {
        if (tab.id !== keep.id && tab.id) toClose.push(tab.id);
      }
    } else {
      for (const tab of matching) {
        if (tab.id) toClose.push(tab.id);
      }
    }
  }

  if (toClose.length > 0) await chrome.tabs.remove(toClose);
  await fetchOpenTabs();
}

export async function closeTabTabDups(): Promise<void> {
  const extensionId = chrome.runtime.id;
  const newtabUrl = `chrome-extension://${extensionId}/index.html`;
  const allTabs = await chrome.tabs.query({});
  const currentWindow = await chrome.windows.getCurrent();
  const tabTabTabs = allTabs.filter(
    (t) => t.url === newtabUrl || t.url === 'chrome://newtab/',
  );

  if (tabTabTabs.length <= 1) return;

  const keep =
    tabTabTabs.find((t) => t.active && t.windowId === currentWindow.id) ||
    tabTabTabs.find((t) => t.active) ||
    tabTabTabs[0];

  const toClose = tabTabTabs
    .filter((t) => t.id !== keep.id)
    .map((t) => t.id!)
    .filter(Boolean);

  if (toClose.length > 0) await chrome.tabs.remove(toClose);
  await fetchOpenTabs();
}

interface LandingPagePattern {
  hostname?: string;
  hostnameEndsWith?: string;
  pathExact?: string[];
  pathPrefix?: string;
  test?: (pathname: string, fullUrl: string) => boolean;
}

const LANDING_PAGE_PATTERNS: LandingPagePattern[] = [
  {
    hostname: 'mail.google.com',
    test: (_p, h) =>
      !h.includes('#inbox/') && !h.includes('#sent/') && !h.includes('#search/'),
  },
  { hostname: 'x.com', pathExact: ['/home'] },
  { hostname: 'www.linkedin.com', pathExact: ['/'] },
  { hostname: 'github.com', pathExact: ['/'] },
  { hostname: 'www.youtube.com', pathExact: ['/'] },
];

function isLandingPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    return LANDING_PAGE_PATTERNS.some((p) => {
      const hostnameMatch = p.hostname
        ? parsed.hostname === p.hostname
        : p.hostnameEndsWith
          ? parsed.hostname.endsWith(p.hostnameEndsWith)
          : false;
      if (!hostnameMatch) return false;
      if (p.test) return p.test(parsed.pathname, url);
      if (p.pathPrefix) return parsed.pathname.startsWith(p.pathPrefix);
      if (p.pathExact) return p.pathExact.includes(parsed.pathname);
      return parsed.pathname === '/';
    });
  } catch {
    return false;
  }
}

export function groupTabsByDomain(tabs: TabInfo[]): DomainGroup[] {
  const groupMap: Record<string, DomainGroup> = {};
  const landingTabs: TabInfo[] = [];

  for (const tab of tabs) {
    try {
      if (isLandingPage(tab.url)) {
        landingTabs.push(tab);
        continue;
      }

      let hostname: string;
      if (tab.url.startsWith('file://')) {
        hostname = 'local-files';
      } else {
        hostname = new URL(tab.url).hostname;
      }
      if (!hostname) continue;

      if (!groupMap[hostname]) groupMap[hostname] = { domain: hostname, tabs: [] };
      groupMap[hostname].tabs.push(tab);
    } catch {
      /* skip malformed URLs */
    }
  }

  if (landingTabs.length > 0) {
    groupMap['__landing-pages__'] = { domain: '__landing-pages__', tabs: landingTabs };
  }

  const landingHostnames = new Set(
    LANDING_PAGE_PATTERNS.map((p) => p.hostname).filter(Boolean) as string[],
  );

  return Object.values(groupMap).sort((a, b) => {
    const aIsLanding = a.domain === '__landing-pages__';
    const bIsLanding = b.domain === '__landing-pages__';
    if (aIsLanding !== bIsLanding) return aIsLanding ? -1 : 1;

    const aIsPriority = landingHostnames.has(a.domain);
    const bIsPriority = landingHostnames.has(b.domain);
    if (aIsPriority !== bIsPriority) return aIsPriority ? -1 : 1;

    return b.tabs.length - a.tabs.length;
  });
}

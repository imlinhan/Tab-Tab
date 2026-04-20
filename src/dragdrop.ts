const LONG_PRESS_MS = 400;

let sortOrder: string[] = [];
let isDragging = false;
let dragCard: HTMLElement | null = null;
let dragGrid: HTMLElement | null = null;
let ghost: HTMLElement | null = null;
let offsetX = 0;
let offsetY = 0;

let pressTimer: ReturnType<typeof setTimeout> | null = null;
let pendingCard: HTMLElement | null = null;
let pendingPointerId: number | null = null;
let startX = 0;
let startY = 0;

function saveSortOrder(): void {
  chrome.storage.local.set({ cardSortOrder: sortOrder }).catch(() => {});
}

function cid(card: HTMLElement): string {
  return card.dataset.domainId || '';
}

function getGrid(): HTMLElement | null {
  return document.getElementById('openTabsMissions');
}

function getCards(g: HTMLElement): HTMLElement[] {
  return Array.from(g.querySelectorAll<HTMLElement>('.mission-card'));
}

function snapshotRects(g: HTMLElement): Map<string, DOMRect> {
  const map = new Map<string, DOMRect>();
  for (const c of getCards(g)) map.set(cid(c), c.getBoundingClientRect());
  return map;
}

function flipAnimate(g: HTMLElement, before: Map<string, DOMRect>): void {
  for (const c of getCards(g)) {
    if (c === dragCard) continue;
    const prev = before.get(cid(c));
    if (!prev) continue;
    const after = c.getBoundingClientRect();
    const dx = prev.left - after.left;
    const dy = prev.top - after.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;

    c.style.transition = 'none';
    c.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        c.style.transition = 'transform 300ms cubic-bezier(0.2, 0, 0, 1)';
        c.style.transform = '';
        c.addEventListener('transitionend', function handler() {
          c.style.transition = '';
          c.removeEventListener('transitionend', handler);
        });
      });
    });
  }
}

function reorderDOM(g: HTMLElement): void {
  const cardMap = new Map<string, HTMLElement>();
  for (const c of getCards(g)) cardMap.set(cid(c), c);

  const frag = document.createDocumentFragment();
  for (const sid of sortOrder) {
    const c = cardMap.get(sid);
    if (c) { frag.appendChild(c); cardMap.delete(sid); }
  }
  for (const c of cardMap.values()) frag.appendChild(c);
  g.appendChild(frag);
}

function reorderCards(): void {
  const g = getGrid();
  if (!g) return;
  reorderDOM(g);
}

function reorderWithFlip(g: HTMLElement): void {
  const before = snapshotRects(g);
  reorderDOM(g);
  flipAnimate(g, before);
}

function cardAtPoint(g: HTMLElement, x: number, y: number): HTMLElement | null {
  for (const c of getCards(g)) {
    if (c === dragCard) continue;
    const r = c.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return c;
  }
  return null;
}

function currentOrder(g: HTMLElement): string[] {
  return getCards(g).map(c => cid(c)).filter(Boolean);
}

function moveInOrder(srcId: string, targetId: string): void {
  const srcIdx = sortOrder.indexOf(srcId);
  const tgtIdx = sortOrder.indexOf(targetId);
  if (srcIdx === -1 || tgtIdx === -1 || srcIdx === tgtIdx) return;
  sortOrder.splice(srcIdx, 1);
  sortOrder.splice(tgtIdx, 0, srcId);
}

function startDrag(card: HTMLElement, cx: number, cy: number): void {
  const g = getGrid();
  if (!g) return;

  isDragging = true;
  dragCard = card;
  dragGrid = g;
  sortOrder = currentOrder(g);

  const rect = card.getBoundingClientRect();
  offsetX = cx - rect.left;
  offsetY = cy - rect.top;

  ghost = card.cloneNode(true) as HTMLElement;
  ghost.className = 'mission-card glass-card drag-ghost';
  ghost.removeAttribute('draggable');
  ghost.style.width = rect.width + 'px';
  ghost.style.left = rect.left + 'px';
  ghost.style.top = rect.top + 'px';
  document.body.appendChild(ghost);

  card.classList.add('dragging');
  g.classList.add('is-dragging');
}

function moveDrag(cx: number, cy: number): void {
  if (!ghost || !dragCard || !dragGrid) return;

  ghost.style.left = (cx - offsetX) + 'px';
  ghost.style.top = (cy - offsetY) + 'px';

  const g = dragGrid;
  const target = cardAtPoint(g, cx, cy);
  if (!target) return;

  const srcId = cid(dragCard);
  const tgtId = cid(target);
  if (!srcId || !tgtId || srcId === tgtId) return;

  const oldIdx = sortOrder.indexOf(srcId);
  const newIdx = sortOrder.indexOf(tgtId);
  if (oldIdx === newIdx) return;

  moveInOrder(srcId, tgtId);
  reorderWithFlip(g);
}

function endDrag(): void {
  if (!isDragging) return;

  if (ghost) { ghost.remove(); ghost = null; }
  if (dragCard) { dragCard.classList.remove('dragging'); dragCard = null; }
  if (dragGrid) {
    dragGrid.classList.remove('is-dragging');
    saveSortOrder();
    dragGrid = null;
  }
  isDragging = false;
}

function cancelPending(): void {
  if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  pendingCard = null;
  pendingPointerId = null;
}

export async function initDragDrop(): Promise<void> {
  try {
    const { cardSortOrder = [] } = await chrome.storage.local.get('cardSortOrder');
    sortOrder = cardSortOrder;
  } catch {
    sortOrder = [];
  }

  if (sortOrder.length > 0) reorderCards();

  const g = getGrid();
  if (!g) return;

  g.addEventListener('pointerdown', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.mission-card');
    if (!card || !card.hasAttribute('draggable')) return;
    if ((e.target as HTMLElement).closest('button, a, input')) return;

    cancelPending();
    pendingCard = card;
    pendingPointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;

    pressTimer = setTimeout(() => {
      if (!pendingCard) return;
      pendingCard.setPointerCapture(e.pointerId);
      startDrag(pendingCard, startX, startY);
      pressTimer = null;
      pendingCard = null;
      pendingPointerId = null;
    }, LONG_PRESS_MS);
  });

  document.addEventListener('pointermove', (e) => {
    if (isDragging) {
      e.preventDefault();
      moveDrag(e.clientX, e.clientY);
      return;
    }

    if (pendingCard && pendingPointerId === e.pointerId) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        cancelPending();
      }
    }
  });

  document.addEventListener('pointerup', (e) => {
    if (pendingPointerId === e.pointerId) cancelPending();
    if (isDragging) endDrag();
  });

  document.addEventListener('pointercancel', (e) => {
    if (pendingPointerId === e.pointerId) cancelPending();
    if (isDragging) endDrag();
  });
}

export function enableDragOnCards(): void {
  const g = getGrid();
  if (!g) return;
  g.querySelectorAll<HTMLElement>('.mission-card').forEach((card) => {
    card.setAttribute('draggable', 'true');
  });
  if (sortOrder.length > 0) reorderCards();
}

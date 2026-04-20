let currentCard: HTMLElement | null = null;
let cachedTransform = '';
let cachedShadow = '';

function refreshCache(): void {
  const cs = getComputedStyle(document.documentElement);
  cachedTransform = cs.getPropertyValue('--card-hover-transform').trim();
  cachedShadow = cs.getPropertyValue('--card-hover-shadow').trim();
}

function applyHover(card: HTMLElement): void {
  card.style.transform = cachedTransform;
  card.style.boxShadow = cachedShadow;
}

function clearHover(card: HTMLElement): void {
  card.style.transform = '';
  card.style.boxShadow = '';
}

export function bindCardHover(): void {
  const grid = document.getElementById('openTabsMissions');
  if (!grid) return;
  refreshCache();
  if (grid.dataset.hoverBound) return;
  grid.dataset.hoverBound = '1';

  grid.addEventListener('mouseover', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('.mission-card');
    if (card === currentCard) return;
    if (currentCard) clearHover(currentCard);
    currentCard = card;
    if (currentCard) applyHover(currentCard);
  });

  grid.addEventListener('mouseleave', () => {
    if (currentCard) { clearHover(currentCard); currentCard = null; }
  });
}

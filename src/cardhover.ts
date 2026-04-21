let currentHovered: HTMLElement | null = null;
let leaveTimer: ReturnType<typeof setTimeout> | null = null;

export function bindCardHover(): void {
  const grid = document.getElementById('openTabsMissions');
  if (!grid) return;

  grid.querySelectorAll<HTMLElement>('.mission-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
      if (currentHovered && currentHovered !== card) {
        currentHovered.classList.remove('card-hovered');
      }
      currentHovered = card;
      card.classList.add('card-hovered');
    });

    card.addEventListener('mouseleave', () => {
      const leaving = card;
      leaveTimer = setTimeout(() => {
        leaving.classList.remove('card-hovered');
        if (currentHovered === leaving) currentHovered = null;
        leaveTimer = null;
      }, 80);
    });
  });
}

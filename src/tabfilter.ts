export function initTabFilter(): void {
  const input = document.getElementById('tabFilterInput') as HTMLInputElement | null;
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    const cards = document.querySelectorAll<HTMLElement>('.mission-card');

    cards.forEach((card) => {
      if (!q) {
        card.style.display = '';
        return;
      }
      const name = card.querySelector('.card-name')?.textContent?.toLowerCase() || '';
      const tabs = card.querySelectorAll('.tab-title');
      let match = name.includes(q);
      if (!match) {
        tabs.forEach((t) => {
          if (t.textContent?.toLowerCase().includes(q)) match = true;
        });
      }
      card.style.display = match ? '' : 'none';
    });
  });
}

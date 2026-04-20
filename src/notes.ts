let debounceTimer: number | undefined;

export async function initNotes(): Promise<void> {
  const textarea = document.getElementById('notesArea') as HTMLTextAreaElement | null;
  if (!textarea) return;

  try {
    const { notes = '' } = await chrome.storage.local.get('notes');
    textarea.value = notes;
  } catch { /* ignore */ }

  textarea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(async () => {
      try { await chrome.storage.local.set({ notes: textarea.value }); } catch { /* ignore */ }
    }, 500);
  });
}

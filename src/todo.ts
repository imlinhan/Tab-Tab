interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

let items: TodoItem[] = [];

async function load(): Promise<void> {
  try {
    const { todos = [] } = await chrome.storage.local.get('todos');
    items = todos;
  } catch { items = []; }
}

async function save(): Promise<void> {
  try { await chrome.storage.local.set({ todos: items }); } catch { /* ignore */ }
}

function render(): void {
  const list = document.getElementById('todoList');
  const empty = document.getElementById('todoEmpty');
  if (!list) return;

  if (items.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  list.innerHTML = items.map((item) => `
    <div class="todo-item${item.done ? ' done' : ''}" data-todo-id="${item.id}">
      <input type="checkbox" class="todo-check" data-action="toggle-todo" data-todo-id="${item.id}" ${item.done ? 'checked' : ''}>
      <span class="todo-text">${escapeHtml(item.text)}</span>
      <button class="todo-delete" data-action="delete-todo" data-todo-id="${item.id}" title="Delete">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function initTodo(): Promise<void> {
  await load();
  render();

  const input = document.getElementById('todoInput') as HTMLInputElement | null;
  input?.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    const text = input.value.trim();
    if (!text) return;
    items.push({ id: Date.now().toString(), text, done: false });
    input.value = '';
    await save();
    render();
  });

  document.addEventListener('click', async (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el) return;

    if (el.dataset.action === 'toggle-todo') {
      const id = el.dataset.todoId;
      const item = items.find((i) => i.id === id);
      if (item) { item.done = !item.done; await save(); render(); }
    }

    if (el.dataset.action === 'delete-todo') {
      const id = el.dataset.todoId;
      items = items.filter((i) => i.id !== id);
      await save();
      render();
    }
  });
}

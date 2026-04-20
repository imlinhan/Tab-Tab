import { getMessage } from './locale';

export function t(key: string, ...substitutions: string[]): string {
  return getMessage(key, substitutions);
}

export function plural(n: number): string {
  return n !== 1 ? 's' : '';
}

export function applyI18n(): void {
  // Stamp all elements with data-i18n attribute
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n!;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.setAttribute('placeholder', t(key));
    } else {
      el.textContent = t(key);
    }
  });

  document.title = t('ext_name');

  const set = (sel: string, key: string) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) el.textContent = t(key);
  };
  const attr = (sel: string, attribute: string, key: string) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) el.setAttribute(attribute, t(key));
  };

  attr('#themeToggle', 'title', 'theme_toggle_title');
  attr('#settingsBtn', 'title', 'settings_btn_title');

  attr('#tabFilterInput', 'placeholder', 'filter_placeholder');
  attr('#todoInput', 'placeholder', 'todo_placeholder');
  attr('#notesArea', 'placeholder', 'notes_placeholder');
  attr('#archiveSearch', 'placeholder', 'archive_search_placeholder');

  set('#openTabsSection h2', 'section_open_tabs');
  set('#deferredColumn h2', 'section_saved_later');
  set('#deferredEmpty', 'empty_nothing_saved');
  set('#hibernateEmpty', 'hibernate_empty');
  set('#todoEmpty', 'todo_empty');
  set('.footer-brand', 'footer_brand');
  set('#settingsPanel h2', 'settings_title');
  set('.widget-pomodoro .widget-title', 'widget_pomodoro');
  set('.widget-todo .widget-title', 'widget_tasks');
  set('.widget-notes .widget-title', 'widget_quick_notes');
  set('.widget-stats .widget-title', 'widget_tab_stats');
  set('.widget-screentime .widget-title', 'widget_screen_time');
  set('.widget-hibernate .widget-title', 'widget_saved_tabs');

  const keepBtn = document.querySelector<HTMLElement>('[data-action="close-tabout-dups"]');
  if (keepBtn) keepBtn.textContent = t('btn_keep_only_this');

  const pomToggle = document.getElementById('pomodoroToggle');
  if (pomToggle) pomToggle.textContent = t('pomodoro_start');
  const pomReset = document.getElementById('pomodoroReset');
  if (pomReset) pomReset.textContent = t('pomodoro_reset');
}

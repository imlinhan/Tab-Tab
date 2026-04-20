import { initSkin } from './skin';
import { initMotion } from './motion';
import { initTheme, cycleTheme } from './theme';
import { initSettings } from './settings';
import { initSearch } from './search';
import { renderDashboard, setupEventListeners } from './render';
import { initMode } from './mode';
import { initColorScheme } from './colorscheme';
import { initWallpaper } from './wallpaper';
import { initClock } from './clock';
import { initQuickLinks } from './quicklinks';
import { initTabFilter } from './tabfilter';
import { initTodo } from './todo';
import { initNotes } from './notes';
import { initQuotes } from './quotes';
import { initStats } from './stats';
import { initWeather } from './weather';
import { initDragDrop } from './dragdrop';
import { initGlassBlur } from './glassblur';
import { initWallpaperOverlay } from './wallpaper-overlay';
import { initHibernate } from './hibernate';
import { initPomodoro } from './pomodoro';
import { initScreenTime } from './screentime';

async function init(): Promise<void> {
  await initSkin();
  await initMode();
  await initTheme();
  await initMotion();
  await initColorScheme();
  await initWallpaper();
  await initGlassBlur();
  await initWallpaperOverlay();
  initSettings();

  await initSearch();
  setupEventListeners();
  await renderDashboard();

  document.getElementById('themeToggle')?.addEventListener('click', cycleTheme);

  initClock();
  await initQuickLinks();
  initTabFilter();
  await initTodo();
  await initNotes();
  initQuotes();
  await initStats();
  await initWeather();
  await initDragDrop();
  await initHibernate();
  initPomodoro();
  await initScreenTime();
}

init();

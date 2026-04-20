# Tab-Tab

A beautiful Chrome new tab extension that turns every new tab into a clean command center for your open tabs.

![Tab-Tab screenshot](screenshot/screenshot_1.png)

## Features

- **Tab grouping** — tabs are automatically grouped by site, each shown as a card with all open pages listed
- **One-click actions** — close all tabs from a site, save them for later, or close duplicates in a single click
- **Drag to reorder** — long-press any card to drag and rearrange your tab groups; order persists across sessions
- **Saved for later** — bookmark individual tabs to a reading list without losing them, with an archived history
- **Three visual styles** — Minimal, Glass (frosted backdrop), and Material 3; switch instantly in Settings
- **Glass blur slider** — dial the backdrop blur from 0–40 px when using the Glass skin
- **Wallpaper support** — upload a custom background; brightness is auto-detected and a soft overlay is applied to keep text readable
- **Light / dark / system theme**
- **Color schemes** — choose from several accent palettes
- **Animation levels** — Subtle, Smooth, or Bouncy
- **Dashboard mode** — optional full-page layout with widgets: Pomodoro timer, task list, quick notes, daily quote, tab stats, screen time, saved tab groups, and a weather widget
- **Quick links** — pinned shortcuts in the header bar
- **Tab filter** — live search across all open tabs
- **Merge windows** — combine all Chrome windows into one

## Installation

> No build step required — load the pre-built `dist/` folder directly.

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `dist/` folder
5. Open a new tab — Tab-Tab is now your new tab page

## Development

```bash
npm install
npm run dev      # watch mode (rebuilds on save)
npm run build    # production build → dist/
```

After each build, click the refresh icon on `chrome://extensions` to reload the extension.

**Stack:** TypeScript · Vite · Vanilla DOM · Chrome MV3

## Project Structure

```
src/
  main.ts          # entry point, init sequence
  render.ts        # tab card rendering and event delegation
  tabs.ts          # Chrome tabs API wrappers
  dragdrop.ts      # long-press drag with FLIP animation
  settings.ts      # settings panel
  skin.ts          # Minimal / Glass / Material skin system
  glassblur.ts     # glass blur slider
  cardhover.ts     # JS-managed hover effects
  wallpaper.ts     # wallpaper upload and apply
  wallpaper-overlay.ts  # brightness-based readability overlay
  theme.ts         # light / dark / system theme
  motion.ts        # animation level
  colorscheme.ts   # accent color schemes
  storage.ts       # saved-for-later tab storage
  hibernate.ts     # save & close tab groups
  tabfilter.ts     # live tab filter input
  search.ts        # search bar with engine switching
  quicklinks.ts    # pinned quick links
  todo.ts          # task list widget
  notes.ts         # quick notes widget
  quotes.ts        # daily quote widget
  weather.ts       # weather widget (Open-Meteo)
  pomodoro.ts      # pomodoro timer widget
  stats.ts         # tab close/save statistics
  screentime.ts    # screen time tracking
  windowmerge.ts   # merge all windows
  clock.ts         # clock display
  utils.ts         # title cleaning, time formatting, domain helpers
  background.ts    # service worker
style.css          # all styles (CSS custom properties, skin variants)
index.html         # extension new tab page
public/
  manifest.json    # Chrome MV3 manifest
  icons/           # extension icons
```

## License

MIT

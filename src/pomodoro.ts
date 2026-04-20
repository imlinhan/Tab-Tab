let remaining = 25 * 60;
let running = false;
let timerId: number | undefined;
let mode: 'work' | 'break' = 'work';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay(): void {
  const display = document.getElementById('pomodoroTime');
  const label = document.getElementById('pomodoroLabel');
  const btn = document.getElementById('pomodoroToggle');
  if (display) display.textContent = formatTime(remaining);
  if (label) label.textContent = mode === 'work' ? 'Focus' : 'Break';
  if (btn) btn.textContent = running ? 'Pause' : 'Start';
}

function tick(): void {
  if (remaining <= 0) {
    running = false;
    clearInterval(timerId);
    timerId = undefined;

    if (mode === 'work') {
      mode = 'break';
      remaining = BREAK_DURATION;
      notify('Break time!', 'Take a 5-minute break.');
    } else {
      mode = 'work';
      remaining = WORK_DURATION;
      notify('Focus time!', 'Back to work for 25 minutes.');
    }
    updateDisplay();
    return;
  }
  remaining--;
  updateDisplay();
}

function notify(title: string, body: string): void {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((p) => {
      if (p === 'granted') new Notification(title, { body });
    });
  }
}

export function initPomodoro(): void {
  updateDisplay();

  document.getElementById('pomodoroToggle')?.addEventListener('click', () => {
    if (running) {
      running = false;
      clearInterval(timerId);
      timerId = undefined;
    } else {
      running = true;
      timerId = window.setInterval(tick, 1000);
    }
    updateDisplay();
  });

  document.getElementById('pomodoroReset')?.addEventListener('click', () => {
    running = false;
    clearInterval(timerId);
    timerId = undefined;
    mode = 'work';
    remaining = WORK_DURATION;
    updateDisplay();
  });
}

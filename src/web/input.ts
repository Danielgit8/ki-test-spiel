import type { Action } from '../core/types';

const KEYS: Record<string, Action> = {
  arrowup: 'up',
  arrowdown: 'down',
  arrowleft: 'left',
  arrowright: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  ' ': 'wait',
  r: 'restart',
};

// Only swallows keys while the game accepts input, so Enter/Space still work on focused buttons otherwise.
export function bindInput(onAction: (action: Action) => void, canPlay: () => boolean): void {
  window.addEventListener('keydown', (e) => {
    const action = KEYS[e.key.toLowerCase()];
    if (!action || e.ctrlKey || e.metaKey || e.altKey || !canPlay()) return;
    e.preventDefault();
    onAction(action);
  });
  document.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (canPlay()) onAction(button.dataset.action as Action);
    });
  });
}

const KEY = 'ki-test-spiel.solved';

export function loadSolved(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function markSolved(id: string): void {
  const solved = loadSolved();
  solved.add(id);
  try {
    localStorage.setItem(KEY, JSON.stringify([...solved]));
  } catch {
    // Storage blocked (private mode): progress is simply not remembered.
  }
}

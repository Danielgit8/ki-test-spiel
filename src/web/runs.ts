import { SUPABASE_KEY, SUPABASE_URL } from '../config';
import type { Action } from '../core/types';
import { GAME_VERSION } from '../core/version';

const PLAYER = 'ki-test-spiel.player';
const OPEN = 'ki-test-spiel.open';
const SENT = 'ki-test-spiel.sent';
const PENDING = 'ki-test-spiel.pending';

interface PendingRun {
  player_id: string;
  level_id: string;
  game_version: string;
  actions: Action[];
}

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked (private mode): nothing is remembered.
  }
}

// crypto.randomUUID needs a secure context, which a phone on http://192.168.x.x is not.
function uuid(): string {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function playerId(): string {
  let id = read<string | null>(PLAYER, null);
  if (!id) {
    id = uuid();
    write(PLAYER, id);
  }
  return id;
}

export function openAttempt(levelId: string): Action[] {
  return read<Record<string, Action[]>>(OPEN, {})[levelId] ?? [];
}

export function saveAttempt(levelId: string, actions: Action[]): void {
  write(OPEN, { ...read<Record<string, Action[]>>(OPEN, {}), [levelId]: actions });
}

// Only the first finished attempt per level is sent; later replays stay local.
export function finishAttempt(levelId: string, actions: Action[]): void {
  const open = read<Record<string, Action[]>>(OPEN, {});
  delete open[levelId];
  write(OPEN, open);

  const sent = read<string[]>(SENT, []);
  if (sent.includes(levelId)) return;
  write(SENT, [...sent, levelId]);
  const run: PendingRun = { player_id: playerId(), level_id: levelId, game_version: GAME_VERSION, actions };
  write(PENDING, [...read<PendingRun[]>(PENDING, []), run]);
  void flush();
}

export async function flush(): Promise<void> {
  if (!import.meta.env.PROD || !SUPABASE_URL || !SUPABASE_KEY) return;
  for (const run of read<PendingRun[]>(PENDING, [])) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/game_runs`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(run),
      });
      // 409 means this run is already stored, which counts as done.
      if (!res.ok && res.status !== 409) return;
    } catch {
      return;
    }
    write(PENDING, read<PendingRun[]>(PENDING, []).filter((p) => p.level_id !== run.level_id));
  }
}

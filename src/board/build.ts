import { levelScore, median } from '../core/score';
import { verifyReplay } from '../core/replay';
import type { Replay, Via } from '../core/replay';
import { ACTIONS } from '../core/types';
import type { Action, LevelDef } from '../core/types';
import { GAME_VERSION } from '../core/version';

export const MIN_HUMANS = 20;

export interface HumanRun {
  playerId: string;
  levelId: string;
  gameVersion: string;
  actions: unknown;
  createdAt: string;
}

export interface Submission {
  source: string;
  data: unknown;
}

export interface BoardLevel {
  id: string;
  optimum: number;
  reference: number;
  humanMedian: number | null;
  humanRuns: number;
  provisional: boolean;
}

export interface BoardEntry {
  name: string;
  via: Via;
  score: number;
  solved: number;
  moves: Record<string, number | null>;
}

export interface Board {
  generated: string;
  gameVersion: string;
  levels: BoardLevel[];
  entries: BoardEntry[];
  humanPlayers: number;
  rejected: { source: string; reason: string }[];
}

const isActions = (a: unknown): a is Action[] =>
  Array.isArray(a) && a.length <= 1000 && a.every((x) => ACTIONS.includes(x as Action));

// Submissions come from outside, so their shape is checked before anything else.
export function parseReplay(data: unknown): Replay | string {
  if (typeof data !== 'object' || data === null) return 'not an object';
  const r = data as Record<string, unknown>;
  for (const field of ['gameVersion', 'levelId', 'player', 'date']) {
    const v = r[field];
    if (typeof v !== 'string' || v.length === 0 || v.length > 100) return `bad ${field}`;
  }
  if (r.via !== 'agent' && r.via !== 'api') return 'bad via';
  if (!isActions(r.actions)) return 'bad actions';
  return r as unknown as Replay;
}

function firstBy<T>(items: T[], key: (t: T) => string, time: (t: T) => string): T[] {
  const first = new Map<string, T>();
  for (const item of items) {
    const current = first.get(key(item));
    if (!current || time(item) < time(current)) first.set(key(item), item);
  }
  return [...first.values()];
}

export function buildBoard(humans: HumanRun[], submissions: Submission[], levels: LevelDef[], now: string): Board {
  const rejected: Board['rejected'] = [];

  const humanResults: { playerId: string; levelId: string; moves: number; won: boolean }[] = [];
  for (const run of firstBy(humans, (r) => `${r.playerId}|${r.levelId}`, (r) => r.createdAt)) {
    const source = `human ${run.playerId} ${run.levelId}`;
    if (!isActions(run.actions)) {
      rejected.push({ source, reason: 'bad actions' });
      continue;
    }
    const result = verifyReplay(
      { gameVersion: run.gameVersion, levelId: run.levelId, actions: run.actions, player: run.playerId, via: 'human', date: run.createdAt },
      levels,
    );
    if (!result.valid) rejected.push({ source, reason: result.reason ?? 'invalid' });
    else humanResults.push({ playerId: run.playerId, levelId: run.levelId, moves: result.moves, won: result.won });
  }

  const boardLevels: BoardLevel[] = levels.map((level) => {
    const won = humanResults.filter((h) => h.levelId === level.id && h.won).map((h) => h.moves);
    const humanMedian = won.length > 0 ? median(won) : null;
    return {
      id: level.id,
      optimum: level.solution.length,
      reference: humanMedian ?? level.solution.length,
      humanMedian,
      humanRuns: won.length,
      provisional: won.length < MIN_HUMANS,
    };
  });

  const aiResults: { name: string; via: Via; levelId: string; date: string; moves: number; won: boolean }[] = [];
  for (const s of submissions) {
    const replay = parseReplay(s.data);
    if (typeof replay === 'string') {
      rejected.push({ source: s.source, reason: replay });
      continue;
    }
    const result = verifyReplay(replay, levels);
    if (!result.valid) rejected.push({ source: s.source, reason: result.reason ?? 'invalid' });
    else aiResults.push({ name: replay.player, via: replay.via, levelId: replay.levelId, date: replay.date, moves: result.moves, won: result.won });
  }

  const groups = new Map<string, typeof aiResults>();
  for (const r of firstBy(aiResults, (r) => `${r.name}|${r.via}|${r.levelId}`, (r) => r.date)) {
    const key = `${r.name}|${r.via}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  const entries: BoardEntry[] = [...groups.values()]
    .map((runs) => {
      const moves: Record<string, number | null> = {};
      let total = 0;
      let solved = 0;
      for (const level of boardLevels) {
        const run = runs.find((r) => r.levelId === level.id);
        moves[level.id] = run ? run.moves : null;
        if (run?.won) {
          solved++;
          total += levelScore(level.reference, run.moves, true);
        }
      }
      return { name: runs[0].name, via: runs[0].via, score: total / boardLevels.length, solved, moves };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return {
    generated: now,
    gameVersion: GAME_VERSION,
    levels: boardLevels,
    entries,
    humanPlayers: new Set(humanResults.map((h) => h.playerId)).size,
    rejected,
  };
}

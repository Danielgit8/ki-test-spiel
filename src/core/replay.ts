import { apply, createSession, defaultLimit, status } from './session';
import { ACTIONS } from './types';
import type { Action, LevelDef } from './types';

export type Via = 'human' | 'agent' | 'api';

export interface Replay {
  gameVersion: string;
  levelId: string;
  actions: Action[];
  player: string;
  via: Via;
  date: string;
}

export interface ReplayResult {
  valid: boolean;
  won: boolean;
  moves: number;
  reason?: string;
}

export function verifyReplay(replay: Replay, levels: LevelDef[]): ReplayResult {
  const level = levels.find((l) => l.id === replay.levelId);
  if (!level) return { valid: false, won: false, moves: 0, reason: 'unknown level' };

  let session = createSession(level, defaultLimit(level));
  for (const action of replay.actions) {
    if (!ACTIONS.includes(action)) {
      return { valid: false, won: false, moves: session.moves, reason: 'unknown action' };
    }
    if (status(session) !== 'playing') {
      return { valid: false, won: false, moves: session.moves, reason: 'actions after end' };
    }
    session = apply(session, action);
  }
  return { valid: true, won: session.state.won, moves: session.moves };
}

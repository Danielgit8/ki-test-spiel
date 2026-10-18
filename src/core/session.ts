import { parseLevel } from './level';
import { step } from './rules';
import type { Action, GameState, LevelDef } from './types';

export type Status = 'playing' | 'won' | 'lost';

export interface Session {
  level: LevelDef;
  initial: GameState;
  state: GameState;
  actions: Action[];
  moves: number;
  limit: number;
}

// Until human data exists (plan 3), the limit is based on the shortest solution.
export function defaultLimit(level: LevelDef): number {
  return 5 * level.solution.length;
}

export function createSession(level: LevelDef, limit: number): Session {
  const initial = parseLevel(level.rows);
  return { level, initial, state: initial, actions: [], moves: 0, limit };
}

export function status(session: Session): Status {
  if (session.state.won) return 'won';
  if (session.moves >= session.limit) return 'lost';
  return 'playing';
}

export function apply(session: Session, action: Action): Session {
  if (status(session) !== 'playing') return session;
  const actions = [...session.actions, action];
  if (action === 'restart') return { ...session, state: session.initial, actions };
  return { ...session, state: step(session.state, action), actions, moves: session.moves + 1 };
}

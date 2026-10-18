import type { Entity, GameState, Move } from './types';

const DELTA: Record<Move, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
  wait: [0, 0],
};

export function player(state: GameState): Entity {
  const p = state.entities.find((e) => e.kind === 'player');
  if (!p) throw new Error('State has no player');
  return p;
}

export function step(state: GameState, move: Move): GameState {
  if (state.won || move === 'wait') return state;

  const [dx, dy] = DELTA[move];
  const from = player(state);
  const tx = from.x + dx;
  const ty = from.y + dy;
  const outside = tx < 0 || ty < 0 || tx >= state.width || ty >= state.height;
  if (outside || state.tiles[ty][tx] === 'wall') return state;

  const here = state.entities.filter((e) => e.kind !== 'player' && e.x === tx && e.y === ty);
  const door = here.find((e) => e.kind === 'door');
  if (door && state.keys === 0) return state;

  const key = here.find((e) => e.kind === 'key');
  const removed = new Set([door, key].filter((e): e is Entity => e !== undefined));

  return {
    ...state,
    entities: state.entities
      .filter((e) => !removed.has(e))
      .map((e) => (e.kind === 'player' ? { ...e, x: tx, y: ty } : e)),
    keys: state.keys - (door ? 1 : 0) + (key ? 1 : 0),
    won: here.some((e) => e.kind === 'goal'),
  };
}

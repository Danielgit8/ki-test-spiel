import { player, step } from './rules';
import { MOVES } from './types';
import type { GameState, Move } from './types';

function stateKey(s: GameState): string {
  const p = player(s);
  const rest = s.entities
    .filter((e) => e.kind !== 'player')
    .map((e) => `${e.kind}${e.x},${e.y}`)
    .sort()
    .join('|');
  return `${p.x},${p.y};${s.keys};${rest}`;
}

// Breadth-first search: the first solution found is a shortest one.
export function solve(start: GameState, maxStates = 200_000): Move[] | null {
  const seen = new Set([stateKey(start)]);
  let frontier: { state: GameState; path: Move[] }[] = [{ state: start, path: [] }];

  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const { state, path } of frontier) {
      for (const move of MOVES) {
        const n = step(state, move);
        if (n.won) return [...path, move];
        const key = stateKey(n);
        if (seen.has(key)) continue;
        seen.add(key);
        if (seen.size > maxStates) throw new Error('Solver state limit reached');
        next.push({ state: n, path: [...path, move] });
      }
    }
    frontier = next;
  }
  return null;
}

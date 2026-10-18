import type { EntityKind, GameState, Tile } from './types';

type Cell = Tile | EntityKind;
export type SymbolMap = Record<Cell, string>;

const CELLS: Cell[] = ['wall', 'floor', 'player', 'key', 'door', 'goal'];

// mulberry32: small deterministic generator, same seed gives the same numbers everywhere.
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function symbolMap(seed: number): SymbolMap {
  const rand = mulberry32(seed);
  const pool = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return Object.fromEntries(CELLS.map((cell, i) => [cell, pool[i]])) as SymbolMap;
}

function cellAt(state: GameState, x: number, y: number): Cell {
  const here = state.entities.filter((e) => e.x === x && e.y === y);
  if (here.some((e) => e.kind === 'player')) return 'player';
  return here[0]?.kind ?? state.tiles[y][x];
}

export function renderText(state: GameState, map: SymbolMap): string {
  const lines: string[] = [];
  for (let y = 0; y < state.height; y++) {
    let line = '';
    for (let x = 0; x < state.width; x++) line += map[cellAt(state, x, y)];
    lines.push(line);
  }
  return lines.join('\n');
}

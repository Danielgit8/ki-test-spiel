import type { Entity, EntityKind, GameState, Tile } from './types';

const ENTITY_CHARS: Record<string, EntityKind> = { P: 'player', K: 'key', D: 'door', G: 'goal' };

export function parseLevel(rows: string[]): GameState {
  const tiles: Tile[][] = [];
  const entities: Entity[] = [];

  rows.forEach((row, y) => {
    tiles.push(
      [...row].map((ch, x): Tile => {
        if (ch === '#') return 'wall';
        if (ch === '.') return 'floor';
        const kind = ENTITY_CHARS[ch];
        if (!kind) throw new Error(`Unknown level char "${ch}" at ${x},${y}`);
        entities.push({ kind, x, y });
        return 'floor';
      }),
    );
  });

  return { width: rows[0].length, height: rows.length, tiles, entities, keys: 0, won: false };
}

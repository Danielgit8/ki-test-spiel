export type Move = 'up' | 'down' | 'left' | 'right' | 'wait';
export type Action = Move | 'restart';

export const MOVES: readonly Move[] = ['up', 'down', 'left', 'right', 'wait'];
export const ACTIONS: readonly Action[] = [...MOVES, 'restart'];

export type Tile = 'wall' | 'floor';
export type EntityKind = 'player' | 'key' | 'door' | 'goal';

export interface Entity {
  kind: EntityKind;
  x: number;
  y: number;
}

export interface GameState {
  width: number;
  height: number;
  tiles: Tile[][];
  entities: Entity[];
  keys: number;
  won: boolean;
}

export interface LevelDef {
  id: string;
  world: number;
  seed: number;
  rows: string[];
  solution: Move[];
}

import type { LevelDef } from '../core/types';
import { WORLD1 } from './world1';

export const LEVELS: LevelDef[] = [...WORLD1];

export function findLevel(id: string): LevelDef | undefined {
  return LEVELS.find((level) => level.id === id);
}

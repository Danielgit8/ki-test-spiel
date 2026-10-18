import type { LevelDef } from '../core/types';

export const WORLD1: LevelDef[] = [
  {
    id: '1-1',
    world: 1,
    seed: 1101,
    rows: [
      '######',
      '#P...#',
      '#....#',
      '#...G#',
      '######',
    ],
    solution: ['right', 'right', 'right', 'down', 'down'],
  },
  {
    id: '1-2',
    world: 1,
    seed: 1102,
    rows: [
      '#######',
      '#P.#..#',
      '#..D.G#',
      '#K.#..#',
      '#######',
    ],
    solution: ['down', 'down', 'right', 'up', 'right', 'right', 'right'],
  },
  {
    id: '1-3',
    world: 1,
    seed: 1103,
    rows: [
      '#########',
      '#P..D..D#',
      '#.##.##.#',
      '#K##K##G#',
      '#########',
    ],
    solution: [
      'down', 'down', 'up', 'up',
      'right', 'right', 'right',
      'down', 'down', 'up', 'up',
      'right', 'right', 'right',
      'down', 'down',
    ],
  },
  {
    id: '1-4',
    world: 1,
    seed: 1104,
    rows: [
      '#########',
      '###G#####',
      '###D#####',
      '###D#####',
      '#K.P.DKK#',
      '#########',
    ],
    solution: [
      'left', 'left',
      'right', 'right', 'right', 'right', 'right', 'right',
      'left', 'left', 'left', 'left',
      'up', 'up', 'up',
    ],
  },
];

import { describe, it, expect } from 'vitest';
import { parseLevel } from '../src/core/level';
import { player, step } from '../src/core/rules';
import { apply, createSession, status } from '../src/core/session';
import type { LevelDef } from '../src/core/types';
import { verifyReplay } from '../src/core/replay';
import { GAME_VERSION } from '../src/core/version';
import { LEVELS, findLevel } from '../src/levels';

describe('rules', () => {
  it('a door blocks without a key', () => {
    const s = parseLevel(['####', '#PD#', '####']);
    expect(step(s, 'right')).toBe(s);
  });

  it('a door opens with a key and uses it up', () => {
    const s = parseLevel(['#####', '#PKD#', '#####']);
    const n = step(step(s, 'right'), 'right');
    expect(player(n)).toMatchObject({ x: 3, y: 1 });
    expect(n.keys).toBe(0);
    expect(n.entities.some((e) => e.kind === 'door')).toBe(false);
  });

  it('the goal wins and later moves change nothing', () => {
    const s = parseLevel(['#####', '#PG.#', '#####']);
    const n = step(s, 'right');
    expect(n.won).toBe(true);
    expect(step(n, 'right')).toBe(n);
  });
});

describe('session', () => {
  it('counts blocked moves, not restarts, and is lost at the limit', () => {
    const level: LevelDef = { id: 't', world: 0, seed: 1, rows: ['#####', '#P.G#', '#####'], solution: [] };
    let s = createSession(level, 2);
    s = apply(s, 'left');
    s = apply(s, 'restart');
    expect(s.moves).toBe(1);
    s = apply(s, 'left');
    expect(status(s)).toBe('lost');
  });
});

describe('verifyReplay', () => {
  const run = {
    gameVersion: GAME_VERSION,
    levelId: '1-1',
    player: 'test',
    via: 'agent' as const,
    date: '2026-10-18T00:00:00.000Z',
    actions: findLevel('1-1')!.solution,
  };

  it('accepts a real winning run', () => {
    expect(verifyReplay(run, LEVELS)).toEqual({ valid: true, won: true, moves: 5 });
  });

  it('rejects a run with extra actions after the end', () => {
    expect(verifyReplay({ ...run, actions: [...run.actions, 'up'] }, LEVELS).valid).toBe(false);
  });
});

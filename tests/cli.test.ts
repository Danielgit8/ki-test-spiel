import { it, expect } from 'vitest';
import { runCommand } from '../src/cli/commands';
import type { CommandResult } from '../src/cli/commands';
import { verifyReplay } from '../src/core/replay';
import { LEVELS, findLevel } from '../src/levels';

it('plays level 1-1 from start to a valid, saved replay', () => {
  let r: CommandResult = runCommand(['start', '1-1', '--player', 'claude-code'], null);
  expect(r.output).toContain('Level 1-1 | moves 0/25 | playing');

  for (const move of findLevel('1-1')!.solution) r = runCommand(['move', move], r.store);

  expect(r.output).toContain('Level complete.');
  expect(r.store).toBeNull();
  expect(r.replay).toMatchObject({ levelId: '1-1', player: 'claude-code', via: 'agent' });
  expect(verifyReplay(r.replay!, LEVELS)).toEqual({ valid: true, won: true, moves: 5 });
});

it('does not let a new start reset the move counter mid-level', () => {
  const started = runCommand(['start', '1-1'], null).store;
  const moved = runCommand(['move', 'up'], started).store;
  const r = runCommand(['start', '1-1'], moved);
  expect(r.output).toContain('still running');
  expect(r.store).toEqual(moved);
});

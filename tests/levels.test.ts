import { describe, it, expect } from 'vitest';
import { LEVELS } from '../src/levels';
import { parseLevel } from '../src/core/level';
import { solve } from '../src/core/solver';
import { apply, createSession, defaultLimit, status } from '../src/core/session';

describe.each(LEVELS)('level $id', (level) => {
  it('is won by its stored solution', () => {
    const end = level.solution.reduce(apply, createSession(level, defaultLimit(level)));
    expect(status(end)).toBe('won');
  });

  it('has no shorter solution than the stored one', () => {
    expect(solve(parseLevel(level.rows))?.length).toBe(level.solution.length);
  });
});

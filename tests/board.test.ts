import { describe, it, expect } from 'vitest';
import { buildBoard } from '../src/board/build';
import type { HumanRun, Submission } from '../src/board/build';
import { median } from '../src/core/score';
import { LEVELS } from '../src/levels';
import { GAME_VERSION } from '../src/core/version';
import type { Action } from '../src/core/types';

const NOW = '2026-10-19T03:00:00.000Z';
const OPTIMAL_1_1: Action[] = ['right', 'right', 'right', 'down', 'down'];
const SEVEN_1_1: Action[] = ['left', 'up', ...OPTIMAL_1_1];
const NINE_1_1: Action[] = ['wait', 'wait', ...SEVEN_1_1];

const human = (playerId: string, actions: Action[], createdAt: string): HumanRun => ({
  playerId, levelId: '1-1', gameVersion: GAME_VERSION, actions, createdAt,
});
const ai = (source: string, player: string, actions: unknown, date: string, via = 'agent'): Submission => ({
  source, data: { gameVersion: GAME_VERSION, levelId: '1-1', player, via, date, actions },
});

describe('board', () => {
  it('computes the median for odd and even counts', () => {
    expect(median([9, 5, 7])).toBe(7);
    expect(median([7, 9])).toBe(8);
  });

  it('uses the shortest solution as reference while there are no humans', () => {
    const board = buildBoard([], [ai('a.json', 'claude-code', OPTIMAL_1_1, NOW)], LEVELS, NOW);
    expect(board.levels[0]).toMatchObject({ id: '1-1', reference: 5, humanMedian: null, provisional: true });
    expect(board.entries[0]).toMatchObject({ name: 'claude-code', score: 0.25, solved: 1 });
  });

  it('counts only the first run per human and uses the human median as reference', () => {
    const humans = [
      human('a', SEVEN_1_1, '2026-10-18T10:00:00Z'),
      human('a', OPTIMAL_1_1, '2026-10-18T11:00:00Z'),
      human('b', NINE_1_1, '2026-10-18T12:00:00Z'),
    ];
    const tenMoves: Action[] = ['wait', ...NINE_1_1];
    const board = buildBoard(humans, [ai('a.json', 'bot', tenMoves, NOW)], LEVELS, NOW);
    expect(board.levels[0]).toMatchObject({ reference: 8, humanMedian: 8, humanRuns: 2, provisional: true });
    expect(board.humanPlayers).toBe(2);
    expect(board.entries[0].score).toBeCloseTo(0.64 / 4);
  });

  it('counts only the first AI run per level and rejects broken submissions', () => {
    const board = buildBoard(
      [],
      [
        ai('first.json', 'bot', NINE_1_1, '2026-10-18T10:00:00Z'),
        ai('second.json', 'bot', OPTIMAL_1_1, '2026-10-18T11:00:00Z'),
        ai('human.json', 'fake', OPTIMAL_1_1, NOW, 'human'),
        ai('cheat.json', 'cheater', ['teleport'], NOW),
      ],
      LEVELS,
      NOW,
    );
    expect(board.entries).toHaveLength(1);
    expect(board.entries[0].moves['1-1']).toBe(9);
    expect(board.rejected.map((r) => r.reason)).toEqual(['bad via', 'bad actions']);
  });
});

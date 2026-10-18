import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { verifyReplay } from '../core/replay';
import type { Replay } from '../core/replay';
import { LEVELS } from '../levels';

const RUNS_DIR = join(process.cwd(), 'runs');
const files = existsSync(RUNS_DIR) ? readdirSync(RUNS_DIR).filter((f) => f.endsWith('.json')) : [];

if (files.length === 0) console.log('No runs found in runs/');

for (const file of files) {
  const replay: Replay = JSON.parse(readFileSync(join(RUNS_DIR, file), 'utf8'));
  const r = verifyReplay(replay, LEVELS);
  const verdict = r.valid ? (r.won ? 'won' : 'lost') : `INVALID (${r.reason})`;
  console.log(`${file}: ${replay.player} via ${replay.via}, level ${replay.levelId}, ${r.moves} moves, ${verdict}`);
}

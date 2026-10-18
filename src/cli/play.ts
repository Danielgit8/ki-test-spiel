import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runCommand } from './commands';
import type { PlayStore } from './commands';

const STORE_FILE = join(process.cwd(), '.play-session.json');
const RUNS_DIR = join(process.cwd(), 'runs');

const store: PlayStore | null = existsSync(STORE_FILE) ? JSON.parse(readFileSync(STORE_FILE, 'utf8')) : null;
const result = runCommand(process.argv.slice(2), store);

if (result.store) writeFileSync(STORE_FILE, JSON.stringify(result.store));
else rmSync(STORE_FILE, { force: true });

console.log(result.output);

if (result.replay) {
  mkdirSync(RUNS_DIR, { recursive: true });
  const name = `${result.replay.levelId}-${result.replay.date.replace(/[:.]/g, '-')}.json`;
  writeFileSync(join(RUNS_DIR, name), JSON.stringify(result.replay, null, 2));
  console.log(`Run saved: runs/${name}`);
}

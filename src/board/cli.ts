import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SUPABASE_URL } from '../config';
import { LEVELS } from '../levels';
import { buildBoard } from './build';
import type { HumanRun, Submission } from './build';

const PAGE = 1000;
// Only the nightly build has this key (GitHub secret). The public key can add runs but not read them.
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

async function fetchHumanRuns(): Promise<HumanRun[]> {
  if (!SUPABASE_URL || !SECRET_KEY) {
    console.log('No Supabase secret key, continuing without human runs');
    return [];
  }
  const runs: HumanRun[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const url = `${SUPABASE_URL}/rest/v1/game_runs?select=player_id,level_id,game_version,actions,created_at&order=id.asc&limit=${PAGE}&offset=${offset}`;
    const res = await fetch(url, { headers: { apikey: SECRET_KEY } });
    if (!res.ok) throw new Error(`Supabase answered ${res.status}: ${await res.text()}`);
    const rows = (await res.json()) as { player_id: string; level_id: string; game_version: string; actions: unknown; created_at: string }[];
    runs.push(...rows.map((r) => ({ playerId: r.player_id, levelId: r.level_id, gameVersion: r.game_version, actions: r.actions, createdAt: r.created_at })));
    if (rows.length < PAGE) return runs;
  }
}

function readSubmissions(): Submission[] {
  if (!existsSync('submissions')) return [];
  return readdirSync('submissions')
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const source = `submissions/${f}`;
      try {
        return { source, data: JSON.parse(readFileSync(join('submissions', f), 'utf8')) as unknown };
      } catch {
        return { source, data: null };
      }
    });
}

const board = buildBoard(await fetchHumanRuns(), readSubmissions(), LEVELS, new Date().toISOString());
mkdirSync('public', { recursive: true });
writeFileSync('public/leaderboard.json', JSON.stringify(board, null, 2));
console.log(`${board.entries.length} AI entries, ${board.humanPlayers} human players, ${board.rejected.length} rejected`);
for (const r of board.rejected) console.log(`rejected ${r.source}: ${r.reason}`);

import './style.css';
import type { Board } from '../board/build';

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const pct = (v: number) => `${Math.round(v * 100)}%`;
const VIA: Record<string, string> = { agent: 'Agent', api: 'Model (API)' };

function cell(tag: 'td' | 'th', text: string, num = false): HTMLElement {
  const el = document.createElement(tag);
  el.textContent = text;
  if (num) el.className = 'num';
  return el;
}

function row(cells: HTMLElement[]): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.append(...cells);
  return tr;
}

async function main(): Promise<void> {
  let board: Board;
  try {
    const res = await fetch('./leaderboard.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    board = (await res.json()) as Board;
  } catch {
    $('status').textContent = 'No results yet.';
    return;
  }

  const ranking = $('ranking') as HTMLTableElement;
  const humans = board.humanPlayers > 0;
  ranking.tBodies[0].append(
    row([cell('td', '–'), cell('td', 'Humans (median)'), cell('td', `${board.humanPlayers} players`), cell('td', humans ? '100%' : '–', true), cell('td', '–', true)]),
  );
  board.entries.forEach((e, i) =>
    ranking.tBodies[0].append(
      row([cell('td', String(i + 1)), cell('td', e.name), cell('td', VIA[e.via] ?? e.via), cell('td', pct(e.score), true), cell('td', `${e.solved}/${board.levels.length}`, true)]),
    ),
  );
  ranking.hidden = false;

  const levels = $('levels') as HTMLTableElement;
  levels.tHead!.append(row([cell('th', 'Level'), cell('th', 'Humans (median)', true), cell('th', 'Shortest', true), ...board.entries.map((e) => cell('th', e.name, true))]));
  for (const l of board.levels) {
    const humanText = l.humanMedian === null ? '–' : `${l.humanMedian}${l.provisional ? '*' : ''}`;
    levels.tBodies[0].append(
      row([cell('td', l.id), cell('td', humanText, true), cell('td', String(l.optimum), true), ...board.entries.map((e) => cell('td', e.moves[l.id] === null ? '–' : String(e.moves[l.id]), true))]),
    );
  }
  levels.hidden = false;

  $('status').textContent = `Updated ${new Date(board.generated).toLocaleString('en-GB')}`;
  $('note').textContent = '* Provisional: fewer than 20 humans have solved this level. Without human results, the shortest possible solution is the reference.';
}

void main();

import { LEVELS, findLevel } from '../levels';
import { apply, createSession, defaultLimit, status } from '../core/session';
import type { Session } from '../core/session';
import { renderText, symbolMap } from '../core/textView';
import { MOVES } from '../core/types';
import type { Action, Move } from '../core/types';
import type { Replay, Via } from '../core/replay';
import { GAME_VERSION } from '../core/version';

export interface PlayStore {
  levelId: string;
  actions: Action[];
  player: string;
  via: Via;
}

export interface CommandResult {
  output: string;
  store: PlayStore | null;
  replay?: Replay;
}

const USAGE = [
  'Usage:',
  '  levels',
  '  start <level> [--player <name>] [--via agent|api|human]',
  '  move <up|down|left|right|wait>',
  '  restart',
  '  show',
].join('\n');

const NO_LEVEL = 'No level running. Start one with: start <level>';
const LEVEL_LIST = `Levels: ${LEVELS.map((l) => l.id).join(', ')}`;

function rebuild(store: PlayStore): Session {
  const level = findLevel(store.levelId);
  if (!level) throw new Error(`Unknown level in store: ${store.levelId}`);
  return store.actions.reduce(apply, createSession(level, defaultLimit(level)));
}

function view(session: Session): string {
  const header = `Level ${session.level.id} | moves ${session.moves}/${session.limit} | ${status(session)}`;
  return `${header}\n${renderText(session.state, symbolMap(session.level.seed))}`;
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function act(store: PlayStore, action: Action, now: () => string): CommandResult {
  const session = apply(rebuild(store), action);
  const result = status(session);
  if (result === 'playing') return { output: view(session), store: { ...store, actions: session.actions } };

  const replay: Replay = {
    gameVersion: GAME_VERSION,
    levelId: store.levelId,
    actions: session.actions,
    player: store.player,
    via: store.via,
    date: now(),
  };
  const ending = result === 'won' ? 'Level complete.' : 'No moves left. Level failed.';
  return { output: `${view(session)}\n${ending}`, store: null, replay };
}

export function runCommand(
  args: string[],
  store: PlayStore | null,
  now: () => string = () => new Date().toISOString(),
): CommandResult {
  const [command, arg] = args;

  switch (command) {
    case 'levels':
      return { output: LEVEL_LIST, store };

    case 'start': {
      if (!arg || !findLevel(arg)) return { output: `Unknown level. ${LEVEL_LIST}`, store };
      const via = (flag(args, '--via') ?? 'agent') as Via;
      if (!['agent', 'api', 'human'].includes(via)) return { output: USAGE, store };
      const fresh: PlayStore = { levelId: arg, actions: [], player: flag(args, '--player') ?? 'anonymous', via };
      return { output: view(rebuild(fresh)), store: fresh };
    }

    case 'move':
      if (!store) return { output: NO_LEVEL, store };
      if (!MOVES.includes(arg as Move)) return { output: USAGE, store };
      return act(store, arg as Move, now);

    case 'restart':
      if (!store) return { output: NO_LEVEL, store };
      return act(store, 'restart', now);

    case 'show':
      if (!store) return { output: NO_LEVEL, store };
      return { output: view(rebuild(store)), store };

    default:
      return { output: USAGE, store };
  }
}

import './style.css';
import { LEVELS } from '../levels';
import { apply, createSession, defaultLimit, status } from '../core/session';
import type { Session, Status } from '../core/session';
import { renderText, symbolMap } from '../core/textView';
import type { Action, LevelDef, Move } from '../core/types';
import { Renderer } from './render';
import { bindInput } from './input';
import { loadSolved, markSolved } from './progress';
import { finishAttempt, flush, openAttempt, saveAttempt } from './runs';

const DIRS: Record<Move, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], wait: [0, 0] };
const END_DELAY = 260;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const renderer = new Renderer($<HTMLCanvasElement>('board'));
const overlay = $('overlay');
const overlayBtn = $<HTMLButtonElement>('overlay-btn');
const aiView = $('ai-view');
const toggleAi = $<HTMLButtonElement>('toggle-ai');
const levelsDialog = $<HTMLDialogElement>('levels');

let session: Session;
let onOverlay: (() => void) | null = null;

const canPlay = () => overlay.hidden && !levelsDialog.open && status(session) === 'playing';

function firstOpenLevel(): LevelDef {
  const solved = loadSolved();
  return LEVELS.find((l) => !solved.has(l.id)) ?? LEVELS[0];
}

function start(level: LevelDef): void {
  session = openAttempt(level.id).reduce(apply, createSession(level, defaultLimit(level)));
  overlay.hidden = true;
  onOverlay = null;
  renderer.show(session.state);
  update();
}

function update(): void {
  $('level-id').textContent = session.level.id;
  $('moves').textContent = `${session.moves} / ${session.limit} moves`;
  aiView.textContent = renderText(session.state, symbolMap(session.level.seed));
}

function handle(action: Action): void {
  const before = session.state;
  session = apply(session, action);
  if (action === 'restart') renderer.show(session.state);
  else renderer.animate(before, session.state, DIRS[action]);
  update();
  const result = status(session);
  if (result === 'playing') saveAttempt(session.level.id, session.actions);
  else {
    finishAttempt(session.level.id, session.actions);
    setTimeout(() => finish(result), END_DELAY);
  }
}

function finish(result: Status): void {
  const next = LEVELS[LEVELS.indexOf(session.level) + 1];
  if (result === 'won') {
    markSolved(session.level.id);
    showOverlay('Level complete', `${session.moves} moves`, next ? 'Next level' : 'Play again', () => start(next ?? LEVELS[0]));
  } else {
    const level = session.level;
    showOverlay('Out of moves', `The limit was ${session.limit}`, 'Try again', () => start(level));
  }
}

function showOverlay(title: string, sub: string, button: string, action: () => void): void {
  $('overlay-title').textContent = title;
  $('overlay-sub').textContent = sub;
  overlayBtn.textContent = button;
  onOverlay = action;
  overlay.hidden = false;
  overlayBtn.focus();
}

function openLevels(): void {
  const solved = loadSolved();
  const grid = $('level-grid');
  grid.replaceChildren();
  LEVELS.forEach((level, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn';
    button.textContent = level.id;
    if (solved.has(level.id)) button.classList.add('solved');
    button.disabled = i > 0 && !solved.has(LEVELS[i - 1].id) && !solved.has(level.id);
    button.addEventListener('click', () => {
      levelsDialog.close();
      start(level);
    });
    grid.append(button);
  });
  levelsDialog.showModal();
}

overlayBtn.addEventListener('click', () => onOverlay?.());
toggleAi.addEventListener('click', () => {
  const show = aiView.hidden;
  aiView.hidden = !show;
  toggleAi.setAttribute('aria-pressed', String(show));
  renderer.resize();
});
$('open-levels').addEventListener('click', openLevels);
$('close-levels').addEventListener('click', () => levelsDialog.close());
window.addEventListener('resize', () => renderer.resize());

bindInput(handle, canPlay);
start(firstOpenLevel());
void flush();

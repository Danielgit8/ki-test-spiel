import { player } from '../core/rules';
import type { Entity, GameState } from '../core/types';

const COLORS = {
  wall: '#444441',
  floor: '#F1EFE8',
  player: '#534AB7',
  key: '#EF9F27',
  door: '#D85A30',
  goal: '#1D9E75',
};
const DURATION = 120;
const MAX_WIDTH = 560;
const ease = (t: number) => 1 - (1 - t) ** 3;

type Drawable = Pick<Entity, 'kind' | 'x' | 'y'>;

interface Anim {
  from: GameState;
  start: number;
  dir: [number, number];
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private state: GameState | null = null;
  private anim: Anim | null = null;
  private cell = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not supported');
    this.ctx = ctx;
  }

  show(state: GameState): void {
    this.state = state;
    this.anim = null;
    this.resize();
  }

  animate(from: GameState, to: GameState, dir: [number, number]): void {
    this.state = to;
    this.anim = { from, start: performance.now(), dir };
    requestAnimationFrame(this.frame);
  }

  resize(): void {
    if (!this.state) return;
    const available = Math.min(this.canvas.parentElement?.clientWidth ?? MAX_WIDTH, MAX_WIDTH);
    this.cell = Math.floor(available / this.state.width);
    const w = this.cell * this.state.width;
    const h = this.cell * this.state.height;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  private frame = (): void => {
    this.draw();
    if (!this.anim) return;
    if (performance.now() - this.anim.start < DURATION) requestAnimationFrame(this.frame);
    else {
      this.anim = null;
      this.draw();
    }
  };

  private draw(): void {
    const { ctx, cell, state, anim } = this;
    if (!state) return;
    const t = anim ? Math.min(1, (performance.now() - anim.start) / DURATION) : 1;
    const k = ease(t);

    ctx.clearRect(0, 0, cell * state.width, cell * state.height);
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        ctx.fillStyle = state.tiles[y][x] === 'wall' ? COLORS.wall : COLORS.floor;
        ctx.beginPath();
        ctx.roundRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2, cell * 0.12);
        ctx.fill();
      }
    }

    for (const e of state.entities) if (e.kind !== 'player') this.entity(e, 1, 1);

    if (anim) {
      for (const e of anim.from.entities) {
        const gone = e.kind !== 'player' && !state.entities.some((s) => s.kind === e.kind && s.x === e.x && s.y === e.y);
        if (gone) this.entity(e, 1 - k, 1 + 0.3 * k);
      }
    }

    const to = player(state);
    let px = to.x;
    let py = to.y;
    if (anim) {
      const from = player(anim.from);
      if (from.x === to.x && from.y === to.y) {
        const bump = Math.sin(Math.PI * t) * 0.12;
        px += anim.dir[0] * bump;
        py += anim.dir[1] * bump;
      } else {
        px = from.x + (to.x - from.x) * k;
        py = from.y + (to.y - from.y) * k;
      }
    }
    this.entity({ kind: 'player', x: px, y: py }, 1, 1);
  }

  private entity(e: Drawable, alpha: number, scale: number): void {
    const { ctx, cell } = this;
    const cx = (e.x + 0.5) * cell;
    const cy = (e.y + 0.5) * cell;
    const s = cell * scale;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    switch (e.kind) {
      case 'goal':
        ctx.strokeStyle = COLORS.goal;
        ctx.lineWidth = s * 0.1;
        ctx.arc(cx, cy, s * 0.26, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case 'door':
        ctx.fillStyle = COLORS.door;
        ctx.roundRect(cx - s * 0.36, cy - s * 0.36, s * 0.72, s * 0.72, s * 0.12);
        ctx.fill();
        break;
      case 'key':
        ctx.fillStyle = COLORS.key;
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.rect(-s * 0.16, -s * 0.16, s * 0.32, s * 0.32);
        ctx.fill();
        break;
      case 'player':
        ctx.fillStyle = COLORS.player;
        ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
    ctx.restore();
  }
}

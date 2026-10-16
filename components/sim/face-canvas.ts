/**
 * Canvas face for the head display (108 × 64.8 mm → 540 × 324 px, 5 : 3).
 *
 * Drawn every frame into an offscreen canvas that the viewer uploads as a
 * CanvasTexture. Preset values live in data/face-presets.ts; this module only owns
 * the parameter shape, ranges and drawing.
 */

export interface FaceParams {
  /** Eye scale, 1 = default */
  eyeSize: number;
  /** Lid openness 0 (closed) … 1 (open) */
  eyeOpen: number;
  /** Eye tilt in degrees, + = outer corners up (mirrored left/right) */
  eyeAngle: number;
  /** Brow tilt in degrees, + = outer ends up (mirrored); 0 brows are flat */
  browAngle: number;
  /** Foreground brightness 0 … 1 */
  brightness: number;
  /** Blinks per minute (0 = never) */
  blinkRate: number;
}

export const FACE_RANGES: Record<keyof FaceParams, [number, number]> = {
  eyeSize: [0.4, 1.6],
  eyeOpen: [0, 1],
  eyeAngle: [-30, 30],
  browAngle: [-30, 30],
  brightness: [0.1, 1],
  blinkRate: [0, 40],
};

export const FACE_DEFAULTS: FaceParams = {
  eyeSize: 1,
  eyeOpen: 1,
  eyeAngle: 0,
  browAngle: 0,
  brightness: 1,
  blinkRate: 12,
};

export function clampFace(p: Partial<FaceParams>): Partial<FaceParams> {
  const out: Partial<FaceParams> = {};
  for (const [k, v] of Object.entries(p) as [keyof FaceParams, number][]) {
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;
    const [lo, hi] = FACE_RANGES[k];
    out[k] = Math.min(Math.max(v, lo), hi);
  }
  return out;
}

/**
 * Timeline face keys → params at time t. Per token, `base` is the value at t = 0,
 * keys that set the token are linear points after it, the last one holds.
 */
export function faceAt(base: FaceParams, keys: { t: number; tokens: Partial<FaceParams> }[], t: number): FaceParams {
  const sorted = [...keys].sort((a, b) => a.t - b.t);
  const out = { ...base };
  for (const k of Object.keys(base) as (keyof FaceParams)[]) {
    let t0 = 0;
    let v0 = base[k];
    for (const key of sorted) {
      const v1 = key.tokens[k];
      if (typeof v1 !== 'number' || !Number.isFinite(v1)) continue;
      if (key.t <= t) {
        t0 = key.t;
        v0 = v1;
        continue;
      }
      v0 += (v1 - v0) * ((t - t0) / (key.t - t0));
      break;
    }
    out[k] = v0;
  }
  return { ...out, ...clampFace(out) };
}

export const FACE_WIDTH = 540;
export const FACE_HEIGHT = 324;
const BLINK_SECONDS = 0.16;
/** Display pixels, not UI chrome — the screen glows white on black. */
const BG = '#000000';
const FG = '#ffffff';

export class FaceCanvas {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private params: FaceParams = { ...FACE_DEFAULTS };
  private nextBlink = 2;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = FACE_WIDTH;
    this.canvas.height = FACE_HEIGHT;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    this.ctx = ctx;
    this.draw(0);
  }

  get current(): FaceParams {
    return { ...this.params };
  }

  setParams(p: Partial<FaceParams>): void {
    this.params = { ...this.params, ...clampFace(p) };
  }

  /** Lid factor from the blink schedule: 1 = open, 0 = shut. */
  private blink(t: number): number {
    const rate = this.params.blinkRate;
    if (rate <= 0) return 1;
    if (t > this.nextBlink + BLINK_SECONDS) {
      // Jittered interval around the mean, deterministic per blink.
      const mean = 60 / rate;
      const r = Math.sin(this.nextBlink * 12.9898) * 43758.5453;
      const jitter = 0.6 + 0.8 * (r - Math.floor(r));
      this.nextBlink = t + mean * jitter;
    }
    const u = (t - this.nextBlink) / BLINK_SECONDS;
    if (u < 0 || u > 1) return 1;
    return Math.abs(1 - 2 * u);
  }

  draw(t: number): void {
    const { ctx } = this;
    const { eyeSize, eyeOpen, eyeAngle, browAngle, brightness } = this.params;
    const W = FACE_WIDTH;
    const H = FACE_HEIGHT;

    ctx.globalAlpha = 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = brightness;
    ctx.fillStyle = FG;
    ctx.strokeStyle = FG;

    const eyeW = 62 * eyeSize;
    const eyeH = 92 * eyeSize * Math.max(eyeOpen * this.blink(t), 0.06);
    const cy = H * 0.54;
    const dx = W * 0.2;

    for (const side of [-1, 1]) {
      const cx = W / 2 + side * dx;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(((-side * eyeAngle) * Math.PI) / 180);
      ctx.beginPath();
      ctx.roundRect(-eyeW / 2, -eyeH / 2, eyeW, eyeH, Math.min(eyeW, eyeH) / 2);
      ctx.fill();
      ctx.restore();

      if (browAngle !== 0) {
        ctx.save();
        ctx.translate(cx, cy - 92 * eyeSize * 0.5 - 34);
        ctx.rotate(((-side * browAngle) * Math.PI) / 180);
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-eyeW * 0.6, 0);
        ctx.lineTo(eyeW * 0.6, 0);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
}

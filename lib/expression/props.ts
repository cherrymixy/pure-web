import type { Axis, MotionProps } from "../models";
import type { PlaybackParams } from "../sim/params";
import { signatureToParams } from "../signature/axes";

// Motion Properties (0–100 sliders, W02E) ↔ playback parameters.
export const PROP_RANGES = {
  /** Speed is piecewise (speedRate): 0 → 0.5×, 50 → 1×, 100 → 2× */
  speed: [0.5, 2],
  duration: [0.7, 1.3],
  amplitude: [0.3, 1.3],
  rhythm: [0.5, 2],
} as const;

/** How far a value may drift from the signature before the slider shows a warning. */
export const SIGNATURE_TOLERANCE = { speed: 0.2, amplitude: 0.2, settle: 0.25, rhythm: 0.3 } as const;

/** Speed prop 0–100 → × rate: 0–50 spans 0.5–1×, 50–100 spans 1–2× (50 stays 1×, so older values below 50 are unchanged). */
export const speedRate = (prop: number) => (prop <= 50 ? 0.5 + prop / 100 : 1 + (prop - 50) / 50);
/** × rate → Speed prop (0–100) */
export const speedProp = (rate: number) =>
  Math.max(0, Math.min(100, Math.round(rate <= 1 ? (rate - 0.5) * 100 : 50 + (rate - 1) * 50)));

const lerp = ([lo, hi]: readonly [number, number], v: number) => lo + (hi - lo) * (v / 100);
const unlerp = ([lo, hi]: readonly [number, number], x: number) => Math.max(0, Math.min(100, Math.round(((x - lo) / (hi - lo)) * 100)));

export interface PropWarning {
  prop: keyof MotionProps;
  param: keyof typeof SIGNATURE_TOLERANCE;
  value: number;
  range: [number, number];
}

/**
 * speed = speedRate(Speed) (0.5–1–2×) ÷ lerp(0.7,1.3, Duration) — longer duration plays slower;
 * amplitude = lerp(0.3,1.3, Amplitude); settle = Smoothness/100; rhythm = lerp(0.5,2, Frequency).
 * antic stays with the signature.
 */
export function propsToParams(props: MotionProps, axes?: Record<Axis, number>): { params: Required<PlaybackParams>; warnings: PropWarning[] } {
  const sig = axes ? signatureToParams(axes).playback : null;
  const params: Required<PlaybackParams> = {
    speed: speedRate(props.speed) / lerp(PROP_RANGES.duration, props.duration),
    amplitude: lerp(PROP_RANGES.amplitude, props.amplitude),
    settle: props.smoothness / 100,
    antic: sig?.antic ?? 0,
    rhythm: lerp(PROP_RANGES.rhythm, props.frequency),
  };
  const warnings: PropWarning[] = [];
  if (sig) {
    const check = (prop: keyof MotionProps, param: keyof typeof SIGNATURE_TOLERANCE) => {
      const tol = SIGNATURE_TOLERANCE[param];
      const range: [number, number] = [sig[param] - tol, sig[param] + tol];
      if (params[param] < range[0] || params[param] > range[1]) warnings.push({ prop, param, value: params[param], range });
    };
    check("speed", "speed");
    check("amplitude", "amplitude");
    check("smoothness", "settle");
    check("frequency", "rhythm");
  }
  return { params, warnings };
}

/** Slider positions that reproduce a signature's playback (Duration at 50). */
export function paramsToProps(params: Required<PlaybackParams>): MotionProps {
  return {
    speed: speedProp(params.speed * lerp(PROP_RANGES.duration, 50)),
    duration: 50,
    amplitude: unlerp(PROP_RANGES.amplitude, params.amplitude),
    smoothness: Math.round(params.settle * 100),
    frequency: unlerp(PROP_RANGES.rhythm, params.rhythm),
  };
}

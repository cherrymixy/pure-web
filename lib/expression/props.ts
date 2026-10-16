import type { Axis, MotionProps } from "../models";
import type { PlaybackParams } from "../sim/params";
import { signatureToParams } from "../signature/axes";

// Motion Properties (0–100 sliders, W02E) ↔ playback parameters.
export const PROP_RANGES = {
  speed: [0.5, 1.5],
  duration: [0.7, 1.3],
  amplitude: [0.3, 1.3],
  rhythm: [0.5, 2],
} as const;

/** How far a value may drift from the signature before the slider shows a warning. */
export const SIGNATURE_TOLERANCE = { speed: 0.2, amplitude: 0.2, settle: 0.25, rhythm: 0.3 } as const;

const lerp = ([lo, hi]: readonly [number, number], v: number) => lo + (hi - lo) * (v / 100);
const unlerp = ([lo, hi]: readonly [number, number], x: number) => Math.max(0, Math.min(100, Math.round(((x - lo) / (hi - lo)) * 100)));

export interface PropWarning {
  prop: keyof MotionProps;
  param: keyof typeof SIGNATURE_TOLERANCE;
  value: number;
  range: [number, number];
}

/**
 * speed = lerp(0.5,1.5, Speed) ÷ lerp(0.7,1.3, Duration) — longer duration plays slower;
 * amplitude = lerp(0.3,1.3, Amplitude); settle = Smoothness/100; rhythm = lerp(0.5,2, Frequency).
 * antic stays with the signature.
 */
export function propsToParams(props: MotionProps, axes?: Record<Axis, number>): { params: Required<PlaybackParams>; warnings: PropWarning[] } {
  const sig = axes ? signatureToParams(axes).playback : null;
  const params: Required<PlaybackParams> = {
    speed: lerp(PROP_RANGES.speed, props.speed) / lerp(PROP_RANGES.duration, props.duration),
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
    speed: unlerp(PROP_RANGES.speed, params.speed * lerp(PROP_RANGES.duration, 50)),
    duration: 50,
    amplitude: unlerp(PROP_RANGES.amplitude, params.amplitude),
    smoothness: Math.round(params.settle * 100),
    frequency: unlerp(PROP_RANGES.rhythm, params.rhythm),
  };
}

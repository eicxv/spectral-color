import { getWindow } from "../sampling";

/**
 * Linear Interpolator
 *
 * Interpolates linearly (lerp) between two values.
 *
 * @remarks Only valid for x \>= 0 and x \< samples.length.
 *
 * @param x - free variable to sample at
 * @param samples - samples to interpolate
 * @returns interpolator
 */
export function linearInterpolator(x: number, samples: readonly number[]): number {
  const x0 = Math.floor(x);
  const t = x - x0;
  const [a, b] = getWindow(x0, samples, 2);
  return a + t * (b - a);
}

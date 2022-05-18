/**
 * Nearest Neighbour Interpolator
 *
 * Selects sample closest to `x`.
 *
 * @remarks Only valid for x \>= 0 and x \<= samples.length.
 *
 * @param x - free variable to sample at
 * @param samples - samples to interpolate
 * @returns interpolator
 */
export function nearestInterpolator(x: number, samples: readonly number[][]): number[];
export function nearestInterpolator(x: number, samples: readonly number[]): number;
export function nearestInterpolator(
  x: number,
  samples: readonly number[] | readonly number[][]
): number | number[] {
  return samples[Math.round(x)];
}

/**
 * Nearest Neighbour Extrapolator
 *
 * Selects the closest value from the given array.
 *
 * Will throw an error if the point is inside the domain.
 *
 * @param x - free variable to sample at
 * @param samples - samples to extrapolate from
 * @returns extrapolator
 */
export function nearestExtrapolator(x: number, samples: readonly number[][]): number[];
export function nearestExtrapolator(x: number, samples: readonly number[]): number;
export function nearestExtrapolator(
  x: number,
  samples: readonly number[] | readonly number[][]
): number | number[] {
  if (x <= 0) {
    return samples[0];
  }
  if (x >= samples.length - 1) {
    return samples[samples.length - 1];
  }
  throw new Error("Cannot extrapolate inside the domain");
}

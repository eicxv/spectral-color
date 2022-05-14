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

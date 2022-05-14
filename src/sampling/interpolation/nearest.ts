export function nearestInterpolator(x: number, samples: readonly number[][]): number[];
export function nearestInterpolator(x: number, samples: readonly number[]): number;
export function nearestInterpolator(
  x: number,
  samples: readonly number[] | readonly number[][]
): number | number[] {
  return samples[Math.round(x)];
}

export function nearestExtrapolator<T extends number | number[]>(
  x: number,
  samples: readonly T[]
): T {
  if (x < 0) {
    return samples[0];
  }
  if (x > samples.length - 1) {
    return samples[samples.length - 1];
  }
  throw new Error("Cannot extrapolate inside the domain");
}

import { getWindow } from "../sampling";

export function linearInterpolator(
  x: number,
  samples: readonly number[]
): number {
  const x0 = Math.floor(x);
  const t = x - x0;
  const [a, b] = getWindow(x0, samples, 2);
  return a + t * (b - a);
}

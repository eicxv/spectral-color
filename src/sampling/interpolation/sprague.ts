import { linearCombination, powerSeries } from "../../utils/utils";
import { getWindow } from "../sampling";

function spragueExtrapolate(i: number, samples: readonly number[]): number {
  const n = samples.length;
  if (i < -2 || i > n + 1) {
    throw new Error("Out of extrapolation domain");
  }
  const coefficients = [
    [884, -1960, 3033, -2648, 1080, -180],
    [508, -540, 488, -367, 144, -24],
  ];
  const mult = 1 / 209;
  const window = i < 0 ? samples.slice(0, 6) : samples.slice(n - 6).reverse();
  const c = coefficients[i === -1 || i === n ? 1 : 0];
  return linearCombination(window, c) * mult;
}

function aCoefficients(window: number[]): number[] {
  const coefficients = [
    [0, 0, 24, 0, 0, 0],
    [2, -16, 0, 16, -2, 0],
    [-1, 16, -30, 16, -1, 0],
    [-9, 39, -70, 66, -33, 7],
    [13, -64, 126, -124, 61, -12],
    [-5, 25, -50, 50, -25, 5],
  ];
  const mult = 1 / 24;
  const a = coefficients.map((c) => linearCombination(c, window) * mult);
  return a;
}

export function spragueInterpolator(x: number, samples: readonly number[]): number {
  const x0 = Math.floor(x);
  const t = x - x0;
  const w = getWindow(x0, samples, 6, spragueExtrapolate);
  const a = aCoefficients(w);
  return linearCombination(powerSeries(t, 6), a);
}

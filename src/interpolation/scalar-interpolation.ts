import { linearCombination, powerSeries } from "../utils/utils";
import { createExtrapolator, ExtrapolatorType } from "./boundary-extrapolation";
import { BaseInterpolator } from "./interpolation";

export class NearestNeighbor extends BaseInterpolator {
  windowSize = 2;

  protected evaluate(window: number[], t: number): number {
    const [a, b] = window;
    return t < 0.5 ? a : b;
  }
}

export class Linear extends BaseInterpolator {
  windowSize = 2;

  protected evaluate(window: number[], t: number): number {
    const [a, b] = window;
    return a + t * (b - a);
  }
}

function spragueExtrapolate(samples: readonly number[], i: number): number {
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

export class Sprague extends BaseInterpolator {
  windowSize = 6;
  extrapolatedSamples: ExtrapolatorType;

  private static readonly coefficients = [
    [0, 0, 24, 0, 0, 0],
    [2, -16, 0, 16, -2, 0],
    [-1, 16, -30, 16, -1, 0],
    [-9, 39, -70, 66, -33, 7],
    [13, -64, 126, -124, 61, -12],
    [-5, 25, -50, 50, -25, 5],
  ];
  private static readonly mult = 1 / 24;

  constructor(samples: readonly number[]) {
    super(samples);
    this.validate();
    this.extrapolatedSamples = createExtrapolator(
      this.samples,
      spragueExtrapolate
    );
  }

  private validate(): void {
    if (this.samples.length < 6) {
      throw new Error(
        `SpragueInterpolator requires at least 6 samples, got ${this.samples.length}`
      );
    }
  }

  private aCoefficients(window: number[]): number[] {
    const coefficients = Sprague.coefficients;
    const mult = Sprague.mult;
    const a = coefficients.map((c) => linearCombination(c, window) * mult);
    return a;
  }

  evaluate(window: number[], t: number): number {
    // clear cached extrapolation in case samples changed
    this.extrapolatedSamples.clear();
    const a = this.aCoefficients(window);
    const x = powerSeries(t, 6);
    return linearCombination(a, x);
  }
}

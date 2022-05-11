import { Shape } from "../spectral-distribution/shape";
import { linearCombination, powerSeries, range } from "../utils/utils";

export interface Interpolator<T extends number | number[]> {
  samples: Readonly<Array<T>>;
  shape: Shape;
  sampleAt(x: number): T;
}

abstract class BaseInterpolator implements Interpolator<number> {
  samples: readonly number[];
  shape: Shape;
  extrapolatedSamples?: Record<number, number>;
  protected abstract windowSize: number;

  constructor(shape: Shape, samples: readonly number[]) {
    this.shape = shape;
    this.samples = samples;
  }

  protected abstract evaluate(window: number[], t: number): number;

  protected toArrayDomain(x: number): number {
    const { start, end, interval } = this.shape;
    if (x < start || x > end) {
      throw new Error(
        `Cannot interpolate outside domain: x = ${x}, domain = [${start}, ${end}]`
      );
    }
    return (x - start) / interval;
  }

  protected window(x0: number): number[] {
    const indices = range(x0 - (this.windowSize / 2 - 1), this.windowSize);
    return indices.map((i) => this.samples[i] ?? this.extrapolatedSamples?.[i]);
  }

  sampleAt(x: number): number {
    x = this.toArrayDomain(x);
    // guard against floating point errors, out of domain already checked
    if (x <= 0) {
      return this.samples[0];
    }
    if (x >= this.samples.length - 1) {
      return this.samples[this.samples.length - 1];
    }

    const x0 = Math.floor(x);
    const t = x - x0;

    const w = this.window(x0);
    return this.evaluate(w, t);
  }
}

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

export class Sprague extends BaseInterpolator {
  windowSize = 6;
  private static readonly boundaryCoefficients = [
    [884, -1960, 3033, -2648, 1080, -180],
    [508, -540, 488, -367, 144, -24],
  ];
  private static readonly boundaryMult = 1 / 209;
  private static readonly evalCoefficients = [
    [0, 0, 24, 0, 0, 0],
    [2, -16, 0, 16, -2, 0],
    [-1, 16, -30, 16, -1, 0],
    [-9, 39, -70, 66, -33, 7],
    [13, -64, 126, -124, 61, -12],
    [-5, 25, -50, 50, -25, 5],
  ];
  private static readonly evalMult = 1 / 24;

  constructor(shape: Shape, samples: readonly number[]) {
    super(shape, samples);
    this.validate();
    this.extrapolatedSamples = this.extrapolateEnds(samples);
  }

  private validate(): void {
    if (this.samples.length < 6) {
      throw new Error(
        `SpragueInterpolator requires at least 6 samples, got ${this.samples.length}`
      );
    }
  }

  private extrapolateEnds(samples: readonly number[]): Record<number, number> {
    const n = this.samples.length;
    const first = samples.slice(0, 6);
    const last = samples.slice(n - 6).reverse();
    const coefficients = Sprague.boundaryCoefficients;
    const mult = Sprague.boundaryMult;
    const ends = {
      [-1]: linearCombination(first, coefficients[1]) * mult,
      [-2]: linearCombination(first, coefficients[0]) * mult,
      [n]: linearCombination(last, coefficients[1]) * mult,
      [n + 1]: linearCombination(last, coefficients[0]) * mult,
    };
    return ends;
  }

  private aCoefficients(window: number[]): number[] {
    const coefficients = Sprague.evalCoefficients;
    const mult = Sprague.evalMult;
    const a = coefficients.map((c) => linearCombination(c, window) * mult);
    return a;
  }

  evaluate(window: number[], t: number): number {
    const a = this.aCoefficients(window);
    const x = powerSeries(t, 6);
    return linearCombination(a, x);
  }
}

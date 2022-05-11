import { SpectralShape } from "../spectral-shape";

function range(start: number, n: number, interval = 1): number[] {
  return Array.from(new Array(n), (_, i) => i * interval + start);
}

function linComb(a: number[], b: number[]): number {
  return a.reduce((acc, e, i) => acc + e * b[i], 0);
}

function powerSeries(x: number, n: number): number[] {
  return Array.from(new Array(n), (_, i) => x ** i);
}

export interface IInterpolator {
  samples: number[];
  shape: SpectralShape;
  sampleAt(x: number): number;
}

abstract class BaseInterpolator implements IInterpolator {
  samples: Array<number>;
  shape: SpectralShape;
  extrapolatedSamples?: Record<number, number>;
  protected abstract windowSize: number;

  constructor(shape: SpectralShape, samples: Array<number>) {
    this.shape = shape;
    this.samples = samples;
  }

  protected abstract evaluate(window: number[], t: number): number;

  protected toArrayDomain(x: number): number {
    const { start, end, interval } = this.shape;
    if (x < 0 || x > end) {
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

export class NearestNeighborInterpolator extends BaseInterpolator {
  windowSize = 2;

  protected evaluate(window: number[], t: number): number {
    const [a, b] = window;
    return t < 0.5 ? a : b;
  }
}

export class LinearInterpolator extends BaseInterpolator {
  windowSize = 2;

  protected evaluate(window: number[], t: number): number {
    const [a, b] = window;
    return a + t * (b - a);
  }
}

export class SpragueInterpolator extends BaseInterpolator {
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

  constructor(shape: SpectralShape, samples: Array<number>) {
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

  private extrapolateEnds(samples: number[]): Record<number, number> {
    const n = this.samples.length;
    const first = samples.slice(0, 6);
    const last = samples.slice(n - 6).reverse();
    const coefficients = SpragueInterpolator.boundaryCoefficients;
    const mult = SpragueInterpolator.boundaryMult;
    const ends = {
      [-1]: linComb(first, coefficients[1]) * mult,
      [-2]: linComb(first, coefficients[0]) * mult,
      [n]: linComb(last, coefficients[1]) * mult,
      [n + 1]: linComb(last, coefficients[0]) * mult,
    };
    return ends;
  }

  private aCoefficients(window: number[]): number[] {
    const coefficients = SpragueInterpolator.evalCoefficients;
    const mult = SpragueInterpolator.evalMult;
    const a = coefficients.map((c) => linComb(c, window) * mult);
    return a;
  }

  evaluate(window: number[], t: number): number {
    const a = this.aCoefficients(window);
    const x = powerSeries(t, 6);
    return linComb(a, x);
  }
}

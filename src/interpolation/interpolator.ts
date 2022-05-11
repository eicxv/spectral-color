import { SpectralShape } from "../spectral-shape";

function range(start: number, n: number, interval = 1): number[] {
  return Array.from(new Array(n), (_, i) => i * interval + start);
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
  abstract windowSize: number;

  constructor(shape: SpectralShape, samples: Array<number>) {
    this.shape = shape;
    this.samples = samples;
  }

  protected abstract evaluate(window: number[], t: number): number;

  toShape(x: number): number {
    const { start, end, interval } = this.shape;
    if (x < 0 || x > end) {
      throw new Error(
        `Cannot interpolate outside domain: x = ${x}, domain = [${start}, ${end}]`
      );
    }
    return (x - start) / interval;
  }

  sampleAt(x: number): number {
    x = this.toShape(x);
    // guard against floating point errors, out of domain already checked
    if (x <= 0) {
      return this.samples[0];
    }
    if (x >= this.samples.length - 1) {
      return this.samples[this.samples.length - 1];
    }

    const x0 = Math.floor(x);
    const t = x - x0;
    const indices = range(x0 - (this.windowSize / 2 - 1), this.windowSize);
    const window = indices.map(
      (i) => this.samples[i] ?? this.extrapolatedSamples?.[i]
    );
    return this.evaluate(window, t);
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

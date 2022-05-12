import { Shape } from "../spectral-distribution/shape";
import { rangeMap } from "../utils/utils";
import { ExtrapolatorType } from "./boundary-extrapolation";

export interface Interpolator<T extends number | number[]> {
  samples: Readonly<Array<T>>;
  shape: Shape;
  sampleAt(x: number[]): T[];
  sampleAt(x: number): T;
  sampleAt(x: number | number[]): T | T[];
}

export abstract class BaseInterpolator implements Interpolator<number> {
  samples: readonly number[];
  shape: Shape;
  extrapolatedSamples?: ExtrapolatorType;
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
    return rangeMap(
      (i) => this.samples[i] ?? this.extrapolatedSamples?.[i],
      x0 - (this.windowSize / 2 - 1),
      this.windowSize
    );
  }

  sampleAt(x: number[]): number[];
  sampleAt(x: number): number;
  sampleAt(x: number | number[]): number | number[];
  sampleAt(x: number | number[]): number | number[] {
    if (Array.isArray(x)) {
      return x.map((x) => this._sampleAt(x));
    }
    return this._sampleAt(x);
  }

  _sampleAt(x: number): number {
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

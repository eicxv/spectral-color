import { mapRange } from "../utils/utils";
import { ExtrapolatorType } from "./boundary-extrapolation";

export interface Interpolator<T extends number | number[]> {
  samples: readonly T[];
  sampleAt(x: number[]): T[];
  sampleAt(x: number): T;
  sampleAt(x: number | number[]): T | T[];
}

export abstract class BaseInterpolator implements Interpolator<number> {
  samples: readonly number[];
  extrapolatedSamples?: ExtrapolatorType;
  protected abstract windowSize: number;

  constructor(samples: readonly number[]) {
    this.samples = samples;
  }

  protected abstract evaluate(window: number[], t: number): number;

  protected window(x0: number): number[] {
    return mapRange(
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
    if (x < 0 || x > this.samples.length - 1) {
      throw new Error(
        `Cannot interpolate outside domain: x = ${x}, domain = [0, ${
          this.samples.length - 1
        }]`
      );
    }
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

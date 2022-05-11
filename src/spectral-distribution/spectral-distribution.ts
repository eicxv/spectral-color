import { rangeMap } from "../utils/utils";
import { Shape } from "./shape";

export enum Interpolation {
  Linear,
  Nearest,
  Sprague,
}

export interface ISpectralDistribution<T> {
  shape: Shape;
  [Symbol.iterator](): IterableIterator<[number, T]>;
  wavelengths(): IterableIterator<number>;
  samples(): IterableIterator<T>;
  sampleAt(wavelength: number, interp: Interpolation): T | null;
  sum(): T;
  zipWith<OtherT>(
    other: ISpectralDistribution<OtherT>,
    fun: (a: T, b: OtherT) => number,
    interp?: Interpolation
  ): ISpectralDistribution<number>;
  zipWith<OtherT>(
    other: ISpectralDistribution<OtherT>,
    fun: (a: T, b: OtherT) => number[],
    interp?: Interpolation
  ): ISpectralDistribution<number[]>;
  map(fun: (a: T) => number): ISpectralDistribution<number>;
  map(fun: (a: T) => number[]): ISpectralDistribution<number[]>;
}

abstract class BaseSpectralDistribution<T> implements ISpectralDistribution<T> {
  shape: Shape;
  protected _samples: Array<T>;

  constructor(shape: Shape, samples: Array<T>);
  constructor(span: [number, number], interval: number, samples: Array<T>);
  constructor(start: number, interval: number, samples: Array<T>);
  constructor(
    shapeSpanOrStart: number | [number, number] | Shape,
    samplesOrInterval: number | Array<T>,
    samplesOrUndef?: Array<T>
  ) {
    this.shape = this.initShape(
      shapeSpanOrStart,
      samplesOrInterval,
      samplesOrUndef
    );
    this._samples = samplesOrUndef ?? (samplesOrInterval as Array<T>);
    this.validateSampleCount();
  }

  static fromFunction(
    f: (x: number) => number | number[],
    shape: Shape
  ): ISpectralDistribution<number | number[]> {
    const n = Math.round((shape.end - shape.start) / shape.interval);
    const samples = rangeMap(f, shape.start, n, shape.interval);
    if (Array.isArray(samples[0])) {
      return new MultiSpectralDistribution(shape, samples as number[][]);
    } else {
      return new SpectralDistribution(shape, samples as number[]);
    }
  }

  private validateSampleCount(): void {
    const { start, end, interval } = this.shape;
    const sampleCount = this._samples.length;
    if (Math.round((end - start) / interval) !== sampleCount - 1) {
      throw new Error("Sample count does not match shape");
    }
  }

  private initShape(
    shapeSpanOrStart: number | [number, number] | Shape,
    samplesOrInterval: number | Array<T>,
    samplesOrUndef?: Array<T>
  ): Shape {
    if (shapeSpanOrStart instanceof Shape) {
      return shapeSpanOrStart;
    }
    if (Array.isArray(shapeSpanOrStart)) {
      const span = shapeSpanOrStart;
      const interval = samplesOrInterval as number;
      return new Shape(span, interval);
    } else {
      const start = shapeSpanOrStart;
      const interval = samplesOrInterval as number;
      const samples = samplesOrUndef as Array<T>;
      const end = start + (samples.length - 1) * interval;
      return new Shape(start, end, interval);
    }
  }

  *[Symbol.iterator](): IterableIterator<[number, T]> {
    const wl = this.wavelengths();
    for (const v of this.samples()) {
      yield [wl.next().value, v];
    }
  }

  *wavelengths(): IterableIterator<number> {
    const { start, interval } = this.shape;
    for (let i = 0; i < this._samples.length; i++) {
      yield start + i * interval;
    }
  }

  samples(): IterableIterator<T> {
    return this._samples[Symbol.iterator]();
  }

  protected abstract lerp(a: T, b: T, t: number): T;

  sampleAt(wavelength: number, interp: Interpolation): T | null {
    const { start, interval } = this.shape;
    const i = (wavelength - start) / interval;
    if (interp === Interpolation.Nearest) {
      return this._samples[Math.round(i)] ?? null;
    } else {
      const i0 = Math.floor(i);
      const t = i - i0;
      const v0 = this._samples[i0];
      const v1 = this._samples[Math.ceil(i)];
      if (v0 !== undefined && v1 !== undefined) {
        return this.lerp(v0, v1, t);
      }
      return v0 ?? v1 ?? null;
    }
  }

  protected createNew(
    span: [number, number],
    interval: number,
    samples: Array<number | number[]>
  ): ISpectralDistribution<number | number[]> {
    if (Array.isArray(samples[0])) {
      return new MultiSpectralDistribution(
        span,
        interval,
        samples as number[][]
      );
    } else {
      return new SpectralDistribution(span, interval, samples as number[]);
    }
  }

  zipWith<OtherT>(
    other: ISpectralDistribution<OtherT>,
    fun: (a: T, b: OtherT) => number,
    interp?: Interpolation
  ): ISpectralDistribution<number>;
  zipWith<OtherT>(
    other: ISpectralDistribution<OtherT>,
    fun: (a: T, b: OtherT) => number[],
    interp?: Interpolation
  ): ISpectralDistribution<number[]>;
  zipWith(
    other: ISpectralDistribution<number | number[]>,
    fun: (a: T, b: number | number[]) => number | number[],
    interp = Interpolation.Linear
  ): ISpectralDistribution<number | number[]> {
    const samples = [];
    let start: number | null = null;
    let end = 0;
    for (const [wl, v1] of this) {
      const v2 = other.sampleAt(wl, interp);
      if (v2 === null) {
        continue;
      }
      start ??= wl;
      end = wl;
      samples.push(fun(v1, v2));
    }
    if (start === null) {
      throw new Error("Degenerate spectrum");
    }
    return this.createNew([start, end], this.shape.interval, samples);
  }

  map(f: (v: T) => number): ISpectralDistribution<number>;
  map(f: (v: T) => number[]): ISpectralDistribution<number[]>;
  map(
    f: (v: T) => number | number[]
  ): ISpectralDistribution<number | number[]> {
    const samples = this._samples.map(f);
    return this.createNew(this.shape.span, this.shape.interval, samples);
  }

  abstract sum(): T;
}

export class SpectralDistribution extends BaseSpectralDistribution<number> {
  protected lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  sum(): number {
    const samples = this._samples as number[];
    const reducer = (acc: number, v: number): number => acc + v;
    return samples.reduce(reducer, 0);
  }
}

export class MultiSpectralDistribution extends BaseSpectralDistribution<
  number[]
> {
  protected lerp(a: number[], b: number[], t: number): number[] {
    return a.map((a_, i) => a_ + t * (b[i] - a_));
  }

  sum(): number[] {
    const samples = this._samples as number[][];
    const reducer = (acc: number[], v: number[]): number[] =>
      acc.map((a, i) => a + v[i]);
    return samples.reduce(reducer, Array(this._samples[0].length).fill(0));
  }
}

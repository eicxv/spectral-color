import { Interpolator } from "../interpolation/interpolation";
import * as interp from "../interpolation/scalar-interpolation";
import * as vectorInterp from "../interpolation/vector-interpolation";
import { Shape } from "./shape";

export interface ISpectralDistribution<T> {
  shape: Shape;
  [Symbol.iterator](): IterableIterator<[number, T]>;
  wavelengths(): IterableIterator<number>;
  samples(): IterableIterator<T>;
  sampleAt(wavelength: number): T;
  sampleAt(wavelength: number[]): T[];
  sampleAt(wavelength: number | number[]): T | T[];
  sum(): T;
  zipWith<OtherT>(
    other: ISpectralDistribution<OtherT>,
    fun: (a: T, b: OtherT) => number
  ): ISpectralDistribution<number>;
  zipWith<OtherT>(
    other: ISpectralDistribution<OtherT>,
    fun: (a: T, b: OtherT) => number[]
  ): ISpectralDistribution<number[]>;
  map(fun: (a: T) => number): ISpectralDistribution<number>;
  map(fun: (a: T) => number[]): ISpectralDistribution<number[]>;
}

abstract class BaseSpectralDistribution<T extends number | number[]>
  implements ISpectralDistribution<T>
{
  shape: Shape;
  protected abstract interpolator: Interpolator<T>;
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

  private validateSampleCount(): void {
    const n = this._samples.length;
    const expected = this.shape.sampleCount();
    if (n !== expected) {
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

  setInterpolator(
    Interpolator: new (shape: Shape, samples: T[]) => Interpolator<T>
  ): void {
    this.interpolator = new Interpolator(this.shape, this._samples);
  }

  samples(): IterableIterator<T> {
    return this._samples[Symbol.iterator]();
  }

  sampleAt(wavelength: number): T;
  sampleAt(wavelength: number[]): T[];
  sampleAt(wavelength: number | number[]): T | T[];
  sampleAt(wavelength: number | number[]): T | T[] {
    return this.interpolator.sampleAt(wavelength);
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
    fun: (a: T, b: OtherT) => number
  ): ISpectralDistribution<number>;
  zipWith<OtherT>(
    other: ISpectralDistribution<OtherT>,
    fun: (a: T, b: OtherT) => number[]
  ): ISpectralDistribution<number[]>;
  zipWith(
    other: ISpectralDistribution<number | number[]>,
    fun: (a: T, b: number | number[]) => number | number[]
  ): ISpectralDistribution<number | number[]> {
    let wl = [...this.wavelengths()];
    wl = wl.filter(other.shape.isInDomain.bind(other.shape));
    if (wl.length === 0) {
      throw new Error("Degenerate spectrum");
    }
    const samples = wl.map((wavelength) => {
      const a = this.sampleAt(wavelength);
      const b = other.sampleAt(wavelength);
      return fun(a, b);
    });
    return this.createNew(
      [wl[0], wl[wl.length - 1]],
      this.shape.interval,
      samples
    );
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
  interpolator = new interp.Sprague(this.shape, this._samples);

  sum(): number {
    const samples = this._samples as number[];
    const reducer = (acc: number, v: number): number => acc + v;
    return samples.reduce(reducer, 0);
  }

  static fromFunction(
    f: (x: number) => number,
    shape: Shape
  ): SpectralDistribution {
    const samples = shape.mapWavelengths(f);
    return new SpectralDistribution(shape, samples);
  }
}

export class MultiSpectralDistribution extends BaseSpectralDistribution<
  number[]
> {
  interpolator = new vectorInterp.Sprague(this.shape, this._samples);

  sum(): number[] {
    const samples = this._samples as number[][];
    const reducer = (acc: number[], v: number[]): number[] =>
      acc.map((a, i) => a + v[i]);
    return samples.reduce(reducer, Array(this._samples[0].length).fill(0));
  }

  static fromFunction(
    f: (x: number) => number[],
    shape: Shape
  ): MultiSpectralDistribution {
    const samples = shape.mapWavelengths(f);
    return new MultiSpectralDistribution(shape, samples);
  }
}

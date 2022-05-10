import { SpectralShape } from "./spectral-shape";

export enum Interpolation {
  linear,
  nearest,
}

export interface ISpectralDistribution<T> {
  shape: SpectralShape;
  [Symbol.iterator](): IterableIterator<[number, T]>;
  wavelengths(): IterableIterator<number>;
  values(): IterableIterator<T>;
  valueAtWavelength(wavelength: number, interp: Interpolation): T | null;
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
  shape: SpectralShape;
  protected samples: Array<T>;

  constructor(shape: SpectralShape, values: Array<T>);
  constructor(span: [number, number], interval: number, values: Array<T>);
  constructor(start: number, interval: number, values: Array<T>);
  constructor(
    shapeSpanOrStart: number | [number, number] | SpectralShape,
    valuesOrInterval: number | Array<T>,
    valuesOrUndef?: Array<T>
  ) {
    this.shape = this.initShape(
      shapeSpanOrStart,
      valuesOrInterval,
      valuesOrUndef
    );
    this.samples = valuesOrUndef ?? (valuesOrInterval as Array<T>);
    this.validateSampleCount();
  }

  private validateSampleCount(): void {
    const { start, end, interval } = this.shape;
    const sampleCount = this.samples.length;
    if (Math.round((end - start) / interval) !== sampleCount - 1) {
      throw new Error("Sample count does not match shape");
    }
  }

  private initShape(
    shapeSpanOrStart: number | [number, number] | SpectralShape,
    valuesOrInterval: number | Array<T>,
    valuesOrUndef?: Array<T>
  ): SpectralShape {
    if (shapeSpanOrStart instanceof SpectralShape) {
      return shapeSpanOrStart;
    }
    if (Array.isArray(shapeSpanOrStart)) {
      const span = shapeSpanOrStart;
      const interval = valuesOrInterval as number;
      return new SpectralShape(span, interval);
    } else {
      const start = shapeSpanOrStart;
      const interval = valuesOrInterval as number;
      const values = valuesOrUndef as Array<T>;
      const end = start + (values.length - 1) * interval;
      return new SpectralShape(start, end, interval);
    }
  }

  *[Symbol.iterator](): IterableIterator<[number, T]> {
    const wl = this.wavelengths();
    for (const v of this.values()) {
      yield [wl.next().value, v];
    }
  }

  *wavelengths(): IterableIterator<number> {
    const { start, interval } = this.shape;
    for (let i = 0; i < this.samples.length; i++) {
      yield start + i * interval;
    }
  }

  values(): IterableIterator<T> {
    return this.samples[Symbol.iterator]();
  }

  protected abstract lerp(a: T, b: T, t: number): T;

  valueAtWavelength(wavelength: number, interp: Interpolation): T | null {
    const { start, interval } = this.shape;
    const i = (wavelength - start) / interval;
    if (interp === Interpolation.nearest) {
      return this.samples[Math.round(i)] ?? null;
    } else {
      const i0 = Math.floor(i);
      const t = i - i0;
      const v0 = this.samples[i0];
      const v1 = this.samples[Math.ceil(i)];
      if (v0 !== undefined && v1 !== undefined) {
        return this.lerp(v0, v1, t);
      }
      return v0 ?? v1 ?? null;
    }
  }

  protected createNew(
    span: [number, number],
    interval: number,
    values: Array<number | number[]>
  ): ISpectralDistribution<number | number[]> {
    if (Array.isArray(values[0])) {
      return new MultiSpectralDistribution(
        span,
        interval,
        values as number[][]
      );
    } else {
      return new SpectralDistribution(span, interval, values as number[]);
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
    interp = Interpolation.linear
  ): ISpectralDistribution<number | number[]> {
    const values = [];
    let start: number | null = null;
    let end = 0;
    for (const [wl, v1] of this) {
      const v2 = other.valueAtWavelength(wl, interp);
      if (v2 === null) {
        continue;
      }
      start ??= wl;
      end = wl;
      values.push(fun(v1, v2));
    }
    if (start === null) {
      throw new Error("Degenerate spectrum");
    }
    return this.createNew([start, end], this.shape.interval, values);
  }

  map(f: (v: T) => number): ISpectralDistribution<number>;
  map(f: (v: T) => number[]): ISpectralDistribution<number[]>;
  map(
    f: (v: T) => number | number[]
  ): ISpectralDistribution<number | number[]> {
    const values = this.samples.map(f);
    return this.createNew(this.shape.span, this.shape.interval, values);
  }

  abstract sum(): T;
}

export class SpectralDistribution extends BaseSpectralDistribution<number> {
  protected lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  sum(): number {
    const values = this.samples as number[];
    const reducer = (acc: number, v: number): number => acc + v;
    return values.reduce(reducer, 0);
  }
}

export class MultiSpectralDistribution extends BaseSpectralDistribution<
  number[]
> {
  protected lerp(a: number[], b: number[], t: number): number[] {
    return a.map((a_, i) => a_ + t * (b[i] - a_));
  }

  sum(): number[] {
    const values = this.samples as number[][];
    const reducer = (acc: number[], v: number[]): number[] =>
      acc.map((a, i) => a + v[i]);
    return values.reduce(reducer, Array(this.samples[0].length).fill(0));
  }
}

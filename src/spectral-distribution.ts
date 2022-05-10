export enum Interpolation {
  linear,
  nearest,
}

export interface ISpectralDistribution<T> {
  span: [number, number]; // first and last wavelengths of distribution [nm]
  interval: number; // [nm]
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
  protected start: number;
  protected end: number;
  interval: number;
  protected _values: Array<T>;
  constructor(
    spanOrStart: number | [number, number],
    interval: number,
    values: Array<T>
  ) {
    if (Array.isArray(spanOrStart)) {
      [this.start, this.end] = spanOrStart;
    } else {
      this.start = spanOrStart;
      this.end = this.start + (values.length - 1) * interval;
    }
    this.interval = interval;
    this._values = values;
    this.validateLength();
  }

  private validateLength(): void {
    const span = this.span;
    const values = this._values;
    const interval = this.interval;
    if (values.length === 0) {
      throw new Error("values must not be empty");
    }
    if (span[1] - span[0] !== (values.length - 1) * interval) {
      throw new Error("span and interval do not match number of values");
    }
  }
  *[Symbol.iterator](): IterableIterator<[number, T]> {
    const wl = this.wavelengths();
    for (const v of this.values()) {
      yield [wl.next().value, v];
    }
  }

  get span(): [number, number] {
    return [this.start, this.end];
  }

  *wavelengths(): IterableIterator<number> {
    for (let i = 0; i < this._values.length; i++) {
      yield this.start + i * this.interval;
    }
  }

  values(): IterableIterator<T> {
    return this._values[Symbol.iterator]();
  }

  protected abstract lerp(a: T, b: T, t: number): T;

  valueAtWavelength(wavelength: number, interp: Interpolation): T | null {
    const i = (wavelength - this.start) / this.interval;
    if (interp === Interpolation.nearest) {
      return this._values[Math.round(i)] ?? null;
    } else {
      const i0 = Math.floor(i);
      const t = i - i0;
      const v0 = this._values[i0];
      const v1 = this._values[Math.ceil(i)];
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
    return this.createNew([start, end], this.interval, values);
  }

  map(f: (v: T) => number): ISpectralDistribution<number>;
  map(f: (v: T) => number[]): ISpectralDistribution<number[]>;
  map(
    f: (v: T) => number | number[]
  ): ISpectralDistribution<number | number[]> {
    const values = this._values.map(f);
    return this.createNew(this.span, this.interval, values);
  }

  abstract sum(): T;
}

export class SpectralDistribution extends BaseSpectralDistribution<number> {
  constructor(
    spanOrStart: number | [number, number],
    interval: number,
    values: number[]
  ) {
    super(spanOrStart, interval, values);
  }

  protected lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  sum(): number {
    const values = this._values as number[];
    const reducer = (acc: number, v: number): number => acc + v;
    return values.reduce(reducer, 0);
  }
}

export class MultiSpectralDistribution extends BaseSpectralDistribution<
  number[]
> {
  constructor(
    spanOrStart: number | [number, number],
    interval: number,
    values: number[][]
  ) {
    super(spanOrStart, interval, values);
  }

  protected lerp(a: number[], b: number[], t: number): number[] {
    return a.map((a_, i) => a_ + t * (b[i] - a_));
  }

  sum(): number[] {
    const values = this._values as number[][];
    const reducer = (acc: number[], v: number[]): number[] =>
      acc.map((a, i) => a + v[i]);
    return values.reduce(reducer, Array(this._values[0].length).fill(0));
  }
}

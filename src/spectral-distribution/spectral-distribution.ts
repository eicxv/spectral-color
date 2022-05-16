import { nearestExtrapolator } from "../sampling/extrapolation/nearest";
import { linearInterpolator } from "../sampling/interpolation/linear";
import { spragueInterpolator } from "../sampling/interpolation/sprague";
import { composeSampler, Extrapolator, Interpolator, Sampler } from "../sampling/sampling";
import {
  add,
  broadcastBinaryOperator,
  BroadcastResult,
  divide,
  multiply,
  SampleType,
  subtract,
} from "./operators";
import { Shape } from "./shape";

type DistributedArray<T> = T extends any ? T[] : never;
export type SampleT = number | number[];

interface SpectralDistributionConfig<T extends SampleT> {
  shape: Shape;
  samples: DistributedArray<T>;
  interpolator?: Interpolator;
  extrapolator?: Extrapolator;
}

export class SpectralDistribution<T extends SampleT> {
  shape: Shape;
  samples: DistributedArray<T>;
  protected interpolator: Interpolator;
  protected extrapolator: Extrapolator;
  protected sampler: Sampler;

  constructor(config: SpectralDistributionConfig<T>) {
    this.shape = config.shape;
    this.samples = config.samples;
    this.validate();
    this.interpolator = config.interpolator ?? this.defaultInterpolator();
    this.extrapolator = config.extrapolator ?? this.defaultExtrapolator();
    this.sampler = composeSampler(this.interpolator, this.extrapolator);
  }

  private validate(): void {
    if (this.samples.length == 0) {
      throw new Error("Must have at least one sample");
    }
    if (this.samples.length !== this.shape.count) {
      throw new Error("Sample count does not match shape");
    }
  }

  get type(): SampleType {
    return Array.isArray(this.samples[0]) ? SampleType.Vector : SampleType.Scalar;
  }

  get channels(): number | null {
    return Array.isArray(this.samples[0]) ? this.samples[0].length : null;
  }

  private defaultInterpolator(): Interpolator {
    return this.samples.length >= 6 ? spragueInterpolator : linearInterpolator;
  }

  private defaultExtrapolator(): Extrapolator {
    return nearestExtrapolator;
  }

  protected toArrayDomain(wavelength: number): number;
  protected toArrayDomain(wavelengths: number[]): number[];
  protected toArrayDomain(wavelength: SampleT): SampleT;
  protected toArrayDomain(wavelength: SampleT): SampleT {
    if (Array.isArray(wavelength)) {
      return wavelength.map((w) => this.toArrayDomain(w));
    }
    return (wavelength - this.shape.start) / this.shape.interval;
  }

  sampleAt<U extends SampleT>(wavelength: U): U extends number ? T : DistributedArray<T> {
    const wl = this.toArrayDomain(wavelength);
    return this.sampler(wl, this.samples) as U extends number ? T : DistributedArray<T>;
  }

  resample(shape: Shape): SpectralDistribution<T> {
    const interpolator = this.interpolator;
    const extrapolator = this.extrapolator;
    const samples = this.sampleAt(shape.wavelengths());
    return new SpectralDistribution({
      shape,
      samples,
      interpolator,
      extrapolator,
    });
  }

  combine<OtherT extends SampleT, OutT extends SampleT>(
    other: SpectralDistribution<OtherT>,
    f: (a: T, b: OtherT) => OutT
  ): SpectralDistribution<OutT> {
    const shape = this.shape;
    const otherSamples = other.sampleAt(shape.wavelengths());
    const newSamples = this.samples.map((sample, i) =>
      f(sample as T, otherSamples[i] as OtherT)
    ) as DistributedArray<OutT>;
    return new SpectralDistribution<OutT>({
      shape,
      samples: newSamples,
      interpolator: this.interpolator,
      extrapolator: this.extrapolator,
    });
  }

  map<OutT extends SampleT>(f: (x: T) => OutT): SpectralDistribution<OutT> {
    const newSamples = this.samples.map((sample) => f(sample as T)) as DistributedArray<OutT>;
    return new SpectralDistribution<OutT>({
      shape: this.shape,
      samples: newSamples,
      interpolator: this.interpolator,
      extrapolator: this.extrapolator,
    });
  }

  reduce<OutT>(f: (acc: OutT, x: T, i: number, arr: T[]) => OutT, initial: OutT): OutT {
    const samples = this.samples as T[];
    return samples.reduce(f, initial);
  }

  sum(): T {
    if (Array.isArray(this.samples[0])) {
      const samples = this.samples as number[][];
      const sum = new Array(this.samples[0].length).fill(0);
      for (const sample of samples) {
        for (let i = 0; i < sample.length; i++) {
          sum[i] += sample[i];
        }
      }
      return sum as T;
    }
    const samples = this.samples as number[];
    const reducer = (a: number, b: number): number => a + b;
    return samples.reduce(reducer, 0) as T;
  }

  add<OtherT extends SampleT>(
    other: SpectralDistribution<OtherT>
  ): SpectralDistribution<BroadcastResult<T, OtherT>> {
    return this.broadcastBinaryOperator(other, add);
  }

  subtract<OtherT extends SampleT>(
    other: SpectralDistribution<OtherT>
  ): SpectralDistribution<BroadcastResult<T, OtherT>> {
    return this.broadcastBinaryOperator(other, subtract);
  }

  multiply<OtherT extends SampleT>(
    other: SpectralDistribution<OtherT>
  ): SpectralDistribution<BroadcastResult<T, OtherT>> {
    return this.broadcastBinaryOperator(other, multiply);
  }

  divide<OtherT extends SampleT>(
    other: SpectralDistribution<OtherT>
  ): SpectralDistribution<BroadcastResult<T, OtherT>> {
    return this.broadcastBinaryOperator(other, divide);
  }

  broadcastBinaryOperator<OtherT extends SampleT>(
    other: SpectralDistribution<OtherT> | SampleT,
    operator: (a: number, b: number) => number
  ): SpectralDistribution<BroadcastResult<T, OtherT>>;
  broadcastBinaryOperator(
    other: SpectralDistribution<SampleT> | SampleT,
    operator: (a: number, b: number) => number
  ): SpectralDistribution<SampleT> {
    const f = broadcastBinaryOperator(operator, this, other);
    if (!(other instanceof SpectralDistribution)) {
      const fUnary = (a: T): BroadcastResult<T, typeof other> => f(a, other);
      return this.map(fUnary);
    }
    return this.combine(other, f as (a: T, b: SampleT) => SampleT);
  }

  static fromFunction<U extends SampleT>(f: (x: number) => U, shape: Shape): SpectralDistribution<U> {
    const samples = shape.map(f) as DistributedArray<U>;
    return new SpectralDistribution({ shape, samples });
  }
}

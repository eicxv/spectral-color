import { nearestExtrapolator } from "../sampling/extrapolation/nearest";
import { linearInterpolator } from "../sampling/interpolation/linear";
import { spragueInterpolator } from "../sampling/interpolation/sprague";
import { composeSampler, Extrapolator, Interpolator, Sampler } from "../sampling/sampling";
import { add } from "./operators";
import { Shape } from "./shape";

type DistributedArray<T> = T extends any ? T[] : never;

interface SpectralDistributionConfig<T extends number | number[]> {
  shape: Shape;
  samples: DistributedArray<T>;
  interpolator?: Interpolator;
  extrapolator?: Extrapolator;
}

export class SpectralDistribution<T extends number | number[]> {
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
    if (this.samples.length !== this.shape.sampleCount()) {
      throw new Error("Sample count does not match shape");
    }
  }

  private defaultInterpolator(): Interpolator {
    return this.samples.length >= 6 ? spragueInterpolator : linearInterpolator;
  }

  private defaultExtrapolator(): Interpolator {
    return nearestExtrapolator;
  }

  protected toArrayDomain(wavelength: number): number;
  protected toArrayDomain(wavelengths: number[]): number[];
  protected toArrayDomain(wavelength: number | number[]): number | number[];
  protected toArrayDomain(wavelength: number | number[]): number | number[] {
    if (Array.isArray(wavelength)) {
      return wavelength.map((w) => this.toArrayDomain(w));
    }
    return (wavelength - this.shape.start) / this.shape.interval;
  }

  sampleAt<U extends number | number[]>(wavelength: U): U extends number ? T : DistributedArray<T> {
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

  combine<U extends number | number[]>(
    other: SpectralDistribution<U>,
    f: (a: T, b: U) => number
  ): SpectralDistribution<number>;
  combine<U extends number | number[]>(
    other: SpectralDistribution<U>,
    f: (a: T, b: U) => number[]
  ): SpectralDistribution<number[]>;
  combine<U extends number | number[]>(
    other: SpectralDistribution<U>,
    f: (a: T, b: U) => number | number[]
  ): SpectralDistribution<number | number[]> {
    const shape = this.shape;
    const otherSamples = other.sampleAt(shape.wavelengths());
    const newSamples = this.samples.map((sample, i) =>
      f(sample as T, otherSamples[i] as U)
    ) as DistributedArray<number | number[]>;
    return new SpectralDistribution<number | number[]>({
      shape,
      samples: newSamples,
      interpolator: this.interpolator,
      extrapolator: this.extrapolator,
    });
  }

  map(f: (x: T) => number): SpectralDistribution<number>;
  map(f: (x: T) => number[]): SpectralDistribution<number[]>;
  map(f: (x: T) => number | number[]): SpectralDistribution<number | number[]> {
    const newSamples = this.samples.map((sample) => f(sample as T)) as DistributedArray<number | number[]>;
    return new SpectralDistribution<number | number[]>({
      shape: this.shape,
      samples: newSamples,
      interpolator: this.interpolator,
      extrapolator: this.extrapolator,
    });
  }

  sum(): T {
    if (Array.isArray(this.samples[0])) {
      const samples = this.samples as number[][];
      return samples.reduce(add.vector.vector, new Array(this.samples[0].length).fill(0)) as T;
    }
    const samples = this.samples as number[];
    return samples.reduce(add.scalar.scalar, 0) as T;
  }

  static fromFunction<U extends number | number[]>(
    f: (x: number) => U,
    shape: Shape
  ): SpectralDistribution<U> {
    const samples = shape.mapWavelengths(f) as DistributedArray<U>;
    return new SpectralDistribution({ shape, samples });
  }
}

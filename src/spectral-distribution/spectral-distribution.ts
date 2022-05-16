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

/**
 * Spectral distribution config
 * @typeParam T - The type of the samples.
 */
interface SpectralDistributionConfig<T extends SampleT> {
  /** {@inheritDoc SpectralDistribution.shape} */
  shape: Shape;
  /** {@inheritDoc SpectralDistribution.samples} */
  samples: DistributedArray<T>;
  /** {@inheritDoc SpectralDistribution.interpolator} */
  interpolator?: Interpolator;
  /** {@inheritDoc SpectralDistribution.extrapolator} */
  extrapolator?: Extrapolator;
}

/**
 * Spectral distribution.
 *
 * Represents a discrete spectral distribution.
 */
export class SpectralDistribution<T extends SampleT> {
  /**
   * Spectral distribution config
   * @typeParam T - The type of the samples.
   */
  shape: Shape;
  /**
   * Samples.
   * Array of numbers for a single distribution such as a spectral power distribution,
   * array of arrays for a multi-spectral distribution such as colour matching functions.
   * Length must match `shape.count`
   *
   * @typeParam T - The type of the samples.
   */
  samples: DistributedArray<T>;
  /**
   * Interpolation method
   * @defaultValue `spragueInterpolator` if `shape.count` is greater than 5 otherwise `linearInterpolator`
   */
  protected interpolator: Interpolator;
  /**
   * Extrapolation method
   * @defaultValue `nearestExtrapolator`
   */
  protected extrapolator: Extrapolator;
  /**
   * Sampler composed of interpolator and extrapolator.
   */
  protected sampler: Sampler;

  /**
   * Creates a spectral distribution instance.
   * @param config - Spectral distribution config.
   */
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

  /**
   * Gets type of the samples.
   * @see {@link SampleType}
   *
   * @returns Sample type.
   */
  get type(): SampleType {
    return Array.isArray(this.samples[0]) ? SampleType.Vector : SampleType.Scalar;
  }

  /**
   * Gets number channels in samples.
   *
   * @returns Integer if Sampletype is vector, otherwise `null`.
   */
  get channels(): number | null {
    return Array.isArray(this.samples[0]) ? this.samples[0].length : null;
  }

  private defaultInterpolator(): Interpolator {
    return this.samples.length >= 6 ? spragueInterpolator : linearInterpolator;
  }

  private defaultExtrapolator(): Extrapolator {
    return nearestExtrapolator;
  }

  /**
   * Remap wavelength from shape domain `[shape.start, shape.end]` to array domain `[0, shape.count - 1]`.
   *
   * @param wavelength - wavelength to remap.
   * @returns wavelength remapped to array domain.
   */
  protected toArrayDomain(wavelength: number): number;
  protected toArrayDomain(wavelengths: number[]): number[];
  protected toArrayDomain(wavelength: SampleT): SampleT;
  protected toArrayDomain(wavelength: SampleT): SampleT {
    if (Array.isArray(wavelength)) {
      return wavelength.map((w) => this.toArrayDomain(w));
    }
    return (wavelength - this.shape.start) / this.shape.interval;
  }

  /**
   * Sample distribution at given wavelength or wavelengths.
   *
   * Samples are interpolated using the configured interpolator.
   * If sampling outside the domain of the distribution, the configured extrapolator is used.
   *
   * @typeParam SamplingT -
   * @param wavelength - Wavelength or wavelengths to sample at.
   * @returns Sampled value or array of sampled values.
   *
   * @example
   * ```
   * import { D65 } from "spectral-colors";
   *
   * const sample = D65.sampleAt(500);
   * console.log(sample);
   * // >>> 109.354
   * const multipleSamples = D65.sampleAt([400, 500, 600]);
   * console.log(multipleSamples);
   * // >>> [82.754..., 109.354, 90.006...]
   * ```
   */
  sampleAt<SamplingT extends number | number[]>(
    wavelength: SamplingT
  ): SamplingT extends number ? T : DistributedArray<T> {
    const wl = this.toArrayDomain(wavelength);
    return this.sampler(wl, this.samples) as SamplingT extends number ? T : DistributedArray<T>;
  }

  /**
   * Creates a new spectral distribution of the given shape by sampling this distribution.
   *
   * @param shape - Shape of the new spectral distribution.
   * @returns Resampled spectral distribution.
   *
   * @example
   * Resample with interpolation and extrapolation.
   * ```
   * const sd = new SpectralDistribution({
   *   shape: new Shape([400, 800], 400),
   *   samples: [10, 20],
   *   interpolator: linearInterpolator,
   *   extrapolator: nearestExtrapolator
   * });
   * const resampled = sd.resample(new Shape([300, 900], 100));
   * console.log(resampled.samples);
   * // >>> [10, 10, 12.5, 15, 17.5, 20, 20]
   * ```
   */
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

  /**
   * Creates a new spectral distribution by applying a function to each pair of samples from two distributions.
   *
   * The shape of the `this` instance will be used to resample the `other` distribution. The resulting distribution will have the same shape as the `this` instance.
   * @see {@link Shape}
   * @see {@link SpectralDistribution.resample}
   *
   * @typeParam OtherT - The type of the `other` distribution.
   * @typeParam OutT - Return type of `f` and the sample type of the resulting distribution.
   * @param other - Other distribution to apply `f` to.
   * @param f - Function to apply to each pair of samples.
   * @returns Combined and transformed spectral distribution of shape `this.shape`.
   *
   * @example
   * ```
   * const sd1 = new SpectralDistribution({shape: new Shape([400, 700], 4), samples: [1, 2, 3, 4]});
   * const sd2 = new SpectralDistribution({shape: new Shape([400, 700], 4), samples: [3.5, 2.5, 1.5, 0.5]});
   * const f = (a, b) => Math.max(a, b);
   * const sd3 = sd1.combine(sd2, f);
   * console.log(sd3.samples);
   * // >>> [3.5, 2.5, 3, 4]
   * ```
   */
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

  /**
   * Maps spectral distribution by applying a function to each sample.
   *
   * @typeParam OutT - Return type of `f` and the sample type of the resulting distribution.
   * @param f - Function to apply to each sample.
   * @returns Spectral distribution of same shape as `this` with transformed samples.
   */
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

  /**
   * Sums spectral distribution.
   *
   * For multi-channel distributions, the sum is computed for each channel.
   *
   * @returns sum of samples
   *
   * @example
   * ```
   * const sd = new SpectralDistribution({shape: new Shape([400, 600], 100), samples: [[1, 10], [2, 20], [3, 30]]});
   * console.log(sd.sum());
   * // >>> [6, 60]
   * ```
   */
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

  /**
   * Adds a spectral distribution to another spectral distribution, number or array.
   *
   * If `term` is a distribution it will first be resampled to match the shape of `this`.
   * @see {@link SpectralDistribution.combine}
   * @see {@link SpectralDistribution.resample}
   *
   * If `term` is a number or array it will be broadcast across the spectral distribution.
   * Addition is broadcast according to {@link SpectralDistribution.broadcastBinaryOperator}.
   *
   * @typeParam TermT - The sample type of the `term` distribution if it is a distribution or the type of `term`.
   * @param term - Spectral distribution, number or array of numbers to add to `this`.
   * @returns Spectral distribution with summed samples.
   */
  add<TermT extends SampleT>(
    term: SpectralDistribution<TermT> | TermT
  ): SpectralDistribution<BroadcastResult<T, TermT>> {
    return this.broadcastBinaryOperator(term, add);
  }

  /**
   * Subtracts spectral distribution, number or array from this spectral distribution,
   *
   * If `term` is a distribution it will first be resampled to match the shape of `this`.
   * @see {@link SpectralDistribution.combine}
   * @see {@link SpectralDistribution.resample}
   *
   * If `term` is a number or array it will be broadcast across the spectral distribution.
   * Subtraction is broadcast according to {@link SpectralDistribution.broadcastBinaryOperator}.
   *
   * @typeParam TermT - The sample type of the `term` distribution if it is a distribution or the type of `term`.
   * @param term - Spectral distribution, number or array of numbers.
   * @returns Spectral distribution.
   */
  subtract<TermT extends SampleT>(
    term: SpectralDistribution<TermT> | TermT
  ): SpectralDistribution<BroadcastResult<T, TermT>> {
    return this.broadcastBinaryOperator(term, subtract);
  }

  /**
   * Multiplies spectral distribution with `factor` spectral distribution, number or array.
   *
   * If `factor` is a distribution it will first be resampled to match the shape of `this`.
   * @see {@link SpectralDistribution.combine}
   * @see {@link SpectralDistribution.resample}
   *
   * If `factor` is a number or array it will be broadcast across the spectral distribution.
   * Multiplication is broadcast according to {@link SpectralDistribution.broadcastBinaryOperator}.
   *
   * @typeParam FactorT - The sample type of the `factor` distribution if it is a distribution or the type of `factor`.
   * @param factor - Spectral distribution, number or array of numbers.
   * @returns Spectral distribution.
   */
  multiply<FactorT extends SampleT>(
    factor: SpectralDistribution<FactorT> | FactorT
  ): SpectralDistribution<BroadcastResult<T, FactorT>> {
    return this.broadcastBinaryOperator(factor, multiply);
  }

  /**
   * Divides spectral distribution with `divisor` spectral distribution, number or array.
   *
   * If `divisor` is a distribution it will first be resampled to match the shape of `this`.
   * @see {@link SpectralDistribution.combine}
   * @see {@link SpectralDistribution.resample}
   *
   * If `divisor` is a number or array it will be broadcast across the spectral distribution.
   * Multiplication is broadcast according to {@link SpectralDistribution.broadcastBinaryOperator}.
   *
   * @typeParam DivisorT - The sample type of the `divisor` distribution if it is a distribution or the type of `divisor`.
   * @param divisor - Spectral distribution, number or array of numbers.
   * @returns Spectral distribution.
   */
  divide<DivisorT extends SampleT>(
    divisor: SpectralDistribution<DivisorT> | DivisorT
  ): SpectralDistribution<BroadcastResult<T, DivisorT>> {
    return this.broadcastBinaryOperator(divisor, divide);
  }

  /**
   * Broadcasts binary operator across samples of a {@link SpectralDistribution}.
   *
   * `operator` is broadcast depending on the types of arguments.
   *
   * | `this`   | `arg`    | `result` | broadcast |
   * | number   | number   | number   | function applied directly
   * | number   | number[] | number[] | scalar broadcasted to array
   * | number[] | number   | number[] | scalar broadcasted to array
   * | number[] | number[] | number[] | function applied element-wise
   *
   * If both arguments are arrays the muse be of the same length.
   *
   * @typeParam ArgT - The sample type of the `divisor` distribution if it is a distribution or the type of `divisor`.
   * @param arg - Second argument to operate on.
   * @param operator - Binary operator: (number, number) =\> number
   * @returns Spectral distribution.
   */
  broadcastBinaryOperator<ArgT extends SampleT>(
    arg: SpectralDistribution<ArgT> | SampleT,
    operator: (a: number, b: number) => number
  ): SpectralDistribution<BroadcastResult<T, ArgT>>;
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

  /**
   * Creates a new {@link SpectralDistribution} of shape `shape` by sampling `f`.
   *
   * @typeParam OutT - The sample type of the new distribution
   * @param f - Function to generate distribution from. (wavelength: number) =\> number | number[]
   * @param shape - Shape of the new distribution.
   * @returns Spectral distribution.
   */
  static fromFunction<OutT extends SampleT>(
    f: (x: number) => OutT,
    shape: Shape
  ): SpectralDistribution<OutT> {
    const samples = shape.map(f) as DistributedArray<OutT>;
    return new SpectralDistribution({ shape, samples });
  }
}

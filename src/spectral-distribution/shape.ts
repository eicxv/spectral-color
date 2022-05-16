import { mapRange, range } from "../utils/utils";

/**
 * Represents the domain and sampling interval of a discrete distribution.
 *
 * @remarks
 * Used in the {@link SpectralDistribution} class.
 *
 * The domain is inclusive of the start and end values.
 */
export class Shape {
  /**
   * Wavelength of first sample of distribution [nm].
   */
  readonly start: number;

  /**
   * Wavelength of last sample of distribution [nm].
   */
  readonly end: number;

  /**
   * Sampling interval [nm].
   */
  readonly interval: number;

  /**
   * Creates an instance of shape.
   * @remarks
   * `start` must be equal to or larger than `end`.
   * `interval` must always larger than zero even if the shape only has one value (i.e. if `start` = `end`).
   * `interval` must be a multiple of the difference between `start` and `end`.
   *
   * @param start - The start of the domain [nm].
   * @param end - The end of the domain [nm].
   * @param interval - Sampling interval [nm].
   *
   * @returns A new instance of shape.
   */
  constructor(start: number, end: number, interval: number);
  /**
   * Creates an instance of shape.
   * @remarks
   * `start` must be equal to or larger than `end`.
   * `interval` must always larger than zero even if the shape only has one value (i.e. if `start` = `end`).
   * `interval` must be a multiple of the difference between `start` and `end`.
   *
   * @param domain - The start and end of the domain [nm].
   * @param interval - Sampling interval [nm].
   *
   * @returns A new instance of shape.
   */
  constructor(domain: [number, number], interval: number);
  constructor(
    startOrDomain: number | [number, number],
    endOrInterval: number,
    interval: number = endOrInterval
  ) {
    if (Array.isArray(startOrDomain)) {
      this.start = startOrDomain[0];
      this.end = startOrDomain[1];
      this.interval = endOrInterval;
    } else {
      this.start = startOrDomain;
      this.end = endOrInterval;
      this.interval = interval;
    }
    this.validate();
  }

  /**
   * Gets domain [nm].
   *
   * @returns Domain [start, end].
   */
  get domain(): [number, number] {
    return [this.start, this.end];
  }

  /**
   * [Symbol.iterator]. Create an iterator over each wavelength in the domain.
   *
   * @example
   * ```
   * const shape = new Shape(400, 700, 100);
   * for (const wavelength of shape) {
   *  console.log(wavelength);
   * }
   * // >>> 400
   * // >>> 500
   * // >>> 600
   * // >>> 700
   * ```
   *
   * @returns Wavelength iterator.
   */
  *[Symbol.iterator](): IterableIterator<number> {
    for (let i = 0; i < this.count; i++) {
      yield this.start + i * this.interval;
    }
  }

  /**
   * Wavelengths
   *
   * @example
   * ```
   * const shape = new Shape(400, 700, 100);
   * console.log(shape.wavelengths());
   * // >>> [400, 500, 600, 700]
   * ```
   *
   * @returns Array of wavelengths.
   */
  wavelengths(): number[] {
    return range(this.start, this.count, this.interval);
  }

  /**
   * Maps a function over the wavelenghts of the domain.
   *
   * @example
   * ```
   * const shape = new Shape(400, 700, 100);
   * const wavelengthsMicrons = shape.map((x) => x * 1e-3);
   * console.log(wavelengthsMicrons);
   * // >>> [0.4, 0.5, 0.6, 0.7]
   * ```
   *
   * @typeParam OutType - The type of the result.
   * @param f - Function to map over domain.
   * @returns Array of mapped values.
   */
  map<OutType>(f: (wavelength: number) => OutType): OutType[] {
    return mapRange(f, this.start, this.count, this.interval);
  }

  /**
   * Number of samples in the domain.
   *
   * @example
   * ```
   * const shape = new Shape(360, 830, 5);
   * console.log(shape.count);
   * // >>> 94
   * ```
   * @example
   * ```
   * const shape = new Shape(500, 500, 1);
   * console.log(shape.count);
   * // >>> 1
   * ```
   *
   * @returns Number of samples in the domain.
   */
  get count(): number {
    return Math.round((this.end - this.start) / this.interval) + 1;
  }

  /**
   * Determines if a x is within the domain.
   *
   * @param x - Wavelength [nm].
   * @returns True if x is within the domain.
   */
  inDomain(x: number): boolean {
    return x >= this.start && x <= this.end;
  }

  private validate(): void {
    if (this.start > this.end) {
      throw new Error(
        `End wavelength ${this.end} must be equal or larger than start wavelength ${this.start}`
      );
    }
    if (this.interval <= 0) {
      throw new Error(`Interval ${this.interval} must be larger than zero`);
    }
    const remainder = (this.end - this.start) % this.interval;
    const tol = 1e-8;
    if (remainder > tol && remainder < this.interval - tol) {
      throw new Error(
        `Domain [${this.start}, ${this.end}] does not match sampling interval ${this.interval}`
      );
    }
  }
}

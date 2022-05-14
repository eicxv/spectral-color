import { mapRange, range } from "../utils/utils";

export class Shape {
  readonly start: number; // wavelength of first sample of distribution [nm]
  readonly end: number; // wavelength of last sample of distribution [nm]
  readonly interval: number; // sample interval [nm]

  constructor(start: number, end: number, interval: number);
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

  get domain(): [number, number] {
    return [this.start, this.end];
  }

  *[Symbol.iterator](): IterableIterator<number> {
    for (let i = 0; i < this.sampleCount(); i++) {
      yield this.start + i * this.interval;
    }
  }

  wavelengths(): number[] {
    return range(this.start, this.sampleCount(), this.interval);
  }

  mapWavelengths<T>(f: (wl: number) => T): T[] {
    return mapRange(f, this.start, this.sampleCount(), this.interval);
  }

  sampleCount(): number {
    return Math.round((this.end - this.start) / this.interval) + 1;
  }

  isInDomain(x: number): boolean {
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

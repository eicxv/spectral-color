export class Shape {
  start: number; // wavelength of first sample of distribution [nm]
  end: number; // wavelength of last sample of distribution [nm]
  interval: number; // sample intervale [nm]
  constructor(start: number, end: number, interval: number);
  constructor(span: [number, number], interval: number);
  constructor(
    startOrSpan: number | [number, number],
    endOrInterval: number,
    interval: number = endOrInterval
  ) {
    if (Array.isArray(startOrSpan)) {
      this.start = startOrSpan[0];
      this.end = startOrSpan[1];
      this.interval = endOrInterval;
    } else {
      this.start = startOrSpan;
      this.end = endOrInterval;
      this.interval = interval;
    }
    this.validate();
  }

  get span(): [number, number] {
    return [this.start, this.end];
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
        `Span [${this.start}, ${this.end}] does not match sampling interval ${this.interval}`
      );
    }
  }
}

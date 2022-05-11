import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { beforeEach, describe, expect, it } from "vitest";
import { Shape } from "./shape";
import {
  MultiSpectralDistribution,
  SpectralDistribution,
} from "./spectral-distribution";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe("SpectralDistribution", () => {
  describe("constructor", () => {
    const samples = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const samplesCopy = samples.slice();
    const cases: Array<[SpectralDistribution, [number, number, number]]> = [
      [new SpectralDistribution([0, 10], 1, samples), [0, 10, 1]],
      [new SpectralDistribution(5, 5, samples), [5, 55, 5]],
      [
        new SpectralDistribution(new Shape(-0.5, 0.5, 0.1), samples),
        [-0.5, 0.5, 0.1],
      ],
    ];
    it.each(cases)("should construct distribution", (sd, ex) => {
      const [start, end, interval] = ex;
      const shape = sd.shape;
      expect(shape.start).toBe(start);
      expect(shape.end).toBe(end);
      expect(shape.interval).toBe(interval);
      expect([...sd.samples()]).toBeDeepCloseTo(samplesCopy);
    });
  });

  describe("iterators", () => {
    // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    const context = {} as any;
    beforeEach(() => {
      context.samples = [-4, 0, 3, 2];
      context.wavelengths = [5, 15, 25, 35];
      context.sd = new SpectralDistribution(5, 10, context.samples.slice());
    });

    describe("wavelengths", () => {
      it("should iterate over wavelengths", () => {
        const wavelengths = [...context.sd.wavelengths()];
        expect(wavelengths).toBeDeepCloseTo(context.wavelengths);
      });
    });

    describe("samples", () => {
      it("should iterate over samples", () => {
        const samples = [...context.sd.samples()];
        expect(samples).toBeDeepCloseTo(context.samples);
      });
    });

    describe("iterator", () => {
      it("should iterate over wavelength and sample tuples", () => {
        const values = [];
        const wavelengths = context.sd.wavelengths();
        for (const samples of context.sd.samples()) {
          values.push([wavelengths.next().value, samples]);
        }
        expect([...context.sd[Symbol.iterator]()]).toBeDeepCloseTo(values);
      });
    });
  });

  describe("map", () => {
    it("should return transformed distribution", () => {
      const samples = [0, 1, 2, 3, 4, 5];
      const sd = new SpectralDistribution(0, 5, samples);
      const f = (x: number): number => x * x;
      const mapped = sd.map(f);
      expect([...mapped.samples()]).toBeDeepCloseTo(samples.map(f));
    });

    it("map to tuple should return MultiSpectralDistribution instance", () => {
      const sd = new SpectralDistribution(0, 5, [0, 1, 2, 3, 4, 5]);
      const f = (x: number): [number, number] => [x, x * x];
      expect(sd.map(f)).toBeInstanceOf(MultiSpectralDistribution);
    });

    it("map to tuple should return transformed distribution", () => {
      const samples = [0, 1, 2, 3, 4, 5];
      const sd = new SpectralDistribution(0, 5, samples);
      const f = (x: number): [number, number, number] => [1, x, x * x];
      const mapped = sd.map(f);
      expect(mapped).toBeInstanceOf(MultiSpectralDistribution);
      expect([...mapped.samples()]).toBeDeepCloseTo(samples.map(f));
    });
  });
});

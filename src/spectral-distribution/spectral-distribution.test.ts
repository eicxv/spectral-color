import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { beforeEach, describe, expect, it } from "vitest";
import { Shape } from "./shape";
import { SpectralDistribution } from "./spectral-distribution";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe("SpectralDistribution", () => {
  describe("constructor", () => {
    const samples = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const samplesCopy = samples.slice();
    it("should construct distribution", () => {
      const shape = new Shape(-0.5, 0.5, 0.1);
      const sd = new SpectralDistribution({ shape, samples });
      expect(shape.start).toBe(-0.5);
      expect(shape.end).toBe(0.5);
      expect(shape.interval).toBe(0.1);
      expect(sd.samples).toBeDeepCloseTo(samplesCopy);
    });
  });

  describe("sampleAt", () => {
    let sd: SpectralDistribution<number>;
    const samples = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    beforeEach(() => {
      const shape = new Shape([0, 1], 0.1);
      sd = new SpectralDistribution({ shape, samples });
    });
    it("should return original data at intervals", () => {
      expect(sd.sampleAt([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])).toBeDeepCloseTo(samples);
      expect(sd.sampleAt(0.1)).toBeDeepCloseTo(1);
    });
    it("should interpolate", () => {
      expect(sd.sampleAt([0.05, 0.15])).toBeDeepCloseTo([0.5, 1.5]);
      expect(sd.sampleAt(0.05)).toBeDeepCloseTo(0.5);
    });
    it("should extrapolate", () => {
      expect(sd.sampleAt([-0.05, 1.5])).toBeDeepCloseTo([0, 10]);
      expect(sd.sampleAt(-1)).toBeDeepCloseTo(0);
    });
  });

  describe("map", () => {
    it("should return transformed distribution", () => {
      const samples = [0, 1, 2, 3, 4, 5];
      const shape = new Shape([0, 25], 5);
      const sd = new SpectralDistribution({ shape, samples });
      const f = (x: number): number => x * x;
      const mapped = sd.map(f);
      expect(mapped).toBeInstanceOf(SpectralDistribution);
      expect(mapped.samples).toBeDeepCloseTo(samples.map(f));
    });

    it("map to tuple", () => {
      const samples = [0, 1, 2, 3, 4, 5];
      const shape = new Shape([0, 25], 5);
      const sd = new SpectralDistribution({ shape, samples });
      const f = (x: number): [number, number, number] => [1, x, x * x];
      const mapped = sd.map(f);
      expect(mapped).toBeInstanceOf(SpectralDistribution);
      expect(mapped.samples).toBeDeepCloseTo(samples.map(f));
    });
  });
});

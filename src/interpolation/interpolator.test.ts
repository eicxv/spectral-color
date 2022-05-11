import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, it } from "vitest";
import { SpectralShape } from "../spectral-shape";
import {
  IInterpolator,
  LinearInterpolator,
  NearestNeighborInterpolator,
} from "./interpolator";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe("Interpolator", () => {
  function testInterpolator(
    interp: IInterpolator,
    testValues: Array<[number, number]>
  ): void {
    const { start, end, interval } = interp.shape;
    it("should throw if sampling out of domain", () => {
      expect(() => interp.sampleAt(start - 1)).toThrow();
      expect(() => interp.sampleAt(end + 1)).toThrow();
      expect(() => interp.sampleAt(start + end / 2)).not.toThrow();
    });
    it("should return original data when sampling at intervals", () => {
      expect(interp.sampleAt(start)).toBeCloseTo(interp.samples[0], 10);
      expect(interp.sampleAt(start + interval)).toBeCloseTo(
        interp.samples[1],
        10
      );
      expect(interp.sampleAt(end)).toBeCloseTo(
        interp.samples[interp.samples.length - 1],
        10
      );
    });
    it("should return interpolated data when sampling at arbitrary points", () => {
      testValues.forEach(([x, y]) => {
        expect(interp.sampleAt(x)).toBeCloseTo(y, 10);
      });
    });
  }

  describe("NearestNeighbor", () => {
    const shape = new SpectralShape([0, 3], 1);
    const samples = [0, 1, 2, 3];
    const interp = new NearestNeighborInterpolator(shape, samples);
    const testValues = [
      [0.4, 0],
      [0.5, 1],
      [0.65, 1],
      [1.6, 2],
      [2.6, 3],
    ] as Array<[number, number]>;
    testInterpolator(interp, testValues);
  });

  describe("Linear", () => {
    const shape = new SpectralShape([0, 3], 0.5);
    const samples = [0, 1, 2, 3, 4, 5, 6];
    const interp = new LinearInterpolator(shape, samples);
    const testValues = [
      [0.4, 0.8],
      [1.2, 2.4],
      [2.25, 4.5],
      [2.6, 5.2],
    ] as Array<[number, number]>;
    testInterpolator(interp, testValues);
  });
});

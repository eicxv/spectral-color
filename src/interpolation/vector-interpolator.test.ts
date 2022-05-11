import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, it } from "vitest";
import { SpectralShape } from "../spectral-shape";
import {
  IInterpolator,
  LinearInterpolator,
  NearestNeighborInterpolator,
  SpragueInterpolator,
} from "./interpolator";
import {
  IVectorInterpolator,
  LinearVectorInterpolator,
  NearestNeighborVectorInterpolator,
  SpragueVectorInterpolator,
} from "./vector-interpolator";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map((row) => row[i]));
}

describe("Vector Interpolator", () => {
  function testInterpolator(
    VInterp: new (
      shape: SpectralShape,
      samples: number[][]
    ) => IVectorInterpolator,
    Interp: new (shape: SpectralShape, samples: number[]) => IInterpolator
  ): void {
    const data = [
      [5.2, 10.4, 43.2],
      [2.3, -3.1, 6.1],
      [10.2, -12.2, 12],
      [13.2, 0, 13.2],
      [-3.3, 5.1, 55.3],
      [40.8, -4.2, 6.1],
      [56.1, 44.2, -6.1],
      [12.5, 1, -12.5],
    ];
    const shape = new SpectralShape([-0.5, 3], 0.5);
    const x = [-0.45, 0.34, 1.567, 2.5, 2.3333];
    const vinterp = new VInterp(shape, data);
    const { start, end, interval } = shape;
    it("should throw if sampling out of domain", () => {
      expect(() => vinterp.sampleAt(start - 1)).toThrow();
      expect(() => vinterp.sampleAt(end + 1)).toThrow();
      expect(() => vinterp.sampleAt(start + end / 2)).not.toThrow();
    });

    it("should return original data when sampling at intervals", () => {
      expect(vinterp.sampleAt(start)).toBeDeepCloseTo(vinterp.samples[0], 10);
      expect(vinterp.sampleAt(start + interval)).toBeDeepCloseTo(
        vinterp.samples[1],
        10
      );
      expect(vinterp.sampleAt(end)).toBeDeepCloseTo(
        vinterp.samples[vinterp.samples.length - 1],
        10
      );
    });

    it.each(x)("should match scalar implementation", (x) => {
      const cols = transpose(data);
      const interps = cols.map((col) => new Interp(shape, col));
      function sampleScalarInterps(x: number): number[] {
        return interps.map((interp) => interp.sampleAt(x));
      }
      expect(vinterp.sampleAt(x)).toBeDeepCloseTo(sampleScalarInterps(x), 10);
    });
  }

  describe("NearestNeighbor", () => {
    testInterpolator(
      NearestNeighborVectorInterpolator,
      NearestNeighborInterpolator
    );
  });

  describe("Linear", () => {
    testInterpolator(LinearVectorInterpolator, LinearInterpolator);
  });

  describe("Sprague", () => {
    it("should throw if recieving less than 6 samples", () => {
      expect(
        () =>
          new SpragueVectorInterpolator(new SpectralShape(0, 2, 1), [
            [1, 2, 3],
            [1, 2, 3],
            [1, 2, 3],
          ])
      ).toThrow();
    });
    testInterpolator(SpragueVectorInterpolator, SpragueInterpolator);
  });
});

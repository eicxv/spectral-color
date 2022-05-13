import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, it } from "vitest";
import { transpose } from "./../utils/utils";
import { Interpolator } from "./interpolation";
import * as interpolator from "./scalar-interpolation";
import { Linear, NearestNeighbor, Sprague } from "./vector-interpolation";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe("Vector Interpolator", () => {
  function testInterpolator(
    VInterp: new (samples: number[][]) => Interpolator<number[]>,
    Interp: new (samples: number[]) => Interpolator<number>
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
    const xArr = [0.05, 0.34, 1.567, 2.5, 2.3333];
    const start = 0;
    const end = data.length - 1;
    const vinterp = new VInterp(data);
    it("should throw if sampling out of domain", () => {
      expect(() => vinterp.sampleAt(start - 1)).toThrow();
      expect(() => vinterp.sampleAt(end + 1)).toThrow();
      expect(() => vinterp.sampleAt(start + end / 2)).not.toThrow();
    });

    it("should return original data when sampling at intervals", () => {
      expect(vinterp.sampleAt(start)).toBeDeepCloseTo(vinterp.samples[0], 10);
      expect(vinterp.sampleAt(start + 1)).toBeDeepCloseTo(
        vinterp.samples[1],
        10
      );
      expect(vinterp.sampleAt(end)).toBeDeepCloseTo(
        vinterp.samples[vinterp.samples.length - 1],
        10
      );
    });

    const cols = transpose(data);
    const interps = cols.map((col) => new Interp(col));
    it.each(xArr)("should match scalar implementation", (x) => {
      const y = interps.map((interp) => interp.sampleAt(x));
      expect(vinterp.sampleAt(x)).toBeDeepCloseTo(y, 10);
    });
    it("should match scalar implementation when sampling with array", () => {
      const y = transpose(interps.map((interp) => interp.sampleAt(xArr)));
      expect(vinterp.sampleAt(xArr)).toBeDeepCloseTo(y, 10);
    });
  }

  describe("NearestNeighbor", () => {
    testInterpolator(NearestNeighbor, interpolator.NearestNeighbor);
  });

  describe("Linear", () => {
    testInterpolator(Linear, interpolator.Linear);
  });

  describe("Sprague", () => {
    it("should throw if recieving less than 6 samples", () => {
      expect(
        () =>
          new Sprague([
            [1, 2, 3],
            [1, 2, 3],
            [1, 2, 3],
          ])
      ).toThrow();
    });
    testInterpolator(Sprague, interpolator.Sprague);
  });
});

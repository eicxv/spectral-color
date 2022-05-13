import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, it } from "vitest";
import { Interpolator } from "./interpolation";
import { Linear, NearestNeighbor, Sprague } from "./scalar-interpolation";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe("Scalar Interpolator", () => {
  function testInterpolator(
    interp: Interpolator<number>,
    testValues: Array<[number, number]>
  ): void {
    const start = 0;
    const end = interp.samples.length - 1;
    it("should throw if sampling out of domain", () => {
      expect(() => interp.sampleAt(start - 1)).toThrow();
      expect(() => interp.sampleAt(end + 1)).toThrow();
      expect(() => interp.sampleAt(start + end / 2)).not.toThrow();
    });
    it("should return original data when sampling at intervals", () => {
      expect(interp.sampleAt(start)).toBeCloseTo(interp.samples[0], 10);
      expect(interp.sampleAt(start + 1)).toBeCloseTo(interp.samples[1], 10);
      expect(interp.sampleAt(end)).toBeCloseTo(
        interp.samples[interp.samples.length - 1],
        10
      );
    });
    it("should interpolate data when sampling at arbitrary points", () => {
      testValues.forEach(([x, y]) => {
        expect(interp.sampleAt(x)).toBeCloseTo(y, 10);
      });
    });
    it("should return array of interpolated data when sampling with array", () => {
      const x = testValues.map((e) => e[0]);
      const y = testValues.map((e) => e[1]);
      expect(interp.sampleAt(x)).toBeDeepCloseTo(y, 10);
    });
  }

  describe("NearestNeighbor", () => {
    const samples = [0, 1, 2, 3];
    const interp = new NearestNeighbor(samples);
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
    const samples = [0, 4, 3.5, 1.7, 4, 5, 6];
    const interp = new Linear(samples);
    const testValues = [
      [0.4, 1.6],
      [1.2, 3.9],
      [2.25, 3.05],
      [4.6, 4.6],
    ] as Array<[number, number]>;
    testInterpolator(interp, testValues);
  });

  describe("Sprague", () => {
    it("should throw if recieving less than 6 samples", () => {
      expect(() => new Sprague([1, 2, 3, 4, 5])).toThrow();
    });
    const samples = [5.2, 2.3, 10.2, 13.2, -3.3, 40.8, 56.1, 12.5];
    const interp = new Sprague(samples);
    const testValues = [
      [0, 5.2000000000000313],
      [0.5, 2.6846179724880392],
      [0.7777777777777778, 2.1150882260003945],
      [1.5, 5.4930678080143531],
      [1.5555555555555556, 6.0430281390123843],
      [2.3333333333333335, 13.00164609053498],
      [2.5, 14.34765625],
      [3, 13.199999999999999],
      [3.111111111111111, 11.596020818867943],
      [3.5, 1.5046874999999982],
      [3.888888888888889, -4.3716901782135764],
      [4.5, 15.47109375],
      [4.666666666666667, 24.849931412894385],
      [5.444444444444445, 54.851709572805518],
      [5.5, 55.968187425239229],
      [6.222222222222222, 50.361421867271417],
      [6.5, 39.29649745813397],
      [7, 12.499999999999989],
    ] as Array<[number, number]>;
    testInterpolator(interp, testValues);
  });
});

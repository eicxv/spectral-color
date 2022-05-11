import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, it } from "vitest";
import { Shape } from "../spectral-distribution/shape";
import {
  Interpolator,
  Linear,
  NearestNeighbor,
  Sprague,
} from "./scalar-interpolation";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe("Scalar Interpolator", () => {
  function testInterpolator(
    interp: Interpolator<number>,
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
    const shape = new Shape([0, 3], 1);
    const samples = [0, 1, 2, 3];
    const interp = new NearestNeighbor(shape, samples);
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
    const shape = new Shape([0, 3], 0.5);
    const samples = [0, 1, 2, 3, 4, 5, 6];
    const interp = new Linear(shape, samples);
    const testValues = [
      [0.4, 0.8],
      [1.2, 2.4],
      [2.25, 4.5],
      [2.6, 5.2],
    ] as Array<[number, number]>;
    testInterpolator(interp, testValues);
  });

  describe("Sprague", () => {
    it("should throw if recieving less than 6 samples", () => {
      expect(() => new Sprague(new Shape(0, 4, 1), [1, 2, 3, 4, 5])).toThrow();
    });
    const shape = new Shape([0, 3.5], 0.5);
    const samples = [5.2, 2.3, 10.2, 13.2, -3.3, 40.8, 56.1, 12.5];
    const interp = new Sprague(shape, samples);
    const testValues = [
      [0.0, 5.2000000000000313],
      [0.25, 2.6846179724880392],
      [0.3888888888888889, 2.1150882260003945],
      [0.75, 5.4930678080143531],
      [0.77777777777777779, 6.0430281390123843],
      [1.1666666666666667, 13.00164609053498],
      [1.25, 14.34765625],
      [1.5, 13.199999999999999],
      [1.5555555555555556, 11.596020818867943],
      [1.75, 1.5046874999999982],
      [1.9444444444444444, -4.3716901782135764],
      [2.25, 15.47109375],
      [2.3333333333333335, 24.849931412894385],
      [2.7222222222222223, 54.851709572805518],
      [2.75, 55.968187425239229],
      [3.1111111111111112, 50.361421867271417],
      [3.25, 39.29649745813397],
      [3.5, 12.499999999999989],
    ] as Array<[number, number]>;
    testInterpolator(interp, testValues);
  });
});

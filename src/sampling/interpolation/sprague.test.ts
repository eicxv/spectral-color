import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, it } from "vitest";
import { range, transpose } from "../../utils/utils";
import { spragueInterpolator } from "./sprague";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

function testSampler(
  description: string,
  interp: (x: number, samples: readonly number[]) => number,
  samples: number[],
  x: number[],
  y: number[]
): void {
  it.each(transpose([x, y]))(description, (x, y) => {
    expect(interp(x, samples)).toBeCloseTo(y, 10);
  });
}

describe("sprague interpolator", () => {
  const samples = [5.2, 2.3, 10.2, 13.2, -3.3, 40.8, 56.1, 12.5];
  const x = [
    0, 0.5, 0.7777777777777778, 1.5, 1.5555555555555556, 2.3333333333333335,
    2.5, 3, 3.111111111111111, 3.5, 3.888888888888889, 4.5, 4.666666666666667,
    5.444444444444445, 5.5, 6.222222222222222, 6.5,
  ];
  const y = [
    5.2000000000000313, 2.6846179724880392, 2.1150882260003945,
    5.4930678080143531, 6.0430281390123843, 13.00164609053498, 14.34765625,
    13.199999999999999, 11.596020818867943, 1.5046874999999982,
    -4.3716901782135764, 15.47109375, 24.849931412894385, 54.851709572805518,
    55.968187425239229, 50.361421867271417, 39.29649745813397,
  ];
  testSampler(
    "should return original data when sampling at integers",
    spragueInterpolator,
    samples,
    range(0, samples.length - 1),
    samples.slice(0, samples.length - 1)
  );
  testSampler(
    "should interpolate when sampling at arbitrary points",
    spragueInterpolator,
    samples,
    x,
    y
  );
});

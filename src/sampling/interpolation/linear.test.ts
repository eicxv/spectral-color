import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, it } from "vitest";
import { range, transpose } from "../../utils/utils";
import { linearInterpolator } from "./linear";

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

describe("linear interpolator", () => {
  const samples = [0, 4, 3.5, 1.7, 4, 5, 6];
  const x = [0.4, 1.2, 2.25, 4.6];
  const y = [1.6, 3.9, 3.05, 4.6];
  testSampler(
    "should return original data when sampling at integers",
    linearInterpolator,
    samples,
    range(0, samples.length - 1),
    samples.slice(0, samples.length - 1)
  );
  testSampler("should interpolate when sampling at arbitrary points", linearInterpolator, samples, x, y);
});

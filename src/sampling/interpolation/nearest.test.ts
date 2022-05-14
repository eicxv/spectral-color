import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, it } from "vitest";
import { range, transpose } from "../../utils/utils";
import { nearestInterpolator } from "./nearest";

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

describe("nearest interpolator", () => {
  const samples = [0, 1, 2, 3];
  const x = [0.4, 0.5, 0.65, 1.6, 2.6];
  const y = [0, 1, 1, 2, 3];
  testSampler(
    "should return original data when sampling at integers",
    nearestInterpolator,
    samples,
    samples.slice(0, samples.length - 1),
    range(0, samples.length - 1)
  );
  testSampler(
    "should interpolate when sampling at arbitrary points",
    nearestInterpolator,
    samples,
    x,
    y
  );
});
